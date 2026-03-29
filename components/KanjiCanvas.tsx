"use client";

import { useEffect, useRef, useState } from 'react';
import { Play, PenTool, GraduationCap } from 'lucide-react';
// @ts-ignore
import HanziWriter from 'hanzi-writer';

interface KanjiCanvasProps {
  character: string;
  initialMode?: 'practice' | 'test';
  onComplete?: (correct: boolean) => void;
  hideControls?: boolean;
}

export default function KanjiCanvas({ character, initialMode = 'practice', onComplete, hideControls = false }: KanjiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const [mode, setMode] = useState<'practice' | 'test'>(initialMode);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Cleanup any existing writer instance when mode, character, or key changes
    if (writerRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
        writerRef.current = null;
    }

    writerRef.current = HanziWriter.create(containerRef.current, character, {
      width: 300,
      height: 300,
      padding: 20,
      showCharacter: false,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 50,
      showOutline: mode === 'practice',
      drawingWidth: 25,
      strokeColor: '#1a1a1a', // var(--ink-black)
      radicalColor: '#9b2c2c', // var(--cinnabar)
      outlineColor: '#828e70', // var(--sage)
      leniency: 2.5, // much more forgiving stroke precision
    });

    if (mode === 'practice') {
        setTimeout(() => {
            writerRef.current?.quiz({
                onMistake: () => {
                    if (containerRef.current) {
                        containerRef.current.classList.remove('shake-error');
                        void containerRef.current.offsetWidth;
                        containerRef.current.classList.add('shake-error');
                    }
                },
                onCorrectStroke: () => {
                    if (containerRef.current) {
                        containerRef.current.classList.remove('flash-correct');
                        void containerRef.current.offsetWidth;
                        containerRef.current.classList.add('flash-correct');
                    }
                }
            });
        }, 50);
    } else if (mode === 'test') {
        setTimeout(() => {
            writerRef.current?.quiz({
                showHintAfterMisses: 3,
                onMistake: () => {
                    if (containerRef.current) {
                        containerRef.current.classList.remove('shake-error');
                        void containerRef.current.offsetWidth;
                        containerRef.current.classList.add('shake-error');
                    }
                },
                onCorrectStroke: () => {
                    if (containerRef.current) {
                        containerRef.current.classList.remove('flash-correct');
                        void containerRef.current.offsetWidth;
                        containerRef.current.classList.add('flash-correct');
                    }
                },
                onComplete: (summaryData: any) => {
                    writerRef.current?.updateColor('strokeColor', '#828e70', { duration: 500 });
                    
                    if (containerRef.current && summaryData.totalMistakes === 0) {
                        containerRef.current.classList.remove('flash-perfect');
                        void containerRef.current.offsetWidth;
                        containerRef.current.classList.add('flash-perfect');
                    }

                    setTimeout(() => {
                        writerRef.current?.updateColor('strokeColor', '#1a1a1a', { duration: 1000 });
                        if (onComplete) onComplete(true);
                    }, 2000);
                }
            });
        }, 50);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      writerRef.current = null;
    };
  }, [character, mode, renderKey, onComplete]);

  const handlePractice = () => {
    setMode('practice');
    setRenderKey(prev => prev + 1);
  };

  const handleTest = () => {
    setMode('test');
    setRenderKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        ref={containerRef} 
        className="wabi-card p-4 flex justify-center items-center" 
      />
      
      {!hideControls && (
        <div className="flex gap-4 w-full justify-center px-4">
          <button 
            onClick={() => writerRef.current?.animateCharacter()}
            className="flex flex-1 items-center justify-center gap-2 bg-transparent font-semibold py-2 px-1 transition-all active:scale-95"
            style={{ color: '#9b2c2c', borderBottom: '1.5px solid rgba(138,154,65,0.50)' }}
          >
            <Play className="w-5 h-5" /> Animate
          </button>
          <button 
            onClick={handlePractice}
            className="flex flex-1 items-center justify-center gap-2 bg-transparent font-semibold py-2 px-1 transition-all active:scale-95"
            style={{ 
              color: mode === 'practice' ? '#8A9A41' : '#2C2F24', 
              borderBottom: `1.5px solid ${mode === 'practice' ? '#8A9A41' : 'rgba(138,154,65,0.25)'}`
            }}
          >
            <PenTool className="w-5 h-5" /> Practice
          </button>
          <button 
            onClick={handleTest}
            className="flex flex-1 items-center justify-center gap-2 bg-transparent font-semibold py-2 px-1 transition-all active:scale-95"
            style={{ 
              color: mode === 'test' ? '#8A9A41' : '#2C2F24', 
              borderBottom: `1.5px solid ${mode === 'test' ? '#8A9A41' : 'rgba(138,154,65,0.25)'}`
            }}
          >
            <GraduationCap className="w-5 h-5" /> Test
          </button>
        </div>
      )}
    </div>
  );
}
