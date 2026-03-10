import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { getEventsFromCache, getSubEventsByEventId } from '../database/db';

const ConfigureEventScreen = ({ onConfigure, onBack = () => {} }) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedSubEvent, setSelectedSubEvent] = useState('');
  const [events, setEvents] = useState([]);
  const [subEvents, setSubEvents] = useState([]);

  useEffect(() => {
    const cachedEvents = getEventsFromCache();
    setEvents(cachedEvents);
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const cachedSubEvents = getSubEventsByEventId(parseInt(selectedEvent));
      setSubEvents(cachedSubEvents);
      setSelectedSubEvent('');
    }
  }, [selectedEvent]);

  const handleConfigure = () => {
    if (!selectedEvent) {
      Alert.alert('Error', 'Please select an event');
      return;
    }
    if (!selectedSubEvent) {
      Alert.alert('Error', 'Please select a sub event');
      return;
    }

    const event = events.find(e => e.id === parseInt(selectedEvent));
    const subEvent = subEvents.find(se => se.id === parseInt(selectedSubEvent));

    onConfigure(event, subEvent);
  };

  return (
    <LinearGradient
      colors={['#000d2d', '#1e3a8a', '#3b82f6']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000d2d" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Image source={require('../../assets/logo_DE.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Configure Event</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Event Configuration</Text>
            
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Ionicons name="calendar" size={20} color="#3b82f6" />
                <Text style={styles.label}>Event</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <View style={[styles.pickerContainer, selectedEvent && styles.pickerActive]}>
                <Picker
                  selectedValue={selectedEvent}
                  onValueChange={setSelectedEvent}
                  style={styles.picker}
                >
                  <Picker.Item label="Select an event" value="" color="#999" />
                  {events.map(event => (
                    <Picker.Item key={event.id} label={event.name} value={event.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Ionicons name="list" size={20} color={selectedEvent ? "#3b82f6" : "#ccc"} />
                <Text style={[styles.label, !selectedEvent && styles.labelDisabled]}>Sub Event</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <View style={[styles.pickerContainer, !selectedEvent && styles.pickerDisabled, selectedSubEvent && styles.pickerActive]}>
                <Picker
                  selectedValue={selectedSubEvent}
                  onValueChange={setSelectedSubEvent}
                  style={styles.picker}
                  enabled={!!selectedEvent}
                >
                  <Picker.Item label={selectedEvent ? "Select sub event" : "Select event first"} value="" color="#999" />
                  {subEvents.map(subEvent => (
                    <Picker.Item key={subEvent.id} label={subEvent.name} value={subEvent.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.continueButtonContainer, (!selectedEvent || !selectedSubEvent) && styles.continueButtonDisabled]} 
              onPress={handleConfigure}
              activeOpacity={0.8}
              disabled={!selectedEvent || !selectedSubEvent}
            >
              <LinearGradient
                colors={['#000d2d', '#1e3a8a', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueButton}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.continueButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>This configuration will be used for all tickets in this session</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
  headerIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
  },
  logoImage: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
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
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  labelDisabled: {
    color: '#A0AEC0',
  },
  required: {
    color: '#FF6B6B',
    fontSize: 16,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  pickerActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#fff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerDisabled: {
    backgroundColor: '#F7FAFC',
    opacity: 0.6,
    borderColor: '#E2E8F0',
  },
  picker: {
    height: 56,
    color: '#1A202C',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButtonContainer: {
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  continueButton: {
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
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
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
});

export default ConfigureEventScreen;
