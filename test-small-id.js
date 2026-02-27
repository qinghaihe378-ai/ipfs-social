import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGroupWithSmallId() {
  console.log('🧪 测试使用小ID创建群组...\n');

  // 创建测试用户
  const user1 = `test_small_1_${Date.now()}`;
  const user2 = `test_small_2_${Date.now()}`;

  console.log('📝 创建测试用户...');
  await supabase.from('users').insert([
    { username: user1, nickname: '测试用户1', public_key: 'key1' },
    { username: user2, nickname: '测试用户2', public_key: 'key2' }
  ]);

  // 使用小的ID
  const groupId = Math.floor(Math.random() * 1000000);
  console.log(`\n📝 创建群组，ID: ${groupId}...`);
  
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      id: groupId,
      group_id: groupId.toString(),
      name: '测试群组',
      creator: user1
    })
    .select()
    .single();

  if (groupError) {
    console.log('❌ 创建群组失败:', groupError.message);
    console.log('错误详情:', groupError);
  } else {
    console.log('✅ 群组创建成功:', group);
  }

  // 添加群组成员
  console.log('\n📝 添加群组成员...');
  const { error: memberError1 } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupId.toString(), username: user1 },
      { group_id: groupId.toString(), username: user2 }
    ]);

  if (memberError1) {
    console.log('❌ 添加成员失败:', memberError1.message);
  } else {
    console.log('✅ 成员添加成功');
  }

  // 查询user2的群组
  console.log('\n📝 查询user2的群组...');
  const { data: userGroups, error: queryError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('username', user2);

  if (queryError) {
    console.log('❌ 查询群组失败:', queryError.message);
  } else {
    console.log(`✅ user2加入了${userGroups.length}个群组`);
    console.log('群组ID:', userGroups);
  }

  // 发送群消息（使用小的消息ID）
  const msgId = Math.floor(Math.random() * 1000000);
  console.log(`\n📝 发送群消息，ID: ${msgId}...`);
  const { data: msg, error: msgError } = await supabase
    .from('messages')
    .insert({
      id: msgId,
      from_user: user1,
      to_user: `group:${groupId}`,
      content: '测试群消息',
      type: 'group',
      timestamp: Date.now()
    })
    .select()
    .single();

  if (msgError) {
    console.log('❌ 发送群消息失败:', msgError.message);
  } else {
    console.log('✅ 群消息发送成功:', msg);
  }

  // 查询群消息
  console.log('\n📝 查询群消息...');
  const { data: groupMsgs, error: msgQueryError } = await supabase
    .from('messages')
    .select('*')
    .eq('to_user', `group:${groupId}`);

  if (msgQueryError) {
    console.log('❌ 查询群消息失败:', msgQueryError.message);
  } else {
    console.log(`✅ 查询到${groupMsgs.length}条群消息`);
    console.log('消息:', groupMsgs);
  }

  // 清理
  console.log('\n🗑️  清理测试数据...');
  await supabase.from('messages').delete().eq('id', msgId);
  await supabase.from('group_members').delete().eq('group_id', groupId.toString());
  await supabase.from('groups').delete().eq('id', groupId);
  await supabase.from('users').delete().in('username', [user1, user2]);
  console.log('✅ 完成');
}

testGroupWithSmallId().catch(console.error);
