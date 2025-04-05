import React, { useState, useCallback } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { API_URL } from '../../constants/api';
import debounce from 'lodash/debounce';

export default function LoginScreen() {
  const [employee_id, setEmployee_id] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Create a debounced version of the login function
  const debouncedLogin = useCallback(
    debounce(async (emp_id: string, pwd: string) => {
      try {
        setError('');
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ employee_id: emp_id, password: pwd }),
        });

        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        
        const data = await response.json();
        console.log('Response data:', data);

        // Handle 307 redirect status code
        if (response.status === 307) {
          console.log('Got 307 status code');
          console.log('Response headers:', [...response.headers.entries()]);
          
          let redirectUrl = response.headers.get('Location') || 
                           response.headers.get('location') || 
                           data.redirectUrl || 
                           data.redirect_url || 
                           data.url;
                           
          console.log('Redirect URL:', redirectUrl);
          
          if (!redirectUrl) {
            console.error('No redirect URL found in headers or response body');
            setError('Redirect URL not provided in the response');
            return;
          }

          const resetTokenMatch = redirectUrl.match(/reset-password\/([^\/\?]+)/);
          console.log('Reset token match:', resetTokenMatch);
          
          if (resetTokenMatch && resetTokenMatch[1]) {
            const resetToken = resetTokenMatch[1];
            console.log('Extracted reset token:', resetToken);
            
            try {
              const validateResponse = await fetch(`${API_URL}/auth/validate-reset-token/${resetToken}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              if (validateResponse.ok) {
                router.push({
                  pathname: '/screens/ResetPassword',
                  params: { token: resetToken }
                });
              } else {
                setError('Password reset token is not valid');
              }
            } catch (error) {
              console.error('Error validating reset token:', error);
              setError('Failed to validate reset token');
            }
          } else {
            setError('Invalid reset password URL format');
          }
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        await login(emp_id, pwd);
      } catch (error) {
        console.error('Login error:', error);
        setError(error instanceof Error ? error.message : 'Login failed');
      } finally {
        setIsSubmitting(false);
      }
    }, 300),
    [login, router]
  );

  const handleLogin = async () => {
    if (!employee_id || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    debouncedLogin(employee_id, password);
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
              <Ionicons name="cloud-outline" size={40} color={theme.COLORS.primary.main} />
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
                editable={!isSubmitting}
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
                editable={!isSubmitting}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
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
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={theme.COLORS.text.primary} />
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
              disabled={isSubmitting}
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