"use client";

import { useRouter } from 'next/navigation';
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

export default function PracticeClient({ kanjiData, isQuizMode }: PracticeClientProps) {
  const router = useRouter();

  const handleRandomQuiz = () => {
    // Force a full page reload to get a new random kanji from the server
    window.location.href = '/practice?mode=quiz';
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">

      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-md mx-auto mb-8">
        <div className="text-lg font-bold tracking-wider">KANJI DOJO</div>
        <div className="flex items-center gap-3">
          {isQuizMode && (
            <div className="text-xs font-semibold tracking-wider uppercase px-2 py-1 rounded-full"
              style={{ background: 'rgba(155, 44, 44, 0.1)', color: '#9b2c2c' }}>
              Quiz Mode
            </div>
          )}
          <div className="text-sm font-medium text-sage">Session Active</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">

        {/* Kanji Display — hidden in quiz mode */}
        {!isQuizMode && (
          <div className="wabi-card w-full p-10 flex items-center justify-center mb-8">
            <div className="text-9xl font-bold leading-none py-4">
              {kanjiData.character}
            </div>
          </div>
        )}

        {/* Quiz Challenge Prompt — shown only in quiz mode */}
        {isQuizMode && (
          <div className="wabi-card w-full p-8 flex flex-col items-center justify-center mb-8"
            style={{ borderColor: 'rgba(155, 44, 44, 0.3)' }}>
            <div className="text-4xl mb-3">🧠</div>
            <div className="text-xs text-sage font-semibold tracking-wider uppercase mb-2">Draw this Kanji</div>
            <div className="text-3xl capitalize font-bold text-center">
              {Array.isArray(kanjiData.meanings) ? kanjiData.meanings.join(', ') : kanjiData.meanings || "—"}
            </div>
          </div>
        )}

        {/* Readings — always shown */}
        <KanjiReadings onyomi={kanjiData.onyomi} kunyomi={kanjiData.kunyomi} />

        {/* Meanings — shown only in non-quiz mode (already shown in challenge prompt above for quiz) */}
        {!isQuizMode && (
          <div className="w-full mb-10">
            <div className="wabi-card p-5 w-full flex flex-col items-center">
              <div className="text-xs text-sage font-semibold tracking-wider uppercase mb-2">Meanings</div>
              <div className="text-2xl capitalize font-medium text-center">
                {Array.isArray(kanjiData.meanings) ? kanjiData.meanings.join(', ') : kanjiData.meanings || "—"}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto mt-auto pb-8 space-y-4">
        <KanjiCanvas character={kanjiData.character} initialMode={isQuizMode ? 'test' : 'practice'} />

        {/* Random Quiz Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleRandomQuiz}
            className="flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-2xl transition-all active:scale-95"
            style={{
              background: isQuizMode ? 'rgba(155, 44, 44, 0.1)' : 'rgba(130, 142, 112, 0.15)',
              color: isQuizMode ? '#9b2c2c' : '#828e70',
              border: `1px solid ${isQuizMode ? 'rgba(155, 44, 44, 0.2)' : 'rgba(130, 142, 112, 0.3)'}`,
            }}
          >
            <Shuffle className="w-4 h-4" />
            {isQuizMode ? 'Next Random Quiz' : 'Random Quiz'}
          </button>
        </div>

        {isQuizMode && (
          <div className="flex justify-center">
            <button
              onClick={() => window.location.href = '/practice'}
              className="text-sm text-sage hover:text-ink-black transition-colors underline underline-offset-4"
            >
              ← Back to Practice
            </button>
          </div>
        )}

        {kanjiData.example_sentences && kanjiData.example_sentences.length > 0 && !isQuizMode && (
          <div className="mt-8">
            <h3 className="text-sage font-semibold uppercase tracking-wider text-sm mb-4 text-center">Example Sentences</h3>
            {kanjiData.example_sentences.map((sentence: Sentence, idx: number) => (
              <InteractiveSentence key={idx} sentence={sentence} />
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
