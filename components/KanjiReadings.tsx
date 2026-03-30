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

  const onyomiString  = Array.isArray(onyomi)  ? onyomi.join(', ')  : onyomi;
  const kunyomiString = Array.isArray(kunyomi) ? kunyomi.join(', ') : kunyomi;

  const onyomiKatakana  = onyomiString  ? toKatakana(onyomiString)  : '—';
  const kunyomiHiragana = kunyomiString ? toHiragana(kunyomiString) : '—';

  return (
    <div className="grid grid-cols-2 gap-4 w-full mb-8">

      {/* Onyomi Card */}
      <div
        className="wabi-card p-5 relative group transition-all border border-ebony/25"
      >
        <div className="flex justify-between items-start mb-1">
          <div
            className="text-xs font-semibold tracking-wider uppercase text-charcoal/55"
          >
            Onyomi
          </div>
          {onyomiString && (
            <button
              onClick={() => playAudio(onyomiKatakana)}
              className="opacity-50 group-hover:opacity-100 transition-all text-ebony"
              title="Play Onyomi"
            >
              <Volume2 className="h-5 w-5 hover:text-mahogany transition-colors" />
            </button>
          )}
        </div>
        <div className="text-xl font-bold mb-1 text-charcoal">
          {onyomiKatakana}
        </div>
      </div>

      {/* Kunyomi Card */}
      <div
        className="wabi-card p-5 relative group transition-all border border-ebony/25"
      >
        <div className="flex justify-between items-start mb-1">
          <div
            className="text-xs font-semibold tracking-wider uppercase text-charcoal/55"
          >
            Kunyomi
          </div>
          {kunyomiString && (
            <button
              onClick={() => playAudio(kunyomiHiragana)}
              className="opacity-50 group-hover:opacity-100 transition-all text-ebony"
              title="Play Kunyomi"
            >
              <Volume2 className="h-5 w-5 hover:text-mahogany transition-colors" />
            </button>
          )}
        </div>
        <div className="text-xl font-bold mb-1 text-charcoal">
          {kunyomiHiragana}
        </div>
      </div>

    </div>
  );
}
