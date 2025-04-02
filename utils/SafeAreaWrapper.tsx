import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
}

export default function SafeAreaWrapper({ 
  children, 
  style, 
  edges = ['right', 'bottom', 'left']
}: SafeAreaWrapperProps) {
  return (
    <SafeAreaView 
      style={[styles.container, style]} 
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
}); 