import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFriendsAPI() {
  console.log('🧪 测试好友API...\n');

  // 创建测试用户
  const user1 = `test_friend_1_${Date.now()}`;
  const user2 = `test_friend_2_${Date.now()}`;

  console.log('📝 创建测试用户...');
  await supabase.from('users').insert([
    { username: user1, nickname: '测试用户1', public_key: 'key1' },
    { username: user2, nickname: '测试用户2', public_key: 'key2' }
  ]);

  // 创建好友关系
  console.log('\n📝 创建好友关系...');
  const { data: friendData, error: friendError } = await supabase
    .from('friends')
    .insert([
      { user1: user1, user2: user2 },
      { user1: user2, user2: user1 }
    ])
    .select();

  if (friendError) {
    console.log('❌ 创建好友关系失败:', friendError.message);
  } else {
    console.log('✅ 好友关系创建成功:', friendData);
  }

  // 查询好友列表
  console.log('\n📝 查询好友列表...');
  const { data: friends, error: queryError } = await supabase
    .from('friends')
    .select('*')
    .eq('user1', user1);

  if (queryError) {
    console.log('❌ 查询好友失败:', queryError.message);
  } else {
    console.log(`✅ 查询到${friends.length}个好友`);
    console.log('好友列表:', friends);
  }

  // 清理
  console.log('\n🗑️  清理测试数据...');
  await supabase.from('friends').delete().eq('user1', user1);
  await supabase.from('friends').delete().eq('user1', user2);
  await supabase.from('users').delete().in('username', [user1, user2]);
  console.log('✅ 完成');
}

testFriendsAPI().catch(console.error);
