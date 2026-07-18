"use client";

import { useState, useEffect, useCallback } from "react";

interface TestHistory {
  _id: string;
  subject: string;
  testType: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  takenAt: string;
  insights?: {
    weakConcepts: string[];
    strongConcepts: string[];
    suggestion: string;
  };
}

export default function ResultsPage() {
  const [tests, setTests] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const id = localStorage.getItem("antraai_student_id");
    if (!id) {
      window.location.href = "/register";
      return;
    }
    setStudentId(id);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const fetchTests = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mastery?studentId=${id}`);
      const data = await res.json();
      if (res.ok && data.recentTests) {
        setTests(data.recentTests);
      }
    } catch {
      console.error("Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (studentId) {
      fetchTests(studentId);
    }
  }, [studentId, fetchTests]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 70) return "text-green-600 bg-green-50";
    if (pct >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted">Loading test history...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto px-4 py-8">
      <header className="mb-6">
        <a href="/chat" className="text-sm text-primary hover:underline mb-1 inline-block">
          ← Back to Chat
        </a>
        <h1 className="text-2xl font-bold">Test Results</h1>
      </header>

      {tests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="font-medium mb-2">No tests taken yet</h3>
          <p className="text-sm text-muted mb-4">
            Take your first test to see your results here
          </p>
          <a
            href="/test"
            className="inline-flex px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
          >
            Take a Test
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test._id}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {test.subject === "science"
                      ? "🔬"
                      : test.subject === "algebra"
                      ? "📐"
                      : "📏"}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm capitalize">
                      {test.subject} - {test.testType}
                    </h3>
                    <p className="text-xs text-muted">
                      {formatDate(test.takenAt)}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreColor(
                    Math.round((test.score / test.totalMarks) * 100)
                  )}`}
                >
                  {Math.round((test.score / test.totalMarks) * 100)}%
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                <span>
                  Score: {test.score}/{test.totalMarks}
                </span>
                <span>
                  Correct: {test.correctAnswers}/{test.totalQuestions}
                </span>
              </div>

              {test.insights?.suggestion && (
                <p className="mt-2 text-xs text-gray-600 italic">
                  💡 {test.insights.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
