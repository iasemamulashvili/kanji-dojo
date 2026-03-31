"use client";

import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
import type { ListeningQuestion as ListeningQuestionType } from "@/app/api/quiz/questions/route";

interface Props {
  question: ListeningQuestionType;
  onComplete: (correct: boolean) => void;
}

type OptionState = "idle" | "correct" | "incorrect" | "dimmed";

export default function ListeningQuestion({ question, onComplete }: Props) {
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>(
    () => Object.fromEntries(question.options.map((o) => [o, "idle"]))
  );
  const [answered, setAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.audio_text);
    utterance.lang = "ja-JP";

    // Standard stabilized voice selection for Japanese
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP');
    if (jaVoice) utterance.voice = jaVoice;

    utterance.rate = 0.85;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  // Auto-play once when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      playAudio();
    }, 500);
    return () => clearTimeout(timer);
  }, [question.audio_text]);

  function handleSelect(option: string) {
    if (answered) return;
    setAnswered(true);

    const isCorrect = option === question.answer;

    setOptionStates(() =>
      Object.fromEntries(
        question.options.map((o) => {
          if (o === option) return [o, isCorrect ? "correct" : "incorrect"];
          if (o === question.answer && !isCorrect) return [o, "correct"];
          return [o, "dimmed"];
        })
      )
    );

    setTimeout(() => onComplete(isCorrect), 1200);
  }

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm font-bold tracking-[0.2em] uppercase text-ebony/60 text-center mb-8">
        Listen and choose the matching Kanji
      </p>

      {/* Audio Button Stone */}
      <button
        onClick={playAudio}
        disabled={answered}
        className={`w-32 h-32 rounded-full flex items-center justify-center mb-12 transition-all duration-300 border-2 
          ${isPlaying ? 'bg-mahogany/10 border-mahogany scale-105 shadow-lg' : 'bg-parchment border-ebony/30 hover:border-ebony hover:shadow-md'} 
          ${answered ? 'opacity-50 cursor-default' : 'cursor-pointer active:scale-95'}`}
        aria-label="Play audio"
      >
        <Volume2 className={`w-12 h-12 ${isPlaying ? 'text-mahogany animate-pulse' : 'text-ebony'}`} />
      </button>

      {/* Kanji Options Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {question.options.map((option) => {
          const state = optionStates[option];
          let statusCls = "bg-white/40 border-silver/50 text-charcoal";
          
          if (state === "correct") statusCls = "bg-ebony/20 border-ebony text-charcoal scale-[1.02] z-10 shadow-sm";
          if (state === "incorrect") statusCls = "bg-mahogany/10 border-mahogany text-mahogany";
          if (state === "dimmed") statusCls = "opacity-40 grayscale-[0.5]";

          return (
            <button
              key={option}
              disabled={answered}
              onClick={() => handleSelect(option)}
              className={`flex items-center justify-center h-24 text-4xl font-bold imperfect-border border transition-all duration-300 ${statusCls} ${!answered ? 'hover:border-ebony hover:bg-white/60' : ''}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
