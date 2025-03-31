import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { API_URL } from '../../constants/api';

export default function LoginScreen() {
  const [employee_id, setEmployee_id] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    if (!employee_id || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setError('');
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id, password }),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await login(employee_id, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background.default }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: `${theme.COLORS.primary.main}20` }]}>
              <Ionicons name="leaf-outline" size={40} color={theme.COLORS.primary.main} />
            </View>
            <Text style={[styles.title, { color: theme.COLORS.text.primary }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.COLORS.text.secondary }]}>
              Sign in to continue
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.COLORS.background.paper }]}>
              <Ionicons name="mail-outline" size={24} color={theme.COLORS.text.secondary} />
              <TextInput
                style={[styles.input, { color: theme.COLORS.text.primary }]}
                placeholder="Employee ID"
                placeholderTextColor={theme.COLORS.text.secondary}
                value={employee_id}
                onChangeText={setEmployee_id}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.COLORS.background.paper }]}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.COLORS.text.secondary} />
              <TextInput
                style={[styles.input, { color: theme.COLORS.text.primary }]}
                placeholder="Password"
                placeholderTextColor={theme.COLORS.text.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color={theme.COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? <Text style={[styles.errorText, { color: theme.COLORS.error }]}>{error}</Text> : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.COLORS.primary.main },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.COLORS.text.primary} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.COLORS.text.primary }]}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/screens/ForgotPassword')}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.COLORS.primary.main }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:0,
    margin:0
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: horizontalScale(24),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(48),
  },
  logoContainer: {
    width: horizontalScale(80),
    height: horizontalScale(80),
    borderRadius: horizontalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  title: {
    fontSize: fontScale(32),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: fontScale(16),
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  input: {
    flex: 1,
    fontSize: fontScale(16),
    paddingVertical: verticalScale(16),
    marginLeft: horizontalScale(12),
  },
  eyeIcon: {
    padding: moderateScale(8),
  },
  errorText: {
    fontSize: fontScale(14),
    marginBottom: verticalScale(16),
  },
  button: {
    borderRadius: 8,
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: fontScale(14),
  },
}); 