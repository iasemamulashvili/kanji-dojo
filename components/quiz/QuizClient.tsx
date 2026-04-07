"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { QuizQuestion as QuizQuestionType, QuizQuestionsResponse } from "@/app/api/quiz/questions/route";
import { 
  Trophy, 
  Flame, 
  Target, 
  History, 
  ChevronRight, 
  Volume2, 
  PenTool, 
  BookOpen, 
  ArrowRightLeft, 
  Search,
  Filter
} from "lucide-react";
import QuizQuestion from "./QuizQuestion";
import { createClient } from "@supabase/supabase-js";

// ─── Wavy SVG divider (matches PracticeClient aesthetic) ───────────────────
function WabiDivider() {
  return (
    <div className="wabi-divider my-4" aria-hidden="true">
      <svg viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,10 C40,0 80,20 120,10 C160,0 200,18 240,10 C280,2 320,18 360,10 C380,6 395,12 400,10"
          stroke="var(--ebony)"
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
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            i < current ? 'bg-text-muted' : i === current ? 'bg-text-muted/55' : 'bg-text-main/18'
          }`}
        />
      ))}
    </div>
  );
}

// ── Shared layout wrapper ─────────────────────────────────────────────────
function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden p-4 md:p-8 flex flex-col items-center bg-background text-text-main"
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
            className="text-lg font-bold tracking-[0.25em] uppercase text-text-main"
          >
            Kanji Dojo
          </div>
          <div
            className="text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-text-muted/12 text-text-muted"
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
  const [typeStats, setTypeStats] = useState<Record<string, { correct: number, total: number }>>({});

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

    // Update granular stats
    const qType = questions[currentIndex].type;
    const updatedStats = { ...typeStats };
    if (!updatedStats[qType]) updatedStats[qType] = { correct: 0, total: 0 };
    updatedStats[qType].total += 1;
    if (correct) updatedStats[qType].correct += 1;
    setTypeStats(updatedStats);

    fetch("/api/quiz/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        score: newScore,
        finished: isFinished,
        totalCorrect: newScore,
        totalQuestions: questions.length,
        typeStats: updatedStats, // Send the final session stats
      }),
    });

    if (isFinished) {
       // Allow a moment for the DB to process
       setTimeout(() => setStatus("complete"), 800);
    }

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
          className="wabi-card w-full max-w-md p-10 flex flex-col items-center justify-center min-h-[200px]"
        >
          <div className="text-4xl animate-pulse">
            ⛩️
          </div>
          <p className="mt-4 text-xs font-semibold tracking-widest uppercase text-text-muted">
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
          <div className="text-4xl mb-3">🪦</div>
          <h2 className="text-lg font-bold text-accent mb-2">
            Could not load quiz
          </h2>
          <p className="text-xs text-text-muted/70">{errorMsg}</p>
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

    const score = myParticipant?.score || 0;

    return (
      <PageLayout>
        <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
          {/* Kanji Stone Summary */}
          <div className="kanji-stone w-full aspect-square flex flex-col items-center justify-center p-8 mb-12">
            <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-text-muted opacity-60 mb-2">Quiz Complete</h2>
            <div className="text-6xl font-black text-text-main mb-4">
              {score} <span className="text-2xl text-text-muted/40">/ {questions.length}</span>
            </div>
            <p className="text-xs font-bold tracking-widest uppercase text-accent bg-accent/10 px-4 py-2 rounded-full imperfect-border">
               {score === questions.length ? "Sensei's Perfection" : "A Disciplined Effort"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 w-full mb-12">
             <button 
               onClick={() => window.location.href = '/practice'}
               className="wabi-card p-4 text-xs font-black uppercase tracking-[0.2em] hover:border-text-muted transition-all flex items-center justify-center gap-2 group"
             >
               Retreat to Dojo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
             </button>
             <button 
               onClick={() => window.location.href = '/stats'}
               className="wabi-card p-4 text-xs font-black uppercase tracking-[0.2em] hover:border-text-muted transition-all flex items-center justify-center gap-2 group"
             >
               Mastery Scroll <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
             </button>
          </div>

          <WabiDivider />
          
          <h3 className="text-[0.6rem] font-bold tracking-[0.4em] uppercase text-text-muted opacity-60 mb-6 mt-8">Final Leaderboard</h3>
          
          <div className="flex flex-col gap-3 w-full pb-20">
            {sorted.map((p, idx) => {
              const isMe = p.telegram_id.toString() === myParticipant?.telegram_id?.toString();
              return (
                <div
                  key={p.id}
                  className={`flex justify-between items-center p-4 rounded-xl transition-all duration-500 border ${
                    isMe ? 'bg-text-muted/15 border-text-muted/40 scale-102' : 'bg-text-muted/5 border-text-muted/20'
                  }`}
                >
                  <span className={`font-semibold flex items-center gap-2 ${isMe ? 'text-accent' : 'text-text-muted'}`}>
                    {idx + 1}. {isMe ? "✨ You" : `Player ${p.telegram_id.toString().slice(-4)}`}
                  </span>
                  <span className="font-bold text-xl text-text-main">
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
    listening: "Listening",
  };

  return (
    <PageLayout>
      {/* Arena Title & Scoreboard */}
      <div className="w-full max-w-md flex flex-col mb-6">
        <h2 className="text-center font-bold tracking-widest uppercase mb-3 text-text-muted text-xs">
          Live Arena
        </h2>
        <div className="flex gap-2 flex-wrap justify-center p-3 rounded-xl bg-text-muted/6 border border-text-muted/15 min-h-[48px]">
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
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-2 ${
                    isMe ? 'bg-text-muted/20 text-text-muted' : 'bg-transparent text-text-muted'
                  }`}
                >
                  {isMe ? "You" : `P${p.telegram_id.toString().slice(-4)}`}
                  <span className="bg-text-muted text-background px-1.5 py-0.5 rounded-sm">
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
      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-text-muted mb-3">
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
      <p className="mt-4 text-xs text-text-main/45 tracking-wide">
        {currentIndex + 1} / {questions.length}
      </p>
    </PageLayout>
  );
}
