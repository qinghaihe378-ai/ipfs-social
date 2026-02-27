const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复所有问题...\n');

// 读取App.jsx
const appPath = path.join(__dirname, 'src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// 修复1: 通讯录点击好友进入资料页（像微信一样）
console.log('📝 修复1: 通讯录点击行为...');
const oldContactItem = `                        {friendsList.map(friend => (
                          <div 
                            key={friend.username} 
                            className="contact-item"
                          >
                            <div 
                              className="contact-avatar"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFriend(friend);
                                setShowFriendProfile(true);
                              }}
                            >
                              {getInitial(friend.username)}
                            </div>
                            <div 
                              className="contact-info"
                              onClick={() => { setSelectedChat(friend.username); setActiveTab('messages'); }}
                            >
                              <div className="contact-name">{friend.username}</div>
                            </div>
                          </div>
                        ))}`;

const newContactItem = `                        {friendsList.map(friend => (
                          <div 
                            key={friend.username} 
                            className="contact-item"
                            onClick={() => {
                              setSelectedFriend(friend);
                              setShowFriendProfile(true);
                            }}
                          >
                            <div className="contact-avatar">
                              {getInitial(friend.username)}
                            </div>
                            <div className="contact-info">
                              <div className="contact-name">{friend.username}</div>
                            </div>
                          </div>
                        ))`;

if (appContent.includes(oldContactItem)) {
  appContent = appContent.replace(oldContactItem, newContactItem);
  console.log('✅ 修复1完成');
} else {
  console.log('⚠️  修复1: 未找到目标代码');
}

// 保存修改
fs.writeFileSync(appPath, appContent, 'utf8');
console.log('\n✅ App.jsx修复完成');

// 读取server.js
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// 修复2: 消息订阅需要检查群消息
console.log('\n📝 修复2: 消息订阅检查群消息...');
const oldSubscribe = `      if (supabase) {
        const { data: msgData } = await supabase
          .from('messages')
          .select('id')
          .eq('to_user', username);
        newMessages = msgData || [];
      } else {
        newMessages = messages.get(username) || [];
      }`;

const newSubscribe = `      if (supabase) {
        // 获取用户所在的所有群组
        const { data: userGroups } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('username', username);
        
        const groupIds = (userGroups || []).map(g => \`group:\${g.group_id}\`);
        
        // 查询私聊消息
        let query = supabase
          .from('messages')
          .select('id')
          .eq('to_user', username);
        
        // 如果有群组，也查询群消息
        if (groupIds.length > 0) {
          const { data: groupMsgs } = await supabase
            .from('messages')
            .select('id')
            .in('to_user', groupIds);
          newMessages = [...(msgData || []), ...(groupMsgs || [])];
        } else {
          const { data: msgData } = await query;
          newMessages = msgData || [];
        }
      } else {
        newMessages = messages.get(username) || [];
      }`;

if (serverContent.includes(oldSubscribe)) {
  serverContent = serverContent.replace(oldSubscribe, newSubscribe);
  console.log('✅ 修复2完成');
} else {
  console.log('⚠️  修复2: 未找到目标代码');
}

// 保存修改
fs.writeFileSync(serverPath, serverContent, 'utf8');
console.log('\n✅ server.js修复完成');

console.log('\n🎉 所有修复完成！');
console.log('请重启服务器测试功能。');
