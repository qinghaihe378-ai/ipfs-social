import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMinimalInsert() {
  console.log('🧪 测试最小插入...\n');

  const { data, error } = await supabase
    .from('friends')
    .insert({
      user1: 'test1',
      user2: 'test2'
    })
    .select()
    .single();

  if (error) {
    console.log('❌ 失败:', error.message);
  } else {
    console.log('✅ 成功！');
    console.log('记录:', data);
    console.log('字段:', Object.keys(data).join(', '));
    
    // 删除测试记录
    await supabase.from('friends').delete().eq('id', data.id);
  }
}

testMinimalInsert().catch(console.error);