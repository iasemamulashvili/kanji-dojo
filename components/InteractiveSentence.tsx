"use client";

import { useState } from 'react';
import { Volume2 } from 'lucide-react';

export interface Token {
  text: string;
  furigana?: string;
  english?: string;
  grammar_explanation?: string;
}

export interface Sentence {
  japanese: string;
  english: string;
  tokens: Token[];
}

/** Wavy divider — replaces rigid border-top */
function WaveDivider() {
  return (
    <div className="w-full overflow-hidden" style={{ opacity: 0.30, lineHeight: 0, margin: '0.75rem 0' }} aria-hidden="true">
      <svg viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: '18px' }}>
        <path
          d="M0,10 C40,2 80,18 120,10 C160,2 200,18 240,10 C280,2 320,18 360,10 C380,6 395,13 400,10"
          stroke="var(--ebony)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
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
    <div className="w-full mb-8">
      <WaveDivider />

      <div className="flex justify-between items-start mb-6 mt-2">
        <div className="text-sm font-medium italic text-charcoal/70">
          {sentence.english}
        </div>
        <button
          onClick={() => playAudio(sentence.japanese)}
          className="flex items-center gap-1 text-sm font-medium transition-colors flex-shrink-0 ml-3 text-ebony"
        >
          <Volume2 className="h-4 w-4" /> Read
        </button>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-4 mb-4 items-end justify-start">
        {sentence.tokens.map((token, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => setActiveToken(activeToken === token ? null : token)}
          >
            <ruby
              className={`text-xl transition-colors ${activeToken === token ? 'text-mahogany' : 'text-charcoal'}`}
              style={{ 
                borderBottom: `1.5px dashed ${activeToken === token ? 'var(--mahogany)' : 'rgba(44,47,36,0.3)'}`
              }}
            >
              {token.text}
              <rt className="text-[10px] text-ebony">{token.furigana || ''}</rt>
            </ruby>
          </div>
        ))}
      </div>

      {activeToken && (
        <div className="wabi-card p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 relative mt-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold mb-1 text-charcoal">
                {activeToken.text}
              </div>
              <div className="font-medium tracking-wide text-mahogany">
                {activeToken.furigana || '—'}
              </div>
            </div>
            <button
              onClick={() => playAudio(activeToken.furigana || activeToken.text)}
              className="transition-colors text-ebony"
              title="Play Audio"
            >
              <Volume2 className="h-5 w-5 hover:text-mahogany transition-colors" />
            </button>
          </div>
          {activeToken.english && (
            <p className="text-sm text-charcoal/60">
              {activeToken.english}
            </p>
          )}
          {activeToken.grammar_explanation && (
            <div className="mt-1 flex flex-col gap-2">
              <div className="w-full overflow-hidden" style={{ opacity: 0.25, lineHeight: 0 }} aria-hidden="true">
                <svg viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: '8px' }}>
                  <path
                    d="M0,10 C40,2 80,18 120,10 C160,2 200,18 240,10 C280,2 320,18 360,10 C380,6 395,13 400,10"
                    stroke="var(--ebony)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-xs italic leading-relaxed text-charcoal/70">
                {activeToken.grammar_explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
