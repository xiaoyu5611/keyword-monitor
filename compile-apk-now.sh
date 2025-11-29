#!/bin/bash
set -e

echo "======================================"
echo "Android APK 编译脚本"
echo "======================================"

# 设置环境变量
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0

# 进入项目目录
cd /www/wwwroot/keyword-monitor/android

echo "检查Java版本..."
$JAVA_HOME/bin/java -version

echo ""
echo "检查Android SDK..."
ls -la $ANDROID_HOME/

echo ""
echo "清理旧的构建..."
rm -rf app/build
rm -rf .gradle
rm -rf build

echo ""
echo "开始编译APK..."
chmod +x gradlew
./gradlew clean assembleDebug --no-daemon --stacktrace --info

echo ""
echo "======================================"
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ 编译成功！"
    echo "APK路径: /www/wwwroot/keyword-monitor/android/app/build/outputs/apk/debug/app-debug.apk"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
    
    # 复制到根目录方便下载
    cp app/build/outputs/apk/debug/app-debug.apk /www/wwwroot/keyword-monitor/关键词监控.apk
    echo "已复制到: /www/wwwroot/keyword-monitor/关键词监控.apk"
else
    echo "❌ 编译失败，未找到APK文件"
    exit 1
fi
echo "======================================"









