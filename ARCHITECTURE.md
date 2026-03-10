# FestivalPOS - Refactored Architecture Documentation

## Overview
The FestivalPOS app has been refactored to follow **offline-first architecture** with proper integration between UI, SQLite database, and backend services.

---

## Architecture Flow

```
App Start → Initialize DB → Fetch Master Data (Mock API) → Cache in SQLite
                                                                    ↓
User Login → Generate Ticket Screen → Read from SQLite Cache → Display Dropdowns
                                                                    ↓
Generate Ticket → Insert into tickets_local (synced=0) → Success Message
                                                                    ↓
Network Available → Auto Sync → Mark synced=1 → Update server_id
```

---

## Database Schema Changes

### New Tables

#### 1. tickets_local
```sql
- id INTEGER PRIMARY KEY AUTOINCREMENT
- ticket_id TEXT UNIQUE NOT NULL          -- Format: SF24-OC-VIP-000001
- event_id INTEGER NOT NULL
- event_name TEXT NOT NULL
- sub_event_id INTEGER NOT NULL
- sub_event_name TEXT NOT NULL
- entry_type_id INTEGER NOT NULL
- entry_type_name TEXT NOT NULL
- sequence_number INTEGER NOT NULL        -- Auto-incrementing ticket sequence
- price REAL NOT NULL
- created_at TEXT NOT NULL
- synced INTEGER DEFAULT 0                -- 0 = not synced, 1 = synced
- server_id INTEGER                       -- ID from Django backend after sync
```

#### 2. events (Master Data Cache)
```sql
- id INTEGER PRIMARY KEY
- name TEXT NOT NULL
- code TEXT NOT NULL                      -- Short code for ticket ID generation
```

#### 3. sub_events (Master Data Cache)
```sql
- id INTEGER PRIMARY KEY
- event_id INTEGER NOT NULL
- name TEXT NOT NULL
- code TEXT NOT NULL
```

#### 4. entry_types (Master Data Cache)
```sql
- id INTEGER PRIMARY KEY
- sub_event_id INTEGER NOT NULL
- name TEXT NOT NULL
- price REAL NOT NULL
```

---

## File Structure & Responsibilities

### 1. App.js
**Purpose**: App initialization and master data loading

**Flow**:
1. Initialize database schema on app start
2. Fetch master data from mock API (or real Django API when ready)
3. Cache master data in SQLite
4. Handle login state
5. Route to appropriate screen

**Key Changes**:
- Added `initializeApp()` function
- Loads and caches master data before showing UI
- Shows loading screen during initialization

---

### 2. src/database/db.js
**Purpose**: SQLite operations for tickets and master data

**New Functions**:
- `cacheEvents(events)` - Store events in SQLite
- `cacheSubEvents(subEvents)` - Store sub-events in SQLite
- `cacheEntryTypes(entryTypes)` - Store entry types in SQLite
- `getEventsFromCache()` - Read events from SQLite
- `getSubEventsByEventId(eventId)` - Read filtered sub-events
- `getEntryTypesBySubEventId(subEventId)` - Read filtered entry types
- `getNextSequenceNumber()` - Get next ticket sequence number

**Updated Functions**:
- `insertTicket(ticket)` - Now uses new schema with event/sub-event/entry-type details

---

### 3. src/services/mockMasterData.js (NEW)
**Purpose**: Simulate Django API responses for development

**Functions**:
- `getEvents()` - Returns mock events array
- `getSubEvents()` - Returns mock sub-events array
- `getEntryTypes()` - Returns mock entry types array

**Features**:
- Simulates 300ms network delay
- Returns structured JSON matching expected Django API format
- Easy to replace with real API calls

---

### 4. src/services/api.js
**Purpose**: Backend API integration layer

**Updated Functions**:
- `fetchEventsFromServer()` - Currently uses mock, ready for Django endpoint
- `fetchSubEventsFromServer()` - Currently uses mock, ready for Django endpoint
- `fetchEntryTypesFromServer()` - Currently uses mock, ready for Django endpoint
- `syncTicket(ticket)` - Currently simulates sync, ready for Django endpoint

**Integration Points** (marked with TODO comments):
```javascript
// TODO: Replace with real Django endpoint: GET /api/staff/events/
// TODO: Replace with real Django endpoint: GET /api/staff/sub-events/
// TODO: Replace with real Django endpoint: GET /api/staff/entry-types/
// TODO: Replace with real Django endpoint: POST /api/staff/tickets/
```

**How to Switch to Real API**:
1. Uncomment the axios API calls
2. Comment out the mock data imports
3. Update API_BASE_URL with real Django server URL

---

### 5. src/screens/GenerateTicketScreen.js
**Purpose**: Ticket generation UI

**Key Changes**:
- Removed hardcoded static data
- Now reads from SQLite cache using `getEventsFromCache()`, etc.
- Generates structured ticket IDs: `{EventCode}-{SubEventCode}-{EntryTypeCode}-{SequenceNumber}`
- Inserts tickets into `tickets_local` table
- Shows "Using Mock Data (Development Mode)" indicator
- Displays price in dropdown and success message

