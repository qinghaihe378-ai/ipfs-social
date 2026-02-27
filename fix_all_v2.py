#!/usr/bin/env python3
import re

print('🔧 开始修复所有问题...\n')

# 修复1: 通讯录点击好友进入资料页
print('📝 修复1: 通讯录点击行为...')
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到需要修改的行并替换
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # 检查是否是contact-item的开始
    if 'className="contact-item"' in line and i > 0 and 'friendsList.map' in lines[i-1]:
        # 找到整个contact-item块
        indent = '                          '
        new_lines.append(f'{indent}<div \n')
        new_lines.append(f'{indent}  key={{friend.username}} \n')
        new_lines.append(f'{indent}  className="contact-item"\n')
        new_lines.append(f'{indent}  onClick={{() => {{\n')
        new_lines.append(f'{indent}    setSelectedFriend(friend);\n')
        new_lines.append(f'{indent}    setShowFriendProfile(true);\n')
        new_lines.append(f'{indent}  }}}}\n')
        new_lines.append(f'{indent}}>\n')
        
        # 跳过原来的div开始标签
        i += 1
        # 跳过key行
        i += 1
        # 跳过className行
        i += 1
        # 跳过>
        i += 1
        
        # 添加avatar
        new_lines.append(f'{indent}<div className="contact-avatar">\n')
        new_lines.append(f'{indent}  {{getInitial(friend.username)}}\n')
        new_lines.append(f'{indent}</div>\n')
        
        # 跳过原来的avatar块（6行）
        i += 6
        
        # 添加info
        new_lines.append(f'{indent}<div className="contact-info">\n')
        new_lines.append(f'{indent}  <div className="contact-name">{{friend.username}}</div>\n')
        new_lines.append(f'{indent}</div>\n')
        
        # 跳过原来的info块（5行）
        i += 5
        
        # 添加closing div
        new_lines.append(f'{indent}</div>\n')
        
        # 跳过原来的closing div
        i += 1
    else:
        new_lines.append(line)
        i += 1

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('✅ 修复1完成')

# 修复2: 消息订阅检查群消息
print('\n📝 修复2: 消息订阅检查群消息...')
with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 简单替换
old_code = '''      if (supabase) {
        const { data: msgData } = await supabase
          .from('messages')
          .select('id')
          .eq('to_user', username);
        newMessages = msgData || [];
      }'''

new_code = '''      if (supabase) {
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

content = content.replace(old_code, new_code)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 修复2完成')

print('\n🎉 所有修复完成！')
