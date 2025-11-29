#!/usr/bin/env python3
import os
import subprocess
import sys

print("=" * 60)
print("Android APK 自动编译脚本")
print("=" * 60)

# 设置环境变量
os.environ['JAVA_HOME'] = '/usr/lib/jvm/java-17-openjdk-amd64'
os.environ['ANDROID_HOME'] = '/opt/android-sdk'
os.environ['PATH'] = f"{os.environ['PATH']}:{os.environ['ANDROID_HOME']}/cmdline-tools/latest/bin:{os.environ['ANDROID_HOME']}/platform-tools"

# 进入项目目录
os.chdir('/www/wwwroot/keyword-monitor/android')

print("\n1. 检查Java版本...")
try:
    result = subprocess.run(['java', '-version'], capture_output=True, text=True)
    print(result.stderr[:200])
except Exception as e:
    print(f"错误: {e}")

print("\n2. 清理旧的构建...")
subprocess.run(['rm', '-rf', 'app/build', '.gradle', 'build'], capture_output=True)

print("\n3. 确保gradlew可执行...")
subprocess.run(['chmod', '+x', 'gradlew'], capture_output=True)

print("\n4. 开始编译APK...")
print("这可能需要几分钟时间，请耐心等待...\n")

try:
    process = subprocess.Popen(
        ['./gradlew', 'assembleDebug', '--no-daemon', '--stacktrace'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    for line in process.stdout:
        print(line, end='')
    
    process.wait()
    
    if process.returncode == 0:
        print("\n" + "=" * 60)
        print("✅ 编译成功！")
        print("=" * 60)
        
        apk_path = 'app/build/outputs/apk/debug/app-debug.apk'
        if os.path.exists(apk_path):
            # 复制APK到根目录
            subprocess.run([
                'cp', apk_path, 
                '/www/wwwroot/keyword-monitor/关键词监控.apk'
            ])
            
            # 获取文件大小
            size = os.path.getsize(apk_path)
            print(f"\nAPK文件大小: {size / 1024 / 1024:.2f} MB")
            print(f"APK位置: {apk_path}")
            print(f"已复制到: /www/wwwroot/keyword-monitor/关键词监控.apk")
            print("\n可以下载APK并安装到手机上！")
        else:
            print("❌ APK文件未找到")
            sys.exit(1)
    else:
        print(f"\n❌ 编译失败，退出代码: {process.returncode}")
        sys.exit(1)
        
except Exception as e:
    print(f"\n❌ 编译过程出错: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("=" * 60)









