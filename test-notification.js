const API_BASE = 'http://localhost:3001';

async function testFriendRequestNotification() {
  console.log('🧪 测试好友请求通知...\n');

  const testUser1 = `test_notify_1_${Date.now()}`;
  const testUser2 = `test_notify_2_${Date.now()}`;

  // 注册两个用户
  console.log('📝 注册用户1...');
  await fetch(`${API_BASE}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUser1,
      bio: '测试用户1',
      avatar: '',
      publicKey: 'key1'
    })
  });

  console.log('📝 注册用户2...');
  await fetch(`${API_BASE}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUser2,
      bio: '测试用户2',
      avatar: '',
      publicKey: 'key2'
    })
  });

  // 用户2订阅消息
  console.log('\n📡 用户2订阅消息...');
  const eventSource = new EventSource(`${API_BASE}/api/subscribe-messages/${testUser2}`);
  
  let receivedNotification = false;
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 收到通知:', data);
    
    if (data.type === 'friend_request') {
      receivedNotification = true;
      console.log('✅ 收到好友请求通知！');
    }
  };

  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 用户1发送好友请求
  console.log('\n📝 用户1发送好友请求给用户2...');
  const response = await fetch(`${API_BASE}/api/send-friend-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: testUser1,
      to: testUser2,
      message: '你好，加个好友吧'
    })
  });

  const result = await response.json();
  console.log('发送结果:', result.success ? '成功' : '失败', result);

  // 等待5秒看是否收到通知
  console.log('\n⏳ 等待通知...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  eventSource.close();

  if (receivedNotification) {
    console.log('\n✅ 测试通过！好友请求通知正常工作');
  } else {
    console.log('\n❌ 测试失败！没有收到好友请求通知');
  }

  // 清理测试数据
  console.log('\n🗑️  清理测试数据...');
  await fetch(`${API_BASE}/api/cleanup-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users: [testUser1, testUser2] })
  });

  console.log('✨ 测试完成');
}

testFriendRequestNotification().catch(console.error);