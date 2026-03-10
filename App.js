import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, Alert } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import ConfigureEventScreen from './src/screens/ConfigureEventScreen';
import GenerateTicketScreen from './src/screens/GenerateTicketScreen';
import VerifyTicketScreen from './src/screens/VerifyTicketScreenNew';
import ReportScreen from './src/screens/ReportScreen';
import { initDatabase, cacheEvents, cacheSubEvents, cacheEntryTypes, clearAllCache } from './src/database/db';
import { fetchEventsFromServer, fetchAllSubEventsFromServer, fetchAllEntryTypesFromServer } from './src/services/api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showVerifyTicket, setShowVerifyTicket] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      initDatabase();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setIsInitialized(true);
    }
  };

  const loadMasterData = async () => {
    try {
      setIsLoadingData(true);
      console.log('=== CLEARING CACHE ===');
      clearAllCache();
      
      console.log('=== FETCHING EVENTS FROM API ===');
      const events = await fetchEventsFromServer();
      console.log('Events:', JSON.stringify(events));
      
      console.log('=== FETCHING SUB-EVENTS FROM API ===');
      const eventIds = events.map(e => e.id);
      const subEvents = await fetchAllSubEventsFromServer(eventIds);
      console.log('SubEvents:', JSON.stringify(subEvents));
      
      console.log('=== FETCHING ENTRY TYPES FROM API ===');
      const subEventIds = subEvents.map(se => se.id);
      const entryTypes = await fetchAllEntryTypesFromServer(subEventIds);
      console.log('EntryTypes:', JSON.stringify(entryTypes));
      
      console.log('=== CACHING DATA ===');
      cacheEvents(events);
      cacheSubEvents(subEvents);
      cacheEntryTypes(entryTypes);
      
      console.log('=== DATA CACHED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== ERROR ===', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', `Failed to load data: ${error.message}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggedIn(true);
    setShowMenu(true);
    await loadMasterData();
  };

  const handleConfigure = (event, subEvent) => {
    setSelectedEvent(event);
    setSelectedSubEvent(subEvent);
    setIsConfigured(true);
    setShowMenu(false);
  };

  const handleConfigureEvent = () => {
    setShowMenu(false);
  };

  const handleVerifyTicket = () => {
    setShowVerifyTicket(true);
    setShowMenu(false);
  };

  const handleViewReport = () => {
    setShowReport(true);
    setShowMenu(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isInitialized) {
    return <View style={{ flex: 1, backgroundColor: '#6C63FF' }} />;
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (showReport) {
    return (
      <ReportScreen 
        onBack={() => {
          setShowReport(false);
          setShowMenu(true);
        }}
      />
    );
  }

  if (showVerifyTicket) {
    return (
      <VerifyTicketScreen 
        onBack={() => {
          setShowVerifyTicket(false);
          setShowMenu(true);
        }}
      />
    );
  }

  if (showMenu) {
    return (
      <MenuScreen 
        onConfigureEvent={handleConfigureEvent}
        onVerifyTicket={handleVerifyTicket}
        onViewReport={handleViewReport}
        onBack={() => {
          setIsLoggedIn(false);
          setShowMenu(false);
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setShowMenu(false);
          setIsConfigured(false);
        }}
      />
    );
  }

  if (isLoadingData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6C63FF' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading data...</Text>
      </View>
    );
  }

  if (!isConfigured) {
    return <ConfigureEventScreen onConfigure={handleConfigure} onBack={() => setShowMenu(true)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <GenerateTicketScreen 
        preSelectedEvent={selectedEvent}
        preSelectedSubEvent={selectedSubEvent}
        onReconfigure={() => {
          setIsConfigured(false);
          setShowMenu(true);
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setShowMenu(false);
          setIsConfigured(false);
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}
