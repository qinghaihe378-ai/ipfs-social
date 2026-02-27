# 数据库设置指南

## 问题原因
好友功能不工作是因为数据库表 `friend_requests` 不存在。

## 解决方案

### 方法1: 在Supabase控制台执行SQL（推荐）

1. 登录 Supabase 控制台
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"
5. 复制 `database-schema.sql` 文件的内容
6. 粘贴到SQL编辑器中
7. 点击 "Run" 执行

### 方法2: 使用Supabase CLI

```bash
# 安装Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接到项目
supabase link --project-ref YOUR_PROJECT_REF

# 执行SQL
supabase db push
```

## 验证表是否创建成功

在Supabase控制台的 "Table Editor" 中，应该能看到以下表：
- users
- friend_requests
- friends
- messages
- groups
- tweets

## 测试API

执行完SQL后，运行测试脚本验证：

```bash
node test-api.js
```

所有测试应该都通过。

## 预防措施

为了避免以后出现类似问题：

1. **每次添加新功能前，先检查数据库表是否存在**
2. **不要静默捕获数据库错误，要抛出异常**
3. **添加自动化测试，覆盖所有API端点**
4. **修改代码后运行测试脚本验证**

## 当前状态

✅ 已修复：错误处理（现在会抛出异常而不是静默失败）
✅ 已创建：数据库表结构SQL脚本
⏳ 待执行：在Supabase中创建表
⏳ 待验证：运行测试脚本确认功能正常