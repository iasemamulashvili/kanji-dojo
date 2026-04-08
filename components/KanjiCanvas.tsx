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
      width: 320, // Slightly larger for better touch precision
      height: 320,
      padding: 15,
      showCharacter: false,
      strokeAnimationSpeed: 1.25,
      delayBetweenStrokes: 100,
      showOutline: mode === 'practice',
      drawingWidth: 20, // Slimmer stroke for elegance
      strokeColor: '#4a1816', // --rich-mahogany (when user is writing)
      radicalColor: '#1b1a15', // --carbon-black
      outlineColor: '#9f9b8f', // --grey-olive
      leniency: 2.0, // Tighter precision for 'DoJo' standard
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
            if (!writerRef.current) return;
            writerRef.current.quiz({
                showHintAfterMisses: 999, // Effectively NO hints as per Linguistic Architect
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
                    writerRef.current?.updateColor('strokeColor', '#3a3f4b', { duration: 500 }); // Charcoal blue when correct
                    
                    if (containerRef.current && summaryData.totalMistakes === 0) {
                        containerRef.current.classList.remove('flash-perfect');
                        void containerRef.current.offsetWidth;
                        containerRef.current.classList.add('flash-perfect');
                    }

                    setTimeout(() => {
                        if (writerRef.current) {
                            writerRef.current.updateColor('strokeColor', '#4a1816', { duration: 1000 }); // reset to rich mahogany
                        }
                        if (onComplete) onComplete(true);
                    }, 1200); // Faster transition to keep momentum
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
            className="flex flex-1 items-center justify-center gap-2 bg-transparent font-bold py-2 px-1 transition-all active:scale-95"
            style={{ 
              color: mode === 'practice' ? '#4a1816' : '#a7a190', 
              borderBottom: `2.5px solid ${mode === 'practice' ? '#4a1816' : 'transparent'}`
            }}
          >
            <PenTool className="w-4 h-4" /> Practice
          </button>
          <button 
            onClick={handleTest}
            className="flex flex-1 items-center justify-center gap-2 bg-transparent font-bold py-2 px-1 transition-all active:scale-95"
            style={{ 
              color: mode === 'test' ? '#4a1816' : '#a7a190', 
              borderBottom: `2.5px solid ${mode === 'test' ? '#4a1816' : 'transparent'}`
            }}
          >
            <GraduationCap className="w-4 h-4" /> Test
          </button>
        </div>
      )}
    </div>
  );
}
