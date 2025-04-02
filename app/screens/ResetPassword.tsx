import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../constants/api';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import CustomModal from '../components/CustomModal';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    if (!token) {
      setShowErrorModal(true);
    }
  }, [token]);

  const handleResetPassword = async () => {
    if (!token) {
      setError('No reset token provided');
      setShowErrorModal(true);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Password validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        setError(data.message || 'Failed to reset password');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An error occurred while resetting your password');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background.default }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: `${theme.COLORS.primary.main}20` }]}>
              <Ionicons name="lock-open-outline" size={40} color={theme.COLORS.primary.main} />
            </View>
            <Text style={[styles.title, { color: theme.COLORS.text.primary }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: theme.COLORS.text.secondary }]}>
              Enter your new password below
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* New Password Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.COLORS.background.paper }]}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.COLORS.text.secondary} />
              <TextInput
                style={[styles.input, { color: theme.COLORS.text.primary }]}
                placeholder="New Password"
                placeholderTextColor={theme.COLORS.text.secondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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

            {/* Confirm Password Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.COLORS.background.paper }]}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.COLORS.text.secondary} />
              <TextInput
                style={[styles.input, { color: theme.COLORS.text.primary }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.COLORS.text.secondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color={theme.COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? <Text style={[styles.errorText, { color: theme.COLORS.error }]}>{error}</Text> : null}

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.COLORS.primary.main },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.COLORS.text.primary} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.COLORS.text.primary }]}>
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity 
              style={styles.backToLogin}
              onPress={() => router.push('/login')}
            >
              <Text style={[styles.backToLoginText, { color: theme.COLORS.primary.main }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <CustomModal
        visible={showSuccessModal}
        title="Success"
        message="Your password has been reset successfully"
        buttons={[
          {
            text: "Login",
            onPress: () => {
              setShowSuccessModal(false);
              router.push('/login');
            },
            style: "primary"
          }
        ]}
      />

      {/* Error Modal */}
      <CustomModal
        visible={showErrorModal}
        title="Error"
        message={error || 'An error occurred'}
        buttons={[
          {
            text: "Try Again",
            onPress: () => setShowErrorModal(false),
            style: "default"
          },
          {
            text: "Back to Login",
            onPress: () => router.push('/login'),
            style: "primary"
          }
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    margin: 0,
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
  backToLogin: {
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: fontScale(14),
  },
}); 