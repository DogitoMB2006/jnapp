package com.jesus.jnapp

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.content.FileProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

class ApkInstaller(private val context: Context, private val webView: WebView) {

    @JavascriptInterface
    fun installFromUrl(url: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val cacheDir = context.externalCacheDir ?: context.cacheDir
                val apkFile = File(cacheDir, "jnapp-update.apk")

                // Follow redirects and download APK
                var connection = URL(url).openConnection() as HttpURLConnection
                connection.instanceFollowRedirects = true
                connection.connectTimeout = 30_000
                connection.readTimeout = 120_000
                // Follow manual redirects
                var redirectCount = 0
                while (connection.responseCode in 300..399 && redirectCount < 10) {
                    val newUrl = connection.getHeaderField("Location") ?: break
                    connection.disconnect()
                    connection = URL(newUrl).openConnection() as HttpURLConnection
                    connection.instanceFollowRedirects = true
                    redirectCount++
                }
                connection.inputStream.use { input ->
                    apkFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                connection.disconnect()

                withContext(Dispatchers.Main) {
                    // Notify JS that download finished
                    webView.evaluateJavascript("window.__apkInstallReady && window.__apkInstallReady()", null)
                }

                // Trigger install intent
                val intent = Intent(Intent.ACTION_VIEW)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    val uri = FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.fileprovider",
                        apkFile
                    )
                    intent.setDataAndType(uri, "application/vnd.android.package-archive")
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                } else {
                    @Suppress("DEPRECATION")
                    intent.setDataAndType(Uri.fromFile(apkFile), "application/vnd.android.package-archive")
                }
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    webView.evaluateJavascript(
                        "window.__apkInstallError && window.__apkInstallError(${
                            com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(e.message ?: "install failed")
                        })",
                        null
                    )
                }
            }
        }
    }
}
