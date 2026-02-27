import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessagesTable() {
  console.log('🔍 检查messages表结构...\n');

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ 错误:', error.message);
  } else if (data.length > 0) {
    console.log('✅ messages表字段:', Object.keys(data[0]).join(', '));
    console.log('示例记录:', data[0]);
  } else {
    console.log('✅ messages表存在但为空');
    console.log('\n请在Supabase控制台执行以下SQL查看表结构:');
    console.log(`
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
    `);
  }
}

checkMessagesTable().catch(console.error);