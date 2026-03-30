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

export interface DrawingQuestion {
  type: 'drawing';
  question: string;
  kanji: string;
}

export type QuizQuestion =
  | MeaningQuestion
  | ReadingQuestion
  | ReverseQuestion
  | MatchingQuestion
  | DrawingQuestion;

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
  jlpt_level: number;
  stroke_count: number;
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

function buildDrawingQuestion(
  target: KanjiRow
): DrawingQuestion {
  return {
    type: 'drawing',
    question: `Draw the Kanji for "${primaryMeaning(target)}"`,
    kanji: target.character,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Auth — verify the dojo_session
  const activeToken = req.cookies.get('dojo_session')?.value;
  if (!activeToken)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await verifyTelegramToken(activeToken);
    if (!payload || !payload.telegramId) throw new Error('Invalid session');
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
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
    .select('id, character, meanings, onyomi, kunyomi, jlpt_level, stroke_count')
    .eq('id', session.kanji_id)
    .single<KanjiRow>();

  if (targetError || !targetKanji) {
    return NextResponse.json({ error: 'Target kanji not found' }, { status: 404 });
  }

  // 5. Fetch distractor kanjis (excluding the target) from the pool of already learnt kanji
  //    (Same sequence or earlier stroke count in the N5 spectrum)
  let { data: allKanjis, error: distractorError } = await supabase
    .from('kanjis')
    .select('id, character, meanings, onyomi, kunyomi, jlpt_level, stroke_count')
    .eq('jlpt_level', targetKanji.jlpt_level)
    .lte('stroke_count', targetKanji.stroke_count)
    .neq('id', targetKanji.id)
    .returns<KanjiRow[]>();

  if (distractorError) {
    return NextResponse.json(
      { error: 'Error fetching distractors' },
      { status: 500 }
    );
  }

  // If there are not enough learnt kanjis (e.g. very first few kanji), 
  // fallback to fetching the lowest jlpt_level kanjis available.
  if (!allKanjis || allKanjis.length < 9) {
    const { data: fallback } = await supabase
      .from('kanjis')
      .select('id, character, meanings, onyomi, kunyomi, jlpt_level, stroke_count')
      .neq('id', targetKanji.id)
      .order('jlpt_level', { ascending: false })
      .order('stroke_count', { ascending: true })
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

  // 6. Build the requested number of questions
  const requestedCount = parseInt(searchParams.get('count') || '5');
  const questions: QuizQuestion[] = [];
  
  // Available question builders
  const builderPool = [
    () => buildMeaningQuestion(targetKanji, shuffle([...distractors]).slice(0, 3)),
    () => buildReadingQuestion(targetKanji, shuffle([...distractors]).slice(0, 3)),
    () => buildReverseQuestion(targetKanji, shuffle([...distractors]).slice(0, 3)),
    () => buildMatchingQuestion(targetKanji, shuffle([...distractors]).slice(0, 3)),
    () => buildDrawingQuestion(targetKanji),
  ];

  for (let i = 0; i < requestedCount; i++) {
    // Cycle through builders to ensure variety
    const builder = builderPool[i % builderPool.length];
    questions.push(builder());
  }

  // Final shuffle for randomness
  shuffle(questions);

  const payload: QuizQuestionsResponse = {
    session_id: session.id,
    kanji: targetKanji.character,
    questions,
  };

  return NextResponse.json(payload, { status: 200 });
}
