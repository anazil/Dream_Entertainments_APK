import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://de.imcbs.com/api'; // Django API URL

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to all requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== AUTHENTICATION ==========

export const login = async (username, password) => {
  const response = await api.post('/login/', {
    username,
    password,
  });
  
  if (response.data.access) {
    await SecureStore.setItemAsync('access_token', response.data.access);
  }
  if (response.data.refresh) {
    await SecureStore.setItemAsync('refresh_token', response.data.refresh);
  }
  
  return response.data;
};

export const logout = async () => {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
};

// ========== MASTER DATA ENDPOINTS ==========

export const fetchEventsFromServer = async () => {
  const response = await api.get('/staff/events/');
  return response.data;
};

export const fetchSubEventsFromServer = async (eventId) => {
  const response = await api.get(`/staff/sub-events/${eventId}/`);
  return response.data;
};

export const fetchEntryTypesFromServer = async (subEventId) => {
  const response = await api.get(`/staff/entry-types/${subEventId}/`);
  return response.data;
};

export const fetchAllSubEventsFromServer = async (eventIds) => {
  const allSubEvents = [];
  for (const eventId of eventIds) {
    const subEvents = await fetchSubEventsFromServer(eventId);
    allSubEvents.push(...subEvents);
  }
  return allSubEvents;
};

export const fetchAllEntryTypesFromServer = async (subEventIds) => {
  const allEntryTypes = [];
  for (const subEventId of subEventIds) {
    const entryTypes = await fetchEntryTypesFromServer(subEventId);
    allEntryTypes.push(...entryTypes);
  }
  return allEntryTypes;
};

// ========== TICKET SYNC ENDPOINTS ==========

export const syncTicket = async (ticketData) => {
  try {
    const response = await api.post('/staff/generate-ticket/', {
      event_id: ticketData.event_id,
      sub_event_id: ticketData.sub_event_id,
      entry_type_id: ticketData.entry_type_id,
      quantity: ticketData.quantity || 1
    });
    return response.data;  // Returns { group_id, quantity, tickets: [...] }
  } catch (error) {
    throw error;
  }
};

export const syncTicketGroup = async (ticketsData) => {
  try {
    const response = await api.post('/staff/generate-ticket/', {
      event_id: ticketsData.event_id,
      sub_event_id: ticketsData.sub_event_id,
      tickets: ticketsData.tickets
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const syncAllTickets = async (tickets) => {
  const results = [];
  for (const ticket of tickets) {
    try {
      const result = await syncTicket(ticket);
      results.push({ success: true, ticket, serverId: result.id });
    } catch (error) {
      results.push({ success: false, ticket, error: error.message });
    }
  }
  return results;
};

// ========== TICKET VERIFICATION ==========

export const verifyTicket = async (ticketId) => {
  try {
    console.log('Verifying ticket:', ticketId);
    
    // Try different request formats
    const response = await api.post('/staff/verify-ticket/', {
      ticket_id: ticketId
    });
    
    console.log('Verification response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Verification error:', error.response?.status, error.response?.data);
    
    // Try alternative format if first fails
    try {
      console.log('Trying alternative format...');
      const response = await api.post('/staff/verify-ticket/', {
        ticketId: ticketId
      });
      console.log('Alternative response:', response.data);
      return response.data;
    } catch (altError) {
      console.error('Alternative format also failed:', altError.response?.data);
      throw error;
    }
  }
};

export default api;