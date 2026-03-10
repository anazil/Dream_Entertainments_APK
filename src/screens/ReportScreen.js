import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAllTickets } from '../database/db';

const ReportScreen = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalTickets: 0,
    totalRevenue: 0,
    entryTypes: [],
    syncedTickets: 0,
    unsyncedTickets: 0,
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const tickets = getAllTickets();
      
      // Calculate totals
      const totalTickets = tickets.length;
      console.log('Tickets for revenue calculation:', tickets.map(t => ({ id: t.ticket_id, price: t.price, type: typeof t.price })));
      
      const totalRevenue = tickets.reduce((sum, ticket) => {
        const price = (Number(ticket.price) || 0) / 10; // Divide by 10 to fix extra zero
        return sum + price;
      }, 0);
      
      const syncedTickets = tickets.filter(t => t.synced).length;
      const unsyncedTickets = tickets.filter(t => !t.synced).length;
      
      // Group by entry type
      const entryTypeMap = {};
      tickets.forEach(ticket => {
        const key = ticket.entry_type_name;
        if (!entryTypeMap[key]) {
          entryTypeMap[key] = {
            name: key,
            count: 0,
            revenue: 0,
            synced: 0,
            unsynced: 0,
          };
        }
        entryTypeMap[key].count += 1;
        const price = (Number(ticket.price) || 0) / 10; // Divide by 10 to fix extra zero
        entryTypeMap[key].revenue += price;
        if (ticket.synced) {
          entryTypeMap[key].synced += 1;
        } else {
          entryTypeMap[key].unsynced += 1;
        }
      });
      
      console.log('Final revenue calculation:', { totalRevenue, entryTypeMap });
      
      const entryTypes = Object.values(entryTypeMap).sort((a, b) => b.count - a.count);
      
      setReportData({
        totalTickets,
        totalRevenue,
        entryTypes,
        syncedTickets,
        unsyncedTickets,
      });
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000d2d', '#1e3a8a', '#3b82f6']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Report...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000d2d', '#1e3a8a', '#3b82f6']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000d2d" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Sales Report</Text>
        <TouchableOpacity onPress={loadReportData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="receipt-outline" size={28} color="#fff" />
            </View>
            <Text style={styles.summaryNumber}>{reportData.totalTickets}</Text>
            <Text style={styles.summaryLabel}>Total Tickets</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#1e3a8a' }]}>
              <Ionicons name="wallet-outline" size={28} color="#fff" />
            </View>
            <Text style={styles.summaryNumber}>₹{reportData.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
          </View>
        </View>

        {/* Sync Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sync Status</Text>
          <View style={styles.syncRow}>
            <View style={styles.syncItem}>
              <View style={[styles.syncDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.syncLabel}>Synced: {reportData.syncedTickets}</Text>
            </View>
            <View style={styles.syncItem}>
              <View style={[styles.syncDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.syncLabel}>Offline: {reportData.unsyncedTickets}</Text>
            </View>
          </View>
        </View>

        {/* Entry Types Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sales by Entry Type</Text>
          {reportData.entryTypes.map((entryType, index) => (
            <View key={index} style={styles.entryTypeRow}>
              <View style={styles.entryTypeInfo}>
                <Text style={styles.entryTypeName}>{entryType.name}</Text>
                <Text style={styles.entryTypeDetails}>
                  {entryType.count} tickets • ₹{entryType.revenue.toFixed(2)}
                </Text>
              </View>
              <View style={styles.entryTypeStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{entryType.synced}</Text>
                  <Text style={styles.statLabel}>Synced</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{entryType.unsynced}</Text>
                  <Text style={styles.statLabel}>Offline</Text>
                </View>
              </View>
            </View>
          ))}
          
          {reportData.entryTypes.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No tickets generated yet</Text>
            </View>
          )}
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenue Breakdown</Text>
          {reportData.entryTypes.map((entryType, index) => {
            const percentage = reportData.totalRevenue > 0 
              ? ((entryType.revenue / reportData.totalRevenue) * 100).toFixed(1)
              : 0;
            return (
              <View key={index} style={styles.revenueRow}>
                <View style={styles.revenueInfo}>
                  <Text style={styles.revenueName}>{entryType.name}</Text>
                  <Text style={styles.revenueAmount}>₹{entryType.revenue.toFixed(2)}</Text>
                </View>
                <View style={styles.revenueBar}>
                  <View 
                    style={[
                      styles.revenueProgress, 
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.revenuePercentage}>{percentage}%</Text>
              </View>
            );
          })}
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000d2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 16,
  },
  syncRow: {
    flexDirection: 'row',
    gap: 24,
  },
  syncItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  syncLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  entryTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  entryTypeInfo: {
    flex: 1,
  },
  entryTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  entryTypeDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  entryTypeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueInfo: {
    width: 120,
  },
  revenueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  revenueAmount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  revenueBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  revenueProgress: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  revenuePercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 40,
    textAlign: 'right',
  },
});

export default ReportScreen;