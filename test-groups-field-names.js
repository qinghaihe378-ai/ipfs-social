import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGroupsFields() {
  console.log('🧪 测试groups表字段...\n');

  // 先创建一个测试用户
  console.log('📝 创建测试用户...');
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      username: 'test_group_user_' + Date.now(),
      nickname: '测试用户',
      bio: '测试',
      public_key: 'test_key'
    })
    .select()
    .single();

  if (userError) {
    console.log('❌ 创建用户失败:', userError.message);
    return;
  }

  console.log('✅ 用户创建成功:', user.username);

  // 尝试不同的字段组合
  const fieldCombinations = [
    { name: 'created_at', members: ['text'] },
    { name: 'createdAt', members: ['text'] },
    { name: 'member', members: ['text'] },
    { name: 'member_ids', members: ['text'] }
  ];

  for (const combo of fieldCombinations) {
    console.log(`\n🔄 尝试字段组合: ${combo.name}, ${combo.members[0]}`);
    
    const testGroup = {
      id: 'test_' + Date.now() + '_' + combo.name,
      name: '测试群组',
      creator: user.username,
      [combo.name]: Date.now(),
      [combo.members[0]]: [user.username]
    };

    const { data, error } = await supabase
      .from('groups')
      .insert(testGroup)
      .select()
      .single();

    if (error) {
      console.log(`   ❌ 失败: ${error.message}`);
    } else {
      console.log(`   ✅ 成功！正确的字段是: ${combo.name}, ${combo.members[0]}`);
      console.log(`   记录:`, data);
      
      // 删除测试记录
      await supabase.from('groups').delete().eq('id', data.id);
      break;
    }
  }

  // 删除测试用户
  console.log('\n🗑️  删除测试用户...');
  await supabase.from('users').delete().eq('id', user.id);
  console.log('✅ 完成');
}

testGroupsFields().catch(console.error);