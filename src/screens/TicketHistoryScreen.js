import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAllTickets } from '../database/db';

const TicketHistoryScreen = ({ onBack }) => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    loadTicketsFromCache();
  }, []);

  const loadTicketsFromCache = () => {
    try {
      const allTickets = getAllTickets();
      
      // Group tickets by group_id and show only one entry per group
      const groupedTickets = {};
      allTickets.forEach(ticket => {
        const groupId = ticket.group_id || ticket.ticket_id;
        if (!groupedTickets[groupId]) {
          groupedTickets[groupId] = ticket;
        }
      });
      
      setTickets(Object.values(groupedTickets));
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  return (
    <LinearGradient colors={['#000d2d', '#1e3a8a', '#3b82f6']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000d2d" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadTicketsFromCache} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Ticket History</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tickets.reduce((sum, t) => sum + (t.quantity_in_group || 1), 0)}</Text>
            <Text style={styles.statLabel}>Total Tickets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tickets.filter(t => t.synced).reduce((sum, t) => sum + (t.quantity_in_group || 1), 0)}</Text>
            <Text style={styles.statLabel}>Synced</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tickets.filter(t => !t.synced).reduce((sum, t) => sum + (t.quantity_in_group || 1), 0)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.ticketsSection}>
          {tickets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={48} color="#CBD5E0" />
              <Text style={styles.emptyText}>No tickets generated yet</Text>
            </View>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <View>
                      <Text style={styles.ticketId}>{item.group_id || item.ticket_id}</Text>
                      {item.quantity_in_group > 1 && (
                        <Text style={styles.groupInfo}>Group of {item.quantity_in_group} tickets</Text>
                      )}
                    </View>
                    <View style={[styles.syncDot, item.synced ? styles.syncedDot : styles.pendingDot]} />
                  </View>
                  <View style={styles.ticketDetails}>
                    <View style={styles.ticketRow}>
                      <Ionicons name="calendar" size={14} color="#718096" />
                      <Text style={styles.ticketLabel}>{item.event_name}</Text>
                    </View>
                    <View style={styles.ticketRow}>
                      <Ionicons name="list" size={14} color="#718096" />
                      <Text style={styles.ticketLabel}>{item.sub_event_name}</Text>
                    </View>
                    <View style={styles.ticketRow}>
                      <Ionicons name="pricetag" size={14} color="#718096" />
                      <Text style={styles.ticketLabel}>{item.entry_type_name}</Text>
                    </View>
                  </View>
                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketPrice}>₹{item.price}</Text>
                    <Text style={styles.ticketTime}>{new Date(item.created_at).toLocaleString()}</Text>
                  </View>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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
  refreshButton: {
    padding: 10,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  ticketsSection: {
    marginBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  groupInfo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
  },
  syncDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  syncedDot: {
    backgroundColor: '#22c55e',
  },
  pendingDot: {
    backgroundColor: '#f59e0b',
  },
  ticketDetails: {
    marginBottom: 12,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  ticketTime: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
});

export default TicketHistoryScreen;