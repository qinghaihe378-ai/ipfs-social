import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGroupMessage() {
  console.log('🧪 测试群消息流程...\n');

  // 创建测试用户
  const user1 = `test_group_user1_${Date.now()}`;
  const user2 = `test_group_user2_${Date.now()}`;
  const groupId = Math.floor(Math.random() * 10000000).toString();

  console.log('📝 创建测试用户...');
  await supabase.from('users').insert([
    { username: user1, nickname: '测试用户1', public_key: 'key1' },
    { username: user2, nickname: '测试用户2', public_key: 'key2' }
  ]);

  // 创建群组
  console.log('\n📝 创建群组...');
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert({
      id: parseInt(groupId),
      group_id: groupId,
      name: '测试群组',
      creator: user1
    })
    .select();

  if (groupError) {
    console.log('❌ 创建群组失败:', groupError.message);
  } else {
    console.log('✅ 群组创建成功:', groupData);
  }

  // 添加群成员
  console.log('\n📝 添加群成员...');
  const { data: membersData, error: membersError } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupId, username: user1 },
      { group_id: groupId, username: user2 }
    ])
    .select();

  if (membersError) {
    console.log('❌ 添加成员失败:', membersError.message);
  } else {
    console.log('✅ 成员添加成功:', membersData);
  }

  // 发送群消息
  console.log('\n📝 发送群消息...');
  const messageId = Math.floor(Math.random() * 10000000);
  const { data: msgData, error: msgError } = await supabase
    .from('messages')
    .insert({
      id: messageId,
      from_user: user1,
      to_user: `group:${groupId}`,
      content: '测试群消息',
      timestamp: Date.now(),
      type: 'group'
    })
    .select();

  if (msgError) {
    console.log('❌ 发送消息失败:', msgError.message);
  } else {
    console.log('✅ 消息发送成功:', msgData);
  }

  // 检查user2能否收到消息 - 方法1: 通过group_members表
  console.log('\n📝 检查user2的群组 (通过group_members表)...');
  const { data: user2Groups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('username', user2);
  
  const groupIds = (user2Groups || []).map(g => `group:${g.group_id}`);
  console.log('user2所在的群组:', groupIds);

  // 检查消息
  console.log('\n📝 检查user2收到的群消息...');
  if (groupIds.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .in('to_user', groupIds);
    console.log('✅ user2收到的群消息:', messages);
  }

  // 清理
  console.log('\n🗑️  清理测试数据...');
  await supabase.from('messages').delete().eq('id', messageId);
  await supabase.from('group_members').delete().eq('group_id', groupId);
  await supabase.from('groups').delete().eq('group_id', groupId);
  await supabase.from('users').delete().in('username', [user1, user2]);
  console.log('✅ 完成');
}

testGroupMessage().catch(console.error);
