// 更新数据库结构：添加device_remark字段
const Database = require('better-sqlite3');
const db = new Database('./monitor.db');

console.log('🔧 更新数据库结构...');

try {
    // 检查并添加 device_remark 列到 devices 表
    const devicesColumns = db.prepare("PRAGMA table_info(devices)").all();
    const hasDeviceRemark = devicesColumns.some(col => col.name === 'device_remark');
    if (!hasDeviceRemark) {
        console.log('📝 添加 device_remark 列到 devices 表...');
        db.exec("ALTER TABLE devices ADD COLUMN device_remark TEXT");
        console.log('✅ device_remark 列已添加到 devices 表');
    } else {
        console.log('✅ devices.device_remark 列已存在');
    }

    // 检查并添加 device_remark 列到 alerts 表
    const alertsColumns = db.prepare("PRAGMA table_info(alerts)").all();
    const hasAlertRemark = alertsColumns.some(col => col.name === 'device_remark');
    if (!hasAlertRemark) {
        console.log('📝 添加 device_remark 列到 alerts 表...');
        db.exec("ALTER TABLE alerts ADD COLUMN device_remark TEXT");
        console.log('✅ device_remark 列已添加到 alerts 表');
    } else {
        console.log('✅ alerts.device_remark 列已存在');
    }
    
    console.log('✅ 数据库更新完成！');
} catch (error) {
    console.error('❌ 数据库更新失败:', error.message);
} finally {
    db.close();
}

