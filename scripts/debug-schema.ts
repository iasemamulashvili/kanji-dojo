import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

(async () => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  console.log("Checking group_settings table...");
  const { data, error } = await supabase.from('group_settings').select('*').limit(1);
  if (error) {
    console.error("Supabase Error:", error);
    process.exit(1);
  }
  if (data && data.length > 0) {
    console.log("Columns found:", Object.keys(data[0]));
    console.log("Row data:", JSON.stringify(data[0]));
  } else {
    // If empty, let's try to get columns using a different trick or insert test
    console.log("Table is empty. Attempting to fetch column info via RPC or system table if possible...");
    // Just try a dummy query with a known non-existent column to see the error message which often lists available columns
    const { error: dummyError } = await supabase.from('group_settings').select('non_existent_column').limit(1);
    console.log("Dummy error (to see schema):", dummyError?.message);
  }
})();
