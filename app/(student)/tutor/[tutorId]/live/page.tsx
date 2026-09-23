"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

export default function LiveClassPage() {
  const router = useRouter();
  const params = useParams();
  const tutorId = params.tutorId as string;

  const [tutor, setTutor] = useState<any>(null);
  const [tokens, setTokens] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  const studentId = typeof window !== "undefined" ? localStorage.getItem("antraai_student_id") : null;

  useEffect(() => {
    async function fetchData() {
      try {
        const [tutorRes, tokensRes] = await Promise.all([
          fetch(`/api/tutor/${tutorId}`),
          fetch(`/api/tokens/balance`)
        ]);

        if (tutorRes.ok) {
          const tData = await tutorRes.json();
          setTutor(tData.tutor);
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

        if (tokensRes.ok) {
          const tkData = await tokensRes.json();
          setTokens(tkData.data.tokens);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, [tutorId]);

  // Simulated WebRTC timer and billing loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(async () => {
        setDuration(prev => prev + 1);

        // Every 60 seconds (mocked to 10s for fast testing if needed, keeping 60s for realism)
        if (duration > 0 && duration % 60 === 0 && tutor) {
          try {
            const res = await fetch("/api/tokens/deduct", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: tutor.tokenRate, description: `Live class minute with ${tutor.name}`, relatedService: "live_class" }),
            });

            if (res.ok) {
              const data = await res.json();
              setTokens(data.balance);
              if (data.balance < tutor.tokenRate) {
                setIsActive(false);
                setError("Insufficient tokens to continue. Call ended.");
              }
            } else {
               const data = await res.json();
               setIsActive(false);
               setError(data.error || "Failed to deduct tokens. Call ended.");
            }
          } catch (e) {
             console.error("Billing error", e);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, duration, tutor]);

  const startCall = () => {
    if (tutor && tokens < tutor.tokenRate) {
      setError(`You need at least ${tutor.tokenRate} tokens to start a 1-minute call.`);
      return;
    }
    setIsActive(true);
    setError("");
  };

  const endCall = () => {
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!tutor) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-900 text-white p-6 relative">
      <button onClick={() => router.back()} className="absolute top-6 left-6 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
        ← Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">

        <div className="text-center mb-10">
          <div className="w-32 h-32 rounded-full bg-gray-700 mx-auto mb-6 relative">
            {isActive && (
              <span className="absolute -inset-2 rounded-full border-2 border-teal-500 animate-ping opacity-75"></span>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{tutor.name}</h1>
          <p className="text-gray-400 mb-2">{tutor.subject} • {tutor.board}</p>
          <div className="inline-block bg-gray-800 px-4 py-1.5 rounded-full text-sm font-medium border border-gray-700">
            Rate: <span className="text-teal-400">{tutor.tokenRate} tokens/min</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-400 p-4 rounded-xl mb-8 text-center border border-red-900/50">
            {error}
          </div>
        )}

        <div className="bg-gray-800 p-8 rounded-3xl w-full text-center border border-gray-700 shadow-xl">
          <div className="mb-8">
             <div className="text-5xl font-mono mb-2 font-light tracking-wider">
               {formatTime(duration)}
             </div>
             <p className="text-gray-400">Current Balance: <span className="text-yellow-400">{tokens.toFixed(1)} tokens</span></p>
          </div>

          {!isActive ? (
            <button
              onClick={startCall}
              disabled={tokens < tutor.tokenRate}
              className="w-full py-4 bg-teal-600 hover:bg-teal-500 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-900/20"
            >
              Start Live Class
            </button>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center gap-4">
                 <button className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition">
                   🎙️
                 </button>
                 <button className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition">
                   📹
                 </button>
              </div>
              <button
                onClick={endCall}
                className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-lg transition shadow-lg shadow-red-900/20"
              >
                End Call
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
