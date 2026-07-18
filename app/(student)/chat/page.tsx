"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { chapter: string; page?: number }[];
  timestamp: Date;
}

const SUBJECTS = [
  { id: "science", name: "Science", icon: "🔬" },
  { id: "algebra", name: "Algebra", icon: "📐" },
  { id: "geometry", name: "Geometry", icon: "📏" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("science");
  const [socraticMode, setSocraticMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const studentId =
    typeof window !== "undefined"
      ? localStorage.getItem("antraai_student_id")
      : null;
  const studentName =
    typeof window !== "undefined"
      ? localStorage.getItem("antraai_student_name")
      : "Student";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!studentId) {
      window.location.href = "/register";
    }
  }, [studentId]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !studentId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          studentId,
          subject,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen max-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-primary">
            Antra<span className="text-secondary">AI</span>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-muted">Hi, {studentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/mastery"
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            Mastery
          </a>
          <a
            href="/test"
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            Tests
          </a>
        </div>
      </header>

      {/* Subject selector */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              subject === s.id
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.icon} {s.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted">Socratic</label>
          <button
            onClick={() => setSocraticMode(!socraticMode)}
            className={`w-8 h-4 rounded-full transition ${
              socraticMode ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-3 h-3 bg-white rounded-full transition-transform ${
                socraticMode ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-medium text-gray-700 mb-1">
              Ask anything from your textbook!
            </h3>
            <p className="text-sm text-muted">
              I&apos;ll answer based on your Maharashtra SSC textbook content.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "What is Ohm's Law?",
                "Explain Newton's Third Law",
                "How to solve quadratic equations?",
                "What are the types of sets?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-in-up flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-muted">
                    📖 {msg.sources.map((s) => s.chapter).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a doubt from your textbook..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
