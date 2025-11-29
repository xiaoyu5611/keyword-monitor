#!/bin/bash

# 关键词监控系统 - 停止脚本
# ===================================

echo "🛑 正在停止关键词监控系统..."

# 查找并终止Node.js进程
pkill -f "node.*server.js"

if [ $? -eq 0 ]; then
    echo "✅ 服务已停止"
else
    echo "ℹ️  未找到运行中的服务"
fi



