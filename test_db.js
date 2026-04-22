const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('orders').select('user_id').limit(1);
  if (error) {
    console.log("Error:", error.message);
  } else {
    console.log("Success! user_id exists:", data);
  }
}
test();
