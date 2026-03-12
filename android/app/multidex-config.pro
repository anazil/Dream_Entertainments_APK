# MultiDex configuration for FestivalPOS
# Keep main dex classes that are required for app startup

-keep class com.festivalpos.MainApplication
-keep class com.festivalpos.MainActivity
-keep class com.festivalpos.printer.TVSPrinterModule
-keep class com.festivalpos.printer.TVSPrinterPackage

# Keep React Native core classes in main dex
-keep class com.facebook.react.ReactApplication
-keep class com.facebook.react.ReactActivity
-keep class com.facebook.react.ReactPackage
-keep class com.facebook.react.bridge.ReactApplicationContext
-keep class com.facebook.react.bridge.ReactContextBaseJavaModule

# Keep Expo core classes in main dex
-keep class expo.modules.ApplicationLifecycleDispatcher
-keep class expo.modules.ReactNativeHostWrapper

# Prevent obfuscation of printer-related classes
-keep class android.device.** { *; }
-dontwarn android.device.**