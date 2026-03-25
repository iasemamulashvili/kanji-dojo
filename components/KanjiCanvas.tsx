"use client";

import { useEffect, useRef, useState } from 'react';
import { Play, PenTool, GraduationCap } from 'lucide-react';
// @ts-ignore
import HanziWriter from 'hanzi-writer';

interface KanjiCanvasProps {
  character: string;
  initialMode?: 'practice' | 'test';
}

export default function KanjiCanvas({ character, initialMode = 'practice' }: KanjiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const mistakesRef = useRef(0);
  const [mode, setMode] = useState<'practice' | 'test'>(initialMode);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Cleanup any existing writer instance when mode or character changes
    if (writerRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
        writerRef.current = null;
    }

    writerRef.current = HanziWriter.create(containerRef.current, character, {
      width: 300,
      height: 300,
      padding: 20,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 50,
      showOutline: mode === 'practice',
      drawingWidth: 25,
      strokeColor: '#1a1a1a', // var(--ink-black)
      radicalColor: '#9b2c2c', // var(--cinnabar)
      outlineColor: '#828e70', // var(--sage)
    });

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      writerRef.current = null;
    };
  }, [character, mode]);

  const handlePractice = () => {
    setMode('practice');
    setTimeout(() => {
        writerRef.current?.quiz();
    }, 50);
  };

  const handleTest = () => {
    setMode('test');
    setTimeout(() => {
        mistakesRef.current = 0;
        writerRef.current?.quiz({
            onMistake: () => {
                mistakesRef.current++;
                if (mistakesRef.current >= 2) {
                    writerRef.current?.animateCharacter();
                    mistakesRef.current = 0;
                }
            },
            onComplete: () => {
                writerRef.current?.updateColor('strokeColor', '#828e70', { duration: 500 }); // Turn --leaf-sage
                setTimeout(() => {
                    writerRef.current?.updateColor('strokeColor', '#1a1a1a', { duration: 1000 }); // Fade back to ink
                }, 2000);
            }
        });
    }, 50);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        ref={containerRef} 
        className="wabi-card p-4 flex justify-center items-center" 
      />
      
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
    </div>
  );
}
