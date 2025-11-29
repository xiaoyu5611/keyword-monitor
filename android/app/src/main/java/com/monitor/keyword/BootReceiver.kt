package com.monitor.keyword

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * 开机自启动接收器
 */
class BootReceiver : BroadcastReceiver() {
    
    private val TAG = "BootReceiver"
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "设备开机，准备启动监控服务")
            
            // 检查辅助功能是否已启用
            val isEnabled = isAccessibilityServiceEnabled(context)
            if (isEnabled) {
                Log.d(TAG, "辅助功能已启用，服务将自动运行")
            } else {
                Log.w(TAG, "辅助功能未启用，需要用户手动启用")
            }
        }
    }
    
    private fun isAccessibilityServiceEnabled(context: Context): Boolean {
        val service = "${context.packageName}/${KeywordMonitorService::class.java.canonicalName}"
        val enabledServices = android.provider.Settings.Secure.getString(
            context.contentResolver,
            android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        )
        return enabledServices?.contains(service) == true
    }
}








