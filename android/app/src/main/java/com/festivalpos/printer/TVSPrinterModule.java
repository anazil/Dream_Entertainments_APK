package com.festivalpos.printer;

import android.widget.Toast;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.graphics.Bitmap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;

import android.device.PrinterManager;

public class TVSPrinterModule extends ReactContextBaseJavaModule {
    private static final String TAG = "TVSPrinterModule";
    private PrinterManager mPrinter;
    private ReactApplicationContext reactContext;
    private Handler mainHandler;
    
    // Printer page settings
    private static final int PAGE_WIDTH = 384;  // 48mm thermal printer (8 dots/mm)
    private static final int PAGE_HEIGHT = -1;  // Auto height
    
    // Text formatting
    private static final String FONT_FAMILY = "sans-serif";
    private static final int FONT_SIZE_NORMAL = 24;
    private static final int FONT_SIZE_LARGE = 28;
    private static final int FONT_SIZE_SMALL = 20;
    
    // Layout positions
    private static final int MARGIN_LEFT = 10;
    private static final int LINE_HEIGHT = 30;

    public TVSPrinterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.mainHandler = new Handler(Looper.getMainLooper());
        
        // Initialize printer
        initializePrinter();
    }

    private void initializePrinter() {
        try {
            Log.d(TAG, "Initializing PrinterManager...");
            mPrinter = new PrinterManager();
            Log.d(TAG, "PrinterManager initialized successfully");
            
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(reactContext, "Printer initialized successfully", Toast.LENGTH_SHORT).show();
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize PrinterManager: " + e.getMessage(), e);
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(reactContext, "Printer initialization failed", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    @Override
    public String getName() {
        return "TVSPrinter";
    }

    @ReactMethod
    public void printTicket(String ticketData, Promise promise) {
        Log.d(TAG, "printTicket called");
        
        if (mPrinter == null) {
            Log.e(TAG, "Printer not initialized");
            promise.reject("PRINTER_NOT_READY", "Printer not initialized");
            return;
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

            // Open printer
            int openResult = mPrinter.open();
            if (openResult != 0) {
                Log.e(TAG, "Failed to open printer: " + openResult);
                promise.reject("PRINTER_OPEN_FAILED", "Failed to open printer: " + openResult);
                return;
            }
            Log.d(TAG, "Printer opened successfully");

            // Setup page
            int setupResult = mPrinter.setupPage(PAGE_WIDTH, PAGE_HEIGHT);
            if (setupResult != 0) {
                Log.e(TAG, "Failed to setup page: " + setupResult);
                mPrinter.close();
                promise.reject("PAGE_SETUP_FAILED", "Failed to setup page: " + setupResult);
                return;
            }
            Log.d(TAG, "Page setup successful");

            // Draw header
            int yPosition = 20;
            
            // Company name (centered, large)
            drawCenteredText("DREAMS ENTERTAINMENT", yPosition, FONT_SIZE_LARGE, true);
            yPosition += LINE_HEIGHT + 10;
            
            // Separator line
            drawCenteredText("================================", yPosition, FONT_SIZE_SMALL, false);
            yPosition += LINE_HEIGHT;

            // Parse and draw ticket data
            String[] lines = ticketData.split("\\\\n");
            for (String line : lines) {
                if (line.trim().isEmpty()) {
                    yPosition += LINE_HEIGHT / 2;
                } else if (line.contains("---") || line.contains("===")) {
                    // Separator lines
                    drawCenteredText(line, yPosition, FONT_SIZE_SMALL, false);
                    yPosition += LINE_HEIGHT;
                } else {
                    // Regular text
                    mPrinter.drawText(line, MARGIN_LEFT, yPosition, FONT_FAMILY, FONT_SIZE_NORMAL, false, false, 0);
                    yPosition += LINE_HEIGHT;
                }
            }

            // Add some space before footer
            yPosition += LINE_HEIGHT;
            
            // Footer
            drawCenteredText("THANK YOU", yPosition, FONT_SIZE_NORMAL, true);
            yPosition += LINE_HEIGHT * 2;

            // Print the page
            Log.d(TAG, "Printing page...");
            int printResult = mPrinter.printPage(0);
            
            if (printResult == 0) {
                Log.d(TAG, "Print successful");
                
                // Close printer
                mPrinter.close();
                
                promise.resolve("Print successful");
            } else {
                Log.e(TAG, "Print failed with code: " + printResult);
                mPrinter.close();
                promise.reject("PRINT_ERROR", "Print failed with code: " + printResult);
            }

        } catch (Exception e) {
            Log.e(TAG, "Print exception: " + e.getMessage(), e);
            try {
                mPrinter.close();
            } catch (Exception closeEx) {
                Log.e(TAG, "Failed to close printer: " + closeEx.getMessage());
            }
            promise.reject("PRINT_EXCEPTION", e.getMessage());
        }
    }

    @ReactMethod
    public void printQRCode(String qrData, Promise promise) {
        Log.d(TAG, "printQRCode called with data: " + qrData);
        
        if (mPrinter == null) {
            Log.e(TAG, "Printer not initialized for QR code printing");
            promise.reject("PRINTER_NOT_READY", "Printer not initialized");
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
            
            // Open printer
            int openResult = mPrinter.open();
            if (openResult != 0) {
                Log.e(TAG, "Failed to open printer for QR: " + openResult);
                promise.reject("PRINTER_OPEN_FAILED", "Failed to open printer: " + openResult);
                return;
            }

            // Setup page
            int setupResult = mPrinter.setupPage(PAGE_WIDTH, PAGE_HEIGHT);
            if (setupResult != 0) {
                Log.e(TAG, "Failed to setup page for QR: " + setupResult);
                mPrinter.close();
                promise.reject("PAGE_SETUP_FAILED", "Failed to setup page: " + setupResult);
                return;
            }

            // Calculate centered position for QR code
            int qrSize = 200;
            int qrX = (PAGE_WIDTH - qrSize) / 2;
            int qrY = 20;

            // Draw QR code using barcode method
            // Type 8 is typically QR code in PrinterManager
            Log.d(TAG, "Drawing QR code at position (" + qrX + ", " + qrY + ")");
            int drawResult = mPrinter.drawBarcode(qrData, qrX, qrY, qrSize, qrSize, 8, 0);
            
            if (drawResult != 0) {
                Log.w(TAG, "drawBarcode returned: " + drawResult + ", trying alternative method");
                
                // Alternative: Generate QR bitmap and print as image
                try {
                    Bitmap qrBitmap = generateQRCodeBitmap(qrData, qrSize);
                    if (qrBitmap != null) {
                        mPrinter.drawImage(qrBitmap, qrX, qrY);
                        qrBitmap.recycle();
                    }
                } catch (Exception bitmapEx) {
                    Log.e(TAG, "Failed to generate QR bitmap: " + bitmapEx.getMessage());
                }
            }

            // Add label below QR code
            int labelY = qrY + qrSize + 20;
            drawCenteredText("SCAN FOR VERIFICATION", labelY, FONT_SIZE_SMALL, false);

            // Print the page
            Log.d(TAG, "Printing QR page...");
            int printResult = mPrinter.printPage(0);
            
            if (printResult == 0) {
                Log.d(TAG, "QR Code printed successfully");
                mPrinter.close();
                promise.resolve("QR Code printed successfully");
            } else {
                Log.e(TAG, "QR Code print failed with code: " + printResult);
                mPrinter.close();
                promise.reject("PRINT_ERROR", "QR Code print failed with code: " + printResult);
            }

        } catch (Exception e) {
            Log.e(TAG, "QR print exception: " + e.getMessage(), e);
            try {
                mPrinter.close();
            } catch (Exception closeEx) {
                Log.e(TAG, "Failed to close printer: " + closeEx.getMessage());
            }
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
                    if (mPrinter == null) {
                        Log.w(TAG, "Printer not initialized during status check");
                        promise.resolve("Not initialized");
                        return;
                    }

                    // Try to open printer to check status
                    int openResult = mPrinter.open();
                    
                    if (openResult == 0) {
                        // Printer is ready
                        mPrinter.close();
                        Log.d(TAG, "Printer status: Ready");
                        promise.resolve("Ready");
                    } else if (openResult == -1) {
                        Log.d(TAG, "Printer status: Already open or busy");
                        promise.resolve("Busy");
                    } else if (openResult == -2) {
                        Log.d(TAG, "Printer status: Paper out");
                        promise.resolve("Paper out");
                    } else {
                        Log.d(TAG, "Printer status: Error " + openResult);
                        promise.resolve("Error: " + openResult);
                    }

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
                    // Close existing printer if open
                    if (mPrinter != null) {
                        try {
                            mPrinter.close();
                        } catch (Exception e) {
                            Log.w(TAG, "Error closing printer during reinit: " + e.getMessage());
                        }
                    }
                    
                    // Wait a bit
                    Thread.sleep(500);
                    
                    // Reinitialize
                    mPrinter = new PrinterManager();
                    Log.d(TAG, "Printer reinitialized successfully");
                    
                    mainHandler.post(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(reactContext, "Printer reinitialized", Toast.LENGTH_SHORT).show();
                        }
                    });
                    
                    promise.resolve("Reinitialization successful");
                    
                } catch (Exception e) {
                    Log.e(TAG, "Reinitialize exception: " + e.getMessage(), e);
                    promise.reject("REINIT_EXCEPTION", e.getMessage());
                }
            }
        }).start();
    }
    
    // Helper method to draw centered text
    private void drawCenteredText(String text, int y, int fontSize, boolean bold) {
        try {
            // Approximate text width calculation (rough estimate)
            int charWidth = fontSize / 2;
            int textWidth = text.length() * charWidth;
            int x = (PAGE_WIDTH - textWidth) / 2;
            
            // Ensure x is not negative
            if (x < MARGIN_LEFT) {
                x = MARGIN_LEFT;
            }
            
            mPrinter.drawText(text, x, y, FONT_FAMILY, fontSize, bold, false, 0);
        } catch (Exception e) {
            Log.e(TAG, "Error drawing centered text: " + e.getMessage());
        }
    }
    
    // Helper method to generate QR code bitmap using ZXing
    private Bitmap generateQRCodeBitmap(String data, int size) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, size, size);
            
            int width = bitMatrix.getWidth();
            int height = bitMatrix.getHeight();
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565);
            
            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    bitmap.setPixel(x, y, bitMatrix.get(x, y) ? 0xFF000000 : 0xFFFFFFFF);
                }
            }
            
            return bitmap;
        } catch (WriterException e) {
            Log.e(TAG, "Failed to generate QR code bitmap: " + e.getMessage());
            return null;
        }
    }
}
