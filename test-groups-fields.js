import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGroupsTable() {
  console.log('🧪 测试groups表...\n');

  const testGroup = {
    id: 'test_' + Date.now(),
    name: '测试群组',
    creator: 'test_user',
    members: ['test_user'],
    created_at: Date.now()
  };

  console.log('📝 插入测试群组...');
  const { data, error } = await supabase
    .from('groups')
    .insert(testGroup)
    .select()
    .single();

  if (error) {
    console.log('❌ 插入失败:', error.message);
    
    // 尝试用createdAt
    console.log('\n🔄 尝试用createdAt字段...');
    const testGroup2 = {
      id: 'test2_' + Date.now(),
      name: '测试群组2',
      creator: 'test_user',
      members: ['test_user'],
      createdAt: Date.now()
    };

    const { data: data2, error: error2 } = await supabase
      .from('groups')
      .insert(testGroup2)
      .select()
      .single();

    if (error2) {
      console.log('❌ 仍然失败:', error2.message);
    } else {
      console.log('✅ 成功！字段名是createdAt');
      console.log('记录:', data2);
      
      // 删除测试记录
      await supabase.from('groups').delete().eq('id', data2.id);
    }
  } else {
    console.log('✅ 成功！字段名是created_at');
    console.log('记录:', data);
    console.log('字段:', Object.keys(data).join(', '));

    // 删除测试记录
    await supabase.from('groups').delete().eq('id', data.id);
  }
}

testGroupsTable().catch(console.error);