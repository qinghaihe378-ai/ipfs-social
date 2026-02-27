import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFriendsInsert() {
  console.log('🧪 测试friends表插入...\n');

  // 创建测试用户
  const { data: user1 } = await supabase
    .from('users')
    .insert({
      username: 'test_friend_1_' + Date.now(),
      nickname: '测试用户1',
      public_key: 'key1'
    })
    .select()
    .single();

  const { data: user2 } = await supabase
    .from('users')
    .insert({
      username: 'test_friend_2_' + Date.now(),
      nickname: '测试用户2',
      public_key: 'key2'
    })
    .select()
    .single();

  console.log('✅ 测试用户创建成功');

  // 尝试插入好友关系
  console.log('\n📝 尝试插入好友关系...');
  const { data, error } = await supabase
    .from('friends')
    .insert([
      { user1: user1.username, user2: user2.username, status: 'active', created_at: Date.now() },
      { user1: user2.username, user2: user1.username, status: 'active', created_at: Date.now() }
    ])
    .select();

  if (error) {
    console.log('❌ 插入失败:', error.message);
    
    // 尝试不用created_at
    console.log('\n🔄 尝试不用created_at字段...');
    const { data: data2, error: error2 } = await supabase
      .from('friends')
      .insert([
        { user1: user1.username, user2: user2.username, status: 'active' },
        { user1: user2.username, user2: user1.username, status: 'active' }
      ])
      .select();

    if (error2) {
      console.log('❌ 仍然失败:', error2.message);
    } else {
      console.log('✅ 成功！不需要created_at字段');
      console.log('记录:', data2);
    }
  } else {
    console.log('✅ 成功！');
    console.log('记录:', data);
    if (data.length > 0) {
      console.log('字段:', Object.keys(data[0]).join(', '));
    }
  }

  // 清理测试数据
  console.log('\n🗑️  清理测试数据...');
  await supabase.from('friends').delete().in('user1', [user1.username, user2.username]);
  await supabase.from('users').delete().in('username', [user1.username, user2.username]);
  console.log('✅ 完成');
}

testFriendsInsert().catch(console.error);