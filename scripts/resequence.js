const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resequenceJlptOrder() {
  console.log("\n--- RESEQUENCING JLPT ORDER ---");
  const { data: kanjis, error: fetchError } = await supabase
    .from("kanjis")
    .select("id, character, jlpt_level, stroke_count");

  if (fetchError) {
    console.error("Error fetching kanjis for resequencing:", fetchError.message);
    return;
  }

  console.log(`Sorting and resequencing ${kanjis.length} Kanjis...`);

  // Sort logically: N5 (5) first, then N4 (4); then by stroke_count ASC; then by character ASC
  kanjis.sort((a, b) => {
    if (a.jlpt_level !== b.jlpt_level) {
      return b.jlpt_level - a.jlpt_level; // 5 before 4
    }
    if (a.stroke_count !== b.stroke_count) {
      return a.stroke_count - b.stroke_count; // smaller stroke_count first
    }
    return a.character.localeCompare(b.character);
  });

  // Temporarily shift all orders to a high offset to avoid unique conflicts during update
  console.log("Step 1: Shifting all orders to a temporary high offset...");
  for (let i = 0; i < kanjis.length; i++) {
    const { error: shiftError } = await supabase
      .from("kanjis")
      .update({ jlpt_order: 100000 + i })
      .eq("id", kanjis[i].id);

    if (shiftError) {
      console.error(`❌ Failed to shift order for "${kanjis[i].character}":`, shiftError.message);
      return;
    }
  }

  console.log("Step 2: Applying final sequential orders (1..N)...");
  for (let i = 0; i < kanjis.length; i++) {
    const newOrder = i + 1;
    const { error: updateError } = await supabase
      .from("kanjis")
      .update({ jlpt_order: newOrder })
      .eq("id", kanjis[i].id);

    if (updateError) {
      console.error(`❌ Failed to update order for "${kanjis[i].character}" to ${newOrder}:`, updateError.message);
    }
  }

  console.log("Resequencing complete.");
}

(async () => {
  await resequenceJlptOrder();
})();
