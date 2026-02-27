const API_BASE = 'http://localhost:3001';

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 开始测试...\n');

  const testUser1 = `test_user_${Date.now()}`;
  const testUser2 = `test_user_${Date.now() + 1}`;

  // 测试1: 健康检查
  console.log('📋 测试1: 健康检查');
  const health = await testAPI('/api/health');
  console.log(health.success ? '✅ 通过' : '❌ 失败', health.data?.status || health.error);

  // 测试2: 用户注册
  console.log('\n📋 测试2: 用户注册');
  const register1 = await testAPI('/api/profile', 'POST', {
    username: testUser1,
    bio: '测试用户',
    avatar: '',
    publicKey: 'test_public_key_1'
  });
  console.log(register1.success ? '✅ 通过' : '❌ 失败', register1.data?.success ? '用户创建成功' : register1.data?.error || register1.error);

  const register2 = await testAPI('/api/profile', 'POST', {
    username: testUser2,
    bio: '测试用户2',
    avatar: '',
    publicKey: 'test_public_key_2'
  });
  console.log(register2.success ? '✅ 通过' : '❌ 失败', register2.data?.success ? '用户2创建成功' : register2.data?.error || register2.error);

  // 测试3: 检查用户名是否存在
  console.log('\n📋 测试3: 检查用户名');
  const checkExists = await testAPI('/api/check-username', 'POST', { username: testUser1 });
  console.log(checkExists.success ? '✅ 通过' : '❌ 失败', checkExists.data?.exists ? '用户存在' : '用户不存在');

  // 测试4: 发送好友请求
  console.log('\n📋 测试4: 发送好友请求');
  const friendRequest = await testAPI('/api/send-friend-request', 'POST', {
    from: testUser1,
    to: testUser2,
    message: '你好，加个好友吧'
  });
  console.log(friendRequest.success ? '✅ 通过' : '❌ 失败', friendRequest.data?.success ? '好友请求发送成功' : friendRequest.data?.error || friendRequest.error);

  // 测试5: 获取好友请求
  console.log('\n📋 测试5: 获取好友请求');
  const getRequests = await testAPI(`/api/friend-requests/${testUser2}`);
  console.log(getRequests.success ? '✅ 通过' : '❌ 失败', getRequests.data?.requests?.length > 0 ? `收到${getRequests.data.requests.length}个请求` : '没有请求');

  // 测试6: 接受好友请求
  console.log('\n📋 测试6: 接受好友请求');
  if (getRequests.data?.requests?.[0]) {
    const acceptRequest = await testAPI('/api/respond-friend-request', 'POST', {
      requestId: getRequests.data.requests[0].id,
      username: testUser2,
      action: 'accept'
    });
    console.log(acceptRequest.success ? '✅ 通过' : '❌ 失败', acceptRequest.data?.success ? '好友请求接受成功' : acceptRequest.data?.error || acceptRequest.error);
  }

  // 测试7: 获取好友列表
  console.log('\n📋 测试7: 获取好友列表');
  const getFriends1 = await testAPI(`/api/friends/${testUser1}`);
  const getFriends2 = await testAPI(`/api/friends/${testUser2}`);
  console.log(getFriends1.success ? '✅ 通过' : '❌ 失败', getFriends1.data?.friends?.length > 0 ? `${testUser1}有${getFriends1.data.friends.length}个好友` : '没有好友');
  console.log(getFriends2.success ? '✅ 通过' : '❌ 失败', getFriends2.data?.friends?.length > 0 ? `${testUser2}有${getFriends2.data.friends.length}个好友` : '没有好友');

  // 测试8: 创建群组
  console.log('\n📋 测试8: 创建群组');
  const createGroup = await testAPI('/api/create-group', 'POST', {
    groupName: '测试群组',
    creator: testUser1,
    members: [testUser1, testUser2]
  });
  console.log(createGroup.success ? '✅ 通过' : '❌ 失败', createGroup.data?.success ? '群组创建成功' : createGroup.data?.error || createGroup.error);

  // 测试9: 获取群组列表
  console.log('\n📋 测试9: 获取群组列表');
  const getGroups = await testAPI(`/api/groups/${testUser1}`);
  console.log(getGroups.success ? '✅ 通过' : '❌ 失败', getGroups.data?.groups?.length > 0 ? `有${getGroups.data.groups.length}个群组` : '没有群组');

  // 测试10: 发送消息
  console.log('\n📋 测试10: 发送消息');
  const sendMessage = await testAPI('/api/send-message', 'POST', {
    from: testUser1,
    to: testUser2,
    content: '测试消息',
    timestamp: Date.now()
  });
  console.log(sendMessage.success ? '✅ 通过' : '❌ 失败', sendMessage.data?.success ? '消息发送成功' : sendMessage.data?.error || sendMessage.error);

  // 测试11: 获取消息
  console.log('\n📋 测试11: 获取离线消息');
  const getMessages = await testAPI(`/api/offline-messages/${testUser2}`);
  console.log(getMessages.success ? '✅ 通过' : '❌ 失败', getMessages.data?.messages?.length > 0 ? `有${getMessages.data.messages.length}条消息` : '没有消息');

  console.log('\n✨ 测试完成！');
}

runTests().catch(console.error);