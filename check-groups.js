import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroupsTable() {
  console.log('🔍 检查groups表结构...\n');

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ 错误:', error.message);
  } else if (data.length > 0) {
    console.log('✅ groups表字段:', Object.keys(data[0]).join(', '));
  } else {
    console.log('✅ groups表存在但为空');
  }
}

checkGroupsTable().catch(console.error);