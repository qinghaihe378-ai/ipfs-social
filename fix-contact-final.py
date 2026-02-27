#!/usr/bin/env python3

print('🔧 修复通讯录代码...\n')

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到并替换contact-item部分
old_text = '''                        {friendsList.map(friend => (
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
                        ))}'''

new_text = '''                        {friendsList.map(friend => (
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

if old_text in content:
    content = content.replace(old_text, new_text)
    print('✅ 找到并替换成功')
else:
    print('❌ 未找到目标代码，尝试其他方式...')
    # 尝试查找并修复
    import re
    pattern = r'\{friendsList\.map\(friend => \([\s\S]*?\)\)\}'
    
print('\n保存文件...')
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 完成')
