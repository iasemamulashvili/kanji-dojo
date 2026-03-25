"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import KanjiCanvas from './KanjiCanvas';
import KanjiReadings from './KanjiReadings';
import InteractiveSentence, { Sentence } from './InteractiveSentence';
import { Shuffle } from 'lucide-react';

interface KanjiData {
  character: string;
  onyomi: string | string[];
  kunyomi: string | string[];
  meanings: string | string[];
  example_sentences?: Sentence[];
}

interface PracticeClientProps {
  kanjiData: KanjiData;
  isQuizMode: boolean;
}

/** Wavy SVG divider — replaces rigid border-bottom lines */
function WabiDivider() {
  return (
    <div className="wabi-divider my-4" aria-hidden="true">
      <svg viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,10 C40,0 80,20 120,10 C160,0 200,18 240,10 C280,2 320,18 360,10 C380,6 395,12 400,10"
          stroke="#8A9A41"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function PracticeClient({ kanjiData, isQuizMode }: PracticeClientProps) {
  const router = useRouter();

  const handleRandomQuiz = () => {
    window.location.href = '/practice?mode=quiz';
  };

  const meaningsText = Array.isArray(kanjiData.meanings)
    ? kanjiData.meanings.join(', ')
    : kanjiData.meanings || '—';

  return (
    /*
     * Root — parchment canvas with overflow:hidden so the
     * absolute-positioned leaves never create a scrollbar.
     */
    <div
      className="relative min-h-screen overflow-x-hidden p-4 md:p-8 flex flex-col items-center"
      style={{ background: '#F4F1EB', color: '#2C2F24' }}
    >

      {/* ── Background Leaf — left ── */}
      <div
        className="pointer-events-none select-none"
        style={{
          position: 'fixed',
          left: '-60px',
          top: '60px',
          width: '240px',
          opacity: 0.28,
          mixBlendMode: 'multiply',
          zIndex: 0,
          transform: 'rotate(-12deg)',
        }}
        aria-hidden="true"
      >
        <Image
          src="/left-leaf.svg"
          alt=""
          width={240}
          height={480}
          priority
        />
      </div>

      {/* ── Background Leaf — right ── */}
      <div
        className="pointer-events-none select-none"
        style={{
          position: 'fixed',
          right: '-60px',
          bottom: '80px',
          width: '220px',
          opacity: 0.24,
          mixBlendMode: 'multiply',
          zIndex: 0,
          transform: 'rotate(8deg)',
        }}
        aria-hidden="true"
      >
        <Image
          src="/right-leaf.svg"
          alt=""
          width={220}
          height={440}
          priority
        />
      </div>

      {/* ── All page content sits above leaves ── */}
      <div className="relative z-10 flex flex-col items-center w-full">

        {/* Header */}
        <header className="flex justify-between items-center w-full max-w-md mx-auto mb-10">
          <div
            className="text-lg font-bold tracking-[0.25em] uppercase"
            style={{ color: '#2C2F24' }}
          >
            Kanji Dojo
          </div>
          <div className="flex items-center gap-3">
            {isQuizMode && (
              <div
                className="text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full"
                style={{ background: 'rgba(155, 44, 44, 0.10)', color: '#9b2c2c' }}
              >
                Quiz Mode
              </div>
            )}
            <div className="text-sm font-medium" style={{ color: '#8A9A41' }}>
              Session Active
            </div>
          </div>
        </header>

        {/* ──────────────────────────────────────────
            MAIN KANJI STONE — glassmorphism centrepiece
            Hidden in quiz mode; replaced by challenge card.
        ─────────────────────────────────────────── */}
        {!isQuizMode && (
          <div
            className="kanji-stone w-full max-w-md flex items-center justify-center mb-10 py-14 px-8"
          >
            <span
              className="font-bold leading-none select-none"
              style={{ fontSize: 'clamp(5rem, 22vw, 8rem)', color: '#2C2F24' }}
            >
              {kanjiData.character}
            </span>
          </div>
        )}

        {/* ── Quiz Challenge Prompt ── */}
        {isQuizMode && (
          <div
            className="wabi-card w-full max-w-md p-8 flex flex-col items-center justify-center mb-10"
            style={{ borderColor: 'rgba(155, 44, 44, 0.28)' }}
          >
            <div className="text-4xl mb-3">🧠</div>
            <div
              className="text-xs font-semibold tracking-wider uppercase mb-2"
              style={{ color: '#8A9A41' }}
            >
              Draw this Kanji
            </div>
            <div className="text-3xl capitalize font-bold text-center" style={{ color: '#2C2F24' }}>
              {meaningsText}
            </div>
          </div>
        )}

        <WabiDivider />

        {/* Readings */}
        <div className="w-full max-w-md">
          <KanjiReadings onyomi={kanjiData.onyomi} kunyomi={kanjiData.kunyomi} />
        </div>

        {/* Meanings (practice mode only) */}
        {!isQuizMode && (
          <>
            <div className="w-full max-w-md mb-8">
              <div className="wabi-card p-5 w-full flex flex-col items-center">
                <div
                  className="text-xs font-semibold tracking-wider uppercase mb-2"
                  style={{ color: '#8A9A41' }}
                >
                  Meanings
                </div>
                <div
                  className="text-2xl capitalize font-medium text-center"
                  style={{ color: '#2C2F24' }}
                >
                  {meaningsText}
                </div>
              </div>
            </div>
            <WabiDivider />
          </>
        )}

        {/* Kanji Canvas + controls */}
        <div className="w-full max-w-md">
          <KanjiCanvas character={kanjiData.character} initialMode={isQuizMode ? 'test' : 'practice'} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md mt-8 pb-8">
          <button
            onClick={handleRandomQuiz}
            className="flex items-center justify-center gap-2 font-semibold py-3 px-8 rounded-2xl transition-all active:scale-95"
            style={{
              background: isQuizMode ? 'rgba(155, 44, 44, 0.08)' : 'rgba(138, 154, 65, 0.12)',
              color:      isQuizMode ? '#9b2c2c' : '#8A9A41',
              border:     `1px solid ${isQuizMode ? 'rgba(155,44,44,0.20)' : 'rgba(138,154,65,0.30)'}`,
            }}
          >
            <Shuffle className="w-4 h-4" />
            {isQuizMode ? 'Next Random Quiz' : 'Random Quiz'}
          </button>

          {isQuizMode && (
            <button
              onClick={() => (window.location.href = '/practice')}
              className="text-sm transition-colors underline underline-offset-4"
              style={{ color: '#8A9A41' }}
            >
              ← Back to Practice
            </button>
          )}
        </div>

        {/* Example sentences */}
        {kanjiData.example_sentences && kanjiData.example_sentences.length > 0 && !isQuizMode && (
          <div className="w-full max-w-md mt-2 pb-12">
            <h3
              className="font-semibold uppercase tracking-wider text-sm mb-4 text-center"
              style={{ color: '#8A9A41' }}
            >
              Example Sentences
            </h3>
            {kanjiData.example_sentences.map((sentence: Sentence, idx: number) => (
              <InteractiveSentence key={idx} sentence={sentence} />
            ))}
          </div>
        )}

      </div>{/* /z-10 wrapper */}
    </div>
  );
}
