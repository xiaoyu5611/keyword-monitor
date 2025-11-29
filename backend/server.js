const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot配置（从配置文件读取）
let telegramBot = null;
let telegramChatIds = []; // 支持多个群组

// Telegram通知去重机制（仅防止网络重复请求）
const NOTIFICATION_COOLDOWN = 100; // 0.1秒去重时间，仅防止网络重复请求
const recentNotifications = new Map(); // 存储最近的通知时间

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 初始化数据库
const db = new Database('./monitor.db');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY,
    keyword TEXT NOT NULL,
    match_type TEXT DEFAULT 'partial',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    device_remark TEXT,
    keyword TEXT NOT NULL,
    triggered_text TEXT,
    device_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    device_name TEXT NOT NULL,
    device_model TEXT,
    device_remark TEXT,
    last_online DATETIME DEFAULT CURRENT_TIMESTAMP,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS telegram_groups (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL UNIQUE,
    group_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 初始化Telegram配置
function initTelegram() {
  try {
    const tokenRow = db.prepare('SELECT value FROM config WHERE key = ?').get('telegram_token');
    
    if (tokenRow && tokenRow.value) {
      telegramBot = new TelegramBot(tokenRow.value, { polling: false });
      
      // 数据迁移：如果存在旧的单个chat_id配置，迁移到新表
      try {
        const oldChatIdRow = db.prepare('SELECT value FROM config WHERE key = ?').get('telegram_chat_id');
        if (oldChatIdRow && oldChatIdRow.value) {
          const oldChatId = oldChatIdRow.value;
          // 检查是否已存在
          const existing = db.prepare('SELECT id FROM telegram_groups WHERE chat_id = ?').get(oldChatId);
          if (!existing) {
            // 迁移到新表
            const id = uuidv4();
            db.prepare('INSERT INTO telegram_groups (id, chat_id, group_name) VALUES (?, ?, ?)')
              .run(id, oldChatId, '默认群组（从旧配置迁移）');
            console.log('✅ 已迁移旧的Chat ID配置到新群组表');
          }
          // 删除旧配置
          db.prepare('DELETE FROM config WHERE key = ?').run('telegram_chat_id');
        }
      } catch (migrateError) {
        console.log('迁移旧配置时出错（可忽略）:', migrateError.message);
      }
      
      // 加载所有群组
      const groups = db.prepare('SELECT chat_id FROM telegram_groups').all();
      telegramChatIds = groups.map(g => g.chat_id);
      
      if (telegramChatIds.length > 0) {
        console.log(`✅ Telegram机器人已初始化，已配置 ${telegramChatIds.length} 个群组`);
      } else {
        console.log('✅ Telegram机器人已初始化，但未配置群组');
      }
    }
  } catch (error) {
    console.log('ℹ️  Telegram未配置');
  }
}

initTelegram();

// ========== API 路由 ==========

// 获取所有关键词
app.get('/api/keywords', (req, res) => {
  try {
    const keywords = db.prepare('SELECT * FROM keywords ORDER BY created_at DESC').all();
    res.json({ success: true, data: keywords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加关键词
app.post('/api/keywords', (req, res) => {
  try {
    const { keyword, match_type } = req.body;
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ success: false, error: '关键词不能为空' });
    }
    
    const matchType = match_type || 'partial'; // 默认模糊匹配
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO keywords (id, keyword, match_type) VALUES (?, ?, ?)');
    stmt.run(id, keyword.trim(), matchType);
    
    res.json({ success: true, data: { id, keyword: keyword.trim(), match_type: matchType } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除关键词
app.delete('/api/keywords/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM keywords WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '关键词不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有警告
app.get('/api/alerts', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const alerts = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?').all(limit);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加警告（由Android应用调用）
app.post('/api/alerts', async (req, res) => {
  try {
    const { device_id, device_name, device_remark, keyword, triggered_text, device_time } = req.body;
    
    if (!device_id || !device_name || !keyword) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO alerts (id, device_id, device_name, device_remark, keyword, triggered_text, device_time) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, device_id, device_name, device_remark || '', keyword, triggered_text || '', device_time || new Date().toISOString());
    
    // 更新设备最后在线时间
    const deviceStmt = db.prepare('INSERT OR REPLACE INTO devices (id, device_name, device_remark, last_online) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
    deviceStmt.run(device_id, device_name, device_remark || '');
    
    // 发送Telegram通知到所有群组（立即发送，不做任何限制）
    if (telegramBot && telegramChatIds.length > 0) {
      const deviceInfo = device_remark ? `${device_name}（${device_remark}）` : device_name;
      const message = `🚨 *关键词触发警告*\n\n` +
                     `📱 *设备*: ${deviceInfo}\n` +
                     `🔴 *关键词*: ${keyword}\n` +
                     `💬 *文本*: ${triggered_text || '(无)'}\n` +
                     `⏰ *设备时间*: ${device_time || new Date().toLocaleString('zh-CN')}\n` +
                     `🆔 *设备ID*: ${device_id.substring(0, 8)}...`;
      
      // 向所有群组发送通知
      const sendPromises = telegramChatIds.map(async (chatId) => {
        try {
          await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          console.log(`✅ Telegram通知已发送到群组 ${chatId}:`, keyword);
          return { success: true, chatId };
        } catch (telegramError) {
          console.error(`❌ Telegram发送到群组 ${chatId} 失败:`, telegramError.message);
          return { success: false, chatId, error: telegramError.message };
        }
      });
      
      // 等待所有发送完成（不阻塞响应）
      Promise.all(sendPromises).then(results => {
        const successCount = results.filter(r => r.success).length;
        console.log(`📊 Telegram通知发送完成: ${successCount}/${telegramChatIds.length} 个群组成功`);
      });
    }
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 清空警告
app.delete('/api/alerts', (req, res) => {
  try {
    db.prepare('DELETE FROM alerts').run();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有设备
app.get('/api/devices', (req, res) => {
  try {
    const devices = db.prepare('SELECT * FROM devices ORDER BY last_online DESC').all();
    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 设备注册/心跳
app.post('/api/devices/heartbeat', (req, res) => {
  try {
    const { device_id, device_name, device_model, device_remark } = req.body;
    
    if (!device_id || !device_name) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO devices (id, device_name, device_model, device_remark, last_online) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        device_name = excluded.device_name,
        device_model = excluded.device_model,
        device_remark = excluded.device_remark,
        last_online = CURRENT_TIMESTAMP
    `);
    stmt.run(device_id, device_name, device_model || 'Unknown', device_remark || '');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 统计信息
app.get('/api/stats', (req, res) => {
  try {
    const keywordCount = db.prepare('SELECT COUNT(*) as count FROM keywords').get();
    const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get();
    const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get();
    const todayAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE DATE(created_at) = DATE('now')").get();
    
    res.json({
      success: true,
      data: {
        keywords: keywordCount.count,
        alerts: alertCount.count,
        devices: deviceCount.count,
        todayAlerts: todayAlerts.count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Telegram配置相关API
app.get('/api/telegram/config', (req, res) => {
  try {
    const tokenRow = db.prepare('SELECT value FROM config WHERE key = ?').get('telegram_token');
    
    res.json({
      success: true,
      data: {
        token: tokenRow ? tokenRow.value : '',
        configured: !!tokenRow
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/telegram/config', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: '缺少token' });
    }
    
    const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    stmt.run('telegram_token', token);
    
    // 重新初始化Telegram Bot
    telegramBot = new TelegramBot(token, { polling: false });
    
    // 重新加载群组
    const groups = db.prepare('SELECT chat_id FROM telegram_groups').all();
    telegramChatIds = groups.map(g => g.chat_id);
    
    res.json({ success: true, message: 'Telegram Bot Token已保存' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有群组
app.get('/api/telegram/groups', (req, res) => {
  try {
    const groups = db.prepare('SELECT * FROM telegram_groups ORDER BY created_at DESC').all();
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加群组
app.post('/api/telegram/groups', (req, res) => {
  try {
    const { chat_id, group_name } = req.body;
    
    if (!chat_id) {
      return res.status(400).json({ success: false, error: '缺少chat_id' });
    }
    
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO telegram_groups (id, chat_id, group_name) VALUES (?, ?, ?)');
    stmt.run(id, chat_id, group_name || `群组 ${chat_id}`);
    
    // 重新加载群组
    const groups = db.prepare('SELECT chat_id FROM telegram_groups').all();
    telegramChatIds = groups.map(g => g.chat_id);
    
    res.json({ success: true, message: '群组已添加', data: { id, chat_id, group_name: group_name || `群组 ${chat_id}` } });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ success: false, error: '该群组已存在' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除群组
app.delete('/api/telegram/groups/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM telegram_groups WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '群组不存在' });
    }
    
    // 重新加载群组
    const groups = db.prepare('SELECT chat_id FROM telegram_groups').all();
    telegramChatIds = groups.map(g => g.chat_id);
    
    res.json({ success: true, message: '群组已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 测试Telegram通知（向所有群组发送）
app.post('/api/telegram/test', async (req, res) => {
  try {
    if (!telegramBot) {
      return res.status(400).json({ success: false, error: 'Telegram Bot未配置' });
    }
    
    if (telegramChatIds.length === 0) {
      return res.status(400).json({ success: false, error: '未配置任何群组' });
    }
    
    const message = '✅ 测试消息\n\n这是一条来自关键词监控系统的测试消息。';
    
    // 向所有群组发送测试消息
    const sendPromises = telegramChatIds.map(async (chatId) => {
      try {
        await telegramBot.sendMessage(chatId, message);
        return { success: true, chatId };
      } catch (error) {
        return { success: false, chatId, error: error.message };
      }
    });
    
    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    
    res.json({ 
      success: true, 
      message: `测试消息已发送到 ${successCount}/${telegramChatIds.length} 个群组`,
      results 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== APP密码相关API ==========

// 获取APP密码（管理端）
app.get('/api/app-password', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get('app_password');
    res.json({ success: true, data: { password: row ? row.value : '' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 设置APP密码（管理端）
app.post('/api/app-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: '密码至少4位' });
    }
    
    const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    stmt.run('app_password', password);
    
    res.json({ success: true, message: 'APP密码已设置' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 验证APP密码（APP端）
app.post('/api/verify-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, error: '请输入密码' });
    }
    
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get('app_password');
    
    // 如果没有设置密码，默认允许通过
    if (!row || !row.value) {
      return res.json({ success: true, valid: true, message: '密码正确' });
    }
    
    if (password === row.value) {
      res.json({ success: true, valid: true, message: '密码正确' });
    } else {
      res.json({ success: true, valid: false, message: '密码错误' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 管理后台: http://localhost:${PORT}`);
  console.log(`🔌 API地址: http://localhost:${PORT}/api`);
});

// 优雅关闭
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});


