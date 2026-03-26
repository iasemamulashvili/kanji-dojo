"use client";

import { useState, useCallback } from "react";
import type { DrawingQuestion as DrawingQuestionType } from "@/app/api/quiz/questions/route";
import KanjiCanvas from "../KanjiCanvas";

interface Props {
  question: DrawingQuestionType;
  onComplete: (correct: boolean) => void;
}

export default function DrawingQuestion({ question, onComplete }: Props) {
  const [attempts, setAttempts] = useState(0);

  // Called by KanjiCanvas when the user finishes a quiz attempt successfully.
  // We increment attempts and mark the answer correct — the user drew it!
  const handleAttemptDone = useCallback(() => {
    setAttempts((n) => n + 1);
    onComplete(true);
  }, [onComplete]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <p
        style={{
          fontSize: "clamp(1rem, 3.5vw, 1.25rem)",
          fontWeight: 600,
          color: "#2C2F24",
          textAlign: "center",
          marginBottom: "1.75rem",
          lineHeight: 1.4,
        }}
      >
        {question.question}
      </p>

      <div style={{ width: "100%", maxWidth: "340px", marginBottom: "1rem" }}>
        <KanjiCanvas
          character={question.kanji}
          initialMode="test"
          hideControls={true}
          onComplete={handleAttemptDone}
        />
      </div>

      <p className="text-xs text-center opacity-60 font-semibold" style={{ color: "#8A9A41", marginBottom: "1.25rem" }}>
        Trace the character from memory. Mistakes show the stroke — keep trying!
      </p>

      {/* Skip button — always visible so users aren't stuck */}
      <button
        onClick={() => onComplete(false)}
        style={{
          background: "transparent",
          border: "1px solid rgba(138,154,65,0.35)",
          borderRadius: "999px",
          color: "rgba(44,47,36,0.50)",
          fontSize: "0.78rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          padding: "0.45rem 1.4rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#8A9A41";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(138,154,65,0.7)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(44,47,36,0.50)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(138,154,65,0.35)";
        }}
      >
        Skip →
      </button>
    </div>
  );
}
