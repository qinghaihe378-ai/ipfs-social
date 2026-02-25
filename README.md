# IPFS 社交网络

基于 IPFS 和 PubSub 的去中心化社交网络，类似于 Twitter/X。

## 功能特性

- ✅ 去中心化数据存储（IPFS）
- ✅ 实时消息传递（PubSub）
- ✅ 用户身份管理（密钥对）
- ✅ 推文发布和订阅
- ✅ 用户资料管理
- ✅ 响应式设计

## 技术栈

- **前端**: React + Vite
- **后端**: Node.js + Express
- **存储**: IPFS（内容寻址存储）
- **实时通信**: IPFS PubSub

## 前置要求

1. 安装 [IPFS](https://ipfs.io/)
2. 启动 IPFS 守护进程：
   ```bash
   ipfs daemon
   ```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端服务器

在第一个终端：
```bash
npm run server
```

服务器将在 `http://localhost:3001` 运行

### 3. 启动前端开发服务器

在第二个终端：
```bash
npm run dev
```

前端将在 `http://localhost:5173` 运行

## 使用说明

### 创建用户资料

1. 在左侧边栏输入用户名
2. 点击"创建资料"按钮
3. 系统会自动生成公钥/私钥对
4. 用户资料将存储在 IPFS 上

### 发布推文

1. 在文本框中输入推文内容（最多 280 字符）
2. 点击"发布推文"按钮
3. 推文将存储在 IPFS 并通过 PubSub 广播

### 查看时间线

- 所有通过 PubSub 发布的推文会实时显示在时间线上
- 推文包含作者、时间戳和 IPFS CID

## API 端点

### 健康检查
```
GET /api/health
```

### 发布推文
```
POST /api/tweet
Content-Type: application/json

{
  "content": "推文内容",
  "author": "公钥",
  "username": "用户名",
  "timestamp": 1234567890
}
```

### 获取推文
```
GET /api/tweet/:cid
```

### 创建用户资料
```
POST /api/profile
Content-Type: application/json

{
  "username": "用户名",
  "bio": "个人简介",
  "avatar": "头像URL",
  "publicKey": "公钥"
}
```

### 获取用户资料
```
GET /api/profile/:cid
```

### 订阅推文（Server-Sent Events）
```
GET /api/subscribe?topic=social-tweets
```

## 项目结构

```
ipfs-social/
├── server.js          # Express 后端服务器
├── src/
│   ├── App.jsx        # 主应用组件
│   ├── App.css        # 应用样式
│   └── main.jsx       # 应用入口
├── package.json       # 项目配置
└── README.md          # 项目文档
```

## 去中心化特性

1. **数据所有权**: 所有数据存储在 IPFS，用户拥有完全控制权
2. **无中心服务器**: 没有中央数据库，数据分布在整个网络中
3. **内容寻址**: 通过 CID（内容标识符）访问数据，确保数据完整性
4. **实时通信**: 使用 IPFS PubSub 实现点对点消息传递

## 注意事项

- 确保在运行应用前启动 IPFS 守护进程
- IPFS PubSub 需要多个节点才能充分测试
- 当前实现使用本地 IPFS 节点，生产环境应使用公共 IPFS 网关或专用节点

## 未来改进

- [ ] 添加点赞和转发功能
- [ ] 实现用户关注系统
- [ ] 添加图片和视频支持
- [ ] 实现私信功能
- [ ] 添加内容审核机制
- [ ] 实现数据加密
- [ ] 添加搜索功能

## 许可证

MIT License
