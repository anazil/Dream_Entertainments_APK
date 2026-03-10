import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('festivalpos.db');

export const initDatabase = () => {
  // Tickets table - offline-first storage
  db.execSync(`
    CREATE TABLE IF NOT EXISTS tickets_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE NOT NULL,
      group_id TEXT NOT NULL,
      quantity_in_group INTEGER DEFAULT 1,
      event_id INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      sub_event_id INTEGER NOT NULL,
      sub_event_name TEXT NOT NULL,
      entry_type_id INTEGER NOT NULL,
      entry_type_name TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      server_id INTEGER
    );
  `);

  // Master data cache tables
  db.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sub_events (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS entry_types (
      id INTEGER PRIMARY KEY,
      sub_event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL
    );
  `);

  // Staff info table - stores counter range for ticket generation
  db.execSync(`
    CREATE TABLE IF NOT EXISTS staff_info (
      id INTEGER PRIMARY KEY,
      staff_code TEXT NOT NULL,
      current_counter INTEGER NOT NULL,
      range_start INTEGER NOT NULL,
      range_end INTEGER NOT NULL
    );
  `);


};

// ========== TICKET OPERATIONS ==========

export const insertTicket = (ticket) => {
  const result = db.runSync(
    `INSERT INTO tickets_local (ticket_id, group_id, quantity_in_group, event_id, event_name, sub_event_id, sub_event_name, 
     entry_type_id, entry_type_name, sequence_number, price, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      ticket.ticket_id,
      ticket.group_id,
      ticket.quantity_in_group || 1,
      ticket.event_id,
      ticket.event_name,
      ticket.sub_event_id,
      ticket.sub_event_name,
      ticket.entry_type_id,
      ticket.entry_type_name,
      ticket.sequence_number,
      ticket.price,
      ticket.created_at
    ]
  );
  return result.lastInsertRowId;
};

export const getUnsyncedTickets = () => {
  return db.getAllSync('SELECT * FROM tickets_local WHERE synced = 0');
};

export const markTicketAsSynced = (id, serverId) => {
  db.runSync('UPDATE tickets_local SET synced = 1, server_id = ? WHERE id = ?', [serverId, id]);
};

export const getAllTickets = () => {
  return db.getAllSync('SELECT * FROM tickets_local ORDER BY created_at DESC');
};

// ========== COUNTER MANAGEMENT (ATOMIC) ==========
// CRITICAL: ticket_id is generated locally and NEVER changes
// Counter increment is atomic to prevent duplicates

export const getNextTicketId = (eventCode, subEventCode) => {
  // Read current staff info
  const staffInfo = db.getFirstSync('SELECT * FROM staff_info WHERE id = 1');
  
  if (!staffInfo) {
    throw new Error('Staff info not configured');
  }

  // Validate range
  if (staffInfo.current_counter >= staffInfo.range_end) {
    throw new Error('RANGE_EXHAUSTED');
  }

  const sequenceNumber = staffInfo.current_counter;
  
  // ATOMIC: Increment counter immediately
  db.runSync('UPDATE staff_info SET current_counter = current_counter + 1 WHERE id = 1');
  
  // Generate permanent ticket_id with sub_event_code
  const paddedSequence = sequenceNumber.toString().padStart(4, '0');
  const ticketId = `${staffInfo.staff_code}-${eventCode}-${subEventCode}-${paddedSequence}`;
  
  return { ticketId, sequenceNumber };
};

export const getStaffInfo = () => {
  return db.getFirstSync('SELECT * FROM staff_info WHERE id = 1');
};

export const saveStaffInfo = (staffCode, rangeStart, rangeEnd, currentCounter = null) => {
  db.execSync('DELETE FROM staff_info');
  const counter = currentCounter || rangeStart;
  db.runSync(
    'INSERT INTO staff_info (id, staff_code, current_counter, range_start, range_end) VALUES (1, ?, ?, ?, ?)',
    [staffCode, counter, rangeStart, rangeEnd]
  );
};

// ========== MASTER DATA CACHE OPERATIONS ==========

export const cacheEvents = (events) => {
  db.execSync('DELETE FROM events');
  if (events && events.length > 0) {
    events.forEach(event => {
      db.runSync('INSERT INTO events (id, name, code) VALUES (?, ?, ?)', 
        [event.id, event.name, event.code]);
    });
  }
};

export const clearAllCache = () => {
  db.execSync('DELETE FROM events');
  db.execSync('DELETE FROM sub_events');
  db.execSync('DELETE FROM entry_types');
};

export const cacheSubEvents = (subEvents) => {
  db.execSync('DELETE FROM sub_events');
  if (subEvents && subEvents.length > 0) {
    subEvents.forEach(subEvent => {
      db.runSync('INSERT INTO sub_events (id, event_id, name, code) VALUES (?, ?, ?, ?)', 
        [subEvent.id, subEvent.event || subEvent.event_id, subEvent.name, subEvent.code]);
    });
  }
};

export const cacheEntryTypes = (entryTypes) => {
  db.execSync('DELETE FROM entry_types');
  if (entryTypes && entryTypes.length > 0) {
    entryTypes.forEach(entryType => {
      db.runSync('INSERT INTO entry_types (id, sub_event_id, name, price) VALUES (?, ?, ?, ?)', 
        [entryType.id, entryType.sub_event || entryType.sub_event_id, entryType.name, parseFloat(entryType.price)]);
    });
  }
};

export const getEventsFromCache = () => {
  return db.getAllSync('SELECT * FROM events ORDER BY name');
};

export const getSubEventsByEventId = (eventId) => {
  return db.getAllSync('SELECT * FROM sub_events WHERE event_id = ? ORDER BY name', [eventId]);
};

export const getEntryTypesBySubEventId = (subEventId) => {
  return db.getAllSync('SELECT * FROM entry_types WHERE sub_event_id = ? ORDER BY name', [subEventId]);
};

export default db;