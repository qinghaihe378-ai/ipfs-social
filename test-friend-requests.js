import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bysvhqhpvkvlejsntgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3ZocWhwdmt2bGVqc250Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTg3MDgsImV4cCI6MjA4NzYzNDcwOH0.V9mtkwScomV7-2dbbfTDROt0SFXVPGC5HytPM5uktrU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFriendRequests() {
  console.log('🧪 测试好友请求表...\n');

  // 尝试插入测试记录
  const testRecord = {
    id: 'test_' + Date.now(),
    from_user: 'test_from',
    to_user: 'test_to',
    message: 'test message',
    status: 'pending',
    created_at: Date.now()
  };

  console.log('📝 插入测试记录...');
  const { data, error } = await supabase
    .from('friend_requests')
    .insert(testRecord)
    .select()
    .single();

  if (error) {
    console.log('❌ 插入失败:', error.message);
    console.log('错误详情:', error);
    
    // 尝试查询看看表结构
    console.log('\n🔍 查询表结构...');
    const { data: existingData, error: queryError } = await supabase
      .from('friend_requests')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.log('❌ 查询失败:', queryError.message);
    } else {
      console.log('✅ 表存在，记录数:', existingData.length);
      if (existingData.length > 0) {
        console.log('字段:', Object.keys(existingData[0]).join(', '));
      }
    }
  } else {
    console.log('✅ 插入成功！');
    console.log('记录:', data);
    console.log('字段:', Object.keys(data).join(', '));

    // 删除测试记录
    console.log('\n🗑️  删除测试记录...');
    await supabase
      .from('friend_requests')
      .delete()
      .eq('id', data.id);
    console.log('✅ 已删除');
  }
}

testFriendRequests().catch(console.error);