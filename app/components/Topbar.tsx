"use client";

import { useEffect, useState } from "react";

export default function Topbar() {
  const [tokens, setTokens] = useState(20);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch("/api/tokens/balance");
        if (res.ok) {
          const { data } = await res.json();
          setTokens(data.tokens);
          setStreak(data.streak);
        }
      } catch (e) {
        console.error("Failed to fetch tokens", e);
      }
    }
    fetchTokens();
  }, []);

  return (
    <header className="bg-gray-900 text-white border-b border-gray-800 h-16 flex items-center justify-end px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center space-x-6">
        {/* Streak */}
        <div className="flex items-center bg-gray-800 rounded-full px-3 py-1">
          <span className="mr-2">🔥</span>
          <span className="font-medium">{streak}</span>
        </div>

        {/* Tokens */}
        <div className="flex items-center bg-gray-800 rounded-full px-3 py-1">
          <span className="mr-2">🪙</span>
          <span className="font-medium text-yellow-400 mr-2">{tokens} tokens</span>
          <button className="bg-gray-700 hover:bg-gray-600 text-xs px-2 py-1 rounded-full transition">
            +
          </button>
        </div>

        {/* Profile */}
        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-teal-400 transition">
          K
        </div>
      </div>
    </header>
  );
}
