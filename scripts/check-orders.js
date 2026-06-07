const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: kanjis, error } = await supabase
    .from('kanjis')
    .select('character, jlpt_level, jlpt_order')
    .order('jlpt_order', { ascending: true });

  if (error) {
    console.error("Error fetching kanjis:", error);
    return;
  }

  console.log("Existing Kanjis count:", kanjis.length);
  for (const k of kanjis) {
    console.log(`- ${k.character} (N${k.jlpt_level}): Order ${k.jlpt_order}`);
  }
})();
