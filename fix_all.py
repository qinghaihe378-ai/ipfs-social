#!/usr/bin/env python3
import re

print('🔧 开始修复所有问题...\n')

# 修复1: 通讯录点击好友进入资料页
print('📝 修复1: 通讯录点击行为...')
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换通讯录点击行为
old_pattern = r'''                        \{friendsList\.map\(friend => \(
                          <div 
                            key=\{friend\.username\} 
                            className="contact-item"
                          >
                            <div 
                              className="contact-avatar"
                              onClick=\{\(e\) => \{
                                e\.stopPropagation\(\);
                                setSelectedFriend\(friend\);
                                setShowFriendProfile\(true\);
                              \}\}
                            >
                              \{getInitial\(friend\.username\)\}
                            </div>
                            <div 
                              className="contact-info"
                              onClick=\{\(\) => \{ setSelectedChat\(friend\.username\); setActiveTab\('messages'\); \}\}
                            >
                              <div className="contact-name">\{friend\.username\}</div>
                            </div>
                          </div>
                        \)\)\}'''

new_pattern = '''                        {friendsList.map(friend => (
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
                        ))}'''

content = re.sub(old_pattern, new_pattern, content, flags=re.DOTALL)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('✅ 修复1完成')

# 修复2: 消息订阅检查群消息
print('\n📝 修复2: 消息订阅检查群消息...')
with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_msg_pattern = r'''      if \(supabase\) \{
        const \{ data: msgData \} = await supabase
          \.from\('messages'\)
          \.select\('id'\)
          \.eq\('to_user', username\);
        newMessages = msgData \|\| \[\];
      \}'''

new_msg_pattern = '''      if (supabase) {
        // 获取用户所在的所有群组
        const { data: userGroups } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('username', username);
        
        const groupIds = (userGroups || []).map(g => `group:${g.group_id}`);
        
        // 查询私聊消息
        const { data: privateMsgs } = await supabase
          .from('messages')
          .select('id')
          .eq('to_user', username);
        
        // 查询群消息
        let groupMsgs = [];
        if (groupIds.length > 0) {
          const { data } = await supabase
            .from('messages')
            .select('id')
            .in('to_user', groupIds);
          groupMsgs = data || [];
        }
        
        newMessages = [...(privateMsgs || []), ...groupMsgs];
      }'''

content = re.sub(old_msg_pattern, new_msg_pattern, content, flags=re.DOTALL)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('✅ 修复2完成')

print('\n🎉 所有修复完成！')
