# TVS Smart POS Printer Integration Setup

## Prerequisites
- TVS Smart POS i9100 terminal
- Android development environment
- Expo CLI

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build for Android (Required for Native Modules)
```bash
# Create development build
npx expo run:android

# Or create production APK
npx expo build:android
```

### 3. TVS Printer Configuration

#### Option A: Using TVS SDK (Recommended)
1. Contact TVS for their Android SDK
2. Add SDK to `android/app/libs/`
3. Update `ThermalPrinterModule.java` to use TVS APIs

#### Option B: Generic ESC/POS (Current Implementation)
- Uses standard thermal printer commands
- Works with most POS terminals
- No additional SDK required

### 4. Deploy to TVS Terminal
```bash
# Install APK on TVS device
adb install app-release.apk

# Or use Expo development build
npx expo run:android --device
```

## Printer Features

### Auto-Print on Ticket Generation
- Tickets print automatically after generation
- Both online and offline modes supported
- Error handling for printer issues

### Thermal Receipt Format
```
    DREAMS ENTERTAINMENT
    ========================
    EVENT: Summer Festival 2024
    SUB-EVENT: Opening Ceremony
    ENTRY TYPE: VIP
    ------------------------
    TICKET ID: ST01-SF24-OC-0001
    PRICE: Rs.500
    DATE: 15/01/2024
    TIME: 14:30:25
    ------------------------
         [QR CODE]
    SCAN QR FOR VERIFICATION
    ========================
         THANK YOU
```

### Printer Status Monitoring
- Real-time printer status display
- Paper out detection
- Connection error handling

## Troubleshooting

### Printer Not Working
1. Check USB connection
2. Verify printer permissions in Android settings
3. Test with native Android print test

### Print Quality Issues
1. Check thermal paper quality
2. Adjust print density in ESC/POS commands
3. Clean printer head

### Development Testing
```bash
# Test on emulator (no actual printing)
npx expo start --android

# Test on device with printer
npx expo run:android --device
```

## Production Deployment

1. Build release APK: `npx expo build:android --type apk`
2. Install on TVS terminals
3. Configure printer settings
4. Test ticket printing workflow

## Support
- TVS Technical Support for hardware issues
- Check `ThermalPrinterModule.java` for printer integration
- Monitor console logs for print errors