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
 * Coins ad:   window.__admobCallback(success, error)   → window.JNAdMob.showRewardedAd()
 * Diamonds ad: window.__admobDiamondCallback(success, error) → window.JNAdMob.showDiamondAd()
 */
class AdMobBridge(private val activity: Activity, private val webView: WebView) {

    // ── Coins ──────────────────────────────────────────────────────────────────
    private var coinAd: RewardedAd? = null
    private var coinLoading = false

    // ── Diamonds ───────────────────────────────────────────────────────────────
    private var diamondAd: RewardedAd? = null
    private var diamondLoading = false

    companion object {
        private const val COIN_AD_UNIT_ID    = "ca-app-pub-8685487552580546/6291376522"
        private const val DIAMOND_AD_UNIT_ID = "ca-app-pub-8685487552580546/2289967044"
    }

    init {
        loadCoinAd()
        loadDiamondAd()
    }

    // ── Coin ad load ───────────────────────────────────────────────────────────

    private fun loadCoinAd() {
        if (coinLoading || coinAd != null) return
        coinLoading = true
        activity.runOnUiThread {
            RewardedAd.load(
                activity,
                COIN_AD_UNIT_ID,
                AdRequest.Builder().build(),
                object : RewardedAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedAd) {
                        coinAd = ad
                        coinLoading = false
                    }
                    override fun onAdFailedToLoad(error: LoadAdError) {
                        coinAd = null
                        coinLoading = false
                    }
                }
            )
        }
    }

    // ── Diamond ad load ────────────────────────────────────────────────────────

    private fun loadDiamondAd() {
        if (diamondLoading || diamondAd != null) return
        diamondLoading = true
        activity.runOnUiThread {
            RewardedAd.load(
                activity,
                DIAMOND_AD_UNIT_ID,
                AdRequest.Builder().build(),
                object : RewardedAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedAd) {
                        diamondAd = ad
                        diamondLoading = false
                    }
                    override fun onAdFailedToLoad(error: LoadAdError) {
                        diamondAd = null
                        diamondLoading = false
                    }
                }
            )
        }
    }

    // ── JS interface: coins ────────────────────────────────────────────────────

    @JavascriptInterface
    fun showRewardedAd() {
        val ad = coinAd
        if (ad == null) {
            loadCoinAd()
            fireCoinCallback(false, "ad_not_ready")
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                coinAd = null
                loadCoinAd()
            }
            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                coinAd = null
                loadCoinAd()
                fireCoinCallback(false, error.message)
            }
        }

        activity.runOnUiThread {
            ad.show(activity) { _ ->
                fireCoinCallback(true, null)
            }
        }
    }

    @JavascriptInterface
    fun preload() {
        loadCoinAd()
    }

    // ── JS interface: diamonds ─────────────────────────────────────────────────

    @JavascriptInterface
    fun showDiamondAd() {
        val ad = diamondAd
        if (ad == null) {
            loadDiamondAd()
            fireDiamondCallback(false, "ad_not_ready")
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                diamondAd = null
                loadDiamondAd()
            }
            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                diamondAd = null
                loadDiamondAd()
                fireDiamondCallback(false, error.message)
            }
        }

        activity.runOnUiThread {
            ad.show(activity) { _ ->
                fireDiamondCallback(true, null)
            }
        }
    }

    @JavascriptInterface
    fun preloadDiamond() {
        loadDiamondAd()
    }

    // ── Callback helpers ───────────────────────────────────────────────────────

    private fun fireCoinCallback(success: Boolean, error: String?) {
        fireJs("window.__admobCallback && window.__admobCallback(${success}, ${errorArg(error)})")
    }

    private fun fireDiamondCallback(success: Boolean, error: String?) {
        fireJs("window.__admobDiamondCallback && window.__admobDiamondCallback(${success}, ${errorArg(error)})")
    }

    private fun errorArg(error: String?): String {
        if (error == null) return "null"
        val safe = error.replace("\\", "\\\\").replace("'", "\\'")
        return "'$safe'"
    }

    private fun fireJs(js: String) {
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }
}
