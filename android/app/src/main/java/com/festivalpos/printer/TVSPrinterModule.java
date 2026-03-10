package com.festivalpos.printer;

import android.text.Layout;
import android.widget.Toast;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.zcs.sdk.DriverManager;
import com.zcs.sdk.Printer;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.print.PrnStrFormat;
import com.zcs.sdk.print.PrnTextFont;
import com.zcs.sdk.print.PrnTextStyle;

public class TVSPrinterModule extends ReactContextBaseJavaModule {
    private DriverManager mDriverManager;
    private Printer mPrinter;
    private ReactApplicationContext reactContext;

    public TVSPrinterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        initializePrinter();
    }

    private void initializePrinter() {
        try {
            // Wait a bit for system to be ready
            Thread.sleep(1000);
            mDriverManager = DriverManager.getInstance();
            if (mDriverManager != null) {
                mPrinter = mDriverManager.getPrinter();
                // Force a status check to wake up the printer
                if (mPrinter != null) {
                    mPrinter.getPrinterStatus();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public String getName() {
        return "TVSPrinter";
    }

    @ReactMethod
    public void printTicket(String ticketData, Promise promise) {
        try {
            if (mPrinter == null) {
                initializePrinter();
                if (mPrinter == null) {
                    promise.reject("PRINTER_ERROR", "Printer not initialized");
                    return;
                }
            }

            int printStatus = mPrinter.getPrinterStatus();
            if (printStatus == SdkResult.SDK_PRN_STATUS_PAPEROUT) {
                promise.reject("PAPER_OUT", "Out of paper");
                return;
            }
            
            if (printStatus != SdkResult.SDK_OK) {
                promise.reject("PRINTER_NOT_READY", "Printer status: " + printStatus);
                return;
            }

            PrnStrFormat format = new PrnStrFormat();
            format.setTextSize(25);
            format.setStyle(PrnTextStyle.NORMAL);
            format.setFont(PrnTextFont.MONOSPACE);
            format.setAli(Layout.Alignment.ALIGN_CENTER);

            mPrinter.setPrintAppendString("DREAMS ENTERTAINMENT", format);
            mPrinter.setPrintAppendString("================================", format);

            format.setAli(Layout.Alignment.ALIGN_NORMAL);
            
            String[] lines = ticketData.split("\\n");
            for (String line : lines) {
                if (line.trim().isEmpty()) {
                    mPrinter.setPrintAppendString(" ", format);
                } else {
                    mPrinter.setPrintAppendString(line, format);
                }
            }

            mPrinter.setPrintAppendString(" ", format);
            mPrinter.setPrintAppendString(" ", format);
            
            int result = mPrinter.setPrintStart();
            
            if (result == SdkResult.SDK_OK) {
                if (mPrinter.isSuppoerCutter()) {
                    mPrinter.openPrnCutter((byte) 1);
                }
                promise.resolve("Print successful");
            } else {
                promise.reject("PRINT_ERROR", "Print failed with code: " + result);
            }

        } catch (Exception e) {
            promise.reject("PRINT_EXCEPTION", e.getMessage());
        }
    }

    @ReactMethod
    public void printQRCode(String qrData, Promise promise) {
        try {
            if (mPrinter == null) {
                initializePrinter();
                if (mPrinter == null) {
                    promise.reject("PRINTER_ERROR", "Printer not initialized");
                    return;
                }
            }

            int printStatus = mPrinter.getPrinterStatus();
            if (printStatus != SdkResult.SDK_OK) {
                promise.reject("PRINTER_NOT_READY", "Printer status: " + printStatus);
                return;
            }

            mPrinter.setPrintAppendQRCode(qrData, 200, 200, Layout.Alignment.ALIGN_CENTER);
            int result = mPrinter.setPrintStart();
            
            if (result == SdkResult.SDK_OK) {
                promise.resolve("QR Code printed successfully");
            } else {
                promise.reject("PRINT_ERROR", "QR Code print failed with code: " + result);
            }

        } catch (Exception e) {
            promise.reject("PRINT_EXCEPTION", e.getMessage());
        }
    }

    @ReactMethod
    public void checkPrinterStatus(Promise promise) {
        try {
            if (mPrinter == null) {
                initializePrinter();
                if (mPrinter == null) {
                    promise.reject("PRINTER_ERROR", "Printer not initialized");
                    return;
                }
            }

            int status = mPrinter.getPrinterStatus();
            String statusMessage;
            
            switch (status) {
                case SdkResult.SDK_OK:
                    statusMessage = "Ready";
                    break;
                case SdkResult.SDK_PRN_STATUS_PAPEROUT:
                    statusMessage = "Paper out";
                    break;
                default:
                    statusMessage = "Error: " + status;
                    break;
            }
            
            promise.resolve(statusMessage);

        } catch (Exception e) {
            promise.reject("STATUS_ERROR", e.getMessage());
        }
    }
}