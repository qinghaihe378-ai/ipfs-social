import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFriendsTable() {
  console.log('🔍 检查friends表...\n');

  const { data, error } = await supabase
    .from('friends')
    .select('*');

  if (error) {
    console.log('❌ 错误:', error.message);
  } else {
    console.log(`✅ friends表有${data.length}条记录`);
    if (data.length > 0) {
      console.log('记录:', data);
      console.log('字段:', Object.keys(data[0]).join(', '));
    }
  }
}

checkFriendsTable().catch(console.error);