#!/bin/bash

# 低维社交服务器部署脚本

echo "🚀 开始部署低维社交服务器..."

# 检查是否在 server 目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 server 目录下运行此脚本"
    exit 1
fi

# 初始化 git（如果没有）
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git add .
    git commit -m "Initial commit"
fi

echo ""
echo "✅ 本地准备完成！"
echo ""
echo "下一步："
echo "1. 在 GitHub 创建新仓库（例如：low-dim-social-server）"
echo "2. 运行以下命令推送代码："
echo ""
echo "   git remote add origin https://github.com/你的用户名/low-dim-social-server.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. 在 Railway 创建新项目并连接 GitHub 仓库"
echo "4. 复制 Railway 分配的域名"
echo "5. 修改小程序代码中的服务器地址"
echo ""
echo "详细步骤请参考 RAILWAY_DEPLOY.md"
