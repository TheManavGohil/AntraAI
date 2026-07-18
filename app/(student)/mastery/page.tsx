"use client";

import { useState, useEffect, useCallback } from "react";

interface MasteryConcept {
  conceptId: string;
  mastery: number;
  attempts: number;
  correct: number;
  name: string;
  chapter: string;
  subject: string;
  difficulty: string;
  lastPracticed?: string;
}

interface ChapterProgress {
  chapter: { id: string; name: string; number: number; subject: string; standard: number };
  totalConcepts: number;
  masteredCount: number;
  averageMastery: number;
}

interface MasteryData {
  concepts: MasteryConcept[];
  weakConcepts: { conceptId: string; mastery: number; name: string; chapter: string }[];
  strongConcepts: { conceptId: string; mastery: number; name: string; chapter: string }[];
  chapterProgress: ChapterProgress[];
  subjectMastery: { science: number; algebra: number; geometry: number };
}

export default function MasteryPage() {
  const [data, setData] = useState<MasteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "science" | "algebra" | "geometry">("all");
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

  const fetchMastery = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mastery?studentId=${id}`);
      const fetchedData = await res.json();
      if (res.ok) setData(fetchedData);
    } catch {
      console.error("Failed to fetch mastery");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (studentId) {
      fetchMastery(studentId);
    }
  }, [studentId, fetchMastery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.7) return "bg-green-500";
    if (mastery >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMasteryTextColor = (mastery: number) => {
    if (mastery >= 0.7) return "text-green-600";
    if (mastery >= 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-muted">Loading your mastery data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">Failed to load mastery data</p>
          <button
            onClick={() => studentId && fetchMastery(studentId)}
            className="mt-2 px-4 py-2 text-sm bg-primary text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredConcepts =
    filter === "all"
      ? data.concepts
      : data.concepts.filter((c) => c.subject === filter);

  const filteredChapters =
    filter === "all"
      ? data.chapterProgress
      : data.chapterProgress.filter((c) => c.chapter.subject === filter);

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <a href="/chat" className="text-sm text-primary hover:underline mb-1 inline-block">
            ← Back to Chat
          </a>
          <h1 className="text-2xl font-bold">Mastery Map</h1>
        </div>
      </header>

      {/* Subject Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(data.subjectMastery).map(([subject, mastery]) => (
          <div
            key={subject}
            className="bg-white rounded-xl border border-gray-100 p-4 text-center"
          >
            <div className="text-2xl mb-1">
              {subject === "science" ? "🔬" : subject === "algebra" ? "📐" : "📏"}
            </div>
            <p className="text-xs text-muted capitalize mb-2">{subject}</p>
            <div className="text-2xl font-bold" style={{ color: mastery >= 0.7 ? "#10b981" : mastery >= 0.4 ? "#f59e0b" : "#ef4444" }}>
              {Math.round(mastery * 100)}%
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getMasteryColor(mastery)}`}
                style={{ width: `${mastery * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "science", "algebra", "geometry"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === f
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Chapter Progress */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold mb-4">Chapter Progress</h2>
        <div className="space-y-3">
          {filteredChapters.map((ch) => (
            <div key={ch.chapter.id} className="flex items-center gap-3">
              <div className="w-40 text-sm text-gray-700 truncate">
                {ch.chapter.name}
              </div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getMasteryColor(ch.averageMastery)}`}
                  style={{ width: `${ch.averageMastery * 100}%` }}
                />
              </div>
              <div className="w-16 text-right text-xs text-muted">
                {ch.masteredCount}/{ch.totalConcepts}
              </div>
              <div className={`w-20 text-right text-xs font-medium ${getMasteryTextColor(ch.averageMastery)}`}>
                {Math.round(ch.averageMastery * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Concepts */}
      {data.weakConcepts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold mb-4">
            🔴 Needs Work ({data.weakConcepts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.weakConcepts.slice(0, 10).map((c) => (
              <div
                key={c.conceptId}
                className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{c.name}</p>
                  <p className="text-xs text-muted">{c.chapter}</p>
                </div>
                <span className="text-xs font-medium text-red-600">
                  {Math.round(c.mastery * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Concepts */}
      {data.strongConcepts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold mb-4">
            🟢 Mastered ({data.strongConcepts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.strongConcepts.slice(0, 10).map((c) => (
              <div
                key={c.conceptId}
                className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{c.name}</p>
                  <p className="text-xs text-muted">{c.chapter}</p>
                </div>
                <span className="text-xs font-medium text-green-600">
                  {Math.round(c.mastery * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Concepts Grid */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold mb-4">
          All Concepts ({filteredConcepts.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredConcepts.map((c) => (
            <div
              key={c.conceptId}
              className="p-2 rounded-lg border border-gray-100 hover:border-gray-200 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {c.name}
                </p>
                <span className={`text-xs font-medium ${getMasteryTextColor(c.mastery)}`}>
                  {Math.round(c.mastery * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted truncate">{c.chapter}</p>
              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getMasteryColor(c.mastery)}`}
                  style={{ width: `${c.mastery * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
