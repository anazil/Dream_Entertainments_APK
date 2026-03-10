import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { verifyTicket } from '../services/api';

const VerifyTicketScreen = ({ onBack }) => {
  const [ticketId, setTicketId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showResult = (isValid, responseData = null) => {
    console.log('showResult called with:', isValid, responseData);
    setVerificationResult(isValid);
    
    // Animate result
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide result after 3 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVerificationResult(null);
        setTicketId('');
      });
    }, 3000);
  };

  const handleVerify = async () => {
    if (!ticketId.trim()) return;
    
    setLoading(true);
    console.log('Starting verification for:', ticketId.trim());

    try {
      const result = await verifyTicket(ticketId.trim());
      console.log('Verification response:', result);
      setLoading(false);
      
      // Check if status is "verified"
      const isValid = result && result.status === 'verified';
      
      console.log('Ticket is valid:', isValid);
      showResult(isValid, result);
    } catch (error) {
      console.error('Verification failed:', error);
      setLoading(false);
      showResult(false, null);
    }
  };

  return (
    <LinearGradient colors={['#000d2d', '#1e3a8a', '#3b82f6']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000d2d" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Verify Ticket</Text>
      </View>

      <View style={styles.content}>
        {verificationResult === null && (
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
            </View>
            
            <View style={styles.manualInputSection}>
              <Text style={styles.orText}>Or enter manually</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="ticket-outline" size={22} color="#3b82f6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter ticket ID"
                  placeholderTextColor="#CBD5E0"
                  value={ticketId}
                  onChangeText={setTicketId}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.verifyButton, (!ticketId.trim() || loading) && styles.verifyButtonDisabled]} 
                onPress={handleVerify}
                activeOpacity={0.8}
                disabled={!ticketId.trim() || loading}
              >
                <LinearGradient
                  colors={['#000d2d', '#1e3a8a', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.verifyButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.verifyButtonText}>
                    {loading ? 'Verifying...' : 'Verify Ticket'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {verificationResult !== null && (
          <View style={styles.resultContainer}>
            <View style={[
              styles.resultBox,
              verificationResult ? styles.validResult : styles.invalidResult
            ]}>
              <Ionicons 
                name={verificationResult ? "checkmark-circle" : "close-circle"} 
                size={80} 
                color="#fff" 
              />
              <Text style={styles.resultText}>
                {verificationResult ? "VALID TICKET" : "INVALID TICKET"}
              </Text>
            </View>
          </View>
        )}
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerContainer: {
    flex: 1,
  },
  scannerFrame: {
    flex: 2,
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scannerContent: {
    alignItems: 'center',
  },
  qrIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
  },
  manualInputSection: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
  },
  verifyButton: {
    borderRadius: 14,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  verifyButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonGradient: {
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultBox: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  validResult: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  invalidResult: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  resultText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 1,
  },
});

export default VerifyTicketScreen;