import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCode } from '../utils/qrGenerator';
import { printTicket, checkPrinterStatus } from '../services/printerService';
import { 
  getEntryTypesBySubEventId,
  insertTicket,
  getNextTicketId,
  getAllTickets,
  markTicketAsSynced,
  getStaffInfo
} from '../database/db';
import db from '../database/db';
import { syncTicketGroup } from '../services/api';
import TicketHistoryScreen from './TicketHistoryScreen';

const GenerateTicketScreen = ({ preSelectedEvent, preSelectedSubEvent, onReconfigure, onLogout }) => {
  const [quantities, setQuantities] = useState({});
  
  const [entryTypes, setEntryTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [tickets, setTickets] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [showGeneratedTickets, setShowGeneratedTickets] = useState(false);
  const [lastGeneratedTickets, setLastGeneratedTickets] = useState([]);
  const [showTicketHistory, setShowTicketHistory] = useState(false);
  const [requiresSyncBeforeGeneration, setRequiresSyncBeforeGeneration] = useState(false);
  const [printerStatus, setPrinterStatus] = useState('unknown');

  const checkSyncRequirement = () => {
    const unsyncedTickets = tickets.filter(t => !t.synced);
    setRequiresSyncBeforeGeneration(unsyncedTickets.length > 0);
  };

  const updateQuantity = (entryTypeId, change) => {
    setQuantities(prev => {
      const current = prev[entryTypeId] || 0;
      const newValue = Math.max(0, current + change);
      return { ...prev, [entryTypeId]: newValue };
    });
  };

  const getTotalQuantity = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  useEffect(() => {
    loadEntryTypes();
    loadTicketsFromCache();
    checkPrinter();
    
    // Initial network check
    NetInfo.fetch().then(state => {
      console.log('Initial network state:', state);
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state changed:', state);
      const networkStatus = state.isConnected && state.isInternetReachable;
      const wasOnline = isOnline;
      
      console.log('Setting isOnline to:', networkStatus);
      setIsOnline(networkStatus);
      
      // If just came online, check if sync is required
      if (networkStatus && !wasOnline) {
        checkSyncRequirement();
      }
      
      // If went offline, clear sync requirement
      if (!networkStatus) {
        setRequiresSyncBeforeGeneration(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const loadEntryTypes = () => {
    const cachedEntryTypes = getEntryTypesBySubEventId(preSelectedSubEvent.id);
    setEntryTypes(cachedEntryTypes);
  };
  
  const loadTicketsFromCache = () => {
    try {
      const allTickets = getAllTickets();
      setTickets(allTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const checkPrinter = async () => {
    try {
      const { checkPrinterStatus } = require('../services/printerService');
      const status = await checkPrinterStatus();
      
      if (status.status === 'ready') {
        setPrinterStatus('ready');
      } else if (status.status === 'not_initialized') {
        setPrinterStatus('not_initialized');
        
        // Try to reinitialize automatically
        try {
          const { reinitializePrinter } = require('../services/printerService');
          const reinitSuccess = await reinitializePrinter();
          if (reinitSuccess) {
            setPrinterStatus('ready');
          }
        } catch (reinitError) {
          console.log('Auto-reinit failed:', reinitError.message);
        }
      } else {
        setPrinterStatus('error');
      }
    } catch (error) {
      setPrinterStatus('error');
    }
  };

  const handleSyncAll = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please connect to internet.');
      return;
    }

    try {
      const unsyncedTickets = tickets.filter(t => !t.synced);
      
      if (unsyncedTickets.length === 0) {
        Alert.alert('Info', 'All tickets are already synced!');
        return;
      }

      setLoading(true);

      // Group unsynced tickets by group_id for batch sync
      const ticketGroups = {};
      unsyncedTickets.forEach(ticket => {
        const groupId = ticket.group_id;
        if (!ticketGroups[groupId]) {
          ticketGroups[groupId] = [];
        }
        ticketGroups[groupId].push(ticket);
      });

      let syncedCount = 0;
      let failedCount = 0;

      for (const [groupId, groupTickets] of Object.entries(ticketGroups)) {
        try {
          // Build tickets array for this group
          const ticketsToSync = [];
          const ticketsByType = {};
          
          groupTickets.forEach(ticket => {
            const entryTypeId = ticket.entry_type_id;
            if (!ticketsByType[entryTypeId]) {
              ticketsByType[entryTypeId] = 0;
            }
            ticketsByType[entryTypeId]++;
          });
          
          Object.entries(ticketsByType).forEach(([entryTypeId, quantity]) => {
            ticketsToSync.push({
              entry_type_id: parseInt(entryTypeId),
              quantity: quantity
            });
          });
          
          const requestData = {
            event_id: groupTickets[0].event_id,
            sub_event_id: groupTickets[0].sub_event_id,
            tickets: ticketsToSync
          };
          
          const result = await syncTicketGroup(requestData);
          
          // Mark all tickets in this group as synced
          groupTickets.forEach(ticket => {
            markTicketAsSynced(ticket.id, ticket.id);
            syncedCount++;
          });
          
        } catch (error) {
          console.error('Failed to sync group:', groupId, error);
          failedCount += groupTickets.length;
        }
      }

      loadTicketsFromCache();
      setRequiresSyncBeforeGeneration(false);
      setLoading(false);

      Alert.alert(
        'Sync Complete',
        `Synced: ${syncedCount}\nFailed: ${failedCount}`
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Sync failed: ' + error.message);
    }
  };

  const handleGenerateTicket = async () => {
    const totalQty = getTotalQuantity();
    if (totalQty === 0) {
      Alert.alert('Error', 'Please select at least one ticket');
      return;
    }
    
    // Check if sync is required before online generation
    if (isOnline && requiresSyncBeforeGeneration) {
      Alert.alert(
        'Sync Required',
        'You have offline tickets that must be synced before generating new tickets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sync Now', onPress: () => handleSyncAll() }
        ]
      );
      return;
    }
    
    console.log('Generate ticket - isOnline:', isOnline);
    
    try {
      setLoading(true);
      
      // Build tickets array and breakdown
      const ticketsToGenerate = [];
      const breakdown = {};
      
      for (const [entryTypeId, qty] of Object.entries(quantities)) {
        if (qty === 0) continue;
        
        const entryType = entryTypes.find(et => et.id === parseInt(entryTypeId));
        breakdown[entryType.name] = qty;
        
        ticketsToGenerate.push({
          entry_type_id: entryType.id,
          quantity: qty
        });
      }
      
      let result;
      let generatedTickets = [];
      
      if (isOnline) {
        console.log('Attempting online generation...');
        try {
          // Online: Create via API
          const requestData = {
            event_id: preSelectedEvent.id,
            sub_event_id: preSelectedSubEvent.id,
            tickets: ticketsToGenerate
          };
          
          result = await syncTicketGroup(requestData);
          
          // Store API response tickets locally
          result.tickets.forEach(ticket => {
            const entryType = entryTypes.find(et => et.name === ticket.entry_type);
            const localTicket = {
              ticket_id: ticket.ticket_id,
              group_id: ticket.group_id,
              quantity_in_group: ticket.quantity_in_group,
              event_id: preSelectedEvent.id,
              event_name: preSelectedEvent.name,
              sub_event_id: preSelectedSubEvent.id,
              sub_event_name: preSelectedSubEvent.name,
              entry_type_id: entryType.id,
              entry_type_name: ticket.entry_type,
              sequence_number: 0,
              price: parseFloat(ticket.price),
              created_at: new Date().toISOString(),
            };
            
            const localId = insertTicket(localTicket);
            markTicketAsSynced(localId, ticket.id || localId);
            
            generatedTickets.push({
              ticket_id: ticket.ticket_id,
              group_id: ticket.group_id,
              entry_type_name: ticket.entry_type,
              price: parseFloat(ticket.price)
            });
            
            // Print each ticket immediately
            printTicket(localTicket).then(success => {
              if (success) {
                console.log('✅ Ticket printed successfully');
              } else {
                console.log('❌ Print failed - check printer service');
                Alert.alert('Print Warning', 'Ticket generated but printing failed. Check printer connection.');
              }
            }).catch(err => {
              console.log('❌ Print error:', err.message);
              Alert.alert('Print Error', `Printing failed: ${err.message}`);
            });
          });
        } catch (apiError) {
          console.log('API failed, falling back to offline mode:', apiError.message);
          // Fall back to offline mode if API fails
          throw new Error('NETWORK_ERROR');
        }
      } else {
        throw new Error('OFFLINE_MODE');
      }
      
      // Online generation completed successfully
      await loadTicketsFromCache();
      resetForm();
      setLoading(false);
      
      if (generatedTickets.length > 0) {
        setLastGeneratedTickets(generatedTickets);
        
        setShowGeneratedTickets(true);
        
        const breakdownText = Object.entries(breakdown)
          .map(([name, count]) => `${name}: ${count}`)
          .join(', ');
        
        Alert.alert('Success', `Generated and synced ${generatedTickets.length} tickets!\nGroup ID: ${result.group_id}\n${breakdownText}`);
      }
      
    } catch (error) {
      if (error.message === 'NETWORK_ERROR' || error.message === 'OFFLINE_MODE' || !isOnline) {
        console.log('Creating tickets offline...');
        // Offline: Create locally with continuous sequential IDs
        const offlineGroupId = `OFFLINE-${Date.now()}`;
        const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
        
        const generatedTickets = [];
        const breakdown = {};
        let firstTicketId = null;
        
        for (const [entryTypeId, qty] of Object.entries(quantities)) {
          if (qty === 0) continue;
          
          const entryType = entryTypes.find(et => et.id === parseInt(entryTypeId));
          breakdown[entryType.name] = qty;
          
          for (let i = 0; i < qty; i++) {
            // Get next sequential ticket ID using staff counter
            const { ticketId, sequenceNumber } = getNextTicketId(
              preSelectedEvent.code, 
              preSelectedSubEvent.code
            );
            
            if (!firstTicketId) firstTicketId = ticketId;
            
            const localTicket = {
              ticket_id: ticketId,  // Uses continuous sequential ID
              group_id: offlineGroupId,
              quantity_in_group: totalQuantity,
              event_id: preSelectedEvent.id,
              event_name: preSelectedEvent.name,
              sub_event_id: preSelectedSubEvent.id,
              sub_event_name: preSelectedSubEvent.name,
              entry_type_id: entryType.id,
              entry_type_name: entryType.name,
              sequence_number: sequenceNumber,
              price: entryType.price,
              created_at: new Date().toISOString(),
            };
            
            insertTicket(localTicket);
            generatedTickets.push({
              ticket_id: localTicket.ticket_id,
              group_id: localTicket.group_id,
              entry_type_name: entryType.name,
              price: entryType.price
            });
            
            // Print each ticket immediately
            printTicket(localTicket).then(success => {
              if (success) {
                console.log('✅ Offline ticket printed successfully');
              } else {
                console.log('❌ Offline print failed - check printer service');
                Alert.alert('Print Warning', 'Ticket generated offline but printing failed. Check Smart POS printer.');
              }
            }).catch(err => {
              console.log('❌ Offline print error:', err.message);
              Alert.alert('Print Error', `Offline printing failed: ${err.message}\n\nPossible issues:\n- SmartPOSPrinter module not available\n- Printer permission denied\n- Printer service not responding`);
            });
          }
        }
        
        const result = {
          group_id: offlineGroupId,
          total_quantity: totalQuantity
        };
        
        await loadTicketsFromCache();
        resetForm();
        setLoading(false);
        
        if (generatedTickets.length > 0) {
          setLastGeneratedTickets([{
            ticket_id: firstTicketId,
            group_id: offlineGroupId,
            entry_type_name: `Group of ${totalQuantity} tickets`,
            price: generatedTickets.reduce((sum, t) => sum + t.price, 0)
          }]);
          
          setShowGeneratedTickets(true);
          
          const breakdownText = Object.entries(breakdown)
            .map(([name, count]) => `${name}: ${count}`)
            .join(', ');
          
          Alert.alert('Success', `Generated offline ${generatedTickets.length} tickets!\nGroup ID: ${offlineGroupId}\n${breakdownText}`);
        }
        return;
      }
      
      setLoading(false);
      Alert.alert('Error', 'Failed to generate tickets: ' + error.message);
      return;
    }
    
    await loadTicketsFromCache();
    resetForm();
    setLoading(false);
    
    if (generatedTickets.length > 0) {
      setLastGeneratedTickets([{
        group_id: result.group_id,
        total_quantity: result.total_quantity,
        breakdown: breakdown
      }]);
      setShowGeneratedTickets(true);
      
      const breakdownText = Object.entries(breakdown)
        .map(([name, count]) => `${name}: ${count}`)
        .join(', ');
      
      Alert.alert('Success', `Generated and synced ${generatedTickets.length} tickets!\nGroup ID: ${result.group_id}\n${breakdownText}`);
    }
  };

  const resetForm = () => {
    setQuantities({});
  };

  if (showTicketHistory) {
    return <TicketHistoryScreen onBack={() => setShowTicketHistory(false)} />;
  }

  return (
    <LinearGradient colors={['#000d2d', '#1e3a8a', '#3b82f6']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000d2d" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onReconfigure} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: () => onLogout() }
              ]
            );
          }} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Dreams Entertainment</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.configInfo}>
          <View style={styles.configContent}>
            <View>
              <Text style={styles.configLabel}>Event: {preSelectedEvent.name}</Text>
              <Text style={styles.configLabel}>Sub-Event: {preSelectedSubEvent.name}</Text>
            </View>
            <View style={styles.networkStatus}>
              <Ionicons 
                name={printerStatus === 'ready' ? "print" : printerStatus === 'not_initialized' ? "print-outline" : "warning"} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.networkText}>
                {printerStatus === 'ready' ? 'Printer Ready' : 
                 printerStatus === 'not_initialized' ? 'Printer Initializing' : 
                 'Printer Error'}
              </Text>
            </View>
          </View>
          <View style={styles.configContent}>
            <View>
              <Text style={styles.configLabel}>Event: {preSelectedEvent.name}</Text>
              <Text style={styles.configLabel}>Sub-Event: {preSelectedSubEvent.name}</Text>
            </View>
            <View style={[styles.networkStatus, isOnline ? styles.networkOnline : styles.networkOffline]}>
              <Ionicons name={isOnline ? "cloud-done" : "cloud-offline"} size={16} color="#fff" />
              <Text style={styles.networkText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Tickets</Text>
          
          {entryTypes.map(entryType => (
            <View key={entryType.id} style={styles.entryTypeCard}>
              <View style={styles.entryTypeInfo}>
                <Text style={styles.entryTypeName}>{entryType.name}</Text>
                <Text style={styles.entryTypePrice}>₹{entryType.price}</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={() => updateQuantity(entryType.id, -1)}
                >
                  <Ionicons name="remove" size={20} color="#3b82f6" />
                </TouchableOpacity>
                <Text style={styles.counterText}>{quantities[entryType.id] || 0}</Text>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={() => updateQuantity(entryType.id, 1)}
                >
                  <Ionicons name="add" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.generateButtonContainer, (getTotalQuantity() === 0 || loading || (isOnline && requiresSyncBeforeGeneration)) && styles.generateButtonDisabled]} 
          onPress={handleGenerateTicket}
          activeOpacity={0.8}
          disabled={loading || (isOnline && requiresSyncBeforeGeneration)}
        >
          <LinearGradient
            colors={['#000d2d', '#1e3a8a', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            )}
            <Text style={styles.generateButtonText}>
              {loading ? 'Generating...' : 
               (isOnline && requiresSyncBeforeGeneration) ? 'Sync Required First' :
               `Generate ${getTotalQuantity()} Ticket(s)`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {tickets.filter(t => !t.synced).length > 0 && (
          <TouchableOpacity 
            style={[styles.syncAllButton, !isOnline && styles.syncAllButtonDisabled]} 
            onPress={handleSyncAll}
            disabled={!isOnline || loading}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.syncAllButtonText}>
              Sync All Pending ({tickets.filter(t => !t.synced).length})
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.ticketsSection}>
          <TouchableOpacity 
            style={styles.viewHistoryButton}
            onPress={() => setShowTicketHistory(true)}
          >
            <Ionicons name="list" size={20} color="#3b82f6" />
            <Text style={styles.viewHistoryText}>View Ticket History</Text>
            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showGeneratedTickets}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGeneratedTickets(false)}
      >
        <View style={styles.ticketSlipContainer}>
          <View style={styles.ticketSlipHeader}>
            <Text style={styles.ticketSlipTitle}>TICKET RECEIPT</Text>
            <TouchableOpacity onPress={() => setShowGeneratedTickets(false)} style={styles.ticketCloseButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.ticketSlipContent}>
            <View style={styles.ticketSlip}>
              <Text style={styles.companyName}>DREAMS ENTERTAINMENT</Text>
              <View style={styles.dashedLine} />
              
              <View style={styles.ticketInfo}>
                <Text style={styles.infoLabel}>EVENT: {preSelectedEvent.name}</Text>
                <Text style={styles.infoLabel}>SUB-EVENT: {preSelectedSubEvent.name}</Text>
                <Text style={styles.infoLabel}>DATE: {new Date().toLocaleDateString()}</Text>
                <Text style={styles.infoLabel}>TIME: {new Date().toLocaleTimeString()}</Text>
              </View>
              
              <View style={styles.qrSection}>
                {isOnline ? (
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(lastGeneratedTickets[0]?.ticket_id || 'NO-TICKET')}`
                    }}
                    style={styles.qrCode}
                  />
                ) : (
                  <OfflineQRCode ticketId={lastGeneratedTickets[0]?.ticket_id || 'NO-TICKET'} />
                )}
                <Text style={styles.qrLabel}>Scan for verification</Text>
              </View>
              

              
              <View style={styles.ticketsList}>
                <Text style={styles.ticketsHeader}>TICKETS GENERATED</Text>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketNumber}>{lastGeneratedTickets[0]?.ticket_id}</Text>
                  <Text style={styles.ticketType}>Group of {lastGeneratedTickets.length} tickets</Text>
                  <Text style={styles.ticketAmount}>₹{lastGeneratedTickets.reduce((sum, t) => sum + t.price, 0)}</Text>
                </View>
                {Object.entries(
                  lastGeneratedTickets.reduce((acc, ticket) => {
                    acc[ticket.entry_type_name] = (acc[ticket.entry_type_name] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([entryType, count], index) => {
                  const price = lastGeneratedTickets.find(t => t.entry_type_name === entryType)?.price || 0;
                  return (
                    <View key={index} style={styles.ticketBreakdown}>
                      <Text style={styles.breakdownText}>• {entryType}: {count} tickets @ ₹{price} each</Text>
                    </View>
                  );
                })}
              </View>
              
              <View style={styles.dashedLine} />
              
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL TICKETS:</Text>
                  <Text style={styles.totalValue}>{lastGeneratedTickets.length}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL AMOUNT:</Text>
                  <Text style={styles.totalAmount}>₹{lastGeneratedTickets.reduce((sum, t) => sum + t.price, 0)}</Text>
                </View>
              </View>
              
              <View style={styles.dashedLine} />
              <Text style={styles.footerText}>THANK YOU......</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  configInfo: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  configContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configLabel: {
    fontSize: 13,
    color: '#1A202C',
    fontWeight: '600',
    marginBottom: 5,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#6B7280',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 20,
  },
  entryTypeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  entryTypeInfo: {
    flex: 1,
  },
  entryTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  entryTypePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  counterButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    minWidth: 40,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 22,
  },
  generateButtonContainer: {
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  generateButton: {
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  networkOnline: {
    backgroundColor: '#10B981',
  },
  networkOffline: {
    backgroundColor: '#6B7280',
  },
  networkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  syncAllButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  syncAllButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  syncAllButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  ticketsSection: {
    marginBottom: 30,
  },
  viewHistoryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  viewHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    flex: 1,
    marginLeft: 12,
  },
  ticketSlipContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  ticketSlipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  ticketSlipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },
  ticketCloseButton: {
    padding: 8,
  },
  ticketSlipContent: {
    flex: 1,
    padding: 20,
  },
  ticketSlip: {
    backgroundColor: '#fff',
    padding: 20,
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 2,
  },
  dashedLine: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: 15,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#000',
  },
  ticketInfo: {
    marginVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  ticketsHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  ticketsList: {
    marginVertical: 10,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'dotted',
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    flex: 2,
    fontFamily: 'monospace',
  },
  ticketType: {
    fontSize: 12,
    color: '#000',
    flex: 2,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  ticketAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  totalSection: {
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'monospace',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'monospace',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'monospace',
  },
  footerText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },

  ticketBreakdown: {
    paddingVertical: 4,
    paddingLeft: 20,
  },
  breakdownText: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'monospace',
  },
  qrSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrCode: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: '#000',
  },
  offlineQRContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrLabel: {
    fontSize: 12,
    color: '#000',
    marginTop: 8,
    fontFamily: 'monospace',
  },
});

// Offline QR Code Component
const OfflineQRCode = ({ ticketId, size = 120 }) => {
  return (
    <View style={[styles.offlineQRContainer, { width: size, height: size }]}>
      <QRCode
        value={ticketId}
        size={size - 8}
        backgroundColor="white"
        color="black"
      />
    </View>
  );
};

export default GenerateTicketScreen;
