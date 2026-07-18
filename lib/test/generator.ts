import { generateWithGemini } from "@/lib/ai/gemini";
import { generateWithGroq } from "@/lib/ai/groq";
import { getTestGenerationPrompt } from "@/lib/ai/prompts";
import { getConceptsForTest, updateConceptMastery } from "@/lib/mastery/bkt";
import { CONCEPTS, Concept } from "@/lib/utils/constants";
import { TestResult } from "@/lib/db/schemas";
import { connectDB } from "@/lib/db/mongodb";

export { updateConceptMastery };

export interface Question {
  id: string;
  type: "MCQ" | "short_2mark" | "short_3mark" | "long_5mark";
  question: string;
  options: string[] | null;
  correctAnswer: string;
  conceptId: string;
  marks: number;
  timeEstimate: number;
}

export interface Test {
  id: string;
  subject: string;
  type: "diagnostic" | "weekly" | "quiz";
  questions: Question[];
  totalMarks: number;
  timeLimitMinutes: number;
}

function determineQuestionTypes(count: number): string[] {
  const types: string[] = [];
  const mcqCount = Math.floor(count * 0.4);
  const short2Count = Math.floor(count * 0.25);
  const short3Count = Math.floor(count * 0.2);
  const longCount = count - mcqCount - short2Count - short3Count;

  for (let i = 0; i < mcqCount; i++) types.push("MCQ");
  for (let i = 0; i < short2Count; i++) types.push("short_2mark");
  for (let i = 0; i < short3Count; i++) types.push("short_3mark");
  for (let i = 0; i < longCount; i++) types.push("long_5mark");

  return types;
}

function getMarksForType(type: string): number {
  switch (type) {
    case "MCQ": return 1;
    case "short_2mark": return 2;
    case "short_3mark": return 3;
    case "long_5mark": return 5;
    default: return 1;
  }
}

function getTimeForType(type: string): number {
  switch (type) {
    case "MCQ": return 60;
    case "short_2mark": return 120;
    case "short_3mark": return 180;
    case "long_5mark": return 300;
    default: return 60;
  }
}

