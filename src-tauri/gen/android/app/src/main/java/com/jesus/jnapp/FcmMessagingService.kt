package com.jesus.jnapp

import android.Manifest
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FcmMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        FcmTokenStore.write(applicationContext, token)
    }

    /**
     * Handle both:
     * - notification payload (some providers)
     * - data payload { title, body } (our edge-function path)
     *
     * If app is killed and backend sends data-only, Android will NOT auto-show:
     * we must create notification manually here.
     */
    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.data["title"]
            ?: message.notification?.title
            ?: "JNApp"
        val body = message.data["body"]
            ?: message.notification?.body
            ?: ""
        if (body.isBlank()) return

        // Store deep-link so JS can navigate once the app opens
        val referenceId = message.data["reference_id"]
        val referenceType = message.data["reference_type"]
        if (!referenceId.isNullOrBlank() && !referenceType.isNullOrBlank()) {
            DeepLinkStore.write(applicationContext, referenceId, referenceType)
        }

        // Android 13+: no tray notification without runtime permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentIntent = launchIntent?.let {
            PendingIntent.getActivity(
                this,
                0,
                it,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .apply {
                if (contentIntent != null) setContentIntent(contentIntent)
            }
            .build()

        NotificationManagerCompat.from(this)
            .notify(System.currentTimeMillis().toInt(), notification)
    }

    companion object {
        const val CHANNEL_ID = "jnapp_push"
    }
}
