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

    if (question.type === 'reading') {
      try {
        const textToSpeak = option.replace(/・/g, '');
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'ja-JP';
        
        // Improved voice selection for iOS stability
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP');
        if (jaVoice) utterance.voice = jaVoice;
        
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speech synthesis failed:", err);
      }
    }

    setOptionStates(() =>
      Object.fromEntries(
        question.options.map((o) => {
          if (o === option) return [o, isCorrect ? "correct" : "incorrect"];
          if (o === question.answer && !isCorrect) return [o, "correct"]; // reveal answer
          return [o, "dimmed"];
        })
      )
    );

    setTimeout(() => onComplete(isCorrect), 950);
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Question prompt */}
      <p className="text-lg md:text-xl font-semibold text-text-main text-center mb-7 leading-relaxed">
        {question.question}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full">
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
              className={`${cls} imperfect-border`}
              onClick={() => handleSelect(option)}
              disabled={answered}
              aria-label={`Answer option: ${option}`}
            >
              <span className="text-sm md:text-base">
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
