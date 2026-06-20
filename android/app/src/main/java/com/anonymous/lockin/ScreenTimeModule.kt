package com.anonymous.lockin

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.Calendar

class ScreenTimeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ScreenTimeModule"

    @ReactMethod
    fun hasUsageAccess(promise: Promise) {
        try {
            val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactContext.packageName
            )
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun openUsageAccessSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getTodayUsage(promise: Promise) {
    try {
        val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val cal = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
        }
        val startMs = cal.timeInMillis
        val endMs = System.currentTimeMillis()

        val events = usm.queryEvents(startMs, endMs)
        val event = UsageEvents.Event()

        // track foreground start times per package
        val foregroundStart = mutableMapOf<String, Long>()
        val totalPerApp = mutableMapOf<String, Long>()

        while (events.hasNextEvent()) {
        events.getNextEvent(event)
        val pkg = event.packageName

        when (event.eventType) {
            UsageEvents.Event.ACTIVITY_RESUMED -> {
            foregroundStart[pkg] = event.timeStamp
            }
            UsageEvents.Event.ACTIVITY_PAUSED -> {
            val start = foregroundStart.remove(pkg)
            if (start != null) {
                val duration = event.timeStamp - start
                totalPerApp[pkg] = (totalPerApp[pkg] ?: 0L) + duration
            }
            }
        }
        }

        // close any still-open sessions (app still in foreground)
        foregroundStart.forEach { (pkg, start) ->
        val duration = endMs - start
        totalPerApp[pkg] = (totalPerApp[pkg] ?: 0L) + duration
        }

        val result = WritableNativeMap()
        val byApp = WritableNativeMap()
        var totalMs = 0L

        totalPerApp.forEach { (pkg, ms) ->
        if (ms > 0) {
            byApp.putDouble(pkg, ms.toDouble())
            totalMs += ms
        }
        }

        result.putMap("byApp", byApp)
        result.putDouble("totalMs", totalMs.toDouble())
        result.putDouble("collectedAt", endMs.toDouble())
        result.putString("date", java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(cal.time))
        promise.resolve(result)

    } catch (e: SecurityException) {
        promise.reject("PERMISSION_DENIED", "Usage access not granted")
    } catch (e: Exception) {
        promise.reject("USAGE_ERROR", e.message)
    }
    }

    @ReactMethod
    fun getUsageForRange(startMs: Double, endMs: Double, promise: Promise) {
        try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_BEST,
                startMs.toLong(),
                endMs.toLong()
            )

            val result = WritableNativeArray()
            stats?.forEach { stat ->
                if (stat.totalTimeInForeground > 0) {
                    val entry = WritableNativeMap().apply {
                        putString("packageName", stat.packageName)
                        putDouble("totalMs", stat.totalTimeInForeground.toDouble())
                        putDouble("lastUsed", stat.lastTimeUsed.toDouble())
                    }
                    result.pushMap(entry)
                }
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e.message)
        }
    }
}