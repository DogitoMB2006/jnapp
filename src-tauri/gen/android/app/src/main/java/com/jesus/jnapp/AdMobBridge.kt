package com.jesus.jnapp

import android.app.Activity
import android.util.Log
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
 *
 * Coins:   window.JNAdMob.showRewardedAd()
 * Diamonds: window.JNAdMob.showDiamondAd()
 */
class AdMobBridge(private val activity: Activity, private val webView: WebView) {

    private var coinAd: RewardedAd? = null
    private var coinLoading = false
    private var coinLoadError: String? = null
    private var coinRetryCount = 0

    private var diamondAd: RewardedAd? = null
    private var diamondLoading = false
    private var diamondLoadError: String? = null
    private var diamondRetryCount = 0

    companion object {
        private const val TAG = "AdMobBridge"
        private const val COIN_AD_UNIT_ID = "ca-app-pub-8685487552580546/6291376522"
        private const val DIAMOND_AD_UNIT_ID = "ca-app-pub-8685487552580546/2289967044"
        /** Google sample rewarded ad — always fills in debug builds */
        private const val TEST_REWARDED_AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917"
        private const val SHOW_WAIT_ATTEMPTS = 40
        private const val SHOW_WAIT_MS = 500L
        private const val MAX_LOAD_RETRIES = 6
    }

    init {
        MobileAds.initialize(activity) {
            activity.runOnUiThread {
                loadCoinAd(force = true)
                loadDiamondAd(force = true)
            }
        }
    }

    private fun coinUnitId(): String =
        if (BuildConfig.DEBUG) TEST_REWARDED_AD_UNIT_ID else COIN_AD_UNIT_ID

    private fun diamondUnitId(): String =
        if (BuildConfig.DEBUG) TEST_REWARDED_AD_UNIT_ID else DIAMOND_AD_UNIT_ID

    private fun loadCoinAd(force: Boolean = false) {
        if (coinAd != null) return
        if (coinLoading && !force) return
        coinLoading = true
        coinLoadError = null

        activity.runOnUiThread {
            Log.d(TAG, "Loading coin ad (${coinUnitId()})")
            RewardedAd.load(
                activity,
                coinUnitId(),
                AdRequest.Builder().build(),
                object : RewardedAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedAd) {
                        coinAd = ad
                        coinLoading = false
                        coinLoadError = null
                        coinRetryCount = 0
                        Log.d(TAG, "Coin ad loaded")
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        coinAd = null
                        coinLoading = false
                        coinLoadError = "load_${error.code}:${error.message}"
                        Log.e(TAG, "Coin ad failed: ${error.code} ${error.message}")
                        scheduleCoinReload()
                    }
                },
            )
        }
    }

    private fun loadDiamondAd(force: Boolean = false) {
        if (diamondAd != null) return
        if (diamondLoading && !force) return
        diamondLoading = true
        diamondLoadError = null

        activity.runOnUiThread {
            Log.d(TAG, "Loading diamond ad (${diamondUnitId()})")
            RewardedAd.load(
                activity,
                diamondUnitId(),
                AdRequest.Builder().build(),
                object : RewardedAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedAd) {
                        diamondAd = ad
                        diamondLoading = false
                        diamondLoadError = null
                        diamondRetryCount = 0
                        Log.d(TAG, "Diamond ad loaded")
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        diamondAd = null
                        diamondLoading = false
                        diamondLoadError = "load_${error.code}:${error.message}"
                        Log.e(TAG, "Diamond ad failed: ${error.code} ${error.message}")
                        scheduleDiamondReload()
                    }
                },
            )
        }
    }

    private fun scheduleCoinReload() {
        if (coinRetryCount >= MAX_LOAD_RETRIES) return
        coinRetryCount++
        val delayMs = 2000L * coinRetryCount
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            loadCoinAd(force = true)
        }, delayMs)
    }

    private fun scheduleDiamondReload() {
        if (diamondRetryCount >= MAX_LOAD_RETRIES) return
        diamondRetryCount++
        val delayMs = 2000L * diamondRetryCount
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            loadDiamondAd(force = true)
        }, delayMs)
    }

    @JavascriptInterface
    fun isCoinAdReady(): Boolean = coinAd != null

    @JavascriptInterface
    fun isDiamondAdReady(): Boolean = diamondAd != null

    @JavascriptInterface
    fun isCoinAdLoading(): Boolean = coinLoading

    @JavascriptInterface
    fun isDiamondAdLoading(): Boolean = diamondLoading

    @JavascriptInterface
    fun showRewardedAd() {
        if (coinAd == null) loadCoinAd(force = true)
        waitAndShowCoin(SHOW_WAIT_ATTEMPTS)
    }

    private fun waitAndShowCoin(attemptsLeft: Int) {
        val ad = coinAd
        if (ad != null) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    coinAd = null
                    loadCoinAd(force = true)
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    coinAd = null
                    loadCoinAd(force = true)
                    fireCoinCallback(false, "show_${error.code}:${error.message}")
                }
            }
            activity.runOnUiThread {
                ad.show(activity) { _ -> fireCoinCallback(true, null) }
            }
            return
        }

        if (attemptsLeft <= 0) {
            loadCoinAd(force = true)
            val err = coinLoadError ?: "ad_not_ready"
            fireCoinCallback(false, err)
            return
        }

        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            waitAndShowCoin(attemptsLeft - 1)
        }, SHOW_WAIT_MS)
    }

    @JavascriptInterface
    fun preload() {
        loadCoinAd(force = true)
    }

    @JavascriptInterface
    fun showDiamondAd() {
        if (diamondAd == null) loadDiamondAd(force = true)
        waitAndShowDiamond(SHOW_WAIT_ATTEMPTS)
    }

    private fun waitAndShowDiamond(attemptsLeft: Int) {
        val ad = diamondAd
        if (ad != null) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    diamondAd = null
                    loadDiamondAd(force = true)
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    diamondAd = null
                    loadDiamondAd(force = true)
                    fireDiamondCallback(false, "show_${error.code}:${error.message}")
                }
            }
            activity.runOnUiThread {
                ad.show(activity) { _ -> fireDiamondCallback(true, null) }
            }
            return
        }

        if (attemptsLeft <= 0) {
            loadDiamondAd(force = true)
            val err = diamondLoadError ?: "ad_not_ready"
            fireDiamondCallback(false, err)
            return
        }

        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            waitAndShowDiamond(attemptsLeft - 1)
        }, SHOW_WAIT_MS)
    }

    @JavascriptInterface
    fun preloadDiamond() {
        loadDiamondAd(force = true)
    }

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
