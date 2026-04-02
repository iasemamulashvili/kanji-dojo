"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface LeaderboardEntry {
  telegram_id: string;
  username?: string;
  total_score: number;
  sessions_played?: number;
  completed_sessions: number;
  streak_days: number;
  accuracy_pct: number;
}

export default function Scoreboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/quiz/leaderboard")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load leaderboard");
        return res.json();
      })
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden p-4 md:p-8 flex flex-col items-center"
      style={{ background: "#F4F1EB", color: "#2C2F24" }}
    >
      {/* ── Background Leaf — left ── */}
      <div
        className="pointer-events-none select-none"
        style={{
          position: "fixed",
          left: "-60px",
          top: "60px",
          width: "240px",
          opacity: 0.28,
          mixBlendMode: "multiply",
          zIndex: 0,
          transform: "rotate(-12deg)",
        }}
        aria-hidden="true"
      >
        <Image src="/left-leaf.svg" alt="" width={240} height={480} priority />
      </div>

      {/* ── Background Leaf — right ── */}
      <div
        className="pointer-events-none select-none"
        style={{
          position: "fixed",
          right: "-60px",
          bottom: "80px",
          width: "220px",
          opacity: 0.24,
          mixBlendMode: "multiply",
          zIndex: 0,
          transform: "rotate(8deg)",
        }}
        aria-hidden="true"
      >
        <Image src="/right-leaf.svg" alt="" width={220} height={440} priority />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md pb-12">
        <header className="flex justify-between items-center w-full mb-10">
          <div
            className="text-lg font-bold tracking-[0.25em] uppercase"
            style={{ color: "#2C2F24" }}
          >
            Kanji Dojo
          </div>
          <div
            className="text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full"
            style={{ background: "rgba(138,154,65,0.12)", color: "#8A9A41" }}
          >
            Leaderboard
          </div>
        </header>

        <div
          className="kanji-stone w-full flex items-center justify-center mb-8 py-10 px-8"
        >
          <span
            className="font-bold leading-none select-none"
            style={{ fontSize: "clamp(4rem, 18vw, 6rem)", color: "#2C2F24" }}
          >
            名誉
          </span>
        </div>

        <div className="wabi-divider my-4 w-full" aria-hidden="true">
          <svg viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,10 C40,0 80,20 120,10 C160,0 200,18 240,10 C280,2 320,18 360,10 C380,6 395,12 400,10"
              stroke="#8A9A41"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="w-full flex flex-col gap-4 mt-6">
          {loading && (
            <p className="text-center text-sm font-semibold opacity-60" style={{ color: "#8A9A41" }}>
              Loading ranks...
            </p>
          )}
          
          {error && (
            <p className="text-center text-sm font-semibold text-red-800 opacity-80">
              {error}
            </p>
          )}

          {!loading && !error && leaderboard.length === 0 && (
            <p className="text-center text-sm font-semibold opacity-60" style={{ color: "#8A9A41" }}>
              No games played yet. Be the first!
            </p>
          )}

          {!loading && !error && leaderboard.map((player, idx) => {
            let medal = "";
            if (idx === 0) medal = "🥇";
            else if (idx === 1) medal = "🥈";
            else if (idx === 2) medal = "🥉";
            else medal = `${idx + 1}.`;

            return (
              <div
                key={player.telegram_id}
                className="flex justify-between items-center p-5 relative overflow-hidden"
                style={{
                  background: idx < 3 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                  borderRadius: "81% 19% 88% 12% / 15% 79% 21% 85%", // Wabi-Sabi card shape!
                  border: idx < 3 ? "1.5px solid rgba(138,154,65,0.3)" : "1px solid rgba(138,154,65,0.15)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "none"
                }}
              >
                {/* Number/Medal and Name */}
                <div className="flex items-center gap-4 relative z-10">
                  <span 
                    className="font-bold flex items-center justify-center text-xl" 
                    style={{ 
                      color: idx < 3 ? "#5a6b1e" : "#8A9A41", 
                      width: "32px",
                      opacity: idx < 3 ? 1 : 0.7
                    }}
                  >
                    {medal}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-[1.05rem] flex items-center gap-2" style={{ color: "#2C2F24" }}>
                      {player.username || `Player ${player.telegram_id.slice(-4)}`}
                      {player.accuracy_pct > 80 && (
                        <span className="text-[0.55rem] tracking-widest uppercase bg-amber-900/10 text-amber-900 px-2 py-0.5 rounded-full whitespace-nowrap">
                          ⛩️ Sensei
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-semibold tracking-wide uppercase mt-0.5 flex items-center gap-2" style={{ color: "rgba(138,154,65,0.8)" }}>
                      <span>{player.completed_sessions} completions</span>
                      {player.streak_days > 0 && (
                        <span className="flex items-center gap-1 text-orange-700/80">
                          🔥 {player.streak_days}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Score and Flag */}
                <div className="flex flex-col items-end relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-3xl leading-none" style={{ color: "#2C2F24" }}>
                      {player.total_score}
                    </span>
                  </div>
                  {player.completed_sessions > 0 && (
                     <div className="text-[0.65rem] font-bold uppercase tracking-widest mt-1 flex items-center gap-1" style={{ color: "#8A9A41" }}>
                       {player.completed_sessions} 🏁
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
