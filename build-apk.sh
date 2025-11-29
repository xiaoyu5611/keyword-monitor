#!/bin/bash

echo "========================================" 
echo "开始编译Android APK"
echo "========================================"

# 设置环境变量
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo "Java版本:"
java -version

echo ""
echo "Android SDK位置: $ANDROID_HOME"

cd /www/wwwroot/keyword-monitor/android

echo ""
echo "开始下载Gradle..."
./gradlew --version

echo ""
echo "开始编译APK..."
./gradlew assembleDebug --stacktrace

if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "========================================"
    echo "✅ APK编译成功！"
    echo "========================================"
    echo "APK位置: /www/wwwroot/keyword-monitor/android/app/build/outputs/apk/debug/app-debug.apk"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
else
    echo ""
    echo "❌ APK编译失败"
    exit 1
fi









