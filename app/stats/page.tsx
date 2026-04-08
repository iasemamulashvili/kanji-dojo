"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  Target,
  ChevronRight,
  Volume2,
  PenTool,
  BookOpen,
  ArrowRightLeft,
  Search,
  Filter,
  Swords,
} from "lucide-react";

// ─────────────────────────────────────────
// Antler Background — intertwining wabi-sabi
// ─────────────────────────────────────────
function AntlerBackground() {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 500 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* S1 — bottom-left root, diagonal rise NE */}
      <path d="M 80 900 C 88 840 84 778 92 718 C 98 668 96 625 105 578" stroke="var(--charcoal-brown)" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.52" />
      <path d="M 80 900 C 62 882 40 872 18 878" stroke="var(--charcoal-brown)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.26" />
      <path d="M 80 900 C 98 884 120 878 142 885" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 105 578 C 82 540 55 510 30 478 C 10 452 -5 428 -8 400" stroke="var(--charcoal-brown)" strokeWidth="0.72" fill="none" strokeLinecap="round" opacity="0.44" />
      <path d="M 30 478 C 18 454 8 430 5 405" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.3" />
      <path d="M -8 400 C -5 375 5 352 2 328" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.24" />
      <path d="M 2 328 C -4 308 -8 288 -5 266" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.18" />
      <path d="M 105 578 C 130 538 162 505 195 470 C 222 440 245 412 255 378" stroke="var(--charcoal-brown)" strokeWidth="0.72" fill="none" strokeLinecap="round" opacity="0.44" />
      <path d="M 255 378 C 268 355 278 330 290 305 C 300 285 308 265 312 242" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.36" />
      <path d="M 312 242 C 318 220 320 198 316 175" stroke="var(--charcoal-brown)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.26" />
      <path d="M 316 175 C 308 152 300 132 295 110" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 295 110 C 285 90 278 70 275 50" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.16" />
      <path d="M 295 110 C 308 92 320 76 330 58" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.14" />
      <path d="M 195 470 C 205 445 210 420 205 395 C 200 374 192 358 196 340" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.28" />
      <path d="M 196 340 C 188 320 180 302 175 282" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 196 340 C 206 322 218 308 230 292" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.18" />

      {/* S2 — right edge root, sweeps W */}
      <path d="M 500 310 C 468 298 438 282 408 268 C 382 256 358 245 332 236" stroke="var(--charcoal-brown)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
      <path d="M 332 236 C 308 228 285 222 262 218 C 242 214 222 212 202 210" stroke="var(--charcoal-brown)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.34" />
      <path d="M 202 210 C 180 208 158 208 136 210 C 118 212 102 216 82 220" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.26" />
      <path d="M 82 220 C 62 224 44 230 25 236" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 408 268 C 415 244 415 220 408 198 C 402 180 394 165 398 148" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.28" />
      <path d="M 398 148 C 390 128 382 110 378 90" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 398 148 C 410 130 422 114 432 96" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.18" />
      <path d="M 408 268 C 420 295 428 322 424 350 C 420 372 412 390 418 412" stroke="var(--charcoal-brown)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.24" />
      <path d="M 418 412 C 424 432 428 452 422 472" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.18" />
      <path d="M 332 236 C 342 260 348 285 342 310 C 336 330 326 346 330 365" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 500 350 C 475 340 452 328 432 315" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.22" />

      {/* S3 — top center-left root, descends SE */}
      <path d="M 210 0 C 208 35 210 68 215 100 C 220 128 222 152 225 180" stroke="var(--charcoal-brown)" strokeWidth="0.75" fill="none" strokeLinecap="round" opacity="0.42" />
      <path d="M 225 180 C 205 162 182 146 158 132 C 138 120 118 110 95 100" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.32" />
      <path d="M 158 132 C 148 112 142 92 145 72 C 147 56 152 42 148 26" stroke="var(--charcoal-brown)" strokeWidth="0.35" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 148 26 C 140 10 132 -2 126 -14" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.15" />
      <path d="M 95 100 C 78 86 62 72 45 58" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 95 100 C 85 80 78 60 78 38" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.18" />
      <path d="M 225 180 C 238 205 248 232 250 260 C 252 284 248 305 252 328" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.32" />
      <path d="M 252 328 C 248 348 238 362 222 372 C 208 380 195 385 178 392" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.26" />
      <path d="M 178 392 C 160 400 142 408 122 415" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 252 328 C 262 360 268 392 262 422 C 256 448 245 468 240 495" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 240 495 C 232 520 225 545 220 572" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.15" />

      {/* S4 — left edge root, horizontal arc NE */}
      <path d="M 0 480 C 28 468 55 458 82 452 C 108 446 132 443 158 440" stroke="var(--charcoal-brown)" strokeWidth="0.68" fill="none" strokeLinecap="round" opacity="0.35" />
      <path d="M 158 440 C 188 436 218 434 248 432 C 272 430 295 428 318 426" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.28" />
      <path d="M 318 426 C 342 424 365 425 388 428 C 408 430 428 433 450 436" stroke="var(--charcoal-brown)" strokeWidth="0.42" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 450 436 C 468 438 484 440 500 442" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.16" />
      <path d="M 82 452 C 88 428 90 404 85 380 C 80 360 72 342 76 322" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 76 322 C 68 302 60 284 55 264" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
      <path d="M 76 322 C 88 305 100 290 112 275" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.14" />
      <path d="M 158 440 C 162 415 162 390 155 366 C 150 346 140 330 144 312" stroke="var(--charcoal-brown)" strokeWidth="0.35" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 144 312 C 138 294 132 278 128 260" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.15" />
      <path d="M 248 432 C 252 455 252 478 246 500 C 240 518 232 532 236 550" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.18" />
      <path d="M 0 518 C 22 512 42 505 60 496" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.2" />

      {/* S5 — bottom-right root, rises NW then N */}
      <path d="M 420 900 C 412 848 408 795 400 742 C 394 698 390 660 382 618" stroke="var(--charcoal-brown)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.46" />
      <path d="M 420 900 C 440 882 462 872 485 878" stroke="var(--charcoal-brown)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 420 900 C 400 882 378 875 355 880" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 382 618 C 408 598 435 580 462 562 C 480 548 496 535 510 520" stroke="var(--charcoal-brown)" strokeWidth="0.58" fill="none" strokeLinecap="round" opacity="0.34" />
      <path d="M 462 562 C 472 538 475 514 468 490 C 462 470 452 455 456 436" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 456 436 C 460 418 462 400 458 382" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
      <path d="M 382 618 C 360 592 340 565 322 538 C 306 514 292 490 280 465" stroke="var(--charcoal-brown)" strokeWidth="0.58" fill="none" strokeLinecap="round" opacity="0.34" />
      <path d="M 280 465 C 272 440 268 415 272 390 C 275 368 282 350 278 328" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.28" />
      <path d="M 278 328 C 280 305 285 282 288 258 C 290 238 290 218 286 198" stroke="var(--charcoal-brown)" strokeWidth="0.36" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 286 198 C 282 178 276 160 272 140" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
      <path d="M 272 140 C 265 120 260 100 258 80" stroke="var(--charcoal-brown)" strokeWidth="0.23" fill="none" strokeLinecap="round" opacity="0.14" />
      <path d="M 272 140 C 282 122 292 105 300 86" stroke="var(--charcoal-brown)" strokeWidth="0.22" fill="none" strokeLinecap="round" opacity="0.12" />
      <path d="M 322 538 C 315 515 312 492 318 468" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.18" />

      {/* S6 — top-right root, descends SW */}
      <path d="M 468 0 C 462 32 458 65 452 98 C 446 128 442 155 438 185" stroke="var(--charcoal-brown)" strokeWidth="0.72" fill="none" strokeLinecap="round" opacity="0.38" />
      <path d="M 438 185 C 428 208 418 230 408 252 C 398 272 386 290 375 310" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.32" />
      <path d="M 375 310 C 362 332 348 352 335 372 C 322 390 308 408 296 428" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.26" />
      <path d="M 296 428 C 282 450 268 470 256 492" stroke="var(--charcoal-brown)" strokeWidth="0.36" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 256 492 C 245 512 236 535 230 558" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.15" />
      <path d="M 438 185 C 452 162 462 138 468 112 C 472 92 472 72 478 50" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 478 50 C 483 32 485 15 486 -2" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.15" />
      <path d="M 408 252 C 395 238 380 225 365 212" stroke="var(--charcoal-brown)" strokeWidth="0.35" fill="none" strokeLinecap="round" opacity="0.22" />
      <path d="M 365 212 C 350 198 336 185 320 174" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
      <path d="M 375 310 C 392 300 410 290 428 278" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.18" />
      <path d="M 428 278 C 444 265 458 252 470 238" stroke="var(--charcoal-brown)" strokeWidth="0.24" fill="none" strokeLinecap="round" opacity="0.14" />
      <path d="M 468 0 C 485 18 498 36 505 56" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
      <path d="M 452 98 C 468 88 482 76 494 62" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.14" />

      {/* Micro-twigs — void fillers */}
      <path d="M 188 750 C 198 730 204 708 200 686" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.14" />
      <path d="M 188 750 C 175 732 160 718 143 706" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.12" />
      <path d="M 295 810 C 285 790 276 770 272 748" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.12" />
      <path d="M 295 810 C 308 792 318 772 322 750" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.11" />
      <path d="M 360 65 C 368 48 375 30 378 12" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.13" />
      <path d="M 360 65 C 348 48 336 34 325 20" stroke="var(--charcoal-brown)" strokeWidth="0.24" fill="none" strokeLinecap="round" opacity="0.12" />
      <path d="M 42 560 C 50 540 55 518 52 495" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.13" />
      <path d="M 42 560 C 30 540 18 522 5 510" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.12" />
    </svg>
  );
}

