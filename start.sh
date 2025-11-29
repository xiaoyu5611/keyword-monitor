#!/bin/bash

# 关键词监控系统 - 一键启动脚本
# ===================================

echo "🔍 关键词监控系统 - 启动中..."
echo "================================"
echo ""

# 检测Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 进入后端目录
cd "$(dirname "$0")/backend" || exit 1

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 首次运行，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
fi

# 获取本机IP地址
get_local_ip() {
    # Linux
    if command -v ip &> /dev/null; then
        ip route get 1 2>/dev/null | awk '{print $7}' | head -n1
    # macOS
    elif command -v ifconfig &> /dev/null; then
        ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1
    else
        echo "localhost"
    fi
}

LOCAL_IP=$(get_local_ip)

echo ""
echo "================================"
echo "🚀 服务器启动成功！"
echo "================================"
echo ""
echo "📊 管理后台访问地址："
echo "   本机访问: http://localhost:3000"
echo "   局域网访问: http://$LOCAL_IP:3000"
echo ""
echo "📱 Android应用服务器地址："
echo "   请在手机上输入: http://$LOCAL_IP:3000"
echo ""
echo "💡 提示："
echo "   1. 在浏览器打开管理后台"
echo "   2. 添加要监控的关键词"
echo "   3. 在手机上安装并配置Android应用"
echo "   4. 开始监控！"
echo ""
echo "按 Ctrl+C 停止服务"
echo "================================"
echo ""

# 启动服务器
npm start









