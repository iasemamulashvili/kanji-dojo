"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { QuizQuestion as QuizQuestionType, QuizQuestionsResponse } from "@/app/api/quiz/questions/route";
import QuizQuestion from "./QuizQuestion";
import { createClient } from "@supabase/supabase-js";

// ─── Wavy SVG divider (matches PracticeClient aesthetic) ───────────────────
function WabiDivider() {
  return (
    <div className="wabi-divider my-4" aria-hidden="true">
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
  );
}

// ─── Minimal progress pip row ───────────────────────────────────────────────
function ProgressPips({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        justifyContent: "center",
        marginBottom: "1.25rem",
      }}
      aria-label={`Question ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background:
              i < current
                ? "#8A9A41"        // completed = moss
                : i === current
                  ? "rgba(138,154,65,0.55)"  // active = lighter moss
                  : "rgba(44,47,36,0.18)",   // future = faint
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Shared layout wrapper ─────────────────────────────────────────────────
function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden p-4 md:p-8 flex flex-col items-center"
      style={{ background: "#F4F1EB", color: "#2C2F24" }}
    >
      {/* Leaf — left */}
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

      {/* Leaf — right */}
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
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Header */}
        <header className="flex justify-between items-center w-full max-w-md mx-auto mb-8">
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
            Quiz
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

// ─── Main QuizClient ────────────────────────────────────────────────────────

interface Props {
  sessionId: string;
}

type Status = "loading" | "ready" | "complete" | "error";

export default function QuizClient({ sessionId }: Props) {
  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [targetKanji, setTargetKanji] = useState<string>("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [myParticipant, setMyParticipant] = useState<any>(null);

  useEffect(() => {
    let channel: any;

    async function initQuiz() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qCount = urlParams.get('q');
        const qQuery = qCount ? `&count=${qCount}` : "";

        const [qRes, jRes] = await Promise.all([
          fetch(`/api/quiz/questions?session_id=${sessionId}${qQuery}`),
          fetch(`/api/quiz/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          }),
        ]);

        if (!qRes.ok) {
          const body = await qRes.json().catch(() => ({}));
          throw new Error(body.error ?? `Questions HTTP ${qRes.status}`);
        }
        if (!jRes.ok) {
          const body = await jRes.json().catch(() => ({}));
          throw new Error(body.error ?? `Join HTTP ${jRes.status}`);
        }

        const qData: QuizQuestionsResponse = await qRes.json();
        const jData = await jRes.json();

        setQuestions(qData.questions);
        setTargetKanji(qData.kanji);
        setMyParticipant(jData.myParticipant);
        setParticipants(jData.participants);
        setStatus("ready");

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        channel = supabase
          .channel(`quiz:${sessionId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "quiz_participants",
              filter: `session_id=eq.${sessionId}`,
            },
            (payload: any) => {
              setParticipants((prev) => {
                const exists = prev.find((p) => p.id === payload.new.id);
                if (exists) {
                  return prev.map((p) =>
                    p.id === payload.new.id ? payload.new : p
                  );
                }
                return [...prev, payload.new];
              });
            }
          )
          .subscribe();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    }
    initQuiz();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [sessionId]);

  function handleNext(correct: boolean) {
    const isFinished = currentIndex + 1 >= questions.length;
    let newScore = myParticipant?.score || 0;

    if (correct) {
      newScore += 1;
      setMyParticipant((prev: any) => prev ? { ...prev, score: newScore } : prev);
      // Immediately update local participants list to prevent "flicker" or stale score
      setParticipants((prev) => 
        prev.map((p) => 
          p.telegram_id.toString() === myParticipant?.telegram_id?.toString() 
            ? { ...p, score: newScore } 
            : p
        )
      );
    }

    fetch("/api/quiz/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        score: newScore, // or some calculated score, assuming newScore matches totalCorrect for now
        totalCorrect: newScore,
        totalQuestions: questions.length,
        finished: isFinished,
      }),
    });

    if (isFinished) {
      setStatus("complete");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  // ── Shared layout wrapper ─────────────────────────────────────────────────
  // Extracted to top-level to prevent unnecessary remounts

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <PageLayout>
        <div
          className="wabi-card w-full max-w-md p-10 flex flex-col items-center justify-center"
          style={{ minHeight: "200px" }}
        >
          <div
            style={{
              fontSize: "2rem",
              animation: "pulse 1.8s ease-in-out infinite",
            }}
          >
            ⛩️
          </div>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8A9A41",
            }}
          >
            Loading quiz…
          </p>
        </div>
      </PageLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <PageLayout>
        <div className="wabi-card w-full max-w-md p-8 flex flex-col items-center text-center">
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🪦</div>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#9b2c2c",
              marginBottom: "0.5rem",
            }}
          >
            Could not load quiz
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#82896e" }}>{errorMsg}</p>
        </div>
      </PageLayout>
    );
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  if (status === "complete") {
    const sorted = [...participants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const timeA = new Date(a.finished_at || 0).getTime();
      const timeB = new Date(b.finished_at || 0).getTime();
      return timeA - timeB;
    });

    return (
      <PageLayout>
        <div
          className="kanji-stone w-full max-w-md flex items-center justify-center mb-8 py-14 px-8"
          aria-label={`Kanji: ${targetKanji}`}
        >
          <span
            className="font-bold leading-none select-none"
            style={{ fontSize: "clamp(5rem,22vw,8rem)", color: "#2C2F24" }}
          >
            {targetKanji}
          </span>
        </div>

        <WabiDivider />

        <div className="w-full max-w-md p-2">
          <h3
            className="text-center font-bold tracking-widest uppercase mb-4"
            style={{ color: "#8A9A41", fontSize: "0.85rem" }}
          >
            Final Leaderboard
          </h3>
          <div className="flex flex-col gap-2">
            {sorted.map((p, idx) => {
              const isMe = p.telegram_id.toString() === myParticipant?.telegram_id?.toString();
              return (
                <div
                  key={p.id}
                  className="flex justify-between items-center p-4 rounded-xl transition-all duration-500"
                  style={{
                    background: isMe
                      ? "rgba(138,154,65,0.15)"
                      : "rgba(138,154,65,0.05)",
                    border: isMe 
                      ? "2px solid rgba(138,154,65,0.4)" 
                      : "1px solid rgba(138,154,65,0.2)",
                    transform: isMe ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <span
                    className="font-semibold flex items-center gap-2"
                    style={{ color: isMe ? "#4a1816" : "#8A9A41" }}
                  >
                    {idx + 1}. {isMe ? "✨ You" : `Player ${p.telegram_id.toString().slice(-4)}`}
                  </span>
                  <span
                    className="font-bold text-xl"
                    style={{ color: "#2C2F24" }}
                  >
                    {isMe ? Math.max(p.score, myParticipant?.score || 0) : p.score} / {questions.length} Correct {p.finished && "🏁"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Ready — show current question ─────────────────────────────────────────
  const currentQuestion = questions[currentIndex];
  const questionLabel: Record<string, string> = {
    meaning: "Meaning",
    reading: "Reading",
    reverse: "Kanji Recognition",
    matching: "Matching",
  };

  return (
    <PageLayout>
      {/* Arena Title & Scoreboard */}
      <div className="w-full max-w-md flex flex-col mb-6">
        <h2
          className="text-center font-bold tracking-widest uppercase mb-3"
          style={{ color: "#8A9A41", fontSize: "0.85rem" }}
        >
          Live Arena
        </h2>
        <div
          className="flex gap-2 flex-wrap justify-center p-3 rounded-xl"
          style={{
            background: "rgba(138,154,65,0.06)",
            border: "1px solid rgba(138,154,65,0.15)",
            minHeight: "48px"
          }}
        >
          {participants.length === 0 && (
            <span className="text-sm opacity-50 flex items-center">
              Waiting for players...
            </span>
          )}
          {[...participants]
            .sort((a, b) => b.score - a.score)
            .map((p) => {
              const isMe = p.telegram_id.toString() === myParticipant?.telegram_id?.toString();
              return (
                <div
                  key={p.id}
                  className="text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-2"
                  style={{
                    background: isMe ? "rgba(138,154,65,0.2)" : "transparent",
                    color: isMe ? "#5a6b1e" : "#8A9A41",
                  }}
                >
                  {isMe ? "You" : `P${p.telegram_id.toString().slice(-4)}`}
                  <span className="bg-[#8A9A41] text-[#F4F1EB] px-1.5 py-0.5 rounded-sm">
                    {p.score}
                  </span>
                  {p.finished && <span title="Finished">🏁</span>}
                </div>
              );
            })}
        </div>
      </div>

      <WabiDivider />

      {/* Progress */}
      <ProgressPips total={questions.length} current={currentIndex} />

      {/* Question type label */}
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8A9A41",
          marginBottom: "0.75rem",
        }}
      >
        {questionLabel[currentQuestion.type] ?? currentQuestion.type}
      </p>

      {/* Question card */}
      <div className="wabi-card w-full max-w-md p-6 md:p-8">
        <QuizQuestion
          key={currentIndex}
          question={currentQuestion}
          onComplete={handleNext}
        />
      </div>

      {/* Step counter */}
      <p
        style={{
          marginTop: "1rem",
          fontSize: "0.75rem",
          color: "rgba(44,47,36,0.45)",
          letterSpacing: "0.06em",
        }}
      >
        {currentIndex + 1} / {questions.length}
      </p>
    </PageLayout>
  );
}
