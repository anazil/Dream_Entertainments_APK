# TVS SDK Integration Build Instructions

## Files Added/Modified:

### 1. SDK Files Copied:
- `android/app/libs/SmartPos_1.9.0_R240612.jar`
- `android/app/src/main/jniLibs/arm64-v8a/libSmartPosJni.so`
- `android/app/src/main/jniLibs/arm64-v8a/libEmvCoreJni.so`
- `android/app/src/main/jniLibs/armeabi-v7a/libSmartPosJni.so`
- `android/app/src/main/jniLibs/armeabi-v7a/libEmvCoreJni.so`

### 2. Native Module Created:
- `android/app/src/main/java/com/festivalpos/printer/TVSPrinterModule.java`
- `android/app/src/main/java/com/festivalpos/printer/TVSPrinterPackage.java`

### 3. Modified Files:
- `android/app/src/main/java/com/festivalpos/MainApplication.kt` - Added TVSPrinterPackage
- `android/app/build.gradle` - Added SDK JAR dependency
- `src/services/printerService.js` - Updated to use TVS SDK
- `src/services/tvsPrinterTest.js` - Test utility (NEW)

## Build Steps:

1. Clean the project:
   ```
   cd android
   ./gradlew clean
   ```

2. Build the project:
   ```
   ./gradlew assembleDebug
   ```

3. Install on device:
   ```
   npx react-native run-android
   ```

## Testing:

1. Import the test utility in your screen:
   ```javascript
   import { testTVSPrinter, printSampleTicket } from '../services/tvsPrinterTest';
   ```

2. Add test buttons to your UI:
   ```javascript
   <Button title="Test TVS Printer" onPress={testTVSPrinter} />
   <Button title="Print Sample Ticket" onPress={printSampleTicket} />
   ```

## Troubleshooting:

1. If module not found:
   - Ensure MainApplication.kt includes TVSPrinterPackage
   - Clean and rebuild the project
   - Check that JAR file is in android/app/libs/

2. If printer not responding:
   - Check printer status with checkPrinterStatus()
   - Ensure device has printer permission
   - Verify printer is connected and has paper

3. If build fails:
   - Check that all native libraries are in jniLibs folders
   - Verify JAR file is properly referenced in build.gradle
   - Clean project and rebuild

## Available Methods:

- `TVSPrinter.printTicket(text)` - Print formatted ticket
- `TVSPrinter.printQRCode(data)` - Print QR code
- `TVSPrinter.checkPrinterStatus()` - Check printer status

The integration is now complete and ready for testing on the TVS device.