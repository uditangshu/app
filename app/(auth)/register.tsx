import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../../constants/theme';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Register Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background.default,
  },
  text: {
    color: theme.COLORS.text.primary,
    fontSize: 20,
  },
}); 