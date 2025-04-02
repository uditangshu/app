import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.loadingContainer, { backgroundColor: theme.COLORS.background.paper }]}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 12,
    opacity: 0.9,
  },
}); 