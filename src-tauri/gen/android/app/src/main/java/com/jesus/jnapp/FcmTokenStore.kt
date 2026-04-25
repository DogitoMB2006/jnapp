package com.jesus.jnapp

import android.content.Context
import java.io.File

/**
 * Persists the FCM registration token where the Rust `fcm_get_stored_token` command
 * can read it. Tauri's `app_data_dir` on Android resolves to `Context.getDataDir()`
 * (e.g. /data/data/com.jesus.jnapp), NOT `filesDir` (/data/data/.../files).
 */
object FcmTokenStore {
    const val FILE_NAME = "fcm_token.txt"

    fun write(context: Context, token: String) {
        try {
            // Use dataDir (not filesDir) to match Tauri's app_data_dir path resolution
            val dir = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                context.dataDir
            } else {
                android.os.Environment.getDataDirectory().resolve("data/${context.packageName}")
            }
            dir.mkdirs()
            File(dir, FILE_NAME).writeText(token)
        } catch (_: Exception) {
            /* best-effort */
        }
    }
}
