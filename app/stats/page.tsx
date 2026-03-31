"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  Target, 
  History, 
  ChevronRight, 
  Volume2, 
  PenTool, 
  BookOpen, 
  ArrowRightLeft, 
  Search,
  Filter
} from "lucide-react";

// --- Wavy divider for stylistic separation ---
function WabiDivider() {
  return (
    <div className="wabi-divider my-6" aria-hidden="true">
      <svg viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,10 C40,0 80,20 120,10 C160,0 200,18 240,10 C280,2 320,18 360,10 C380,6 395,12 400,10"
          stroke="var(--ebony)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// --- Organic Circular Progress ---
function OrganicProgress({ value, label, icon: Icon, colorClass = "text-mahogany" }: { value: number, label: string, icon: any, colorClass?: string }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Shadow Layer */}
        <svg className="absolute w-full h-full rotate-[-90deg]">
          <circle
            cx="50%" cy="50%" r={radius}
            fill="transparent"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="8"
            strokeDasharray={circumference}
            className="transition-all duration-1000"
          />
          <motion.circle
            cx="50%" cy="50%" r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={colorClass}
          />
        </svg>
        <div className="z-10 flex flex-col items-center">
           <Icon className={`w-5 h-5 mb-0.5 ${colorClass} opacity-80`} />
           <span className="text-xl font-black text-charcoal">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="mt-3 text-[0.65rem] font-bold tracking-widest uppercase text-ebony/60">{label}</span>
    </div>
  );
}

// --- Main Stats Content ---
export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mastery' | 'history'>('mastery');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (res.ok) setStats(data);
      } catch (err) {
        console.error("Stats fail", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="wabi-card p-12 flex flex-col items-center animate-pulse">
          <div className="text-5xl mb-4">🍂</div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-ebony">Whispering to the Dojo...</p>
        </div>
      </div>
    );
  }

  const categoryIcons: Record<string, any> = {
    meaning: BookOpen,
    reading: Search,
    reverse: Target,
    listening: Volume2,
    drawing: PenTool,
    matching: ArrowRightLeft
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden p-4 md:p-8 flex flex-col items-center bg-parchment text-charcoal">
      
      {/* --- Background Assets --- */}
      <div className="fixed left-[-60px] top-[60px] w-[240px] opacity-[0.22] mix-blend-multiply z-0 pointer-events-none rotate-[-12deg]">
        <Image src="/left-leaf.svg" alt="" width={240} height={480} priority />
      </div>
      <div className="fixed right-[-60px] bottom-[80px] w-[220px] opacity-[0.18] mix-blend-multiply z-0 pointer-events-none rotate-[8deg]">
        <Image src="/right-leaf.svg" alt="" width={220} height={440} priority />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        
        {/* Header */}
        <header className="flex flex-col items-center w-full mb-10">
          <h1 className="text-lg font-bold tracking-[0.3em] uppercase mb-1 text-charcoal">Mastery Scroll</h1>
          <div className="text-[0.6rem] font-bold tracking-widest text-mahogany uppercase bg-mahogany/10 px-3 py-1 rounded-full imperfect-border">
             {stats?.global?.username || "Disciple"} • Rank: {stats?.global?.accuracy_pct > 80 ? "Sensei" : "Pupil"}
          </div>
        </header>

        {/* Hero Section — Global Impact */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="kanji-stone p-6 flex flex-col items-center justify-center aspect-square"
           >
              <Flame className="w-8 h-8 text-mahogany mb-3" />
              <span className="text-4xl font-black text-charcoal">{stats?.global?.streak_days}</span>
              <span className="text-[0.6rem] font-bold uppercase tracking-wider text-ebony mt-1">Day Streak</span>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="kanji-stone p-6 flex flex-col items-center justify-center aspect-square"
           >
              <Trophy className="w-8 h-8 text-ebony mb-3" />
              <span className="text-4xl font-black text-charcoal">{stats?.global?.total_correct}</span>
              <span className="text-[0.6rem] font-bold uppercase tracking-wider text-ebony mt-1">Correct Kanjis</span>
           </motion.div>
        </div>

        <WabiDivider />

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('mastery')}
            className={`text-xs font-black uppercase tracking-widest px-4 py-2 transition-all rounded-xl ${activeTab === 'mastery' ? 'bg-ebony text-parchment shadow-md' : 'text-ebony/60 hover:text-ebony'}`}
          >
            Skill Mastery
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`text-xs font-black uppercase tracking-widest px-4 py-2 transition-all rounded-xl ${activeTab === 'history' ? 'bg-ebony text-parchment shadow-md' : 'text-ebony/60 hover:text-ebony'}`}
          >
            Chronicle
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'mastery' ? (
              <motion.div 
                key="mastery"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-4 pb-20"
              >
                {stats?.mastery.length > 0 ? (
                  stats.mastery.map((item: any) => {
                    const accuracy = item.total_count === 0 ? 0 : (item.correct_count / item.total_count) * 100;
                    return (
                      <OrganicProgress 
                        key={item.question_type}
                        value={accuracy}
                        label={item.question_type}
                        icon={categoryIcons[item.question_type] || BookOpen}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center text-xs font-medium text-ebony/60 italic">
                    Train in the Dojo to unlock your mastery path.
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3 pb-20"
              >
                {stats?.recent.length > 0 ? (
                  stats.recent.map((quiz: any, idx: number) => (
                    <div key={idx} className="wabi-card p-4 flex justify-between items-center group hover:border-ebony transition-colors cursor-default">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-parchment border border-ebony/20 flex items-center justify-center font-bold text-xs">
                           {quiz.score}
                         </div>
                         <div className="flex flex-col">
                           <span className="text-xs font-black uppercase tracking-wider text-charcoal">
                             {new Date(quiz.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </span>
                           <span className="text-[0.6rem] text-ebony/60 uppercase font-bold">
                             {Math.round((quiz.correct_answers / quiz.total_questions) * 100)}% Accuracy
                           </span>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ebony opacity-20 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs font-medium text-ebony/60 italic">
                    No history found in the annals yet.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="fixed bottom-0 left-0 w-full p-4 flex justify-center bg-gradient-to-t from-parchment via-parchment to-transparent pt-12 z-20 pointer-events-none">
           <p className="text-[0.6rem] font-bold tracking-[0.4em] uppercase text-ebony/40 mb-4 select-none">
             Persistence • Patience • Mastery
           </p>
        </div>

      </div>
    </div>
  );
}
