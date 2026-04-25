package com.jesus.jnapp

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FcmMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        FcmTokenStore.write(applicationContext, token)
    }

    // onMessageReceived fires only when app is in foreground.
    // The in-app realtime system already handles notifications when open.
    // When app is killed/background, FCM SDK auto-displays using the
    // notification block — no manual display needed.
    override fun onMessageReceived(message: RemoteMessage) = Unit

    companion object {
        const val CHANNEL_ID = "jnapp_push"
    }
}
