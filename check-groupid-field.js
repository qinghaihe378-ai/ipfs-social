import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroupIdField() {
  console.log('🔍 检查messages表是否有groupId字段...\n');

  const { data, error } = await supabase
    .from('messages')
    .select('id, groupId')
    .limit(1);

  if (error) {
    console.log('❌ 错误:', error.message);
    console.log('messages表没有groupId字段');
  } else {
    console.log('✅ messages表有groupId字段');
    if (data.length > 0) {
      console.log('示例记录:', data[0]);
    }
  }
}

checkGroupIdField().catch(console.error);