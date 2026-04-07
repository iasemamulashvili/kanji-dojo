"use client";

import { ChevronRight } from 'lucide-react';

const mockHistory = [
  { score: 18, total: 21, date: "Apr 7, 09:33 PM", acc: "86%", color: "var(--palm-leaf)" },
  { score: 15, total: 17, date: "Apr 6, 09:33 PM", acc: "88%", color: "var(--charcoal-blue)" },
  { score: 10, total: 13, date: "Apr 5, 09:33 PM", acc: "77%", color: "var(--rich-mahogany)" },
];

function VariantAMinimalistLedger() {
  return (
    <div className="flex flex-col w-full">
      {mockHistory.map((item, idx) => (
        <div key={idx} className="group flex justify-between items-center py-4 border-b border-[rgba(var(--rgb-grey-olive),0.2)] hover:bg-[rgba(var(--rgb-soft-linen),0.2)] transition-colors cursor-pointer px-2">
          
          <div className="flex items-center gap-6">
            {/* Minimalist Date & Time */}
            <div className="flex flex-col gap-1 w-28">
              <span className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-[var(--charcoal-brown)]">
                {item.date.split(',')[0]}
              </span>
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--grey-olive)]">
                {item.date.split(',')[1].trim()}
              </span>
            </div>
            
            {/* Accuracy Pill */}
            <span 
              className="text-[0.6rem] uppercase font-black px-2 py-0.5"
              style={{ color: item.color }}
            >
              {item.acc} Acc
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Score Focus */}
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-serif font-black text-[var(--ebony)]">{item.score}</span>
              <span className="text-[0.65rem] font-bold text-[var(--grey-olive)]">/{item.total}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--grey-olive)] opacity-30 group-hover:opacity-100 group-hover:text-[var(--charcoal-blue)] transition-all transform group-hover:translate-x-1" />
          </div>

        </div>
      ))}
    </div>
  );
}

function VariantBStoneTablet() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {mockHistory.map((item, idx) => (
        <div key={idx} className="kanji-stone group flex items-center p-2 bg-[rgba(var(--rgb-soft-linen),0.4)] border-2 border-[var(--grey-olive)] hover:border-[var(--charcoal-brown)] transition-colors cursor-pointer">
          
          {/* Heavy Block Score */}
          <div className="w-16 h-16 kanji-stone bg-[var(--charcoal-brown)] flex flex-col items-center justify-center shrink-0">
             <span className="text-xl font-black text-[var(--soft-linen)] leading-none">{item.score}</span>
             <span className="text-[0.55rem] font-bold text-[var(--grey-olive)] mt-1">{item.acc}</span>
          </div>
          
          <div className="flex-1 flex justify-between items-center px-4">
            <div className="flex flex-col gap-1">
              <span className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-[var(--ebony)]">
                {item.date}
              </span>
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--charcoal-blue)]">
                {item.total} Kanji Attempted
              </span>
            </div>
            
            <div className="w-6 h-6 rounded-full border border-[var(--grey-olive)] flex items-center justify-center group-hover:bg-[var(--charcoal-blue)] transition-colors">
              <ChevronRight className="w-3 h-3 text-[var(--charcoal-brown)] group-hover:text-white transition-colors" />
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}

function VariantCZenThread() {
  return (
    <div className="relative flex flex-col w-full pl-4 py-2">
      {/* Thread Line */}
      <div className="absolute left-[27px] top-4 bottom-4 w-px bg-[rgba(var(--rgb-grey-olive),0.3)]"></div>
      
      {mockHistory.map((item, idx) => (
        <div key={idx} className="relative group flex items-start py-5 cursor-pointer">
          
          {/* Node marker */}
          <div className="w-3 h-3 rounded-full mt-2 shrink-0 z-10 transition-transform group-hover:scale-125" style={{ backgroundColor: item.color }}></div>
          
          <div className="ml-8 flex-1 flex justify-between items-center bg-white/30 backdrop-blur-sm p-4 wabi-card imperfect-border hover:bg-white/50 transition-colors">
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--charcoal-brown)]">
                {item.date}
              </span>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[0.65rem] uppercase font-bold text-[var(--grey-olive)] bg-white/50 px-2 py-0.5 rounded-sm">
                   {item.acc} Accuracy
                 </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-serif font-black" style={{ color: item.color }}>{item.score}</span>
            </div>

          </div>

        </div>
      ))}
    </div>
  );
}

export default function HistoryListVariants() {
  return (
    <div className="min-h-screen bg-transparent text-text-main p-4 md:p-8 flex flex-col items-center">
      
      {/* Environmental Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: "url('/leaves-extract-wabi.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.08,
        }}
      />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center mt-12 space-y-24">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-wider text-[var(--charcoal-brown)]">
            History Layouts
          </h1>
          <p className="text-[var(--charcoal-blue)] opacity-80 text-sm">
            Records of the Dojo
          </p>
        </div>

        <div className="flex flex-col gap-16 w-full pb-24">
          
          {/* VARIANT A */}
          <div className="flex flex-col space-y-6 w-full max-w-lg mx-auto">
            <h2 className="text-sm font-bold opacity-60 uppercase tracking-widest text-[var(--charcoal-blue)]">A. Minimalist Ledger</h2>
            <VariantAMinimalistLedger />
          </div>

          {/* VARIANT B */}
          <div className="flex flex-col space-y-6 w-full max-w-lg mx-auto">
            <h2 className="text-sm font-bold opacity-60 uppercase tracking-widest text-[var(--rich-mahogany)]">B. Stone Tablet</h2>
            <VariantBStoneTablet />
          </div>

          {/* VARIANT C */}
          <div className="flex flex-col space-y-6 w-full max-w-lg mx-auto">
            <h2 className="text-sm font-bold opacity-60 uppercase tracking-widest text-[var(--palm-leaf)]">C. Zen Thread</h2>
            <VariantCZenThread />
          </div>

        </div>
      </div>
    </div>
  );
}
