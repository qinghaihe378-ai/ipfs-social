# 详细部署指南：使用Heroku网页界面

## 第一步：注册Heroku账号

1. 访问 https://www.heroku.com
2. 点击右上角的 "Sign up"
3. 填写邮箱、密码和公司名称（可选）
4. 点击 "Create free account"
5. 检查邮箱，点击验证链接

## 第二步：创建Heroku应用

1. 登录Heroku后，点击 "New" → "Create new app"
2. 输入应用名称（例如：`ipfs-social-app`）
3. 选择一个区域（推荐选择靠近您的地区）
4. 点击 "Create app"

## 第三步：连接GitHub仓库

1. 在应用页面，找到 "Deployment method" 部分
2. 点击 "GitHub"
3. 登录您的GitHub账号（如果需要）
4. 在 "Connect to GitHub" 部分，输入仓库名称：`qinghaihe378-ai/ipfs-social`
5. 点击 "Search"
6. 找到仓库后，点击 "Connect"

## 第四步：配置部署设置

1. 滚动到 "Automatic deploys" 部分
2. 选择分支：`main`
3. 勾选 "Wait for CI to pass before deploy"（可选）
4. 点击 "Enable Automatic Deploys"

## 第五步：手动部署

1. 滚动到 "Manual deploy" 部分
2. 选择分支：`main`
3. 点击 "Deploy Branch"
4. 等待部署完成（这可能需要几分钟）

## 第六步：获取部署URL

1. 部署完成后，点击 "View"
2. 您将看到应用的URL，例如：`https://ipfs-social-app.herokuapp.com`
3. 复制这个URL

## 第七步：更新前端API地址

1. 回到您的项目目录
2. 创建 `.env` 文件：
   ```bash
   echo "VITE_API_URL=https://ipfs-social-app.herokuapp.com/api" > .env
   ```

## 第八步：重新构建Android应用

1. 构建前端：
   ```bash
   npm run build
   ```

2. 同步到Android：
   ```bash
   npx cap sync android
   ```

3. 在Android Studio中构建APK：
   - 打开Android Studio
   - 等待Gradle同步完成
   - 点击 "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"

## 第九步：测试应用

1. 安装新的APK到手机
2. 打开应用
3. 测试聊天功能
4. 即使您的电脑关机，应用也应该能正常工作

## 故障排除

### 问题1：部署失败
- 检查Heroku日志：在应用页面点击 "More" → "View logs"
- 确保所有依赖都已正确安装

### 问题2：API连接失败
- 检查API URL是否正确
- 确保Heroku应用正在运行
- 检查网络连接

### 问题3：IPFS连接问题
- Heroku上的IPFS连接可能不稳定
- 您可以尝试使用公共IPFS网关

## 总结

通过以上步骤，您的应用将：
- ✅ 部署到Heroku云服务器
- ✅ 全天候运行，不受电脑状态影响
- ✅ 支持多用户同时在线聊天
- ✅ 数据持久化存储在Supabase云数据库
- ✅ 可以在任何网络环境下使用

如果您在部署过程中遇到任何问题，请随时告诉我！