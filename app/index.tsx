import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import theme from '../constants/theme';

export default function Index() {
  const { isAuthenticated } = useAuth();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/(app)/home" : "/(auth)/login"} />;
} 