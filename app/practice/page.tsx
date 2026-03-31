import { cookies } from 'next/headers';
import { supabase } from '../../lib/supabase';
import PracticeClient from '../../components/PracticeClient';

export const dynamic = 'force-dynamic';

export default async function PracticePage() {
  const cookieStore = await cookies();
  // Authentication is now handled globally by TelegramAuthProvider in layout.tsx
  // and enforced via dojo_session JWT validation in middleware.ts.
  // We allow the server component to proceed to fetch the current Kanji.

  let kanjiData = null;
  let errorMsg = null;

  try {
    // Normal Mode: fetch current active Kanji for the Dojo
    const groupIdStr = process.env.TELEGRAM_GROUP_ID || '1';
    const groupId = Number(groupIdStr);

    console.log(`[${new Date().toISOString()}] Fetching settings for group_id: ${groupId}`);

    const { data: settings, error: settingsError } = await supabase
      .from('group_settings')
      .select('current_kanji_id')
      .eq('group_id', groupId)
      .maybeSingle();

    if (settingsError) {
      console.error("Settings Query error:", settingsError);
    }

    console.log(`[${new Date().toISOString()}] Current Setting ID for group ${groupId}:`, settings?.current_kanji_id);

    let kanji = null;

    if (settings?.current_kanji_id) {
      const { data, error: kanjiError } = await supabase
        .from('kanjis')
        .select('*')
        .eq('id', settings.current_kanji_id)
        .single();
      
      if (kanjiError) {
        console.error("Kanji Query error:", kanjiError);
      }
      kanji = data;
    }

    console.log('Fetched Kanji:', kanji?.character);

    if (!kanji) {
      const { data: fallbackKanji, error: fallbackError } = await supabase
        .from('kanjis')
        .select('*')
        .order('jlpt_level', { ascending: false })
        .order('stroke_count', { ascending: true })
        .limit(1)
        .single();
      kanji = fallbackKanji;
      if (fallbackError) {
        console.error("Fallback Query Error:", fallbackError);
        errorMsg = "Failed to load the first Kanji.";
      }
    }

    kanjiData = kanji;
  } catch (err: any) {
    console.error("Application Error querying kanjis:", err);
    errorMsg = err.message || "An unexpected error occurred.";
  }

  if (errorMsg || !kanjiData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="wabi-card p-6 text-center max-w-sm w-full">
          <h2 className="text-xl font-bold mb-2 text-cinnabar">Error Loading Dojo</h2>
          <p>{errorMsg || "Kanji not found."}</p>
        </div>
      </div>
    );
  }

  return <PracticeClient kanjiData={kanjiData} />;
}
