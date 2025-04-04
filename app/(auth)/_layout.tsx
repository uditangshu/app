import React from 'react';
import { Stack } from 'expo-router';
import theme from '../../constants/theme';
import SafeAreaWrapper from '../../utils/SafeAreaWrapper';

export default function AuthLayout() {
  return (
    <SafeAreaWrapper>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen name="login" />
      </Stack>
    </SafeAreaWrapper>
  );
} 