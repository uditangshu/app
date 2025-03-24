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
import { Link, router } from 'expo-router';
import theme from '../../constants/theme';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [employee_id, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!employee_id || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('https://backend-deployment-792.as.r.appspot.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await login(employee_id, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="business-outline" size={60} color={theme.COLORS.primary.main} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={theme.COLORS.text.secondary} />
              <TextInput
                style={styles.input}
                placeholder="Employee ID"
                placeholderTextColor={theme.COLORS.text.secondary}
                value={employee_id}
                onChangeText={setEmployeeId}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoComplete="off"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.COLORS.text.secondary} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={theme.COLORS.text.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.COLORS.text.primary} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account?  </Text>
              
                <TouchableOpacity>
                  <Text style={styles.registerLink} onPress={() => router.push('/')}>Sign Up</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
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
    backgroundColor: `${theme.COLORS.primary.main}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  title: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(32),
    ...theme.FONTS.bold,
    marginBottom: verticalScale(8),
  },
  subtitle: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(16),
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background.paper,
    borderRadius: 8,
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  input: {
    flex: 1,
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    paddingVertical: verticalScale(16),
    marginLeft: horizontalScale(12),
  },
  eyeIcon: {
    padding: moderateScale(8),
  },
  errorText: {
    color: theme.COLORS.error,
    fontSize: fontScale(14),
    marginBottom: verticalScale(16),
  },
  button: {
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 8,
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  forgotPasswordText: {
    color: theme.COLORS.primary.main,
    fontSize: fontScale(14),
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(14),
  },
  registerLink: {
    color: theme.COLORS.primary.main,
    fontSize: fontScale(14),
    ...theme.FONTS.medium,
  },
}); 