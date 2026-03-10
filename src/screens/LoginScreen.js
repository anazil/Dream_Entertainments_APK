import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../services/api';
import { saveStaffInfo } from '../database/db';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const isFormValid = username.trim() && password.trim();

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter username');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter password');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting login with:', username);
      console.log('API URL:', 'http://192.168.1.67:8000/api/login/');
      
      const response = await login(username, password);
      console.log('Login response:', response);
      
      // Save staff info to database
      const user = response.user;
      if (user && user.staff_code) {
        // Calculate actual counter: range_start + tickets generated
        const actualCounter = user.range_start + user.current_counter;
        
        saveStaffInfo(
          user.staff_code,
          user.range_start,
          user.range_end,
          actualCounter
        );
      }
      
      onLogin();
    } catch (error) {
      console.log('Login error:', error);
      console.log('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <LinearGradient
      colors={['#000d2d', '#1e3a8a', '#3b82f6']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000d2d" />
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo_DE.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Dreams Entertainment</Text>
          <Text style={styles.subtitle}>Festival Ticketing System</Text>
        </View>

        <View style={styles.formContainer}>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.loginText}>Login to continue</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#3b82f6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#CBD5E0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {username ? <Ionicons name="checkmark-circle" size={20} color="#10B981" /> : null}
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#3b82f6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#CBD5E0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButtonContainer, !isFormValid && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            activeOpacity={0.8} 
            disabled={loading || !isFormValid}
          >
            <LinearGradient
              colors={['#000d2d', '#1e3a8a', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward-circle" size={24} color="#fff" style={styles.arrowIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.helpSection}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.helpText}>Secure login with your staff credentials</Text>
          </View>
        </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 6,
  },
  loginText: {
    fontSize: 15,
    color: '#718096',
    marginBottom: 32,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginBottom: 18,
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
  eyeIcon: {
    padding: 8,
  },
  loginButtonContainer: {
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButton: {
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  helpText: {
    fontSize: 13,
    color: '#065F46',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default LoginScreen;
