const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'monitor.db');
const db = new Database(dbPath);

console.log('🔧 修复数据库结构...\n');

try {
    // 检查keywords表是否有match_type列
    const tableInfo = db.prepare("PRAGMA table_info(keywords)").all();
    const hasMatchType = tableInfo.some(col => col.name === 'match_type');
    
    if (!hasMatchType) {
        console.log('📝 添加 match_type 列到 keywords 表...');
        db.exec(`ALTER TABLE keywords ADD COLUMN match_type TEXT DEFAULT 'partial'`);
        console.log('✅ match_type 列已添加');
    } else {
        console.log('✅ match_type 列已存在');
    }
    
    // 检查alerts表是否有device_time列
    const alertsInfo = db.prepare("PRAGMA table_info(alerts)").all();
    const hasDeviceTime = alertsInfo.some(col => col.name === 'device_time');
    
    if (!hasDeviceTime) {
        console.log('📝 添加 device_time 列到 alerts 表...');
        db.exec(`ALTER TABLE alerts ADD COLUMN device_time TEXT`);
        console.log('✅ device_time 列已添加');
    } else {
        console.log('✅ device_time 列已存在');
    }
    
    // 检查config表是否存在
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='config'").all();
    
    if (tables.length === 0) {
        console.log('📝 创建 config 表...');
        db.exec(`
            CREATE TABLE config (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);
        console.log('✅ config 表已创建');
    } else {
        console.log('✅ config 表已存在');
    }
    
    // 更新所有现有关键词的match_type为partial（如果为NULL）
    const updateResult = db.prepare(`
        UPDATE keywords 
        SET match_type = 'partial' 
        WHERE match_type IS NULL
    `).run();
    
    if (updateResult.changes > 0) {
        console.log(`✅ 已更新 ${updateResult.changes} 个关键词的匹配类型`);
    }
    
    console.log('\n✅ 数据库修复完成！');
    
} catch (error) {
    console.error('❌ 修复失败:', error.message);
    process.exit(1);
} finally {
    db.close();
}








