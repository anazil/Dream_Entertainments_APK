import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const MenuScreen = ({ onConfigureEvent, onVerifyTicket, onViewReport, onLogout, onBack }) => {
  return (
    <LinearGradient colors={['#000d2d', '#1e3a8a', '#3b82f6']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000d2d" />
      
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Dreams Entertainment</Text>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={onConfigureEvent}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#000d2d', '#1e3a8a', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="settings-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>Configure Event</Text>
            <Text style={styles.buttonSubtext}>Setup event and generate tickets</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={onVerifyTicket}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#000d2d', '#1e3a8a', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="qr-code-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>Verify Ticket</Text>
            <Text style={styles.buttonSubtext}>Scan and verify ticket QR codes</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={onViewReport}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#000d2d', '#1e3a8a', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="bar-chart-outline" size={32} color="#fff" />
            <Text style={styles.buttonText}>View Report</Text>
            <Text style={styles.buttonSubtext}>View sales and ticket reports</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  menuButton: {
    borderRadius: 20,
    marginVertical: 15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    alignSelf: 'center',
    width: '100%',
  },
  buttonGradient: {
    borderRadius: 20,
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MenuScreen;