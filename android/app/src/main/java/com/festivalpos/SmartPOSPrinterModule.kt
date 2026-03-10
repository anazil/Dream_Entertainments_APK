package com.festivalpos

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.zcs.sdk.DriverManager
import com.zcs.sdk.Printer
import com.zcs.sdk.SdkResult
import com.zcs.sdk.print.PrnStrFormat
import com.zcs.sdk.print.PrnTextFont
import com.zcs.sdk.print.PrnTextStyle
import android.text.Layout

class SmartPOSPrinterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var mDriverManager: DriverManager? = null
    private var mPrinter: Printer? = null

    init {
        try {
            mDriverManager = DriverManager.getInstance()
            mPrinter = mDriverManager?.getPrinter()
        } catch (e: Exception) {
            // Handle initialization error
        }
    }

    override fun getName(): String {
        return "SmartPOSPrinter"
    }

    @ReactMethod
    fun printText(text: String, promise: Promise) {
        try {
            val printer = mPrinter ?: run {
                promise.reject("PRINTER_ERROR", "Printer not initialized")
                return
            }
            
            // Debug: Check printer status first
            val printStatus = printer.getPrinterStatus()
            android.util.Log.d("SmartPOSPrinter", "Printer status: $printStatus")
            
            when (printStatus) {
                SdkResult.SDK_PRN_STATUS_PAPEROUT -> {
                    promise.reject("PAPER_OUT", "Out of paper")
                    return
                }
                SdkResult.SDK_OK -> {
                    android.util.Log.d("SmartPOSPrinter", "Printer ready")
                }
                else -> {
                    android.util.Log.w("SmartPOSPrinter", "Printer status warning: $printStatus")
                }
            }

            val format = PrnStrFormat()
            format.setTextSize(24)
            format.setAli(Layout.Alignment.ALIGN_NORMAL)
            format.setFont(PrnTextFont.MONOSPACE)

            printer.setPrintAppendString(text, format)
            printer.setPrintAppendString("", format)
            printer.setPrintAppendString("", format)
            
            val result = printer.setPrintStart()
            android.util.Log.d("SmartPOSPrinter", "Print result: $result")
            
            if (result == SdkResult.SDK_OK) {
                promise.resolve("Print successful")
            } else {
                promise.reject("PRINT_ERROR", "Print failed with code: $result")
            }
        } catch (e: Exception) {
            android.util.Log.e("SmartPOSPrinter", "Print exception: ${e.message}")
            promise.reject("PRINT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun printQRCode(data: String, promise: Promise) {
        try {
            val printer = mPrinter ?: run {
                promise.reject("PRINTER_ERROR", "Printer not initialized")
                return
            }
            
            val printStatus = printer.getPrinterStatus()
            if (printStatus == SdkResult.SDK_PRN_STATUS_PAPEROUT) {
                promise.reject("PAPER_OUT", "Out of paper")
                return
            }

            printer.setPrintAppendQRCode(data, 200, 200, Layout.Alignment.ALIGN_CENTER)
            val result = printer.setPrintStart()
            
            if (result == SdkResult.SDK_OK) {
                promise.resolve("QR Code printed successfully")
            } else {
                promise.reject("PRINT_ERROR", "QR Code print failed with code: $result")
            }
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun cutPaper(promise: Promise) {
        try {
            val printer = mPrinter ?: run {
                promise.reject("PRINTER_ERROR", "Printer not initialized")
                return
            }
            
            val printStatus = printer.getPrinterStatus()
            if (printStatus == SdkResult.SDK_OK) {
                printer.openPrnCutter(1.toByte())
                promise.resolve("Paper cut successful")
            } else {
                promise.reject("CUT_ERROR", "Cannot cut paper, printer status: $printStatus")
            }
        } catch (e: Exception) {
            promise.reject("CUT_ERROR", e.message)
        }
    }
}