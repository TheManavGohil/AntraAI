"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface Tutor {
  tutorId: string;
  name: string;
  subject: string;
  board: string;
  gradeRange: string;
  tokenRate: number;
}

export default function ChatLessonPage() {
  const router = useRouter();
  const params = useParams();
  const tutorId = params.tutorId as string;

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const studentId = typeof window !== "undefined" ? localStorage.getItem("antraai_student_id") : null;

  useEffect(() => {
    async function fetchTutor() {
      try {
        const res = await fetch(`/api/tutor/${tutorId}`);
        if (res.ok) {
          const data = await res.json();
          setTutor(data.tutor);
        } else {
            // fallback mock data if db is missing
            if (tutorId === "omkar") {
                setTutor({
                    tutorId: "omkar", name: "Omkar Shinde", subject: "English", board: "MSBSHSE", gradeRange: "Grade 9-12", tokenRate: 2.5
                });
            } else {
                setTutor({
                    tutorId, name: "Sample Tutor", subject: "Sample Subject", board: "MSBSHSE", gradeRange: "Grade 9-12", tokenRate: 2.5
                });
            }
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchTutor();
  }, [tutorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !studentId) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          studentId,
          tutorId,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const chips = [
    "Teach me a topic",
    "Clear my doubts",
    "Explain step by step"
  ];

  if (!tutor) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading Tutor...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-900 text-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white">
            ←
          </button>
          <div className="w-10 h-10 rounded-full bg-gray-700"></div>
          <div>
            <h2 className="font-bold">{tutor.name}</h2>
            <p className="text-xs text-gray-400">{tutor.subject} • {tutor.board}</p>
          </div>
        </div>
        <Link href={`/tutor/${tutorId}/live`} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg text-sm transition">
          Go Live ({tutor.tokenRate} Tokens/Min)
        </Link>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-6">
            <div>
              <div className="w-20 h-20 rounded-full bg-gray-800 mx-auto mb-4"></div>
              <h3 className="text-xl font-medium text-gray-300">Start learning with {tutor.name}</h3>
              <p className="text-sm">What would you like to focus on today?</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center max-w-md">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => {
                    setInput(chip);
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-sm transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-teal-600 text-white rounded-tr-none"
                    : "bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
              <div className="flex gap-1.5 items-center h-5">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form
          onSubmit={handleSend}
          className="flex gap-3 bg-gray-800 p-2 rounded-xl border border-gray-700 focus-within:border-teal-500 transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white px-3 py-2 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-teal-600 hover:bg-teal-500 text-white p-2.5 rounded-lg disabled:opacity-50 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </form>
        <div className="text-center mt-2">
            <span className="text-xs text-gray-500">Every response deducts 1 token.</span>
        </div>
      </div>
    </div>
  );
}
