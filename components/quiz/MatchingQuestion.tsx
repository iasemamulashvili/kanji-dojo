"use client";

import { useState, useEffect } from "react";
import type { MatchingQuestion as MatchingQuestionType } from "@/app/api/quiz/questions/route";

interface Props {
  question: MatchingQuestionType;
  onComplete: (correct: boolean) => void;
}

export default function MatchingQuestion({ question, onComplete }: Props) {
  const { pairs } = question;

  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);

  useEffect(() => {
    setLeftItems([...pairs.map((p) => p.kanji)].sort(() => Math.random() - 0.5));
    setRightItems([...pairs.map((p) => p.meaning)].sort(() => Math.random() - 0.5));
  }, [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const rightToLeft = Object.fromEntries(
    Object.entries(connections).map(([k, v]) => [v, k])
  );
  
  const connectedKanjiList = Object.keys(connections);

  const handleLeftClick = (kanji: string) => {
    if (submitted) return;
    if (selectedLeft === kanji) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(kanji);
    }
  };

  const handleRightClick = (meaning: string) => {
    if (submitted) return;
    if (selectedLeft) {
      setConnections((prev) => {
        const next = { ...prev };
        for (const k in next) {
          if (next[k] === meaning) {
            delete next[k];
          }
        }
        next[selectedLeft] = meaning;
        return next;
      });
      setSelectedLeft(null);
    } else {
      if (rightToLeft[meaning]) {
        setConnections((prev) => {
          const next = { ...prev };
          delete next[rightToLeft[meaning]];
          return next;
        });
      }
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const isAllCorrect = pairs.every((p) => connections[p.kanji] === p.meaning);
    
    if (isAllCorrect) {
      setTimeout(() => onComplete(true), 1500);
    } else {
      setTimeout(() => {
        setSubmitted(false);
        setConnections({});
        setSelectedLeft(null);
      }, 2000);
    }
  };

  const allConnected = connectedKanjiList.length === pairs.length;

  return (
    <div className="flex flex-col w-full items-center relative">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-ebony text-center mb-6 opacity-80">
        {question.instruction}
      </p>

      <div className="grid grid-cols-2 gap-x-12 gap-y-4 w-full max-w-md mx-auto mb-10 relative">
        {/* Left Column: Kanji */}
        <div className="flex flex-col gap-4 z-10">
          {leftItems.map((kanji) => {
            const isSelected = selectedLeft === kanji;
            const connectedMeaning = connections[kanji];
            const connIndex = connectedMeaning ? connectedKanjiList.indexOf(kanji) + 1 : null;
            
            let statusClass = "bg-white/40 border-silver/50 text-charcoal";
            if (isSelected) statusClass = "bg-mahogany/10 border-mahogany shadow-sm scale-105 z-20 ring-1 ring-mahogany/30";
            else if (connectedMeaning && !submitted) statusClass = "bg-white/80 border-ebony/40";
            
            if (submitted && connectedMeaning) {
                const correctMeaning = pairs.find(p => p.kanji === kanji)?.meaning;
                if (connectedMeaning === correctMeaning) {
                    statusClass = "bg-ebony/20 border-ebony text-charcoal";
                } else {
                    statusClass = "bg-mahogany/10 border-mahogany/60 text-mahogany";
                }
            }

            return (
              <button
                key={kanji}
                onClick={() => handleLeftClick(kanji)}
                className={`relative flex items-center justify-center h-16 w-full text-3xl font-bold imperfect-border border backdrop-blur-md transition-all duration-300 ${statusClass} hover:border-ebony`}
              >
                {kanji}
                {connIndex && !submitted && (
                  <span className="absolute -right-2 -top-2 w-6 h-6 flex items-center justify-center bg-parchment border-2 border-ebony rounded-full text-[10px] font-black text-ebony shadow-sm animate-in zoom-in duration-300">
                    {connIndex}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Meanings */}
        <div className="flex flex-col gap-4 z-10">
          {rightItems.map((meaning) => {
            const connectedKanji = rightToLeft[meaning];
            const connIndex = connectedKanji ? connectedKanjiList.indexOf(connectedKanji) + 1 : null;
            
            let statusClass = "bg-silver/5 border-dashed border-silver/40 text-charcoal/70";
            if (connectedKanji && !submitted) statusClass = "bg-white/80 border-solid border-ebony/40 text-charcoal";
            else if (selectedLeft && !connectedKanji) statusClass = "border-dashed border-mahogany/40 cursor-pointer hover:bg-mahogany/5 animate-pulse";
            
            if (submitted && connectedKanji) {
                const correctKanji = pairs.find(p => p.meaning === meaning)?.kanji;
                if (connectedKanji === correctKanji) {
                    statusClass = "bg-ebony/20 border-solid border-ebony text-charcoal";
                } else {
                    statusClass = "bg-mahogany/10 border-solid border-mahogany/60 text-mahogany";
                }
            }

            return (
              <button
                key={meaning}
                onClick={() => handleRightClick(meaning)}
                className={`relative flex items-center justify-center h-16 w-full px-4 text-xs font-bold tracking-tight rounded-2xl border backdrop-blur-sm transition-all duration-300 ${statusClass} ${!connectedKanji && !selectedLeft && !submitted ? 'cursor-default' : ''} hover:shadow-inner`}
              >
                <span className="text-center leading-snug uppercase">{meaning}</span>
                {connIndex && !submitted && (
                  <span className="absolute -left-2 -top-2 w-6 h-6 flex items-center justify-center bg-parchment border-2 border-ebony rounded-full text-[10px] font-black text-ebony shadow-sm animate-in zoom-in duration-300">
                    {connIndex}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allConnected || submitted}
        className={`px-12 py-4 imperfect-border--alt border-2 font-black tracking-[0.3em] uppercase transition-all duration-500 ${allConnected && !submitted ? 'bg-mahogany text-parchment border-mahogany hover:scale-105 hover:shadow-xl active:scale-95' : 'bg-silver/20 text-silver border-silver/30 opacity-40 cursor-not-allowed'}`}
      >
        {submitted ? "Judging..." : "Verify"}
      </button>
    </div>
  );
}
