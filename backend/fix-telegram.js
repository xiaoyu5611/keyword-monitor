// 修复Telegram重复通知的补丁
const fs = require('fs');

const serverFile = './server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// 在文件开头添加去重Map
const addRecentNotifications = `const { v4: uuidv4 } = require('uuid');

// 记录最近发送的通知（防止短时间重复）
const recentNotifications = new Map();
const NOTIFICATION_COOLDOWN = 30000; // 30秒冷却

const app = express();`;

// 替换原来的内容
content = content.replace(
  `const { v4: uuidv4 } = require('uuid');\n\nconst app = express();`,
  addRecentNotifications
);

// 修改Telegram通知部分
const oldTelegramCode = `    // 发送Telegram通知
    if (telegramBot && telegramChatId) {
      try {
        const message = \`🚨 *关键词触发警告*\\n\\n\` +
                       \`📱 *设备*: \${device_name}\\n\` +
                       \`🔴 *关键词*: \${keyword}\\n\` +
                       \`💬 *文本*: \${triggered_text || '(无)'}\\n\` +
                       \`⏰ *设备时间*: \${device_time || new Date().toLocaleString('zh-CN')}\\n\` +
                       \`🆔 *设备ID*: \${device_id.substring(0, 8)}...\`;
        
        await telegramBot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' });
        console.log('✅ Telegram通知已发送');
      } catch (telegramError) {
        console.error('❌ Telegram发送失败:', telegramError.message);
      }
    }`;

const newTelegramCode = `    // 发送Telegram通知（带去重）
    if (telegramBot && telegramChatId) {
      try {
        // 生成唯一键：设备+关键词+文本哈希
        const notifyKey = \`\${device_id}:\${keyword}:\${(triggered_text || '').substring(0, 20)}\`;
        const lastNotifyTime = recentNotifications.get(notifyKey) || 0;
        const currentTime = Date.now();
        
        // 检查是否在冷却期内（30秒）
        if (currentTime - lastNotifyTime < NOTIFICATION_COOLDOWN) {
          console.log('⏭️  跳过Telegram通知（30秒冷却中）:', keyword);
        } else {
          // 发送通知
          const message = \`🚨 *关键词触发警告*\\n\\n\` +
                         \`📱 *设备*: \${device_name}\\n\` +
                         \`🔴 *关键词*: \${keyword}\\n\` +
                         \`💬 *文本*: \${triggered_text || '(无)'}\\n\` +
                         \`⏰ *设备时间*: \${device_time || new Date().toLocaleString('zh-CN')}\\n\` +
                         \`🆔 *设备ID*: \${device_id.substring(0, 8)}...\`;
          
          await telegramBot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' });
          console.log('✅ Telegram通知已发送:', keyword);
          
          // 记录发送时间
          recentNotifications.set(notifyKey, currentTime);
          
          // 清理过期记录（超过1分钟）
          for (const [key, time] of recentNotifications.entries()) {
            if (currentTime - time > 60000) {
              recentNotifications.delete(key);
            }
          }
        }
      } catch (telegramError) {
        console.error('❌ Telegram发送失败:', telegramError.message);
      }
    }`;

content = content.replace(oldTelegramCode, newTelegramCode);

// 写回文件
fs.writeFileSync(serverFile, content, 'utf8');
console.log('✅ 已修复Telegram重复通知问题！');
console.log('📝 添加了30秒冷却机制');


