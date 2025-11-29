package com.monitor.keyword

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class KeywordMonitorService : AccessibilityService() {

    private val TAG = "KeywordMonitorService"
    private val scope = CoroutineScope(Dispatchers.IO + Job())
    private lateinit var prefs: SharedPreferences
    private lateinit var apiClient: ApiClient
    
    // 关键词缓存
    private var cachedKeywords = listOf<KeywordItem>()
    private var lastKeywordUpdateTime = 0L
    private val KEYWORD_UPDATE_INTERVAL = 10000L // 每10秒更新一次关键词列表
    
    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences("keyword_monitor", Context.MODE_PRIVATE)
        apiClient = ApiClient(prefs)
        
        // 初始化设备ID
        if (prefs.getString("device_id", null) == null) {
            prefs.edit().putString("device_id", UUID.randomUUID().toString()).apply()
        }
        
        // 启动前台服务，防止被杀
        startForegroundService()
        
        // 发送心跳
        startHeartbeat()
        
        // 启动关键词更新
        startKeywordUpdater()
        
        Log.d(TAG, "服务已启动 - 前台服务模式")
    }
    
    private fun startForegroundService() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                val channelId = "keyword_monitor_channel"
                val channelName = "关键词监控服务"
                val importance = android.app.NotificationManager.IMPORTANCE_LOW
                
                val channel = android.app.NotificationChannel(channelId, channelName, importance).apply {
                    description = "保持监控服务运行"
                    setShowBadge(false)
                }
                
                val notificationManager = getSystemService(android.app.NotificationManager::class.java)
                notificationManager?.createNotificationChannel(channel)
                
                val notification = android.app.Notification.Builder(this, channelId)
                    .setContentTitle("关键词监控运行中")
                    .setContentText("正在监控输入内容")
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setOngoing(true)
                    .build()
                
                // 使用前台服务，防止被系统杀死
                try {
                    val method = this.javaClass.getMethod("startForeground", Int::class.javaPrimitiveType, android.app.Notification::class.java)
                    method.invoke(this, 1, notification)
                    Log.d(TAG, "前台服务已启动")
                } catch (e: Exception) {
                    Log.e(TAG, "启动前台服务失败: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "创建通知失败: ${e.message}")
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        
        // 记录事件类型用于调试
        val eventTypeStr = when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> "TEXT_CHANGED"
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> "VIEW_FOCUSED"
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> "WINDOW_CONTENT_CHANGED"
            else -> "OTHER(${event.eventType})"
        }
        
        // 处理所有文本相关事件
        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED,
            AccessibilityEvent.TYPE_VIEW_FOCUSED,
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                handleTextEvent(event)
            }
        }
    }

    private fun handleTextEvent(event: AccessibilityEvent) {
        try {
            // 尝试多种方式获取文本
            val texts = mutableSetOf<String>()
            
            // 方式1: 从事件中获取
            event.text?.forEach { charSequence ->
                charSequence?.toString()?.let { texts.add(it) }
            }
            
            // 方式2: 从contentDescription获取
            event.contentDescription?.toString()?.let { texts.add(it) }
            
            // 方式3: 从source节点获取
            event.source?.let { node ->
                extractTextFromNode(node, texts)
                node.recycle()
            }
            
            // 检查所有获取到的文本
            texts.forEach { text ->
                if (text.isNotEmpty()) {
                    checkKeywords(text)
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "处理文本事件出错: ${e.message}")
        }
    }

    private fun extractTextFromNode(node: AccessibilityNodeInfo, texts: MutableSet<String>) {
        try {
            // 获取当前节点的文本
            node.text?.toString()?.let { if (it.isNotEmpty()) texts.add(it) }
            
            // 递归获取子节点的文本
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { child ->
                    extractTextFromNode(child, texts)
                    child.recycle()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "提取节点文本出错: ${e.message}")
        }
    }

    private fun checkKeywords(text: String) {
        // 过滤太短的文本
        if (text.trim().isEmpty() || text.length < 1) {
            return
        }
        
        Log.d(TAG, "检查文本: $text")
        
        scope.launch {
            try {
                // 使用缓存的关键词列表，避免每次都请求服务器
                val keywordItems = cachedKeywords
                if (keywordItems.isEmpty()) {
                    Log.d(TAG, "关键词列表为空，等待更新...")
                    return@launch
                }
                
                Log.d(TAG, "使用缓存的 ${keywordItems.size} 个关键词进行检查")
                
                // 检查文本中是否包含关键词
                for (item in keywordItems) {
                    val matched = when (item.matchType) {
                        "exact" -> {
                            // 完全匹配：整个文本等于关键词
                            text.trim().equals(item.keyword, ignoreCase = true)
                        }
                        else -> {
                            // 模糊匹配：文本中包含关键词
                            text.contains(item.keyword, ignoreCase = true)
                        }
                    }
                    
                    if (matched) {
                        val matchType = if (item.matchType == "exact") "完全匹配" else "模糊匹配"
                        Log.d(TAG, "✅ 检测到关键词 ($matchType): ${item.keyword} 在文本: $text")
                        
                        // 立即上报，不做延迟
                        reportKeywordTrigger(item.keyword, text)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "检查关键词出错: ${e.message}")
                e.printStackTrace()
            }
        }
    }

    private suspend fun reportKeywordTrigger(keyword: String, triggeredText: String) {
        try {
            val deviceId = prefs.getString("device_id", "") ?: ""
            val deviceName = getDeviceName()
            val deviceRemark = prefs.getString("device_remark", "") ?: ""
            
            // 获取设备当前时间（ISO 8601格式）
            val deviceTime = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply {
                timeZone = java.util.TimeZone.getDefault()
            }.format(Date())
            
            apiClient.reportAlert(deviceId, deviceName, deviceRemark, keyword, triggeredText, deviceTime)
            Log.d(TAG, "已上报关键词触发: $keyword (设备备注: $deviceRemark, 设备时间: $deviceTime)")
        } catch (e: Exception) {
            Log.e(TAG, "上报关键词触发失败: ${e.message}")
        }
    }

    private fun getDeviceName(): String {
        val manufacturer = Build.MANUFACTURER
        val model = Build.MODEL
        val androidId = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ANDROID_ID
        ).take(8)
        
        return "$manufacturer $model ($androidId)"
    }

    private fun startHeartbeat() {
        scope.launch {
            while (true) {
                try {
                    val deviceId = prefs.getString("device_id", "") ?: ""
                    val deviceName = getDeviceName()
                    val deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}"
                    val deviceRemark = prefs.getString("device_remark", "") ?: ""
                    
                    apiClient.sendHeartbeat(deviceId, deviceName, deviceModel, deviceRemark)
                    Log.d(TAG, "心跳发送成功")
                } catch (e: Exception) {
                    Log.e(TAG, "心跳发送失败: ${e.message}")
                }
                
                delay(60000) // 每分钟发送一次心跳
            }
        }
    }
    
    private fun startKeywordUpdater() {
        scope.launch {
            while (true) {
                try {
                    val keywords = apiClient.getKeywords()
                    cachedKeywords = keywords
                    lastKeywordUpdateTime = System.currentTimeMillis()
                    Log.d(TAG, "关键词列表已更新: ${keywords.size} 个关键词")
                } catch (e: Exception) {
                    Log.e(TAG, "更新关键词列表失败: ${e.message}")
                }
                
                delay(KEYWORD_UPDATE_INTERVAL) // 每10秒更新一次
            }
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "服务被中断")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "服务已销毁")
    }
}


