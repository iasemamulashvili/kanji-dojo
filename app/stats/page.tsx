'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Stats {
  streak_days: number;
  accuracy_pct: number;
  total_correct: number;
  total_questions: number;
  best_score: number;
  total_quizzes: number;
  username: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) {
          if (res.status === 401) {
            setError('Unauthorized. Please enter via Telegram.');
          } else {
            setError('Failed to fetch statistics.');
          }
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment">
        <div className="text-charcoal font-medium animate-pulse">Consulting the scrolls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment p-6">
        <div className="wabi-card p-8 border-mahogany/30 text-center max-w-sm">
          <h2 className="text-mahogany font-bold text-xl mb-4">🏮 Access Denied</h2>
          <p className="text-charcoal/80 mb-6">{error}</p>
          <p className="text-sm italic">Only those who enter through the Dojo's gate may see their progress.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-parchment py-12 px-6 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-mahogany mb-2">Progress Scrolls</h1>
          <p className="text-charcoal/60 italic">For {stats?.username || 'Sensei'}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Main Stats Cards */}
          <StatCard 
            label="Flame of Discipline" 
            value={`${stats?.streak_days || 0} Days`} 
            sub="Current Streak"
            color="text-mahogany"
          />
          <StatCard 
            label="Precision" 
            value={`${stats?.accuracy_pct || 0}%`} 
            sub="Overall Accuracy"
            color="text-ebony"
          />
          <StatCard 
            label="Scrolls Completed" 
            value={stats?.total_quizzes || 0} 
            sub="Total Quizzes"
            color="text-charcoal"
          />
          <StatCard 
            label="Zen Master Score" 
            value={stats?.best_score || 0} 
            sub="Highest Quiz Score"
            color="text-mahogany"
          />
        </div>

        <div className="wabi-card p-8 border-khaki/40 bg-white/40 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="text-6xl font-bold">武</span>
          </div>
          <h3 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
            📊 Lifetime Performance
          </h3>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-charcoal">{stats?.total_correct || 0}</span>
            <span className="text-xl text-charcoal/40 mb-1">/ {stats?.total_questions || 0}</span>
          </div>
          <p className="text-sm text-charcoal/60">Correct answers across all training sessions.</p>
          
          {/* Simple Progress Bar */}
          <div className="mt-6 h-2 bg-charcoal/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats?.accuracy_pct || 0}%` }}
              className="h-full bg-ebony"
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link 
            href="/practice" 
            className="px-8 py-3 bg-ebony text-parchment rounded-xl organic-border hover:bg-mahogany transition-colors shadow-lg shadow-ebony/20"
          >
            Return to Dojo
          </Link>
        </div>
      </motion.div>
      
      <style jsx>{`
        .organic-border {
          border-radius: 95% 4% 92% 5% / 4% 95% 6% 95%;
        }
      `}</style>
    </main>
  );
}

function StatCard({ label, value, sub, color }: { label: string, value: string | number, sub: string, color: string }) {
  return (
    <div className="wabi-card p-6 bg-white/50 border-silver/30 flex flex-col gap-1 hover:border-khaki/60 transition-colors">
      <span className="text-xs font-bold uppercase tracking-widest text-charcoal/40">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-sm text-charcoal/60">{sub}</span>
    </div>
  );
}
