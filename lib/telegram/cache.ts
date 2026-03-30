/**
 * Simple Middleman Cache for the Telegram Bot /today command.
 * Stores the last successfully fetched Kanji to ensure offline/DB-failure resilience.
 */

interface CachedKanji {
  character: string;
  meanings: string[] | string;
  onyomi: string[] | string;
  kunyomi: string[] | string;
  fetchedAt: string;
}

// In-memory cache for the duration of the process life
let lastKanji: CachedKanji | null = null;

export function setCachedTodayKanji(kanji: Omit<CachedKanji, 'fetchedAt'>) {
  lastKanji = {
    ...kanji,
    fetchedAt: new Date().toISOString()
  };
}

export function getCachedTodayKanji(): CachedKanji | null {
  return lastKanji;
}
