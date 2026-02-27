import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMessageFlow() {
  console.log('🧪 测试消息流程...\n');

  // 创建测试用户
  const user1 = `test_msg_1_${Date.now()}`;
  const user2 = `test_msg_2_${Date.now()}`;

  console.log('📝 创建测试用户...');
  await supabase.from('users').insert([
    { username: user1, nickname: '测试用户1', public_key: 'key1' },
    { username: user2, nickname: '测试用户2', public_key: 'key2' }
  ]);

  // 发送消息
  console.log('\n📝 发送消息...');
  const { data: msg, error: msgError } = await supabase
    .from('messages')
    .insert({
      id: Date.now().toString(),
      from_user: user1,
      to_user: user2,
      content: '测试消息',
      type: 'text',
      timestamp: Date.now()
    })
    .select()
    .single();

  if (msgError) {
    console.log('❌ 发送消息失败:', msgError.message);
  } else {
    console.log('✅ 消息发送成功:', msg);
  }

  // 查询消息
  console.log('\n📝 查询消息...');
  const { data: msgs, error: queryError } = await supabase
    .from('messages')
    .select('*')
    .eq('to_user', user2);

  if (queryError) {
    console.log('❌ 查询消息失败:', queryError.message);
  } else {
    console.log(`✅ 查询到${msgs.length}条消息`);
    console.log('消息:', msgs);
  }

  // 清理
  console.log('\n🗑️  清理测试数据...');
  await supabase.from('messages').delete().eq('from_user', user1);
  await supabase.from('users').delete().in('username', [user1, user2]);
  console.log('✅ 完成');
}

testMessageFlow().catch(console.error);