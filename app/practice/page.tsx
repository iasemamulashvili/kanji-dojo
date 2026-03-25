import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import PracticeClient from '../../components/PracticeClient';

export const dynamic = 'force-dynamic';

export default async function PracticePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('dojo_session');

  if (!sessionCookie?.value) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="wabi-card p-8 text-center max-w-md w-full">
          <div className="text-4xl mb-4">⛩️</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-sage">Please enter the Dojo through the Telegram Group via the magic link.</p>
        </div>
      </div>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-cinnabar">System configuration error. Supabase credentials are missing.</p>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let kanjiData = null;
  let errorMsg = null;

  try {
    // Normal Mode: use group_settings current_kanji_id
    const { data: settings, error: settingsError } = await supabase
      .from('group_settings')
      .select('current_kanji_id')
      .single();

    console.log(`[${new Date().toISOString()}] Current Setting ID:`, settings?.current_kanji_id);

    let kanji = null;

    if (settings?.current_kanji_id) {
      const { data, error: kanjiError } = await supabase
        .from('kanjis')
        .select('*')
        .eq('id', settings.current_kanji_id)
        .single();
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
