import React, { useEffect } from 'react';
import { Stack, Slot } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';
import { lightTheme } from '../constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SafeAreaWrapper from '../utils/SafeAreaWrapper';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function InitialLayout() {
  return (
    <SafeAreaWrapper>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaWrapper>
  );
} 