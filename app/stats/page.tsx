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
  const [timeFilter, setTimeFilter] = useState<'all-time' | 'latest' | 'history'>('all-time');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function loadStats() {
      console.log("[Stats UI] Stats page loaded. Attempting to fetch data...");
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        
        console.log("[Stats UI] Fetch completed.");
        console.log("[Stats UI] Response Status:", res.status);
        console.log("[Stats UI] Data Received:", data);
        
        if (res.ok) setStats(data);
      } catch (err) {
        console.error("[Stats UI] Stats fetch failed", err);
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full justify-between items-center bg-ebony/5 p-4 rounded-xl border border-ebony/10">
          <div className="flex gap-2 bg-parchment p-1 rounded-lg">
            <button 
              onClick={() => setTimeFilter('all-time')}
              className={`text-[0.65rem] font-bold uppercase tracking-widest px-4 py-2 transition-all rounded-md ${timeFilter === 'all-time' ? 'bg-ebony text-parchment shadow-sm' : 'text-ebony/70 hover:text-ebony'}`}
            >
              All Time
            </button>
            <button 
              onClick={() => setTimeFilter('latest')}
              className={`text-[0.65rem] font-bold uppercase tracking-widest px-4 py-2 transition-all rounded-md ${timeFilter === 'latest' ? 'bg-ebony text-parchment shadow-sm' : 'text-ebony/70 hover:text-ebony'}`}
            >
              Latest Quiz
            </button>
            <button 
              onClick={() => setTimeFilter('history')}
              className={`text-[0.65rem] font-bold uppercase tracking-widest px-4 py-2 transition-all rounded-md ${timeFilter === 'history' ? 'bg-ebony text-parchment shadow-sm' : 'text-ebony/70 hover:text-ebony'}`}
            >
              History
            </button>
          </div>
          
          {(timeFilter === 'all-time' || timeFilter === 'latest') && (
            <div className="relative">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-parchment text-ebony text-xs font-bold uppercase tracking-widest px-4 py-2 pr-8 rounded-lg border border-ebony/20 outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="meaning">Meaning</option>
                <option value="reading">Reading</option>
                <option value="reverse">Recognition</option>
                <option value="listening">Listening</option>
                <option value="drawing">Drawing</option>
                <option value="matching">Matching</option>
              </select>
              <Filter className="w-3 h-3 text-ebony absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>


        {/* Dynamic Content Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {(timeFilter === 'all-time' || timeFilter === 'latest') ? (() => {
              
              // Compute Display Data
              let displayData: Record<string, { correct: number, total: number }> = {};
              
              if (timeFilter === 'latest') {
                const latest = stats?.recent?.[0];
                if (latest?.type_stats) {
                  displayData = latest.type_stats;
                } else if (latest) {
                   // Fallback if recent quiz lacked granular stats
                   return (
                     <motion.div key="latest-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full py-12 text-center text-xs font-medium text-ebony/60 italic">
                        Latest quiz had no granular stat breakdown.
                     </motion.div>
                   );
                } else {
                   return (
                     <motion.div key="latest-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full py-12 text-center text-xs font-medium text-ebony/60 italic">
                        No recent quiz found.
                     </motion.div>
                   );
                }
              } else {
                // all-time
                stats?.mastery?.forEach((m: any) => {
                  displayData[m.question_type] = { correct: m.correct_count, total: m.total_count };
                });
              }

              // Filter by Selected Type
              const statsConfig = Object.entries(displayData).map(([type, counts]) => ({
                question_type: type,
                accuracy: counts.total === 0 ? 0 : (counts.correct / counts.total) * 100,
                total: counts.total
              })).filter(m => typeFilter === 'all' || m.question_type === typeFilter);

              return (
                <motion.div 
                  key={`chart-${timeFilter}-${typeFilter}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-4 pb-20"
                >
                  {statsConfig.length > 0 ? (
                    statsConfig.map((item) => (
                      <OrganicProgress 
                        key={item.question_type}
                        value={item.accuracy}
                        label={`${item.question_type} (${item.total})`}
                        icon={categoryIcons[item.question_type] || BookOpen}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-xs font-medium text-ebony/60 italic">
                      {timeFilter === 'latest' ? "No data for this type in the latest quiz." : "Train in the Dojo to unlock your mastery path."}
                    </div>
                  )}
                </motion.div>
              );
            })() : (
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
