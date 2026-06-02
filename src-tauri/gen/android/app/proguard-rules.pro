# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Firebase / FCM
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**

# WebView JavaScript bridges (rewarded ads + APK installer)
-keep class com.jesus.jnapp.AdMobBridge { *; }
-keep class com.jesus.jnapp.ApkInstaller { *; }
-keepclassmembers class com.jesus.jnapp.AdMobBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class com.jesus.jnapp.ApkInstaller {
    @android.webkit.JavascriptInterface <methods>;
}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile