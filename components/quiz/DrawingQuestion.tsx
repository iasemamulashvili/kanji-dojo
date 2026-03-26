"use client";

import type { DrawingQuestion as DrawingQuestionType } from "@/app/api/quiz/questions/route";
import KanjiCanvas from "../KanjiCanvas";

interface Props {
  question: DrawingQuestionType;
  onComplete: (correct: boolean) => void;
}

export default function DrawingQuestion({ question, onComplete }: Props) {
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
           onComplete={onComplete} 
        />
      </div>
      
      <p className="text-xs text-center opacity-60 font-semibold" style={{ color: "#8A9A41" }}>
        Trace the character from memory.
      </p>
    </div>
  );
}
