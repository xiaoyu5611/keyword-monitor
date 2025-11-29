# 📱 自己编译Android APK教程

## 方式一：使用 Android Studio（推荐，最简单）

### 1️⃣ 下载安装 Android Studio

**Windows/Mac/Linux:**
- 官网下载：https://developer.android.com/studio
- 或国内镜像：https://developer.android.google.cn/studio

### 2️⃣ 打开项目

1. 启动 Android Studio
2. 点击 `Open` 或 `Open an Existing Project`
3. 选择目录：`/www/wwwroot/keyword-monitor/android`
4. 等待 Gradle 自动同步（首次会自动下载依赖，需要几分钟）

### 3️⃣ 编译APK

**方法A - 使用菜单：**
1. 点击顶部菜单 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 等待编译完成（1-3分钟）
3. 看到通知 "APK(s) generated successfully"
4. 点击通知中的 `locate` 查看APK位置

**方法B - 使用快捷键：**
- Windows/Linux: `Ctrl + F9`
- Mac: `⌘ + F9`

**APK输出位置：**
```
/www/wwwroot/keyword-monitor/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 方式二：使用命令行（适合Linux/Mac）

### 前提条件

1. **安装 Java JDK 17**
   ```bash
   # Ubuntu/Debian
   sudo apt install openjdk-17-jdk
   
   # Mac
   brew install openjdk@17
   
   # Windows
   # 下载安装：https://adoptium.net/
   ```

2. **设置环境变量**
   ```bash
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # Linux
   # 或
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home  # Mac
   ```

### 编译步骤

```bash
# 1. 进入Android项目目录
cd /www/wwwroot/keyword-monitor/android

# 2. 给gradlew添加执行权限（仅Linux/Mac需要）
chmod +x gradlew

# 3. 清理旧构建（可选）
./gradlew clean

# 4. 编译Debug版APK
./gradlew assembleDebug

# 5. 编译完成后，APK位置
ls -lh app/build/outputs/apk/debug/app-debug.apk
```

**Windows用户使用：**
```cmd
cd C:\www\wwwroot\keyword-monitor\android
gradlew.bat assembleDebug
```

---

## 方式三：使用在线CI/CD服务（最省事）

### GitHub Actions（免费）

1. **将项目推送到GitHub**
   ```bash
   cd /www/wwwroot/keyword-monitor
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/keyword-monitor.git
   git push -u origin main
   ```

2. **GitHub自动编译**
   - 已经配置好了 `.github/workflows/build-apk.yml`
   - 推送代码后，GitHub会自动编译
   - 在 GitHub 项目页面 → Actions → 选择最新运行 → Artifacts → 下载 APK

---

## 常见问题

### ❌ 问题1：Gradle下载太慢

**解决方案A - 使用国内镜像：**

编辑 `android/build.gradle`，添加阿里云镜像：

```gradle
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        google()
        mavenCentral()
    }
}
```

**解决方案B - 手动下载Gradle：**

1. 下载：https://services.gradle.org/distributions/gradle-8.2-bin.zip
2. 解压到：`~/.gradle/wrapper/dists/gradle-8.2-bin/`
3. 重新运行 `./gradlew assembleDebug`

### ❌ 问题2：提示SDK未安装

**解决方案：**

创建 `android/local.properties` 文件：
```properties
sdk.dir=/你的Android SDK路径

# 常见路径：
# Windows: C:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
# Mac: /Users/你的用户名/Library/Android/sdk
# Linux: /home/你的用户名/Android/Sdk
```

### ❌ 问题3：JDK版本不对

**查看当前版本：**
```bash
java -version
```

**需要JDK 17**，如果版本不对，安装JDK 17并设置JAVA_HOME

---

## 🎯 APK编译成功后

### 1. 找到APK文件
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 2. 传输到手机
- **方法A**: 用数据线连接电脑，复制APK到手机
- **方法B**: 上传到云盘（如百度网盘），手机下载
- **方法C**: 发送到微信/QQ，手机接收

### 3. 安装APK
1. 在手机上找到APK文件
2. 点击安装
3. 允许"安装未知来源应用"

### 4. 配置应用
1. 打开"关键词监控"应用
2. 输入服务器地址：`http://38.49.29.167:3000`
3. 点击"保存服务器地址"
4. 启用辅助功能

### 5. 开始使用
- 管理后台：http://38.49.29.167:3000
- 添加关键词
- 手机打字触发关键词
- 后台实时显示警告！

---

## 📦 如果还是编译失败

**最简单方法 - 直接下载我编译好的APK：**

我已经在服务器上准备了编译脚本，等待编译完成后：
```bash
# 下载地址
http://38.49.29.167:3000/关键词监控.apk
```

或者告诉我具体的错误信息，我来帮你解决！

---

## 🔧 项目文件说明

```
android/
├── app/                          # 应用主模块
│   ├── src/main/
│   │   ├── java/com/monitor/keyword/  # Kotlin源代码
│   │   │   ├── MainActivity.kt        # 主界面
│   │   │   ├── KeywordMonitorService.kt  # 监控服务
│   │   │   └── ApiClient.kt           # API客户端
│   │   ├── res/                       # 资源文件
│   │   └── AndroidManifest.xml        # 应用配置
│   └── build.gradle                   # 模块构建配置
├── build.gradle                       # 项目构建配置
├── settings.gradle                    # Gradle设置
├── gradlew                           # Gradle包装器（Linux/Mac）
└── gradlew.bat                       # Gradle包装器（Windows）
```

---

**祝编译顺利！** 🚀








