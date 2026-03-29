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
    <div className="flex flex-col w-full items-center">
      <p className="text-xs font-semibold tracking-widest uppercase text-moss text-center mb-6">
        {question.instruction}
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto mb-8">
        {/* Left Column: Kanji */}
        <div className="flex flex-col gap-3">
          {leftItems.map((kanji) => {
            const isSelected = selectedLeft === kanji;
            const connectedMeaning = connections[kanji];
            const connIndex = connectedMeaning ? connectedKanjiList.indexOf(kanji) + 1 : null;
            
            let statusClass = "bg-white/40 border-moss-light/50";
            if (isSelected) statusClass = "bg-moss/20 border-moss shadow-sm scale-105";
            else if (connectedMeaning && !submitted) statusClass = "bg-white/60 border-moss/50";
            
            if (submitted && connectedMeaning) {
                const correctMeaning = pairs.find(p => p.kanji === kanji)?.meaning;
                if (connectedMeaning === correctMeaning) {
                    statusClass = "bg-moss/20 border-moss text-moss";
                } else {
                    statusClass = "bg-cinnabar/10 border-cinnabar/40 text-cinnabar";
                }
            }

            return (
              <button
                key={kanji}
                onClick={() => handleLeftClick(kanji)}
                className={`relative flex items-center justify-center h-16 w-full text-2xl font-bold rounded-[81%_19%_88%_12%/15%_79%_21%_85%] border backdrop-blur-md transition-all duration-200 ${statusClass}`}
              >
                {kanji}
                {connIndex && (
                  <span className="absolute -right-2 -top-2 w-6 h-6 flex items-center justify-center bg-parchment border border-moss rounded-full text-xs font-bold text-moss shadow-sm">
                    {connIndex}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Meanings */}
        <div className="flex flex-col gap-3">
          {rightItems.map((meaning) => {
            const connectedKanji = rightToLeft[meaning];
            const connIndex = connectedKanji ? connectedKanjiList.indexOf(connectedKanji) + 1 : null;
            
            let statusClass = "bg-white/20 border-dashed border-moss/30";
            if (connectedKanji && !submitted) statusClass = "bg-white/60 border-solid border-moss/50";
            else if (selectedLeft && !connectedKanji) statusClass = "bg-moss/5 border-dashed border-moss/50 cursor-pointer hover:bg-moss/10";
            
            if (submitted && connectedKanji) {
                const correctKanji = pairs.find(p => p.meaning === meaning)?.kanji;
                if (connectedKanji === correctKanji) {
                    statusClass = "bg-moss/20 border-solid border-moss text-moss";
                } else {
                    statusClass = "bg-cinnabar/10 border-solid border-cinnabar/40 text-cinnabar";
                }
            }

            return (
              <button
                key={meaning}
                onClick={() => handleRightClick(meaning)}
                className={`relative flex items-center justify-center h-16 w-full px-4 text-sm font-medium rounded-xl border backdrop-blur-sm transition-all duration-200 ${statusClass} ${!connectedKanji && !selectedLeft && !submitted ? 'cursor-default' : ''}`}
              >
                <span className="text-center leading-tight">{meaning}</span>
                {connIndex && (
                  <span className="absolute -left-2 -top-2 w-6 h-6 flex items-center justify-center bg-parchment border border-moss rounded-full text-xs font-bold text-moss shadow-sm">
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
        className={`px-8 py-3 rounded-[68%_32%_74%_26%/28%_62%_38%_72%] border font-bold tracking-wide transition-all ${allConnected && !submitted ? 'bg-moss text-white border-moss hover:scale-105 shadow-md' : 'bg-gray-200 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed'}`}
      >
        {submitted ? "Checking..." : "Submit"}
      </button>
    </div>
  );
}
