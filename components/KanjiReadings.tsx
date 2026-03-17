"use client";

import { toKatakana, toHiragana } from 'wanakana';
import { Volume2 } from 'lucide-react';

interface KanjiReadingsProps {
  onyomi: string | string[];
  kunyomi: string | string[];
}

export default function KanjiReadings({ onyomi, kunyomi }: KanjiReadingsProps) {
  const playAudio = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const onyomiString = Array.isArray(onyomi) ? onyomi.join(', ') : onyomi;
  const kunyomiString = Array.isArray(kunyomi) ? kunyomi.join(', ') : kunyomi;

  const onyomiKatakana = onyomiString ? toKatakana(onyomiString) : "—";
  const kunyomiHiragana = kunyomiString ? toHiragana(kunyomiString) : "—";

  return (
    <div className="grid grid-cols-2 gap-4 w-full mb-10">
      {/* Onyomi Card */}
      <div className="wabi-card p-5 relative group transition-all hover:border-cinnabar/50">
        <div className="flex justify-between items-start mb-1">
          <div className="text-xs text-ink-black/60 font-semibold tracking-wider uppercase">Onyomi</div>
          {onyomiString && (
            <button 
            onClick={() => playAudio(onyomiKatakana)}
            className="text-sage hover:text-cinnabar opacity-60 group-hover:opacity-100 transition-all"
            title="Play Onyomi"
          >
            <Volume2 className="h-5 w-5" />
          </button>
          )}
        </div>
        <div className="text-xl font-bold text-ink-black mb-1">{onyomiKatakana}</div>
        <div className="text-sm font-medium text-ink-black/70">{onyomiString || "—"}</div>
      </div>
      
      {/* Kunyomi Card */}
      <div className="wabi-card p-5 relative group transition-all hover:border-cinnabar/50">
        <div className="flex justify-between items-start mb-1">
          <div className="text-xs text-ink-black/60 font-semibold tracking-wider uppercase">Kunyomi</div>
          {kunyomiString && (
            <button 
            onClick={() => playAudio(kunyomiHiragana)}
            className="text-sage hover:text-cinnabar opacity-60 group-hover:opacity-100 transition-all"
            title="Play Kunyomi"
          >
            <Volume2 className="h-5 w-5" />
          </button>
          )}
        </div>
        <div className="text-xl font-bold text-ink-black mb-1">{kunyomiHiragana}</div>
        <div className="text-sm font-medium text-ink-black/70">{kunyomiString || "—"}</div>
      </div>
    </div>
  );
}
