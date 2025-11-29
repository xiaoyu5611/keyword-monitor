package com.monitor.keyword

import android.content.SharedPreferences
import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ApiClient(private val prefs: SharedPreferences) {
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    private val TAG = "ApiClient"
    
    private fun getServerUrl(): String {
        return prefs.getString("server_url", "") ?: ""
    }
    
    // 获取关键词列表（带匹配类型）
    suspend fun getKeywords(): List<KeywordItem> = withContext(Dispatchers.IO) {
        val serverUrl = getServerUrl()
        if (serverUrl.isEmpty()) {
            Log.w(TAG, "服务器地址未设置")
            return@withContext emptyList()
        }
        
        try {
            val request = Request.Builder()
                .url("$serverUrl/api/keywords")
                .get()
                .build()
            
            val response = client.newCall(request).execute()
            val body = response.body?.string()
            
            if (response.isSuccessful && body != null) {
                val result = gson.fromJson(body, KeywordsResponse::class.java)
                if (result.success) {
                    return@withContext result.data
                }
            }
            
            emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "获取关键词失败: ${e.message}")
            emptyList()
        }
    }
    
    // 上报警告
    suspend fun reportAlert(
        deviceId: String,
        deviceName: String,
        deviceRemark: String,
        keyword: String,
        triggeredText: String,
        deviceTime: String
    ) = withContext(Dispatchers.IO) {
        val serverUrl = getServerUrl()
        if (serverUrl.isEmpty()) {
            Log.w(TAG, "服务器地址未设置")
            return@withContext
        }
        
        try {
            val alertData = AlertData(deviceId, deviceName, deviceRemark, keyword, triggeredText, deviceTime)
            val json = gson.toJson(alertData)
            
            val requestBody = json.toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$serverUrl/api/alerts")
                .post(requestBody)
                .build()
            
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                Log.d(TAG, "警告上报成功")
            } else {
                Log.e(TAG, "警告上报失败: ${response.code}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "警告上报异常: ${e.message}")
        }
    }
    
    // 发送心跳
    suspend fun sendHeartbeat(
        deviceId: String,
        deviceName: String,
        deviceModel: String,
        deviceRemark: String
    ) = withContext(Dispatchers.IO) {
        val serverUrl = getServerUrl()
        if (serverUrl.isEmpty()) {
            return@withContext
        }
        
        try {
            val heartbeatData = HeartbeatData(deviceId, deviceName, deviceModel, deviceRemark)
            val json = gson.toJson(heartbeatData)
            
            val requestBody = json.toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$serverUrl/api/devices/heartbeat")
                .post(requestBody)
                .build()
            
            client.newCall(request).execute()
        } catch (e: Exception) {
            Log.e(TAG, "心跳发送异常: ${e.message}")
        }
    }
    
    // 验证密码
    suspend fun verifyPassword(password: String): Boolean = withContext(Dispatchers.IO) {
        val serverUrl = getServerUrl()
        if (serverUrl.isEmpty()) {
            Log.w(TAG, "服务器地址未设置")
            return@withContext false
        }
        
        try {
            val passwordRequest = PasswordRequest(password)
            val json = gson.toJson(passwordRequest)
            
            val requestBody = json.toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$serverUrl/api/verify-password")
                .post(requestBody)
                .build()
            
            val response = client.newCall(request).execute()
            val body = response.body?.string()
            
            if (response.isSuccessful && body != null) {
                val result = gson.fromJson(body, PasswordResponse::class.java)
                return@withContext result.success && result.valid
            }
            
            false
        } catch (e: Exception) {
            Log.e(TAG, "密码验证异常: ${e.message}")
            false
        }
    }
}

// 数据类
data class KeywordsResponse(
    val success: Boolean,
    val data: List<KeywordItem>
)

data class KeywordItem(
    val id: String,
    val keyword: String,
    @SerializedName("match_type") val matchType: String = "partial",
    @SerializedName("created_at") val createdAt: String
)

data class AlertData(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("device_name") val deviceName: String,
    @SerializedName("device_remark") val deviceRemark: String,
    val keyword: String,
    @SerializedName("triggered_text") val triggeredText: String,
    @SerializedName("device_time") val deviceTime: String
)

data class HeartbeatData(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("device_name") val deviceName: String,
    @SerializedName("device_model") val deviceModel: String,
    @SerializedName("device_remark") val deviceRemark: String
)

data class PasswordRequest(
    val password: String
)

data class PasswordResponse(
    val success: Boolean,
    val valid: Boolean,
    val message: String
)


