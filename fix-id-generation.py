#!/usr/bin/env python3

print('🔧 修复ID生成逻辑...\n')

with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复群组ID生成
old_group_id = 'const groupId = Date.now().toString();'
new_group_id = 'const groupId = Math.floor(Math.random() * 10000000).toString();'
content = content.replace(old_group_id, new_group_id)

# 修复群组插入时的ID
old_group_insert = '''          const { data: savedGroup, error: dbError } = await supabase
            .from('groups')
            .insert({
              id: parseInt(groupId),
              group_id: groupId,
              name: groupName,
              creator: creator
            })'''

new_group_insert = '''          const { data: savedGroup, error: dbError } = await supabase
            .from('groups')
            .insert({
              id: parseInt(groupId),
              group_id: groupId,
              name: groupName,
              creator: creator
            })'''

# 修复消息ID生成（在send-group-message中）
old_msg_id = 'const message = {\n      id: Date.now().toString(),'
new_msg_id = 'const message = {\n      id: Math.floor(Math.random() * 10000000),'
content = content.replace(old_msg_id, new_msg_id)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ ID生成逻辑修复完成')
