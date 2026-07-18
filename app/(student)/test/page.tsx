"use client";

import { useState, useEffect, useCallback } from "react";

interface Question {
  id: string;
  type: "MCQ" | "short_2mark" | "short_3mark" | "long_5mark";
  question: string;
  options: string[] | null;
  conceptId: string;
  marks: number;
  timeEstimate: number;
}

interface Test {
  testId: string;
  questions: Question[];
  totalMarks: number;
  timeLimitMinutes: number;
  subject: string;
}

interface TestResult {
  score: number;
  totalMarks: number;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  insights: {
    weakConcepts: string[];
    strongConcepts: string[];
    suggestion: string;
  };
  questions: {
    questionId: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    marks: number;
  }[];
}

const SUBJECTS = [
  { id: "science", name: "Science", icon: "🔬" },
  { id: "algebra", name: "Algebra", icon: "📐" },
  { id: "geometry", name: "Geometry", icon: "📏" },
];

export default function TestPage() {
  const [view, setView] = useState<"select" | "taking" | "results">("select");
  const [test, setTest] = useState<Test | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("science");

  const studentId =
    typeof window !== "undefined"
      ? localStorage.getItem("antraai_student_id")
      : null;

  useEffect(() => {
    if (!studentId) {
      window.location.href = "/register";
    }
  }, [studentId]);

  // Timer
  useEffect(() => {
    if (view !== "taking" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          if (test && studentId) {
            const answerArray = test.questions.map((q) => ({
              questionId: q.id,
              answer: answers[q.id] || "",
              timeTaken: 30,
            }));

            fetch("/api/test/grade", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                testId: test.testId,
                studentId,
                answers: answerArray,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.error) throw new Error(data.error);
                setResult(data);
                setView("results");
              })
              .catch((err) => {
                console.error("Failed to submit test:", err);
              });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, timeLeft]);

  const startTest = async (type: "diagnostic" | "weekly") => {
    if (!studentId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/test/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          subject: selectedSubject,
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTest(data);
      setTimeLeft(data.timeLimitMinutes * 60);
      setCurrentQ(0);
      setAnswers({});
      setView("taking");
    } catch (err) {
      console.error("Failed to generate test:", err);
      alert("Failed to generate test. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!test || !studentId) return;
    setLoading(true);

    try {
      const answerArray = test.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
        timeTaken: 30,
      }));

      const res = await fetch("/api/test/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: test.testId,
          studentId,
          answers: answerArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setView("results");
    } catch (err) {
      console.error("Failed to grade test:", err);
      alert("Failed to submit test. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [test, studentId, answers]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Test selection view
  if (view === "select") {
    return (
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <a href="/chat" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Back to Chat
          </a>
          <h1 className="text-2xl font-bold">Practice Tests</h1>
          <p className="text-muted text-sm mt-1">
            Test your knowledge and track your progress
          </p>
        </header>

        {/* Subject selector */}
        <div className="flex gap-2 mb-6">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                selectedSubject === s.id
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <TestOption
            icon="🔍"
            title="Diagnostic Test"
            description="10 questions to assess your current level across all chapters"
            time="30 min"
            onClick={() => startTest("diagnostic")}
            loading={loading}
          />
          <TestOption
            icon="📝"
            title="Weekly Test"
            description="15 questions focused on your weak areas and recent topics"
            time="45 min"
            onClick={() => startTest("weekly")}
            loading={loading}
          />
        </div>

        <div className="mt-8">
          <a
            href="/results"
            className="text-sm text-primary hover:underline"
          >
            View Past Test Results →
          </a>
        </div>
      </div>
    );
  }

  // Test taking view
  if (view === "taking" && test) {
    const question = test.questions[currentQ];
    const progress = ((currentQ + 1) / test.questions.length) * 100;

    return (
      <div className="flex-1 flex flex-col h-screen max-h-screen">
        {/* Test header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              Question {currentQ + 1} / {test.questions.length}
            </span>
            <span
              className={`text-sm font-mono ${
                timeLeft < 60 ? "text-danger font-bold" : "text-muted"
              }`}
            >
              ⏱ {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {test.totalMarks} marks total
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {question.type.replace("_", " ").toUpperCase()}
                </span>
                <span className="text-xs text-muted">
                  {question.marks} mark{question.marks > 1 ? "s" : ""}
                </span>
              </div>

              <p className="text-gray-800 leading-relaxed mb-4">
                {question.question}
              </p>

              {question.type === "MCQ" && question.options ? (
                <div className="space-y-2">
                  {question.options.map((opt, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        answers[question.id] === opt
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={opt}
                        checked={answers[question.id] === opt}
                        onChange={(e) =>
                          setAnswers({ ...answers, [question.id]: e.target.value })
                        }
                        className="accent-primary"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[question.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [question.id]: e.target.value })
                  }
                  placeholder={
                    question.type === "long_5mark"
                      ? "Write your detailed answer here. Show all steps for numerical problems..."
                      : "Write your answer here..."
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[120px] resize-y"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                ← Previous
              </button>

              <div className="flex gap-1">
                {test.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={`w-7 h-7 text-xs rounded-full ${
                      i === currentQ
                        ? "bg-primary text-white"
                        : answers[test.questions[i].id]
                        ? "bg-secondary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentQ === test.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-white bg-secondary rounded-lg hover:bg-secondary/90 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Test"}
                </button>
              ) : (
                <button
                  onClick={() =>
                    setCurrentQ(Math.min(test.questions.length - 1, currentQ + 1))
                  }
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (view === "results" && result) {
    return (
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Test Results</h1>
        </header>

        {/* Score card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="text-center">
            <div
              className={`text-5xl font-bold mb-2 ${
                result.percentage >= 70
                  ? "text-secondary"
                  : result.percentage >= 40
                  ? "text-accent"
                  : "text-danger"
              }`}
            >
              {result.percentage}%
            </div>
            <p className="text-muted">
              {result.correctAnswers} / {result.totalQuestions} correct
            </p>
            <p className="text-sm text-muted mt-1">
              Score: {result.score} / {result.totalMarks} marks
            </p>
          </div>
        </div>

        {/* Insights */}
        {result.insights && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="font-semibold mb-3">💡 Insights</h2>
            <p className="text-sm text-gray-600 mb-4">
              {result.insights.suggestion}
            </p>

            {result.insights.weakConcepts.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-danger mb-1">
                  Needs Work:
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.insights.weakConcepts.map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.insights.strongConcepts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-secondary mb-1">
                  Strong Areas:
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.insights.strongConcepts.map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question review */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold mb-3">Question Review</h2>
          <div className="space-y-3">
            {result.questions.map((q, i) => (
              <div
                key={q.questionId}
                className={`p-3 rounded-lg border ${
                  q.isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Q{i + 1}</span>
                  <span
                    className={`text-xs ${
                      q.isCorrect ? "text-secondary" : "text-danger"
                    }`}
                  >
                    {q.isCorrect ? "✓ Correct" : "✗ Incorrect"} ({q.marks}{" "}
                    marks)
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  Your answer: {q.studentAnswer || "(no answer)"}
                </p>
                {!q.isCorrect && (
                  <p className="text-xs text-gray-500 truncate">
                    Correct: {q.correctAnswer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setView("select");
              setTest(null);
              setResult(null);
            }}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Take Another Test
          </button>
          <a
            href="/chat"
            className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
          >
            Back to Chat
          </a>
        </div>
      </div>
    );
  }

  return null;
}

function TestOption({
  icon,
  title,
  description,
  time,
  onClick,
  loading,
}: {
  icon: string;
  title: string;
  description: string;
  time: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:border-primary/30 hover:shadow-sm transition disabled:opacity-50"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <span className="text-xs text-muted bg-gray-50 px-2 py-1 rounded">
          ⏱ {time}
        </span>
      </div>
    </button>
  );
}
