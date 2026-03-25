"use client";

import { useState } from "react";
import type {
  MeaningQuestion,
  ReadingQuestion,
  ReverseQuestion,
} from "@/app/api/quiz/questions/route";

type MCQuestion = MeaningQuestion | ReadingQuestion | ReverseQuestion;

interface Props {
  question: MCQuestion;
  onComplete: (correct: boolean) => void;
}

type OptionState = "idle" | "correct" | "incorrect" | "dimmed";

export default function MultipleChoiceQuestion({ question, onComplete }: Props) {
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>(
    () => Object.fromEntries(question.options.map((o) => [o, "idle"]))
  );
  const [answered, setAnswered] = useState(false);

  function handleSelect(option: string) {
    if (answered) return;
    setAnswered(true);

    const isCorrect = option === question.answer;

    setOptionStates(() =>
      Object.fromEntries(
        question.options.map((o) => {
          if (o === option) return [o, isCorrect ? "correct" : "incorrect"];
          if (o === question.answer && !isCorrect) return [o, "correct"]; // reveal answer
          return [o, "dimmed"];
        })
      )
    );

    setTimeout(() => onComplete(isCorrect), 850);
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Question prompt */}
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

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {question.options.map((option) => {
          const state = optionStates[option];
          const cls = [
            "quiz-option",
            state === "correct" ? "quiz-option--correct" : "",
            state === "incorrect" ? "quiz-option--incorrect" : "",
            state === "dimmed" ? "quiz-option--dimmed" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={option}
              className={cls}
              onClick={() => handleSelect(option)}
              disabled={answered}
              aria-label={`Answer option: ${option}`}
            >
              <span style={{ fontSize: "clamp(0.9rem, 3vw, 1.05rem)" }}>
                {state === "correct" && "✓ "}
                {state === "incorrect" && "✗ "}
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
