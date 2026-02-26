#!/bin/bash

# 部署脚本 - 帮助用户部署到云端

echo "==============================================="
echo "IPFS 社交应用部署脚本"
echo "==============================================="

echo "\n1. 检查当前目录..."
if [ ! -f "package.json" ]; then
  echo "错误: 请在项目根目录运行此脚本"
  exit 1
fi

echo "\n2. 安装依赖..."
npm install

if [ $? -ne 0 ]; then
  echo "错误: 安装依赖失败"
  exit 1
fi

echo "\n3. 构建前端..."
npm run build

if [ $? -ne 0 ]; then
  echo "错误: 构建前端失败"
  exit 1
fi

echo "\n4. 检查 API 目录..."
if [ ! -d "api" ]; then
  echo "错误: API 目录不存在"
  exit 1
fi

echo "\n5. 安装 API 依赖..."
cd api && npm install && cd ..

if [ $? -ne 0 ]; then
  echo "错误: 安装 API 依赖失败"
  exit 1
fi

echo "\n==============================================="
echo "部署准备完成！"
echo "==============================================="
echo "\n下一步：将项目部署到云端"
echo "\n推荐平台："
echo "1. Vercel (推荐)"
echo "   - 访问 https://vercel.com"
echo "   - 注册/登录账号"
echo "   - 点击 'New Project'"
echo "   - 选择您的 GitHub 仓库"
echo "   - 按照提示完成部署"
echo "\n2. Render"
echo "   - 访问 https://render.com"
echo "   - 注册/登录账号"
echo "   - 点击 'New' → 'Web Service'"
echo "   - 连接您的 GitHub 仓库"
echo "   - 设置 'Start Command' 为: node api/server.js"
echo "   - 点击 'Create Web Service'"
echo "\n3. Railway"
echo "   - 访问 https://railway.app"
echo "   - 注册/登录账号"
echo "   - 点击 'New Project'"
echo "   - 选择 'GitHub Repo'"
echo "   - 连接您的仓库并部署"
echo "\n==============================================="
echo "部署完成后："
echo "1. 获取部署后的 URL (例如: https://your-app-name.vercel.app)"
echo "2. 更新前端 API 地址:"
echo "   - 创建 .env 文件: VITE_API_URL=https://your-app-name.vercel.app/api"
echo "   - 或修改 src/App.jsx 中的 API_BASE"
echo "3. 重新构建 Android 应用:"
echo "   - npm run build"
echo "   - npx cap sync android"
echo "   - 在 Android Studio 中构建 APK"
echo "==============================================="