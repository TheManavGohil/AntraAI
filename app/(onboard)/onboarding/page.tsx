"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONCEPTS, SUBJECTS } from "@/lib/utils/constants";

const DIAGNOSTIC_COUNT = 10;

interface DiagnosticQuestion {
  questionId: string;
  conceptId: string;
  question: string;
  options: string[];
  correctIndex: number;
}

function generateDiagnosticQuestions(subjects: string[], standard: number): DiagnosticQuestion[] {
  const questions: DiagnosticQuestion[] = [];

  for (const subjectId of subjects) {
    const subjectConcepts = CONCEPTS.filter(
      c => c.subject === subjectId && c.standard === standard
    );

    const shuffled = [...subjectConcepts].sort(() => Math.random() - 0.5);
    const perSubject = Math.ceil(DIAGNOSTIC_COUNT / subjects.length);

    for (const concept of shuffled.slice(0, perSubject)) {
      if (questions.length >= DIAGNOSTIC_COUNT) break;

      const distractors = [
        `The opposite of ${concept.name}`,
        `An unrelated concept from a different chapter`,
        `A common misconception about ${concept.name}`,
      ];

      const options = [
        `Correct understanding of ${concept.name}`,
        ...distractors,
      ].sort(() => Math.random() - 0.5);

      const correctIndex = options.findIndex(o =>
        o.startsWith("Correct understanding")
      );

      questions.push({
        questionId: `dq${questions.length + 1}`,
        conceptId: concept.id,
        question: `Which best describes ${concept.name}?`,
        options,
        correctIndex,
      });
    }
  }

  return questions.sort(() => Math.random() - 0.5).slice(0, DIAGNOSTIC_COUNT);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"subjects" | "diagnostic" | "results">("subjects");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const studentId = typeof window !== "undefined" ? localStorage.getItem("antraai_student_id") : null;
  const studentClass = typeof window !== "undefined" ? Number(localStorage.getItem("antraai_student_class") || "9") : 9;

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; conceptId: string; isCorrect: boolean }[]>([]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const startDiagnostic = () => {
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject");
      return;
    }
    setError("");
    const questions = generateDiagnosticQuestions(selectedSubjects, studentClass);
    setDiagnosticQuestions(questions);
    setStep("diagnostic");
  };

  const handleAnswer = (selectedIndex: number) => {
    const q = diagnosticQuestions[currentQ];
    const isCorrect = selectedIndex === q.correctIndex;

    const newAnswers = [...answers, {
      questionId: q.questionId,
      conceptId: q.conceptId,
      isCorrect,
    }];
    setAnswers(newAnswers);

    if (currentQ < diagnosticQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishOnboarding(newAnswers);
    }
  };

  const finishOnboarding = async (finalAnswers: { questionId: string; conceptId: string; isCorrect: boolean }[]) => {
    if (!studentId) {
      setError("Session expired. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          preferredSubjects: selectedSubjects,
          diagnosticAnswers: finalAnswers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Onboarding failed");
      }

      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const correctCount = answers.filter(a => a.isCorrect).length;

  if (!studentId) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Please log in first.</p>
          <button onClick={() => router.push("/login")} className="mt-4 text-primary hover:underline">
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  if (step === "subjects") {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">
              Antra<span className="text-secondary">AI</span>
            </h1>
            <p className="text-muted mt-2">Let&apos;s personalize your learning experience</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Step 1: Choose Your Subjects</h2>
            <p className="text-sm text-gray-500 mb-4">Select the subjects you want to study. You can change this later.</p>

            <div className="space-y-3">
              {SUBJECTS.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedSubjects.includes(subject.id)
                      ? "border-primary bg-primary/5"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{subject.icon}</span>
                  <span className="font-medium text-gray-800">{subject.name}</span>
                  {selectedSubjects.includes(subject.id) && (
                    <span className="ml-auto text-primary text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mt-4">
                {error}
              </div>
            )}

            <button
              onClick={startDiagnostic}
              disabled={selectedSubjects.length === 0}
              className="w-full mt-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Diagnostic Test
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "diagnostic") {
    const q = diagnosticQuestions[currentQ];
    const subjectInfo = CONCEPTS.find(c => c.id === q.conceptId);

    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Diagnostic Test</h1>
            <p className="text-sm text-muted mt-1">
              Question {currentQ + 1} of {diagnosticQuestions.length}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${((currentQ + 1) / diagnosticQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {subjectInfo && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {subjectInfo.chapter}
              </span>
            )}

            <h2 className="text-lg font-medium text-gray-800 mt-3 mb-4">{q.question}</h2>

            <div className="space-y-2">
              {q.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition-all text-sm"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const percentage = diagnosticQuestions.length > 0
    ? Math.round((correctCount / diagnosticQuestions.length) * 100)
    : 0;

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="text-5xl mb-4">
          {percentage >= 70 ? "🎉" : percentage >= 40 ? "👍" : "💪"}
        </div>

        <h1 className="text-3xl font-bold text-primary mb-2">You&apos;re All Set!</h1>
        <p className="text-muted mb-6">Your personalized learning plan is ready.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Diagnostic Results</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{percentage}%</p>
              <p className="text-xs text-muted">Score</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-500">{correctCount}</p>
              <p className="text-xs text-muted">Correct</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-400">{diagnosticQuestions.length - correctCount}</p>
              <p className="text-xs text-muted">Incorrect</p>
            </div>
          </div>

          <div className="mt-4 text-left">
            <p className="text-sm font-medium text-gray-700 mb-2">Selected Subjects:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map(s => {
                const subject = SUBJECTS.find(sub => sub.id === s);
                return (
                  <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {subject?.icon} {subject?.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          onClick={() => router.push("/chat")}
          disabled={loading}
          className="w-full max-w-xs mx-auto py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Setting up..." : "Start Learning →"}
        </button>
      </div>
    </main>
  );
}
