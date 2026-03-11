package com.festivalpos.printer;

import android.text.Layout;
import android.widget.Toast;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.LifecycleEventListener;
import com.zcs.sdk.DriverManager;
import com.zcs.sdk.Printer;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.Sys;
import com.zcs.sdk.print.PrnStrFormat;
import com.zcs.sdk.print.PrnTextFont;
import com.zcs.sdk.print.PrnTextStyle;

public class TVSPrinterModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final String TAG = "TVSPrinterModule";
    private DriverManager mDriverManager;
    private Printer mPrinter;
    private Sys mSys;
    private ReactApplicationContext reactContext;
    private boolean isInitialized = false;
    private boolean isInitializing = false;
    private Handler mainHandler;
    private int initRetryCount = 0;
    private static final int MAX_RETRY_COUNT = 3;
    private static final int INIT_DELAY_MS = 2000;

    public TVSPrinterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.mainHandler = new Handler(Looper.getMainLooper());
        
        // Register lifecycle listener
        reactContext.addLifecycleEventListener(this);
        
        // Delay initialization to allow device services to start
        delayedInitialization();
    }

    private void delayedInitialization() {
        mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                initializePrinter();
            }
        }, INIT_DELAY_MS);
    }

    private synchronized void initializePrinter() {
        if (isInitialized || isInitializing) {
            return;
        }
        
        isInitializing = true;
        Log.d(TAG, "Starting printer initialization, attempt: " + (initRetryCount + 1));
        
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // Step 1: Get DriverManager instance
                    mDriverManager = DriverManager.getInstance();
                    if (mDriverManager == null) {
                        Log.e(TAG, "DriverManager.getInstance() returned null");
                        handleInitializationFailure();
                        return;
                    }
                    Log.d(TAG, "DriverManager obtained successfully");
                    
                    // Step 2: Get system device
                    mSys = mDriverManager.getBaseSysDevice();
                    if (mSys == null) {
                        Log.e(TAG, "getBaseSysDevice() returned null");
                        handleInitializationFailure();
                        return;
                    }
                    Log.d(TAG, "System device obtained successfully");
                    
                    // Step 3: Power on the system first
                    Log.d(TAG, "Powering on system...");
                    int powerResult = mSys.sysPowerOn();
                    Log.d(TAG, "Power on result: " + powerResult);
                    
                    // Wait for system to be ready
                    Thread.sleep(2000);
                    
                    // Step 4: Initialize SDK
                    Log.d(TAG, "Initializing SDK...");
                    int sdkStatus = mSys.sdkInit();
                    Log.d(TAG, "SDK init result: " + sdkStatus);
                    
                    if (sdkStatus != SdkResult.SDK_OK) {
                        Log.w(TAG, "First SDK init failed, retrying...");
                        Thread.sleep(1000);
                        sdkStatus = mSys.sdkInit();
                        Log.d(TAG, "SDK retry result: " + sdkStatus);
                    }
                    
                    if (sdkStatus == SdkResult.SDK_OK) {
                        // Step 5: Get printer instance
                        mPrinter = mDriverManager.getPrinter();
                        if (mPrinter == null) {
                            Log.e(TAG, "getPrinter() returned null");
                            handleInitializationFailure();
                            return;
                        }
                        
                        // Step 6: Test printer availability
                        int printerStatus = mPrinter.getPrinterStatus();
                        Log.d(TAG, "Printer status: " + printerStatus);
                        
                        isInitialized = true;
                        isInitializing = false;
                        initRetryCount = 0;
                        Log.d(TAG, "Printer initialization successful!");
                        
                        // Show success toast on main thread
                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(reactContext, "Printer initialized successfully", Toast.LENGTH_SHORT).show();
                            }
                        });
                        
                    } else {
                        Log.e(TAG, "SDK initialization failed with status: " + sdkStatus);
                        handleInitializationFailure();
                    }
                    
                } catch (Exception e) {
                    Log.e(TAG, "Exception during initialization: " + e.getMessage(), e);
                    handleInitializationFailure();
                }
            }
        }).start();
    }
    
    private void handleInitializationFailure() {
        isInitializing = false;
        initRetryCount++;
        
        if (initRetryCount < MAX_RETRY_COUNT) {
            Log.d(TAG, "Retrying initialization in 3 seconds...");
            mainHandler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    initializePrinter();
                }
            }, 3000);
        } else {
            Log.e(TAG, "Max retry attempts reached. Printer initialization failed.");
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(reactContext, "Printer initialization failed after " + MAX_RETRY_COUNT + " attempts", Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    @Override
    public String getName() {
        return "TVSPrinter";
    }
    
    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume called");
        // Re-initialize if not already initialized
        if (!isInitialized && !isInitializing) {
            delayedInitialization();
        }
    }
    
    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause called");
        // Keep printer initialized for background operations
    }
    
    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy called");
        cleanup();
    }
    
    private void cleanup() {
        try {
            if (mSys != null) {
                mSys.sdkClose();
            }
            isInitialized = false;
            isInitializing = false;
            mPrinter = null;
            mSys = null;
            mDriverManager = null;
        } catch (Exception e) {
            Log.e(TAG, "Error during cleanup: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void printTicket(String ticketData, Promise promise) {
        Log.d(TAG, "printTicket called");
        
        if (!isInitialized || mPrinter == null) {
            Log.w(TAG, "Printer not initialized, attempting to initialize...");
            
            // Try to initialize synchronously for immediate use
            if (!isInitializing) {
                initializePrinter();
                
                // Wait a bit for initialization
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            
            if (!isInitialized || mPrinter == null) {
                String errorMsg = "Printer not ready. Status: initialized=" + isInitialized + 
                                ", initializing=" + isInitializing + ", printer=" + (mPrinter != null);
                Log.e(TAG, errorMsg);
                promise.reject("PRINTER_NOT_READY", errorMsg);
                return;
            }
        }
        
        new Thread(new Runnable() {
            @Override
            public void run() {
                performPrint(ticketData, promise);
            }
        }).start();
    }
    
    private void performPrint(String ticketData, Promise promise) {
        try {
            Log.d(TAG, "Starting print operation");

            int printStatus = mPrinter.getPrinterStatus();
            Log.d(TAG, "Printer status: " + printStatus);
            
            if (printStatus == SdkResult.SDK_PRN_STATUS_PAPEROUT) {
                Log.e(TAG, "Printer out of paper");
                promise.reject("PAPER_OUT", "Out of paper");
                return;
            }
            
            if (printStatus != SdkResult.SDK_OK) {
                Log.e(TAG, "Printer not ready, status: " + printStatus);
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
            Log.d(TAG, "Print start result: " + result);
            
            if (result == SdkResult.SDK_OK) {
                Log.d(TAG, "Print successful");
                
                // Cut paper if supported
                try {
                    if (mPrinter.isSuppoerCutter()) {
                        Log.d(TAG, "Cutting paper");
                        mPrinter.openPrnCutter((byte) 1);
                    }
                } catch (Exception cutterException) {
                    Log.w(TAG, "Cutter operation failed: " + cutterException.getMessage());
                }
                
                promise.resolve("Print successful");
            } else {
                Log.e(TAG, "Print failed with code: " + result);
                promise.reject("PRINT_ERROR", "Print failed with code: " + result);
            }

        } catch (Exception e) {
            Log.e(TAG, "Print exception: " + e.getMessage(), e);
            promise.reject("PRINT_EXCEPTION", e.getMessage());
        }
    }

    @ReactMethod
    public void printQRCode(String qrData, Promise promise) {
        Log.d(TAG, "printQRCode called");
        
        if (!isInitialized || mPrinter == null) {
            Log.e(TAG, "Printer not initialized for QR code printing");
            promise.reject("PRINTER_ERROR", "SDK not initialized");
            return;
        }
        
        new Thread(new Runnable() {
            @Override
            public void run() {
                performQRPrint(qrData, promise);
            }
        }).start();
    }
    
    private void performQRPrint(String qrData, Promise promise) {
        try {
            Log.d(TAG, "Starting QR code print operation");
            
            int printStatus = mPrinter.getPrinterStatus();
            Log.d(TAG, "Printer status for QR: " + printStatus);
            
            if (printStatus != SdkResult.SDK_OK) {
                Log.e(TAG, "Printer not ready for QR, status: " + printStatus);
                promise.reject("PRINTER_NOT_READY", "Printer status: " + printStatus);
                return;
            }

            Log.d(TAG, "Printing QR code: " + qrData);
            mPrinter.setPrintAppendQRCode(qrData, 200, 200, Layout.Alignment.ALIGN_CENTER);
            int result = mPrinter.setPrintStart();
            Log.d(TAG, "QR print result: " + result);
            
            if (result == SdkResult.SDK_OK) {
                Log.d(TAG, "QR Code printed successfully");
                promise.resolve("QR Code printed successfully");
            } else {
                Log.e(TAG, "QR Code print failed with code: " + result);
                promise.reject("PRINT_ERROR", "QR Code print failed with code: " + result);
            }

        } catch (Exception e) {
            Log.e(TAG, "QR print exception: " + e.getMessage(), e);
            promise.reject("PRINT_EXCEPTION", e.getMessage());
        }
    }

    @ReactMethod
    public void checkPrinterStatus(Promise promise) {
        Log.d(TAG, "checkPrinterStatus called");
        
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (!isInitialized || mPrinter == null) {
                        Log.w(TAG, "Printer not initialized during status check");
                        
                        String statusMsg = "Not initialized (initialized=" + isInitialized + 
                                         ", initializing=" + isInitializing + 
                                         ", printer=" + (mPrinter != null) + ")";
                        promise.resolve(statusMsg);
                        return;
                    }

                    int status = mPrinter.getPrinterStatus();
                    Log.d(TAG, "Printer status code: " + status);
                    
                    String statusMessage;
                    
                    switch (status) {
                        case SdkResult.SDK_OK:
                            statusMessage = "Ready";
                            break;
                        case SdkResult.SDK_PRN_STATUS_PAPEROUT:
                            statusMessage = "Paper out";
                            break;
                        case SdkResult.SDK_PRN_STATUS_OVERHEAT:
                            statusMessage = "Overheated";
                            break;
                        case SdkResult.SDK_PRN_STATUS_LOWPOWER:
                            statusMessage = "Low power";
                            break;
                        default:
                            statusMessage = "Error: " + status;
                            break;
                    }
                    
                    Log.d(TAG, "Printer status message: " + statusMessage);
                    promise.resolve(statusMessage);

                } catch (Exception e) {
                    Log.e(TAG, "Status check exception: " + e.getMessage(), e);
                    promise.reject("STATUS_ERROR", e.getMessage());
                }
            }
        }).start();
    }
    
    @ReactMethod
    public void forceReinitialize(Promise promise) {
        Log.d(TAG, "forceReinitialize called");
        
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // Reset state
                    isInitialized = false;
                    isInitializing = false;
                    initRetryCount = 0;
                    
                    // Cleanup existing resources
                    cleanup();
                    
                    // Wait a bit
                    Thread.sleep(1000);
                    
                    // Reinitialize
                    initializePrinter();
                    
                    // Wait for initialization
                    int waitCount = 0;
                    while (isInitializing && waitCount < 10) {
                        Thread.sleep(500);
                        waitCount++;
                    }
                    
                    if (isInitialized) {
                        promise.resolve("Reinitialization successful");
                    } else {
                        promise.reject("REINIT_FAILED", "Reinitialization failed");
                    }
                    
                } catch (Exception e) {
                    Log.e(TAG, "Reinitialize exception: " + e.getMessage(), e);
                    promise.reject("REINIT_EXCEPTION", e.getMessage());
                }
            }
        }).start();
    }
}