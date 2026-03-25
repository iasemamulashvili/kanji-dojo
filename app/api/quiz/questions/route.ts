import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramToken } from '@/lib/auth/jwt';

// ─────────────────────────────────────────────────────────────────────────────
// TS Interfaces — the strict contract between the backend and the UI artist
// ─────────────────────────────────────────────────────────────────────────────

export interface MeaningQuestion {
  type: 'meaning';
  question: string;
  options: string[];
  answer: string;
}

export interface ReadingQuestion {
  type: 'reading';
  question: string;
  options: string[];
  answer: string;
}

export interface ReverseQuestion {
  type: 'reverse';
  question: string;
  options: string[];
  answer: string;
}

export interface MatchingPair {
  kanji: string;
  meaning: string;
}

export interface MatchingQuestion {
  type: 'matching';
  instruction: string;
  pairs: MatchingPair[];
}

export type QuizQuestion =
  | MeaningQuestion
  | ReadingQuestion
  | ReverseQuestion
  | MatchingQuestion;

export interface QuizQuestionsResponse {
  session_id: string;
  kanji: string;
  questions: QuizQuestion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal kanji shape from the DB
// ─────────────────────────────────────────────────────────────────────────────

interface KanjiRow {
  id: string;
  character: string;
  meanings: string[] | null;
  onyomi: string[] | null;
  kunyomi: string[] | null;
  jlpt_order: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shuffle an array in-place using Fisher-Yates. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Return the primary meaning of a kanji row, or a fallback. */
function primaryMeaning(k: KanjiRow): string {
  return k.meanings?.[0] ?? '???';
}

/** Return a display-friendly onyomi string (e.g. "にん・じん"). */
function primaryOnyomi(k: KanjiRow): string {
  return k.onyomi?.join('・') ?? '—';
}

// ─────────────────────────────────────────────────────────────────────────────
// Question builders
// ─────────────────────────────────────────────────────────────────────────────

function buildMeaningQuestion(
  target: KanjiRow,
  distractors: KanjiRow[]
): MeaningQuestion {
  const answer = primaryMeaning(target);
  const wrongOptions = distractors.map(primaryMeaning).filter((m) => m !== answer);
  const options = shuffle([answer, ...wrongOptions.slice(0, 3)]);
  return {
    type: 'meaning',
    question: `What does ${target.character} mean?`,
    options,
    answer,
  };
}

function buildReadingQuestion(
  target: KanjiRow,
  distractors: KanjiRow[]
): ReadingQuestion {
  const answer = primaryOnyomi(target);
  const wrongOptions = distractors
    .map(primaryOnyomi)
    .filter((r) => r !== answer && r !== '—');
  const options = shuffle([answer, ...wrongOptions.slice(0, 3)]);
  return {
    type: 'reading',
    question: `What is the Onyomi reading of ${target.character}?`,
    options,
    answer,
  };
}

function buildReverseQuestion(
  target: KanjiRow,
  distractors: KanjiRow[]
): ReverseQuestion {
  const answer = target.character;
  const wrongOptions = distractors
    .map((k) => k.character)
    .filter((c) => c !== answer);
  const options = shuffle([answer, ...wrongOptions.slice(0, 3)]);
  return {
    type: 'reverse',
    question: `Which Kanji means "${primaryMeaning(target)}"?`,
    options,
    answer,
  };
}

function buildMatchingQuestion(
  target: KanjiRow,
  distractors: KanjiRow[]
): MatchingQuestion {
  // Build 4 pairs: 1 target + 3 distractors that each have a valid meaning
  const pool = [target, ...distractors].filter(
    (k) => k.meanings && k.meanings.length > 0
  );
  const chosen = pool.slice(0, 4);
  const pairs: MatchingPair[] = shuffle(
    chosen.map((k) => ({ kanji: k.character, meaning: primaryMeaning(k) }))
  );
  return {
    type: 'matching',
    instruction: 'Drag each Kanji to its correct English meaning.',
    pairs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Auth — verify the JWT cookie set by middleware / /api/auth/telegram
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await verifyTelegramToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // 2. Validate query params
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id parameter' }, { status: 400 });
  }

  // 3. Look up the quiz session to find the target kanji
  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .select('id, kanji_id, status')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'finished') {
    return NextResponse.json({ error: 'This quiz session has already finished' }, { status: 410 });
  }

  // 4. Fetch the target kanji
  const { data: targetKanji, error: targetError } = await supabase
    .from('kanjis')
    .select('id, character, meanings, onyomi, kunyomi, jlpt_order')
    .eq('id', session.kanji_id)
    .single<KanjiRow>();

  if (targetError || !targetKanji) {
    return NextResponse.json({ error: 'Target kanji not found' }, { status: 404 });
  }

  // 5. Fetch distractor kanjis (excluding the target) from the pool of already learnt kanji
  //    (jlpt_order <= targetKanji.jlpt_order)
  let { data: allKanjis, error: distractorError } = await supabase
    .from('kanjis')
    .select('id, character, meanings, onyomi, kunyomi, jlpt_order')
    .lte('jlpt_order', targetKanji.jlpt_order)
    .neq('id', targetKanji.id)
    .returns<KanjiRow[]>();

  if (distractorError) {
    return NextResponse.json(
      { error: 'Error fetching distractors' },
      { status: 500 }
    );
  }

  // If there are not enough learnt kanjis (e.g. very first few kanji), 
  // fallback to fetching the lowest jlpt_order kanjis available.
  if (!allKanjis || allKanjis.length < 9) {
    const { data: fallback } = await supabase
      .from('kanjis')
      .select('id, character, meanings, onyomi, kunyomi, jlpt_order')
      .neq('id', targetKanji.id)
      .order('jlpt_order', { ascending: true })
      .limit(20)
      .returns<KanjiRow[]>();
      
    const combined = [...(allKanjis || []), ...(fallback || [])];
    const uniqueIds = new Set();
    allKanjis = combined.filter(k => {
      if (uniqueIds.has(k.id)) return false;
      uniqueIds.add(k.id);
      return true;
    });
  }

  if (allKanjis.length < 3) {
    return NextResponse.json(
      { error: 'Not enough kanji in DB to generate distractors' },
      { status: 500 }
    );
  }

  // Randomly pick 9 from the pool for variety
  const distractors = shuffle([...allKanjis]).slice(0, 9);

  // 6. Build all 4 question types
  const questions: QuizQuestion[] = [
    buildMeaningQuestion(targetKanji, distractors.slice(0, 3)),
    buildReadingQuestion(targetKanji, distractors.slice(3, 6)),
    buildReverseQuestion(targetKanji, distractors.slice(6, 9)),
    buildMatchingQuestion(targetKanji, distractors.slice(0, 3)),
  ];

  const payload: QuizQuestionsResponse = {
    session_id: session.id,
    kanji: targetKanji.character,
    questions,
  };

  return NextResponse.json(payload, { status: 200 });
}
