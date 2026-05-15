package com.jesus.jnapp

import android.app.Activity
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

/**
 * JavaScript bridge for Google AdMob rewarded ads.
 * Registered as window.JNAdMob in the WebView.
 *
 * Usage from JS:
 *   window.__admobCallback = (success, error) => { ... }
 *   window.JNAdMob.showRewardedAd()
 *
 */
class AdMobBridge(private val activity: Activity, private val webView: WebView) {

    private var rewardedAd: RewardedAd? = null
    private var isLoading = false

    companion object {
        private const val AD_UNIT_ID = "ca-app-pub-8685487552580546/6291376522"
    }

    init {
        loadAd()
    }

    private fun loadAd() {
        if (isLoading || rewardedAd != null) return
        isLoading = true
        activity.runOnUiThread {
            RewardedAd.load(
                activity,
                AD_UNIT_ID,
                AdRequest.Builder().build(),
                object : RewardedAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedAd) {
                        rewardedAd = ad
                        isLoading = false
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        rewardedAd = null
                        isLoading = false
                    }
                }
            )
        }
    }

    @JavascriptInterface
    fun showRewardedAd() {
        val ad = rewardedAd
        if (ad == null) {
            loadAd()
            fireCallback(false, "ad_not_ready")
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                rewardedAd = null
                loadAd()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                rewardedAd = null
                loadAd()
                fireCallback(false, error.message)
            }
        }

        activity.runOnUiThread {
            ad.show(activity) { _ ->
                // Reward earned — coins are tracked on the frontend
                fireCallback(true, null)
            }
        }
    }

    @JavascriptInterface
    fun preload() {
        loadAd()
    }

    private fun fireCallback(success: Boolean, error: String?) {
        val js = if (success) {
            "window.__admobCallback && window.__admobCallback(true, null)"
        } else {
            val safe = (error ?: "unknown")
                .replace("\\", "\\\\")
                .replace("'", "\\'")
            "window.__admobCallback && window.__admobCallback(false, '$safe')"
        }
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }
}
