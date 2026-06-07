const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: kanjis, error } = await supabase.from('kanjis').select('character, jlpt_level, grammar_explanation');
  if (error) {
    console.error("Error fetching kanjis:", error);
    return;
  }

  const total = kanjis.length;
  const n5 = kanjis.filter(k => k.jlpt_level === 5);
  const n4 = kanjis.filter(k => k.jlpt_level === 4);
  const missingExplanation = kanjis.filter(k => !k.grammar_explanation);

  console.log(`Total Kanjis in DB: ${total}`);
  console.log(`- N5: ${n5.length}`);
  console.log(`- N4: ${n4.length}`);
  console.log(`Kanjis missing grammar_explanation: ${missingExplanation.length}`);
})();
