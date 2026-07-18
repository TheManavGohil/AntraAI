import { searchTextbooks } from "@/lib/db/chroma";
import { generateWithGemini } from "@/lib/ai/gemini";
import { generateWithGroq } from "@/lib/ai/groq";
import { getDirectAnswerSystemPrompt, getSocraticSystemPrompt } from "@/lib/ai/prompts";
import { ConceptMastery } from "@/lib/db/schemas";

export interface RAGResponse {
  answer: string;
  sources: { chapter: string; page?: number; subject: string }[];
  conceptId?: string;
}

export async function queryAssistant(
  question: string,
  options: {
    studentName: string;
    studentClass: number;
    subject: string;
    masteryPercent: number;
    socraticMode?: boolean;
    conceptId?: string;
    studentId?: string;
    conversationContext?: string;
    socraticStep?: number;
  }
): Promise<RAGResponse> {
  const {
    studentName,
    studentClass,
    subject,
    masteryPercent,
    socraticMode = false,
    conceptId,
    studentId,
    conversationContext,
    socraticStep,
  } = options;

  const searchResults = await searchTextbooks(question, {
    nResults: 5,
    standard: studentClass,
    subject: subject,
  });

  const context = searchResults.documents
    .map((doc, i) => {
      const meta = searchResults.metadatas[i];
      return `[Source: ${meta.chapter || "Unknown"}, Page ${meta.page_number || "?"}]\n${doc}`;
    })
    .join("\n\n---\n\n");

  let conceptMastery = masteryPercent;
  if (conceptId && studentId) {
    const conceptRecord = await ConceptMastery.findOne({ studentId, conceptId });
    if (conceptRecord) {
      conceptMastery = conceptRecord.masteryProbability;
    }
  }

  const systemPrompt = socraticMode
    ? getSocraticSystemPrompt(studentName, studentClass, conceptMastery, subject, socraticStep)
    : getDirectAnswerSystemPrompt(studentName, studentClass, conceptMastery, subject);

  let userPrompt = `Based on the following textbook content, answer the student's question.\n\nTextbook Context:\n${context}\n\nQuestion: ${question}`;

  if (conversationContext) {
    userPrompt = `CONVERSATION HISTORY (most recent first):\n${conversationContext}\n\n---\n\nBased on the following textbook content and the conversation history, respond to the student's latest message.\n\nTextbook Context:\n${context}\n\nStudent's latest message: ${question}`;
  }

  let answer: string;
  try {
    answer = await generateWithGemini(userPrompt, systemPrompt);
  } catch {
    console.log("Gemini failed, falling back to Groq");
    answer = await generateWithGroq(userPrompt, systemPrompt);
  }

  const sources = searchResults.metadatas.map((meta) => ({
    chapter: (meta.chapter as string) || "Unknown",
    page: meta.page_number as number | undefined,
    subject: (meta.subject as string) || subject,
  }));

  return {
    answer,
    sources: sources.slice(0, 3),
    conceptId,
  };
}

export async function classifyQueryIntent(
  query: string
): Promise<{ isAcademic: boolean; suggestedSubject: string; suggestedConcept?: string }> {
  const prompt = `Classify this student query. Return JSON:
{
  "isAcademic": <true if related to school subjects (Science, Math, English)>,
  "suggestedSubject": "science" | "algebra" | "geometry" | "general",
  "suggestedConcept": "<concept name if identifiable, null otherwise>"
}

Student query: "${query}"

Return ONLY valid JSON.`;

  try {
    const response = await generateWithGemini(prompt);
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { isAcademic: true, suggestedSubject: "general" };
  }
}