// ─────────────────────────────────────────
// Wavy divider
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// Dynamic accuracy colour helper
// ─────────────────────────────────────────
function getAestheticColor(value: number) {
  if (value <= 33) return "text-[var(--rich-mahogany)]";
  if (value <= 66) return "text-[var(--charcoal-blue)]";
  return "text-[var(--palm-leaf)]";
}

// ─────────────────────────────────────────
// Organic circular progress
// ─────────────────────────────────────────
function OrganicProgress({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const dynColor = getAestheticColor(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="absolute w-full h-full rotate-[-90deg]">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke="rgba(var(--rgb-ebony), 0.1)"
            strokeWidth="3"
            strokeDasharray={circumference}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={dynColor}
          />
        </svg>
        <div className="z-10 flex flex-col items-center">
          <Icon className={`w-5 h-5 mb-0.5 ${dynColor} opacity-80`} />
          <span className={`text-xl font-serif font-black ${dynColor}`}>{Math.round(value)}%</span>
        </div>
      </div>
      <span className={`mt-3 text-[0.65rem] font-bold tracking-widest uppercase ${dynColor} opacity-90`}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--soft-linen)]">
      <AntlerBackground />
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 pt-8 flex flex-col items-center gap-6">
        <div className="w-full py-6 px-4 bg-white/20 imperfect-border backdrop-blur-sm animate-pulse flex flex-col items-center gap-4">
          <div className="h-6 w-48 bg-[var(--charcoal-brown)]/20 rounded" />
          <div className="h-7 w-24 bg-[var(--charcoal-blue)]/20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 w-full">
          {[0, 1].map((i) => (
            <div key={i} className="kanji-stone p-6 aspect-square animate-pulse bg-white/20" />
          ))}
        </div>
        <div className="w-full kanji-stone p-6 animate-pulse bg-white/20 h-40" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Icon map
// ─────────────────────────────────────────
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  meaning:  BookOpen,
  reading:  Search,
  reverse:  Target,
  listening:Volume2,
  drawing:  PenTool,
  matching: ArrowRightLeft,
};

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default function StatsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <StatsContent />
    </Suspense>
  );
}

