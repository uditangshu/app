import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        contentStyle: {
          marginTop: 0,
          paddingTop: 0,
        },
        animation: 'slide_from_bottom',
      }}
    />
  );
} 