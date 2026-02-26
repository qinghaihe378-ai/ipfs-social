# 部署到云端指南

## 当前架构问题

**问题**：当前应用连接到本地服务器，如果电脑关机，手机上的应用就无法使用。

**解决方案**：将后端服务器部署到云端，这样即使电脑关机，应用也能正常工作。

## 部署步骤

### 1. 部署到 Vercel

#### 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 登录 Vercel
```bash
vercel login
```

#### 部署项目
```bash
vercel
```

按照提示操作：
1. 选择 "Link to existing project" 或 "Create new project"
2. 设置项目名称
3. 确认部署设置

#### 获取部署后的 URL
部署完成后，Vercel 会提供一个 URL，例如：
```
https://your-app-name.vercel.app
```

### 2. 配置环境变量

在 Vercel 项目设置中添加环境变量：
- `IPFS_URL`: IPFS 节点地址（可选，默认使用公共节点）

### 3. 更新前端 API 地址

#### 方法 1：使用环境变量（推荐）
创建 `.env` 文件：
```
VITE_API_URL=https://your-app-name.vercel.app/api
```

#### 方法 2：直接修改代码
在 `src/App.jsx` 中修改：
```javascript
const API_BASE = 'https://your-app-name.vercel.app/api';
```

### 4. 重新构建 Android 应用

```bash
npm run build
npx cap sync android
```

然后在 Android Studio 中重新构建 APK。

## 注意事项

1. **IPFS 连接**：
   - 云端部署后，IPFS 连接可能需要配置公共节点
   - 或者使用 IPFS 网关服务

2. **Supabase 数据库**：
   - 项目已经使用 Supabase 作为云数据库
   - 用户数据和消息会持久化存储

3. **实时通信**：
   - IPFS PubSub 在云端可能不稳定
   - 可以考虑使用 WebSocket 或其他实时通信方案

## 替代方案

如果 Vercel 部署有问题，可以考虑：

### 1. 使用 Render
```bash
npm install -g render-cli
render deploy
```

### 2. 使用 Railway
```bash
npm install -g railway
railway login
railway init
railway up
```

### 3. 使用 Heroku
```bash
heroku create your-app-name
git push heroku main
```

## 本地开发

如果需要在本地开发，确保：
1. 启动本地服务器：`npm run server`
2. 前端会自动连接到 `http://localhost:3001`
3. 手机和电脑在同一 WiFi 网络中

## 总结

- **当前状态**：应用连接到本地服务器，电脑关机后无法使用
- **解决方案**：部署到云端服务器
- **推荐平台**：Vercel（免费、简单）
- **部署后**：应用可以全天候运行，不受电脑状态影响

部署完成后，即使您的电脑关机，手机上的应用也能正常使用所有功能！