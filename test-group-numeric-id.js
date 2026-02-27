import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGroupWithNumericId() {
  console.log('🧪 测试groups表使用数字ID...\n');

  const testGroup = {
    id: Date.now(),
    name: '测试群组'
  };

  console.log('📝 尝试插入数字ID...');
  const { data, error } = await supabase
    .from('groups')
    .insert(testGroup)
    .select()
    .single();

  if (error) {
    console.log('❌ 失败:', error.message);
  } else {
    console.log('✅ 成功！');
    console.log('记录:', data);
    console.log('字段:', Object.keys(data).join(', '));
    
    // 删除测试记录
    await supabase.from('groups').delete().eq('id', data.id);
  }
}

testGroupWithNumericId().catch(console.error);