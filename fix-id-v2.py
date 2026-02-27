#!/usr/bin/env python3

print('🔧 修复ID生成逻辑...\n')

with open('server.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # 修复群组ID生成
    if 'const groupId = Date.now().toString();' in line:
        indent = '    '
        new_lines.append(f'{indent}const groupId = Math.floor(Math.random() * 10000000).toString();\n')
        print(f'✅ 修复群组ID生成（行{i+1}）')
    # 修复消息ID生成
    elif 'id: Date.now().toString(),' in line and 'message' in ''.join(lines[max(0,i-5):i]):
        indent = '      '
        new_lines.append(f'{indent}id: Math.floor(Math.random() * 10000000),\n')
        print(f'✅ 修复消息ID生成（行{i+1}）')
    else:
        new_lines.append(line)

with open('server.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('\n✅ ID生成逻辑修复完成')
