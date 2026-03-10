# FestivalPOS - Installation Guide

## Install Required Dependencies

Run the following command in your project directory:

```bash
npm install expo-sqlite axios @react-native-community/netinfo
```

Or with yarn:

```bash
yarn add expo-sqlite axios @react-native-community/netinfo
```

## Configuration

### 1. Update Django API URL

Edit `src/services/api.js` and replace the API_BASE_URL with your Django backend URL:

```javascript
const API_BASE_URL = 'http://your-django-api.com/api';
```

### 2. Django Backend Setup

Your Django API should have an endpoint `/api/tickets/` that accepts POST requests with the following structure:

```json
{
  "ticket_number": "TKT1234567890123",
  "customer_name": "John Doe",
  "customer_phone": "1234567890",
  "amount": 100.50,
  "payment_method": "CASH",
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

## Running the App

```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for Web

## Features

✅ Offline-first ticket generation
✅ Local SQLite storage
✅ Auto-sync when online
✅ Manual sync option
✅ Network status indicator
✅ Clean POS UI
✅ Multiple payment methods (Cash, Card, UPI)
✅ Form validation

## File Structure

```
src/
├── database/
│   └── db.js              # SQLite database setup and operations
├── screens/
│   └── GenerateTicketScreen.js  # Main ticket generation screen
├── services/
│   └── api.js             # Axios API service for Django backend
└── utils/
    └── syncManager.js     # Offline sync management
```
