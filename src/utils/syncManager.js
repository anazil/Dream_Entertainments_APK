import NetInfo from '@react-native-community/netinfo';
import { getUnsyncedTickets, markTicketAsSynced } from '../database/db';
import { syncAllTickets } from '../services/api';

// ========== OFFLINE-FIRST SYNC MANAGER ==========
// Handles automatic synchronization when network becomes available

export const checkNetworkAndSync = async () => {
  const netInfo = await NetInfo.fetch();
  
  if (netInfo.isConnected && netInfo.isInternetReachable) {
    const unsyncedTickets = getUnsyncedTickets();
    
    if (unsyncedTickets.length > 0) {
      // TODO: Currently syncs to mock endpoint
      // Will automatically use real Django endpoint when api.js is updated
      const results = await syncAllTickets(unsyncedTickets);
      
      results.forEach(result => {
        if (result.success) {
          markTicketAsSynced(result.ticket.id, result.serverId);
        }
      });
      
      return {
        synced: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      };
    }
  }
  
  return { synced: 0, failed: 0 };
};

export const setupAutoSync = (callback) => {
  return NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      checkNetworkAndSync().then(callback);
    }
  });
};
