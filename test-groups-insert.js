import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGroupsInsert() {
  console.log('🧪 测试groups表插入...\n');

  const testGroup = {
    id: 'test_' + Date.now(),
    name: '测试群组',
    creator: 'test_user',
    members: ['test_user']
  };

  console.log('📝 尝试插入群组...');
  const { data, error } = await supabase
    .from('groups')
    .insert(testGroup)
    .select()
    .single();

  if (error) {
    console.log('❌ 插入失败:', error.message);
    
    // 尝试不同的字段名
    console.log('\n🔄 尝试不同的字段名...');
    const testGroup2 = {
      id: 'test2_' + Date.now(),
      name: '测试群组2',
      creator: 'test_user',
      member_ids: ['test_user']
    };

    const { data: data2, error: error2 } = await supabase
      .from('groups')
      .insert(testGroup2)
      .select()
      .single();

    if (error2) {
      console.log('❌ 仍然失败:', error2.message);
    } else {
      console.log('✅ 成功！字段名是member_ids');
      console.log('记录:', data2);
      console.log('字段:', Object.keys(data2).join(', '));
      
      // 删除测试记录
      await supabase.from('groups').delete().eq('id', data2.id);
    }
  } else {
    console.log('✅ 成功！');
    console.log('记录:', data);
    console.log('字段:', Object.keys(data).join(', '));
    
    // 删除测试记录
    await supabase.from('groups').delete().eq('id', data.id);
  }
}

testGroupsInsert().catch(console.error);