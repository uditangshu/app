import React, { useEffect } from 'react';
import { Stack, Slot } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';
import { lightTheme } from '../constants/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutWithTheme />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutWithTheme() {
  const { isDarkMode } = useTheme();
  
  return (
    <SafeAreaProvider style={{ backgroundColor: isDarkMode ? 'black' : '#F5F5F5' }}>
      <InitialLayout />
    </SafeAreaProvider>
  );
}

function InitialLayout() {
  const { isDarkMode } = useTheme();

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: isDarkMode ? '#121212' : '#F5F5F5'
    }}>
      <SafeAreaView 
        style={{ 
          flex: 1,
          backgroundColor: isDarkMode ? 'black' : 'gray'
        }} 
        edges={['top']}
      >
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent'
            }
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
    </View>
  );
} 