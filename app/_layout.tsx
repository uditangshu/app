import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { lightTheme, darkTheme } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen 
          name="(app)" 
          options={{ headerShown: false }} 
        />
      ) : (
        <Stack.Screen 
          name="(auth)" 
          options={{ headerShown: false }} 
        />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
} 