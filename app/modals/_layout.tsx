import { Stack } from 'expo-router';
import React from 'react';
import SafeAreaWrapper from '../../utils/SafeAreaWrapper';

export default function ModalsLayout() {
  return (
    <SafeAreaWrapper>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
          contentStyle: {
            marginTop: 0,
            paddingTop: 0,
            backgroundColor: 'transparent',
          },
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          // fullScreenGestureEnabled is not a valid prop, removing it
        }}
      />
    </SafeAreaWrapper>
  );
} 