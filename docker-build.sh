#!/bin/bash

echo "使用Docker编译Android APK..."

cd /www/wwwroot/keyword-monitor

# 构建Docker镜像
docker build -t keyword-monitor-builder .

# 运行容器并编译
docker run --rm -v $(pwd):/output keyword-monitor-builder

echo "编译完成！APK位置: /www/wwwroot/keyword-monitor/关键词监控.apk"



