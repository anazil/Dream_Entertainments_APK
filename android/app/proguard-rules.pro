# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# FestivalPOS specific rules
-keep class com.festivalpos.** { *; }
-keep class com.festivalpos.printer.** { *; }

# TVS Printer SDK (if using device-specific APIs)
-keep class android.device.** { *; }
-dontwarn android.device.**

# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.react.**

# Expo modules
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# ZXing QR Code library
-keep class com.google.zxing.** { *; }
-dontwarn com.google.zxing.**

# SQLite
-keep class org.sqlite.** { *; }
-dontwarn org.sqlite.**

# Networking
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Prevent duplicate class issues
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
-dontwarn javax.inject.**

# Add any project specific keep options here:
