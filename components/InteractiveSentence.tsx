"use client";

import { useState } from 'react';
import { Volume2 } from 'lucide-react';

export interface Token {
  text: string;
  furigana?: string;
  meaning?: string;
}

export interface Sentence {
  japanese: string;
  english: string;
  tokens: Token[];
}

export default function InteractiveSentence({ sentence }: { sentence: Sentence }) {
  const [activeToken, setActiveToken] = useState<Token | null>(null);

  const playAudio = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full mb-8 pt-4 border-t border-sage">
      <div className="flex justify-between items-start mb-6">
        <div className="text-ink-black text-sm font-medium italic">
          {sentence.english}
        </div>
        <button
          onClick={() => playAudio(sentence.japanese)}
          className="text-sage hover:text-cinnabar transition-colors flex items-center gap-1 text-sm font-medium"
        >
          <Volume2 className="h-4 w-4" /> Read Full Sentence
        </button>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-4 mb-4 items-end justify-start">
        {sentence.tokens.map((token, idx) => (
          <div key={idx} className="flex flex-col items-center cursor-pointer group" onClick={() => setActiveToken(activeToken === token ? null : token)}>
             <ruby className={`text-xl transition-colors ${activeToken === token ? 'text-cinnabar' : 'text-ink-black group-hover:text-cinnabar'}`}>
               {token.text}
               <rt className="text-[10px] text-sage">{token.furigana || ""}</rt>
             </ruby>
          </div>
        ))}
      </div>

      {activeToken && (
        <div className="wabi-card p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 relative mt-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold text-ink-black mb-1">
                {activeToken.text}
              </div>
              <div className="text-cinnabar font-medium tracking-wide">
                {activeToken.furigana || '—'}
              </div>
            </div>
            
            <button
              onClick={() => playAudio(activeToken.text)}
              className="text-sage hover:text-cinnabar transition-colors"
              title="Play Audio"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>
          {activeToken.meaning && (
            <div className="text-ink-black border-t border-sage pt-3 capitalize">
              {activeToken.meaning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