**Data Flow**:
```
Component Mount → Load Events from SQLite
User Selects Event → Load Sub-Events from SQLite (filtered by event_id)
User Selects Sub-Event → Load Entry Types from SQLite (filtered by sub_event_id)
User Clicks Generate → Insert into tickets_local → Show Success
```

---

### 6. src/utils/syncManager.js
**Purpose**: Offline sync management

**No Breaking Changes**:
- Continues to work with new schema
- Will automatically use real Django endpoint when api.js is updated
- Syncs unsynced tickets when network becomes available

---

## Ticket ID Generation

**Format**: `{EventCode}-{SubEventCode}-{EntryTypeCode}-{SequenceNumber}`

**Example**: `SF24-OC-VIP-000001`
- SF24 = Summer Festival 2024
- OC = Opening Ceremony
- VIP = VIP Entry Type
- 000001 = Sequence number (6 digits, zero-padded)

**Implementation**:
```javascript
const ticketId = `${event.code}-${subEvent.code}-${entryType.name.substring(0, 3).toUpperCase()}-${sequenceNumber.toString().padStart(6, '0')}`;
```

---

## Mock vs Real API Integration

### Current State (Mock Mode)
- Master data loaded from `mockMasterData.js`
- Ticket sync simulates success response
- 300ms delay to simulate network latency
- Orange indicator shows "Using Mock Data (Development Mode)"

### Future State (Real Django API)
**Step 1**: Update `src/services/api.js`
```javascript
// Uncomment these lines:
const response = await api.get('/staff/events/');
return response.data;

// Comment out these lines:
const { getEvents } = require('./mockMasterData');
return await getEvents();
```

**Step 2**: Update API_BASE_URL
```javascript
const API_BASE_URL = 'https://your-django-server.com/api';
```

**Step 3**: No other changes needed!
- App.js will automatically use real API
- GenerateTicketScreen continues reading from SQLite cache
- SyncManager will sync to real Django endpoint

---

## Offline-First Guarantees

1. **Tickets are always saved locally first**
   - No network required for ticket generation
   - Tickets stored in SQLite immediately

2. **Master data cached in SQLite**
   - Dropdowns work offline after initial load
   - No API calls during ticket generation

3. **Automatic sync when online**
   - SyncManager monitors network status
   - Syncs unsynced tickets automatically
   - Marks tickets as synced after successful upload

4. **Graceful degradation**
   - If initial master data fetch fails, app uses existing cache
   - If sync fails, tickets remain in local queue

---

## Testing the Implementation

### 1. Test Offline Ticket Generation
- Turn off network
- Generate tickets
- Verify tickets saved in SQLite
- Check `synced = 0`

### 2. Test Master Data Caching
- Clear app data
- Launch app (loads mock data)
- Turn off network
- Restart app
- Verify dropdowns still work (reading from cache)

### 3. Test Sync
- Generate tickets offline
- Turn on network
- Verify tickets sync automatically
- Check `synced = 1` and `server_id` populated

---

## Migration Path to Real Django API

### Phase 1: Current (Mock Mode) ✅
- Mock API simulates Django responses
- All data flows through SQLite
- Offline-first architecture in place

### Phase 2: Django Integration (Future)
1. Deploy Django backend with endpoints:
   - `GET /api/staff/events/`
   - `GET /api/staff/sub-events/`
   - `GET /api/staff/entry-types/`
   - `POST /api/staff/tickets/`

2. Update `src/services/api.js`:
   - Uncomment real API calls
   - Comment out mock imports
   - Update API_BASE_URL

3. Test with real backend

4. Remove mock indicator from UI

### Phase 3: Production
- Deploy to app stores
- Monitor sync success rates
- Add retry logic if needed

---

## Key Benefits of This Architecture

1. **Scalable**: Easy to switch from mock to real API
2. **Offline-First**: Works without network
3. **Performant**: UI reads from local SQLite, not API
4. **Maintainable**: Clear separation of concerns
5. **Testable**: Can test with mock data independently

---

## Summary of Changes

| File | Status | Purpose |
|------|--------|---------|
| `App.js` | ✅ Updated | Initialize DB and load master data |
| `src/database/db.js` | ✅ Updated | New schema + cache operations |
| `src/services/mockMasterData.js` | ✅ New | Mock API responses |
| `src/services/api.js` | ✅ Updated | Integration layer with TODO markers |
| `src/screens/GenerateTicketScreen.js` | ✅ Updated | Read from SQLite, insert tickets |
| `src/utils/syncManager.js` | ✅ Updated | Added TODO comments |

---

## Next Steps

1. ✅ Database schema updated
2. ✅ Mock API service created
3. ✅ Master data caching implemented
4. ✅ UI connected to SQLite
5. ✅ Ticket generation working
6. ⏳ Deploy Django backend (future)
7. ⏳ Switch to real API (future)
8. ⏳ Add ticket history screen (future)
9. ⏳ Add manual sync button (future)
10. ⏳ Add print/share functionality (future)
