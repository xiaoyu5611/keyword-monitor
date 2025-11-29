# 📱 Telegram机器人配置完整教程

## 🎯 第一步：创建Telegram机器人

### 1. 打开Telegram，搜索 @BotFather

在Telegram搜索框输入：`@BotFather`（官方机器人管理工具）

### 2. 创建新机器人

发送命令：`/newbot`

### 3. 按照提示操作

```
BotFather: Alright, a new bot. How are we going to call it? Please choose a name for your bot.
你: 关键词监控机器人

BotFather: Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.
你: keyword_monitor_bot

BotFather: Done! Congratulations on your new bot. You will find it at t.me/keyword_monitor_bot. 
You can now add a description, about section and profile picture for your bot, see /help for a list of commands.

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789

Keep your token secure and store it safely, it can be used by anyone to control your bot.
```

### 4. 保存Token

**重要！** 复制这个Token：`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789`

这就是你的 **Bot Token**

---

## 🎯 第二步：获取Chat ID

### 方法A：获取群组Chat ID（推荐）

#### 1. 创建一个Telegram群组

- 打开Telegram
- 点击"新建群组"
- 添加至少一个联系人（或者添加另一个你自己的账号）
- 群组名称：例如"关键词监控群"

#### 2. 把机器人加入群组

- 打开刚创建的群组
- 点击群组名称 → 添加成员
- 搜索你的机器人名称（例如：keyword_monitor_bot）
- 添加机器人到群组

#### 3. 在群组发送一条消息

随便发送什么都可以，例如：`测试`

#### 4. 获取Chat ID

在浏览器打开以下地址（替换YOUR_BOT_TOKEN为你的Token）：

```
https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```

例如：
```
https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789/getUpdates
```

#### 5. 找到Chat ID

你会看到类似这样的JSON响应：

```json
{
  "ok": true,
  "result": [
    {
      "update_id": 123456789,
      "message": {
        "message_id": 2,
        "from": {
          "id": 987654321,
          "is_bot": false,
          "first_name": "Your Name"
        },
        "chat": {
          "id": -1001234567890,    ← 这就是Chat ID！
          "title": "关键词监控群",
          "type": "supergroup"
        },
        "date": 1234567890,
        "text": "测试"
      }
    }
  ]
}
```

找到 `"chat": { "id": -1001234567890 }`

**-1001234567890** 就是你的 **Chat ID**（群组ID通常是负数）

---

### 方法B：获取私聊Chat ID

#### 1. 直接和机器人私聊

- 在Telegram搜索你的机器人（keyword_monitor_bot）
- 点击"Start"或发送 `/start`
- 发送任意消息，例如：`Hello`

#### 2. 获取Chat ID

在浏览器打开：
```
https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```

#### 3. 找到你的Chat ID

```json
{
  "ok": true,
  "result": [
    {
      "update_id": 123456789,
      "message": {
        "message_id": 1,
        "from": {
          "id": 987654321,    ← 这就是你的Chat ID！
          "is_bot": false,
          "first_name": "Your Name"
        },
        "chat": {
          "id": 987654321,    ← 私聊Chat ID（正数）
          "first_name": "Your Name",
          "type": "private"
        },
        "date": 1234567890,
        "text": "Hello"
      }
    }
  ]
}
```

**987654321** 就是你的 **Chat ID**（私聊ID是正数）

---

## 🎯 第三步：在管理后台配置

### 1. 打开管理后台

浏览器访问：`http://38.49.29.167:3000`

### 2. 找到"Telegram机器人配置"面板

在页面底部可以看到

### 3. 填入配置

- **Bot Token**：`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789`
- **Chat ID**：`-1001234567890`（群组）或 `987654321`（私聊）

### 4. 保存配置

点击"保存配置"按钮

### 5. 测试发送

点击"测试发送"按钮

如果成功，你会在Telegram收到一条测试消息：

```
🧪 测试消息
这是来自关键词监控系统的测试消息
```

---

## 🎯 第四步：测试完整流程

### 1. 在管理后台添加关键词

例如：`测试`（选择"模糊匹配"）

### 2. 在手机上输入关键词

打开微信或任何输入应用，输入：`这是一个测试`

### 3. 检查Telegram

你应该在Telegram群组收到类似这样的消息：

```
🚨 关键词触发警告

📱 设备: asus ASUSAI2501A
🔑 关键词: 测试
📝 文本: 这是一个测试
⏰ 时间: 2025-11-06 10:30:45
```

---

## ❓ 常见问题

### Q1: 获取Chat ID时返回空result？

**原因**：机器人没有收到任何消息

**解决**：
1. 确保机器人已加入群组
2. 在群组发送一条消息
3. 重新访问getUpdates链接

### Q2: 测试发送失败，显示403错误？

**原因**：机器人被封禁或Token错误

**解决**：
1. 检查Token是否正确
2. 确保Token没有多余的空格
3. 向@BotFather确认机器人状态

### Q3: 测试发送失败，显示400错误？

**原因**：Chat ID错误

**解决**：
1. 确保Chat ID是数字
2. 群组Chat ID应该是负数（例如-1001234567890）
3. 私聊Chat ID应该是正数（例如987654321）
4. 不要包含引号或其他字符

### Q4: 机器人在群组但不发消息？

**原因**：机器人没有权限

**解决**：
1. 群组设置 → 管理员 → 添加管理员
2. 把机器人设为管理员
3. 或者确保群组允许所有成员发消息

### Q5: 手机触发关键词但Telegram不通知？

**检查清单**：
- [ ] 管理后台配置了Telegram（已保存）
- [ ] 测试发送成功
- [ ] 手机APP辅助功能已开启
- [ ] 管理后台"警告通知"能看到记录
- [ ] 服务器日志没有错误

如果管理后台有警告但Telegram没收到：
→ 检查服务器日志：`tail -f /www/wwwroot/keyword-monitor/backend/server.log`

---

## 🎉 配置完成！

现在你的系统已经完全配置好了：

✅ Telegram机器人创建完成
✅ Chat ID获取成功
✅ 管理后台配置完成
✅ 测试发送成功
✅ 实时通知工作正常

享受你的关键词监控系统吧！🚀








