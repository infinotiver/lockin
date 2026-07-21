package com.anonymous.lockin

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class ScreenTimeModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ScreenTimeModule"

    @ReactMethod
    fun hasUsageAccess(promise: Promise) {
        try {
            val appOps =
                reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager

            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactContext.packageName
            )

            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e)
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
            promise.reject("SETTINGS_ERROR", e)
        }
    }

   private fun buildUsageResult(
    startMs: Long,
    endMs: Long
    ): WritableNativeMap {

        val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

        // Look back one day so we can detect sessions that began before startMs.
        val queryStart = startMs - 24L * 60L * 60L * 1000L

        val events = usm.queryEvents(queryStart, endMs)
        val event = UsageEvents.Event()

        val foregroundStart = mutableMapOf<String, Long>()
        val totalPerApp = mutableMapOf<String, Long>()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)

            val pkg = event.packageName ?: continue

            when (event.eventType) {

                UsageEvents.Event.ACTIVITY_RESUMED,
                UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                    foregroundStart[pkg] = event.timeStamp
                }

                UsageEvents.Event.ACTIVITY_PAUSED,
                UsageEvents.Event.MOVE_TO_BACKGROUND -> {

                    val originalStart = foregroundStart.remove(pkg) ?: continue

                    // Don't count time before the requested interval.
                    val actualStart = maxOf(originalStart, startMs)

                    // Don't count time after the requested interval.
                    val actualEnd = minOf(event.timeStamp, endMs)

                    val duration = actualEnd - actualStart

                    if (duration > 0) {
                        totalPerApp[pkg] =
                            (totalPerApp[pkg] ?: 0L) + duration
                    }
                }
            }
        }

        // Apps still in foreground when the interval ended.
        foregroundStart.forEach { (pkg, originalStart) ->

            val actualStart = maxOf(originalStart, startMs)
            val duration = endMs - actualStart

            if (duration > 0) {
                totalPerApp[pkg] =
                    (totalPerApp[pkg] ?: 0L) + duration
            }
        }

        val byApp = WritableNativeMap()
        var totalMs = 0L

        totalPerApp.forEach { (pkg, ms) ->
            byApp.putDouble(pkg, ms.toDouble())
            totalMs += ms
        }

        return WritableNativeMap().apply {
            putMap("byApp", byApp)
            putDouble("totalMs", totalMs.toDouble())
            putDouble("collectedAt", endMs.toDouble())
            putString(
                "date",
                java.text.SimpleDateFormat(
                    "yyyy-MM-dd",
                    java.util.Locale.US
                ).format(java.util.Date(startMs))
            )
        }
    }
    

    @ReactMethod
    fun getTodayUsage(promise: Promise) {
        try {

            val cal = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }

            val result = buildUsageResult(
                cal.timeInMillis,
                System.currentTimeMillis()
            )

            promise.resolve(result)

        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", e)
        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e)
        }
    }

    @ReactMethod
    fun getUsageForRange(
        startMs: Double,
        endMs: Double,
        promise: Promise
    ) {
        try {

            val result = buildUsageResult(
                startMs.toLong(),
                endMs.toLong()
            )

            val array = WritableNativeArray()
            val byApp = result.getMap("byApp")

            byApp?.entryIterator?.forEach { entry ->
                val map = WritableNativeMap().apply {
                    putString("packageName", entry.key)
                    putDouble("totalMs", entry.value as Double)
                    putDouble("lastUsed", endMs)
                }

                array.pushMap(map)
            }

            promise.resolve(array)

        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", e)
        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e)
        }
    }
}