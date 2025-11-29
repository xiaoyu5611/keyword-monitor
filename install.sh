#!/bin/bash

# 关键词监控系统 - 安装脚本
# ===================================

echo "🔍 关键词监控系统 - 安装向导"
echo "================================"
echo ""

# 检测操作系统
OS="Unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
fi

echo "📌 检测到操作系统: $OS"
echo ""

# 检查Node.js
echo "🔍 检查Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js已安装: $NODE_VERSION"
else
    echo "❌ 未检测到Node.js"
    echo ""
    echo "请先安装Node.js (v14或更高版本):"
    echo "  Linux: sudo apt install nodejs npm"
    echo "  macOS: brew install node"
    echo "  或访问: https://nodejs.org/"
    exit 1
fi

# 检查npm
echo "🔍 检查npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm已安装: $NPM_VERSION"
else
    echo "❌ 未检测到npm"
    exit 1
fi

# 安装后端依赖
echo ""
echo "📦 安装后端依赖..."
cd "$(dirname "$0")/backend" || exit 1

npm install
if [ $? -eq 0 ]; then
    echo "✅ 后端依赖安装完成"
else
    echo "❌ 后端依赖安装失败"
    exit 1
fi

# 返回根目录
cd ..

# 赋予启动脚本执行权限
chmod +x start.sh
chmod +x stop.sh

echo ""
echo "================================"
echo "✅ 安装完成！"
echo "================================"
echo ""
echo "🚀 快速开始："
echo "   ./start.sh    # 启动服务"
echo "   ./stop.sh     # 停止服务"
echo ""
echo "📱 Android应用编译："
echo "   1. 使用Android Studio打开 android/ 目录"
echo "   2. 编译并生成APK"
echo "   3. 安装到手机"
echo ""
echo "📖 详细文档请查看 README.md"
echo ""









