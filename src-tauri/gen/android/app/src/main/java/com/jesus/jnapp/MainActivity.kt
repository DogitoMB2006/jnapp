package com.jesus.jnapp

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.android.gms.ads.MobileAds
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : TauriActivity() {

    private val requestNotifPerm = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        // Initialize AdMob SDK before WebView/bridge creation so ads can load immediately
        MobileAds.initialize(this)
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotifPerm.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) return@addOnCompleteListener
            val t = task.result ?: return@addOnCompleteListener
            FcmTokenStore.write(this, t)
        }
    }

    override fun onWebViewCreate(webView: WebView) {
        webView.addJavascriptInterface(ApkInstaller(this, webView), "JNApkInstaller")
        webView.addJavascriptInterface(AdMobBridge(this, webView), "JNAdMob")

        val previousClient = webView.webViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                previousClient?.onPageFinished(view, url)
                attachJsBridges(webView)
            }
        }

        attachJsBridges(webView)
    }

    /** Mirror @JavascriptInterface globals onto window for the React app. */
    private fun attachJsBridges(webView: WebView) {
        val js = """
            (function() {
              try {
                if (typeof JNAdMob !== 'undefined') window.JNAdMob = JNAdMob;
                if (typeof JNApkInstaller !== 'undefined') window.JNApkInstaller = JNApkInstaller;
              } catch (e) {}
            })();
        """.trimIndent()
        webView.post { webView.evaluateJavascript(js, null) }
        webView.postDelayed({ webView.evaluateJavascript(js, null) }, 400)
        webView.postDelayed({ webView.evaluateJavascript(js, null) }, 1200)
    }
}
