import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { lightTheme } from '../constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={lightTheme.COLORS.primary.main} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/(app)/home" : "/(auth)/login"} />;
} 