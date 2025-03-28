import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../constants/api';
import { theme } from '../../constants/theme';
import { fontScale, horizontalScale, moderateScale, verticalScale } from '../../utils/scaling';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Password reset instructions have been sent to your email',
          [
            {
              text: 'OK',
              onPress: () => router.push('/login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you instructions to reset your password.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.COLORS.text.secondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleForgotPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Instructions</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(20),
    justifyContent: 'center',
    backgroundColor: theme.COLORS.background.default,
  },
  title: {
    fontSize: fontScale(24),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.bold,
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontScale(16),
    color: theme.COLORS.text.secondary,
    marginBottom: verticalScale(30),
    textAlign: 'center',
    ...theme.FONTS.regular,
  },
  input: {
    height: verticalScale(50),
    borderWidth: 1,
    borderColor: theme.COLORS.border.main,
    borderRadius: 8,
    paddingHorizontal: horizontalScale(15),
    marginBottom: verticalScale(20),
    fontSize: fontScale(16),
    backgroundColor: theme.COLORS.background.paper,
    color: theme.COLORS.text.primary,
    ...theme.FONTS.regular,
  },
  button: {
    backgroundColor: theme.COLORS.primary.main,
    height: verticalScale(50),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
  },
  backButton: {
    marginTop: verticalScale(20),
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.COLORS.primary.main,
    fontSize: fontScale(16),
    ...theme.FONTS.regular,
  },
}); 