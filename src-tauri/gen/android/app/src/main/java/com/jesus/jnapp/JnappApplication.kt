package com.jesus.jnapp

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

/**
 * Creates the FCM default channel as early as possible so
 * [com.google.firebase.messaging.default_notification_channel_id] works when the
 * app process was killed (system shows notification messages without running our Activity).
 */
class JnappApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ensurePushChannel()
    }

    private fun ensurePushChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        val ch = NotificationChannel(
            FcmMessagingService.CHANNEL_ID,
            "JNApp push",
            NotificationManager.IMPORTANCE_HIGH
        )
        ch.description = "General push notifications for JNApp"
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
            .createNotificationChannel(ch)
    }
}
