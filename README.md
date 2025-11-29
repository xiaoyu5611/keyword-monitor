# 🔍 关键词监控系统

一个完整的关键词监控解决方案，包括Android应用、管理后台和后端API服务。

## 📋 系统功能

- ✅ **Android应用** - 监听手机输入，检测关键词触发
- ✅ **管理后台** - 设置关键词、查看警告通知
- ✅ **后端API** - 连接应用和后台，存储数据
- ✅ **实时监控** - 自动上报触发信息
- ✅ **设备管理** - 查看所有连接的设备

## 🚀 快速开始

### 方式一：一键启动（推荐）

```bash
cd /www/wwwroot/keyword-monitor
chmod +x start.sh
./start.sh
```

### 方式二：手动启动

```bash
cd /www/wwwroot/keyword-monitor/backend
npm install
npm start
```

## 📱 Android应用安装

### 1. 使用Android Studio编译（推荐）

```bash
cd /www/wwwroot/keyword-monitor/android
# 使用Android Studio打开项目并编译
```

### 2. 编译APK

```bash
cd /www/wwwroot/keyword-monitor/android
./gradlew assembleDebug
# APK位置: android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. 安装到手机

将生成的APK文件传输到手机并安装。

## ⚙️ 配置说明

### 后端服务配置

服务器默认运行在 `http://localhost:3000`

如需修改端口：
```bash
PORT=8080 npm start
```

### Android应用配置

1. 打开应用
2. 输入服务器地址（例如：`http://192.168.1.100:3000`）
3. 点击"保存服务器地址"
4. 点击"启用辅助功能"
5. 在系统设置中启用"关键词监控"服务

## 📖 使用流程

### 1️⃣ 启动后端服务
```bash
./start.sh
```

### 2️⃣ 打开管理后台
浏览器访问：`http://localhost:3000`

### 3️⃣ 添加关键词
在管理后台的"关键词管理"中添加要监控的关键词

### 4️⃣ 安装并配置Android应用
- 在手机上安装APK
- 设置服务器地址（后端服务的IP:端口）
- 启用辅助功能

### 5️⃣ 开始监控
当手机上输入包含关键词的内容时，管理后台会实时显示警告

## 🔧 技术栈

### 后端
- Node.js + Express
- SQLite数据库
- RESTful API

### 前端
- 原生HTML/CSS/JavaScript
- 响应式设计
- 实时数据刷新

### Android
- Kotlin
- AccessibilityService（辅助功能服务）
- OkHttp + Gson

## 📊 API接口

### 关键词管理
- `GET /api/keywords` - 获取关键词列表
- `POST /api/keywords` - 添加关键词
- `DELETE /api/keywords/:id` - 删除关键词

### 警告通知
- `GET /api/alerts` - 获取警告列表
- `POST /api/alerts` - 添加警告（Android调用）
- `DELETE /api/alerts` - 清空警告

### 设备管理
- `GET /api/devices` - 获取设备列表
- `POST /api/devices/heartbeat` - 设备心跳

### 统计信息
- `GET /api/stats` - 获取统计数据

## 🔒 隐私说明

本系统使用Android辅助功能服务监听输入内容：
- 仅检测设置的关键词
- 不会收集其他个人信息
- 所有数据存储在本地服务器
- 请确保您有权限监控目标设备

## 🐛 故障排查

### 后端无法启动
```bash
# 检查端口占用
netstat -tuln | grep 3000
# 检查Node.js版本
node -v  # 需要 v14+
```

### Android应用无法连接
1. 检查服务器地址是否正确
2. 确保手机和服务器在同一网络
3. 检查防火墙设置
4. 尝试使用IP地址而非localhost

### 辅助功能无法启用
1. 前往系统设置 > 辅助功能
2. 找到"关键词监控"
3. 授予必要权限

## 📝 更新日志

### v1.0.0 (2025-11-05)
- ✅ 初始版本发布
- ✅ 完整的关键词监控功能
- ✅ 管理后台界面
- ✅ Android应用

## 📄 许可证

MIT License

## 👨‍💻 技术支持

如有问题，请检查：
1. 服务器是否正常运行
2. 网络连接是否正常
3. 辅助功能是否已启用
4. 关键词是否已添加
