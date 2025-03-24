import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.COLORS.background.paper,
          borderTopColor: theme.COLORS.background.default,
        },
        tabBarActiveTintColor: theme.COLORS.primary.main,
        tabBarInactiveTintColor: theme.COLORS.text.secondary,
        headerStyle: {
          backgroundColor: theme.COLORS.background.paper,
        },
        headerTintColor: theme.COLORS.text.primary,
        headerTitleStyle: {
          ...theme.FONTS.bold,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 