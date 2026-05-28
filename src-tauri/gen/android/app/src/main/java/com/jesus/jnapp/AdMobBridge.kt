package com.jesus.jnapp

import android.app.Activity
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
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
        // Wait for MobileAds SDK init to complete before loading ads.
        // MobileAds.initialize is idempotent — callback fires immediately if already done.
        MobileAds.initialize(activity) {
            activity.runOnUiThread {
                loadCoinAd()
                loadDiamondAd()
            }
        }
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
        waitAndShowCoin(attemptsLeft = 10)
    }

    private fun waitAndShowCoin(attemptsLeft: Int) {
        val ad = coinAd
        if (ad != null) {
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
                ad.show(activity) { _ -> fireCoinCallback(true, null) }
            }
            return
        }
        if (attemptsLeft <= 0) {
            loadCoinAd()
            fireCoinCallback(false, "ad_not_ready")
            return
        }
        // Ad still loading — wait 500ms and retry
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            waitAndShowCoin(attemptsLeft - 1)
        }, 500)
    }

    @JavascriptInterface
    fun preload() {
        loadCoinAd()
    }

    // ── JS interface: diamonds ─────────────────────────────────────────────────

    @JavascriptInterface
    fun showDiamondAd() {
        waitAndShowDiamond(attemptsLeft = 10)
    }

    private fun waitAndShowDiamond(attemptsLeft: Int) {
        val ad = diamondAd
        if (ad != null) {
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
                ad.show(activity) { _ -> fireDiamondCallback(true, null) }
            }
            return
        }
        if (attemptsLeft <= 0) {
            loadDiamondAd()
            fireDiamondCallback(false, "ad_not_ready")
            return
        }
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            waitAndShowDiamond(attemptsLeft - 1)
        }, 500)
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
