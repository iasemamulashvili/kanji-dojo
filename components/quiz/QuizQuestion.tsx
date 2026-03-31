"use client";

import dynamic from "next/dynamic";
import type { QuizQuestion as QuizQuestionType } from "@/app/api/quiz/questions/route";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import DrawingQuestion from "./DrawingQuestion";
import ListeningQuestion from "./ListeningQuestion";

// ─── NoSSR boundary for the dnd-kit matching component ─────────────────────
// @dnd-kit uses browser-only APIs; server-rendering it causes hydration errors.
const MatchingQuestionDynamic = dynamic(
  () => import("./MatchingQuestion"),
  { ssr: false, loading: () => (
    <div style={{ textAlign: "center", padding: "2rem", color: "#8A9A41", fontSize: "0.85rem" }}>
      Loading matching…
    </div>
  )}
);

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  question: QuizQuestionType;
  onComplete: (correct: boolean) => void;
}

// ─── Switcher ───────────────────────────────────────────────────────────────

export default function QuizQuestion({ question, onComplete }: Props) {
  if (question.type === "matching") {
    return <MatchingQuestionDynamic question={question} onComplete={onComplete} />;
  }
  
  if (question.type === "drawing") {
    return <DrawingQuestion question={question} onComplete={onComplete} />;
  }

  if (question.type === "listening") {
    return <ListeningQuestion question={question} onComplete={onComplete} />;
  }

  // meaning | reading | reverse – all share the same MC renderer
  return <MultipleChoiceQuestion question={question} onComplete={onComplete} />;
}
