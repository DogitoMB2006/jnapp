package com.jesus.jnapp

import android.content.Context
import java.io.File

/**
 * Persists a pending deep-link navigation written by FcmMessagingService when a
 * push notification is received while the app is killed.  The Rust command
 * `deep_link_consume_pending` reads and deletes the file so the JS layer can
 * navigate once and only once.
 */
object DeepLinkStore {
    const val FILE_NAME = "pending_deep_link.json"

    private fun dataDir(context: Context): File =
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            context.dataDir
        } else {
            android.os.Environment.getDataDirectory()
                .resolve("data/${context.packageName}")
        }

    fun write(context: Context, referenceId: String, referenceType: String) {
        try {
            val dir = dataDir(context)
            dir.mkdirs()
            val safe = { s: String -> s.replace("\\", "\\\\").replace("\"", "\\\"") }
            val json = """{"reference_id":"${safe(referenceId)}","reference_type":"${safe(referenceType)}"}"""
            File(dir, FILE_NAME).writeText(json)
        } catch (_: Exception) { /* best-effort */ }
    }

    /** Returns the JSON string and deletes the file, or null if nothing pending. */
    fun consume(context: Context): String? {
        return try {
            val file = File(dataDir(context), FILE_NAME)
            if (!file.exists()) return null
            val content = file.readText()
            file.delete()
            content
        } catch (_: Exception) { null }
    }
}
