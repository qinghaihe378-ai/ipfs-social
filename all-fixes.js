// 快速修复所有问题的完整代码

// 问题1: 通讯录点击好友应该进入资料页
// 位置: App.jsx 第1260-1280行
// 修复: 整个contact-item点击进入资料页

const fix1 = `
                        {friendsList.map(friend => (
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
                        ))}
`;

// 问题2: 消息订阅需要检查群消息
// 位置: server.js 第240-245行
// 修复: 同时检查私聊和群消息

const fix2 = `
      if (supabase) {
        // 获取用户所在的所有群组
        const { data: userGroups } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('username', username);
        
        const groupIds = (userGroups || []).map(g => \`group:\${g.group_id}\`);
        
        // 查询私聊消息和群消息
        let query = supabase
          .from('messages')
          .select('id')
          .eq('to_user', username);
        
        if (groupIds.length > 0) {
          query = query.or(\`to_user.in.(\${groupIds.join(',')})\`);
        }
        
        const { data: msgData } = await query;
        newMessages = msgData || [];
      }
`;

console.log('修复代码已准备好');
console.log('修复1:', fix1);
console.log('修复2:', fix2);
