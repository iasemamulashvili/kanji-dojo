"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { QuizQuestion as QuizQuestionType, QuizQuestionsResponse } from "@/app/api/quiz/questions/route";
import QuizQuestion from "./QuizQuestion";

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

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/quiz/questions?session_id=${sessionId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data: QuizQuestionsResponse = await res.json();
        setQuestions(data.questions);
        setTargetKanji(data.kanji);
        setStatus("ready");
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    }
    fetchQuestions();
  }, [sessionId]);

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setStatus("complete");
    } else {
      setCurrentIndex((i) => i + 1);
    }
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

        <div
          className="wabi-card w-full max-w-md p-8 flex flex-col items-center text-center"
          style={{ borderColor: "rgba(138,154,65,0.35)" }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎋</div>
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "#2C2F24",
              marginBottom: "0.4rem",
            }}
          >
            Quiz Complete
          </h2>
          <p
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#8A9A41",
            }}
          >
            All {questions.length} questions answered
          </p>
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
      {/* Kanji stone centrepiece */}
      <div
        className="kanji-stone w-full max-w-md flex items-center justify-center mb-8 py-10 px-8"
        aria-label={`Quiz kanji: ${targetKanji}`}
      >
        <span
          className="font-bold leading-none select-none"
          style={{ fontSize: "clamp(4rem,18vw,7rem)", color: "#2C2F24" }}
        >
          {targetKanji}
        </span>
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