function StatsContent() {
  const searchParams                 = useSearchParams();
  const sessionId                    = searchParams.get("session_id");

  const [stats, setStats]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<"result" | "all-time" | "history">(sessionId ? "result" : "all-time");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    async function loadStats() {
      try {
        const url = sessionId ? `/api/stats?session_id=${sessionId}` : "/api/stats";
        const res  = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          setStats(data);
          // If we specifically requested a session and got a result, ensure we are on the result tab
          if (sessionId && data.sessionResult) {
            setTab("result");
          }
        }
      } catch (err) {
        console.error("[Stats] Fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [sessionId]);

  if (loading) return <LoadingSkeleton />;

  const masteryData: { question_type: string; accuracy: number; total: number }[] = (
    stats?.mastery ?? []
  )
    .map((m: any) => ({
      question_type: m.question_type,
      accuracy: m.total_count === 0 ? 0 : (m.correct_count / m.total_count) * 100,
      total: m.total_count,
    }))
    .filter((m: any) => typeFilter === "all" || m.question_type === typeFilter);

  const rank = (stats?.global?.accuracy_pct ?? 0) > 80 ? "Sensei" : "Pupil";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--soft-linen)] text-text-main">
      <AntlerBackground />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 pt-8 pb-24 flex flex-col items-center gap-6">

        {/* Header */}
        <header className="flex flex-col items-center w-full py-6 space-y-4 bg-white/20 imperfect-border backdrop-blur-sm px-4">
          <h1 className="text-2xl font-serif font-black tracking-[0.2em] uppercase text-[var(--charcoal-brown)] text-center">
            Path of Mastery
          </h1>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[var(--soft-linen)] bg-[var(--charcoal-blue)] px-6 py-2 rounded-full shadow-md">
              <Swords className="w-4 h-4 opacity-80" aria-hidden="true" />
              <span>{rank}</span>
            </div>
          </div>
        </header>

        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="kanji-stone p-6 flex flex-col items-center justify-center aspect-square"
          >
            <Flame className="w-8 h-8 text-accent mb-3" />
            <span className="text-4xl font-black text-text-main">{stats?.global?.streak_days ?? "—"}</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mt-1">Day Streak</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="kanji-stone p-6 flex flex-col items-center justify-center aspect-square"
          >
            <Trophy className="w-8 h-8 text-text-muted mb-3" />
            <span className="text-4xl font-black text-text-main">{stats?.global?.total_correct ?? "—"}</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mt-1">Correct Kanjis</span>
          </motion.div>
        </div>

        <WabiDivider />

        {/* Filter bar */}
        <div className="w-full flex flex-col sm:flex-row gap-6 justify-between items-center py-4 border-b border-[rgba(var(--rgb-grey-olive),0.3)]">
          <div className="flex gap-6 overflow-x-auto w-full sm:w-auto scrollbar-hide py-1">
            {stats?.sessionResult && (
              <button
                id="stats-tab-result"
                onClick={() => setTab("result")}
                className={`text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-2 whitespace-nowrap ${
                  tab === "result"
                    ? "border-[var(--charcoal-blue)] text-[var(--charcoal-blue)]"
                    : "border-transparent text-[var(--charcoal-brown)] opacity-60 hover:opacity-100"
                }`}
              >
                Current Result
              </button>
            )}
            <button
              id="stats-tab-overview"
              onClick={() => setTab("all-time")}
              className={`text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-2 whitespace-nowrap ${
                tab === "all-time"
                  ? "border-[var(--charcoal-blue)] text-[var(--charcoal-blue)]"
                  : "border-transparent text-[var(--charcoal-brown)] opacity-60 hover:opacity-100"
              }`}
            >
              Overview
            </button>
            <button
              id="stats-tab-history"
              onClick={() => setTab("history")}
              className={`text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-2 whitespace-nowrap ${
                tab === "history"
                  ? "border-[var(--charcoal-blue)] text-[var(--charcoal-blue)]"
                  : "border-transparent text-[var(--charcoal-brown)] opacity-60 hover:opacity-100"
              }`}
            >
              History
            </button>
          </div>

          <div
            className={`relative transition-all duration-300 ${
              tab === "history" ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <select
              id="stats-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-transparent text-[var(--charcoal-brown)] text-[0.65rem] font-bold uppercase tracking-[0.2em] px-3 py-1 pr-8 outline-none cursor-pointer border-none"
            >
              <option value="all">All Types</option>
              <option value="meaning">Meaning</option>
              <option value="reading">Reading</option>
              <option value="reverse">Recognition</option>
              <option value="listening">Listening</option>
              <option value="drawing">Drawing</option>
              <option value="matching">Matching</option>
            </select>
            <Filter className="w-3 h-3 text-[var(--charcoal-blue)] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Dynamic content */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {tab === "result" && stats?.sessionResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6 w-full pb-24"
              >
                {/* Session specific stats summary */}
                <div className="kanji-stone p-6 bg-white/10 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-text-muted/10 pb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-text-muted">Your Performance</span>
                    <span className="text-xl font-serif font-black text-text-main">
                      {stats.sessionResult.score?.score ?? 0} / {stats.sessionResult.score?.total_questions ?? 0}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Accuracy</span>
                      <span className="text-lg font-black text-accent">
                        {Math.round((stats.sessionResult.score?.correct_answers / stats.sessionResult.score?.total_questions) * 100) || 0}%
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Completed</span>
                      <span className="text-lg font-black text-text-main italic">
                        {new Date(stats.sessionResult.score?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Leaderboard */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Quiz Leaderboard</h3>
                  <div className="flex flex-col gap-2 bg-text-muted/5 p-3 rounded-xl border border-text-muted/10">
                    {stats.sessionResult.leaderboard.length > 0 ? (
                      stats.sessionResult.leaderboard.map((p: any, idx: number) => (
                        <div key={p.id} className="flex justify-between items-center py-2 px-1 border-b border-text-muted/5 last:border-0">
                          <span className="text-xs font-bold text-text-muted">
                            {idx + 1}. {p.username || `Player ${p.telegram_id.toString().slice(-4)}`}
                          </span>
                          <span className="text-sm font-black text-text-main">
                            {p.score} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[0.6rem] text-text-muted italic text-center py-4">No other participants yet.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : tab === "all-time" ? (
              <motion.div
                key={`mastery-${typeFilter}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-4 pb-24 kanji-stone border-2 border-[var(--grey-olive)] p-6 bg-transparent"
              >
                {masteryData.length > 0 ? (
                  masteryData.map((item) => (
                    <OrganicProgress
                      key={item.question_type}
                      value={item.accuracy}
                      label={`${item.question_type} (${item.total})`}
                      icon={categoryIcons[item.question_type] ?? BookOpen}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-xs font-medium text-text-muted/60 italic">
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
                className="flex flex-col w-full pb-24"
              >
                {(stats?.recent ?? []).length > 0 ? (
                  (stats.recent as any[]).map((quiz: any, idx: number) => {
                    const accValue = Math.round((quiz.correct_answers / quiz.total_questions) * 100) || 0;
                    let accColor = "var(--palm-leaf)";
                    if (accValue <= 33) accColor = "var(--rich-mahogany)";
                    else if (accValue <= 66) accColor = "var(--charcoal-blue)";

                    const dateObj = new Date(quiz.created_at);
                    const formattedDate = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    const formattedTime = dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

                    return (
                      <div
                        key={idx}
                        className="group flex justify-between items-center py-4 border-b border-[rgba(var(--rgb-grey-olive),0.2)] hover:bg-[rgba(var(--rgb-soft-linen),0.2)] transition-colors cursor-pointer px-2"
                      >
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col gap-1 w-24">
                            <span className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-[var(--charcoal-brown)]">{formattedDate}</span>
                            <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--grey-olive)]">{formattedTime}</span>
                          </div>
                          <span className="text-[0.6rem] uppercase font-black px-2 py-0.5" style={{ color: accColor }}>
                            {accValue}% Acc
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-serif font-black text-[var(--ebony)]">{quiz.score}</span>
                            <span className="text-[0.65rem] font-bold text-[var(--grey-olive)]">/{quiz.total_questions}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--grey-olive)] opacity-30 group-hover:opacity-100 group-hover:text-[var(--charcoal-blue)] transition-all transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs font-medium text-text-muted/60 italic">
                    No history found in the annals yet.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer gradient */}
      <div className="fixed bottom-0 left-0 w-full p-4 flex justify-center bg-gradient-to-t from-[var(--soft-linen)] via-[var(--soft-linen)] to-transparent pt-16 z-20 pointer-events-none">
        <p className="text-[0.6rem] font-bold tracking-[0.4em] uppercase text-text-muted/50 mb-4 select-none drop-shadow-sm">
          Persistence • Patience • Mastery
        </p>
      </div>
    </div>
  );
}
