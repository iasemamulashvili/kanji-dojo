export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current kanji
  const { data: settings } = await supabase.from('group_settings').select('current_kanji_id').single();
  let kanjiId = settings?.current_kanji_id;

  if (!kanjiId) {
    const { data: fallback } = await supabase.from('kanjis').select('id').order('jlpt_level', { ascending: false }).order('stroke_count', { ascending: true }).limit(1).single();
    kanjiId = fallback?.id;
  }

  if (!kanjiId) {
    return new NextResponse('No kanji found', { status: 404 });
  }

  // Telegram bot might redirect here, let's create a session.
  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .insert({ kanji_id: kanjiId, status: 'active' }) // Skip waiting state for now
    .select('id')
    .single();

  if (error || !session) {
    return new NextResponse('Failed to create session', { status: 500 });
  }

  const baseUrl = req.nextUrl.origin;
  return NextResponse.redirect(new URL(`/quiz/${session.id}`, baseUrl));
}