export async function generateTest(
  studentId: string,
  subject: string,
  testType: "diagnostic" | "weekly" | "quiz",
  standard: number,
  conceptId?: string
): Promise<Test> {
  await connectDB();

  let selectedConcepts: { name: string; difficulty: string; bloomsLevel: string; chapter: string; id: string }[];

  if (testType === "diagnostic") {
    // For diagnostic: select concepts spread across all chapters
    const subjectConcepts = CONCEPTS.filter(c => c.subject === subject && c.standard === standard);
    const chapterGroups = new Map<string, Concept[]>();

    for (const concept of subjectConcepts) {
      const key = concept.chapter;
      if (!chapterGroups.has(key)) chapterGroups.set(key, []);
      chapterGroups.get(key)!.push(concept);
    }

    selectedConcepts = [];
    const chaptersArray = Array.from(chapterGroups.entries());
    for (let i = 0; i < Math.min(10, chaptersArray.length); i++) {
      const chapterConcepts = chaptersArray[i][1];
      const randomConcept = chapterConcepts[Math.floor(Math.random() * chapterConcepts.length)];
      selectedConcepts.push(randomConcept);
    }
  } else if (testType === "quiz" && conceptId) {
    // For quiz on specific concept
    const concept = CONCEPTS.find(c => c.id === conceptId);
    if (concept) {
      selectedConcepts = Array(5).fill(concept);
    } else {
      selectedConcepts = [];
    }
  } else {
    // For weekly: use mastery-based selection
    const conceptsForTest = await getConceptsForTest(studentId, subject, 10);
    selectedConcepts = conceptsForTest.map(c => ({
      name: c.concept.name,
      difficulty: c.concept.difficulty,
      bloomsLevel: c.concept.bloomsLevel,
      chapter: c.concept.chapter,
      id: c.concept.id,
    }));
  }

  if (selectedConcepts.length === 0) {
    // Fallback: random concepts from the subject
    const subjectConcepts = CONCEPTS.filter(c => c.subject === subject && c.standard === standard);
    selectedConcepts = subjectConcepts
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map(c => ({
        name: c.name,
        difficulty: c.difficulty,
        bloomsLevel: c.bloomsLevel,
        chapter: c.chapter,
        id: c.id,
      }));
  }

  const questionCount = testType === "diagnostic" ? 10 : testType === "weekly" ? 15 : 5;
  const questionTypes = determineQuestionTypes(questionCount);
  const prompt = getTestGenerationPrompt(subject, standard, selectedConcepts, questionTypes);

  let questions: Question[];

  try {
    const response = await generateWithGemini(prompt);
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    questions = parsed.map((q: Record<string, unknown>, i: number) => ({
      id: q.id as string || `q${i + 1}`,
      type: q.type as Question["type"],
      question: q.question as string,
      options: q.options as string[] | null,
      correctAnswer: q.correctAnswer as string,
      conceptId: q.conceptId as string || selectedConcepts[i % selectedConcepts.length]?.id || "",
      marks: q.marks as number || getMarksForType(q.type as string),
      timeEstimate: q.timeEstimate as number || getTimeForType(q.type as string),
    }));
  } catch {
    console.log("Gemini failed for test generation, falling back to Groq");
    const response = await generateWithGroq(prompt);
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    questions = parsed.map((q: Record<string, unknown>, i: number) => ({
      id: q.id as string || `q${i + 1}`,
      type: q.type as Question["type"],
      question: q.question as string,
      options: q.options as string[] | null,
      correctAnswer: q.correctAnswer as string,
      conceptId: q.conceptId as string || selectedConcepts[i % selectedConcepts.length]?.id || "",
      marks: q.marks as number || getMarksForType(q.type as string),
      timeEstimate: q.timeEstimate as number || getTimeForType(q.type as string),
    }));
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return {
    id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    subject,
    type: testType,
    questions,
    totalMarks,
    timeLimitMinutes: testType === "diagnostic" ? 30 : testType === "weekly" ? 45 : 15,
  };
}

export async function gradeTest(
  studentId: string,
  testId: string,
  answers: { questionId: string; answer: string; timeTaken: number }[],
  questions: Question[],
  subject: string,
  testType: "diagnostic" | "weekly" | "quiz"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  await connectDB();

  const gradedQuestions = [];
  let totalScore = 0;
  let totalMarks = 0;
  let correctCount = 0;

  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) continue;

    totalMarks += question.marks;

    let isCorrect = false;
    let marksAwarded = 0;

    if (question.type === "MCQ") {
      isCorrect = answer.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      marksAwarded = isCorrect ? question.marks : 0;
    } else {
      // For subjective questions, use AI grading
      try {
        const gradingPrompt = `Grade this answer:\n\nQuestion: ${question.question}\nModel Answer: ${question.correctAnswer}\nStudent Answer: ${answer.answer}\nMarks: ${question.marks}\n\nReturn JSON: {"marksAwarded": <number>, "isCorrect": <boolean>}`;

        let gradingResponse: string;
        try {
          gradingResponse = await generateWithGemini(gradingPrompt);
        } catch {
          gradingResponse = await generateWithGroq(gradingPrompt);
        }

        const cleaned = gradingResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const grading = JSON.parse(cleaned);
        marksAwarded = Math.min(grading.marksAwarded || 0, question.marks);
        isCorrect = marksAwarded >= question.marks * 0.5;
      } catch {
        // Fallback: simple keyword matching
        const studentWords = answer.answer.toLowerCase().split(/\s+/);
        const correctWords = question.correctAnswer.toLowerCase().split(/\s+/);
        const overlap = studentWords.filter(w => correctWords.includes(w)).length;
        const ratio = overlap / correctWords.length;
        marksAwarded = Math.round(ratio * question.marks);
        isCorrect = ratio >= 0.5;
      }
    }

    totalScore += marksAwarded;
    if (isCorrect) correctCount++;

    gradedQuestions.push({
      questionId: answer.questionId,
      studentAnswer: answer.answer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      conceptId: question.conceptId,
      timeTaken: answer.timeTaken,
      marks: marksAwarded,
    });
  }

  const weakConcepts = gradedQuestions
    .filter(q => !q.isCorrect)
    .map(q => q.conceptId)
    .filter((v, i, a) => a.indexOf(v) === i);

  const strongConcepts = gradedQuestions
    .filter(q => q.isCorrect)
    .map(q => q.conceptId)
    .filter((v, i, a) => a.indexOf(v) === i);

  const result = await TestResult.create({
    studentId,
    testType,
    subject,
    score: totalScore,
    totalMarks,
    correctAnswers: correctCount,
    totalQuestions: answers.length,
    timeTakenSeconds: answers.reduce((sum, a) => sum + a.timeTaken, 0),
    questions: gradedQuestions,
    percentage: totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0,
    insights: {
      weakConcepts,
      strongConcepts,
      improvementAreas: weakConcepts,
      suggestion: `Focus on reviewing ${weakConcepts.length} concept(s) where you need improvement.`,
    },
  });

  return result;
}

export async function getTestHistory(
  studentId: string,
  subject?: string,
  limit: number = 10
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  await connectDB();

  const filter: Record<string, unknown> = { studentId };
  if (subject) filter.subject = subject;

  return TestResult.find(filter)
    .sort({ takenAt: -1 })
    .limit(limit);
}
