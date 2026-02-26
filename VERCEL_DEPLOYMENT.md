# Vercel部署指南（网页界面）

## 步骤1：访问Vercel官网
- 打开浏览器，访问 https://vercel.com
- 点击右上角的 "Sign Up" 或 "Log In"

## 步骤2：使用GitHub账号登录
- 选择 "Continue with GitHub"
- 授权Vercel访问您的GitHub账号

## 步骤3：创建新项目
- 登录后，点击顶部导航栏的 "Add New..." → "Project"
- 在 "Import Git Repository" 页面，搜索您的仓库 `qinghaihe378-ai/ipfs-social`
- 找到仓库后，点击 "Import" 按钮

## 步骤4：配置项目
- 在配置页面，保持默认设置
- 点击 "Deploy" 按钮
- 等待部署完成（大约1-3分钟）

## 步骤5：获取部署URL
- 部署完成后，您会看到一个URL，例如：`https://ipfs-social.vercel.app`
- 复制这个URL

## 步骤6：更新前端API地址
- 回到您的项目目录
- 编辑 `.env` 文件
- 将 `VITE_API_URL` 设置为您的部署URL，例如：
  ```
  VITE_API_URL=https://ipfs-social.vercel.app/api
  ```
- 保存文件

## 步骤7：重新构建应用
1. **构建前端**：
   ```bash
   npm run build
   ```

2. **同步到Android**：
   ```bash
   npx cap sync android
   ```

3. **构建APK**：
   ```bash
   cd android && ./gradlew assembleDebug
   ```

## 步骤8：测试应用
- 安装APK到手机
- 打开应用
- 测试聊天功能
- 验证全球访问

## 注意事项
- Vercel的免费套餐每月有100GB的带宽限制
- 部署完成后，您可以在Vercel控制台查看项目状态
- 如果遇到部署问题，请检查Vercel日志

## 故障排除
- **部署失败**：检查项目的构建配置和依赖
- **API连接失败**：确保API地址正确，并且Vercel应用正在运行
- **消息发送失败**：检查网络连接和服务器状态

通过以上步骤，您的应用将部署到Vercel云服务器，实现全球访问和好友聊天功能。