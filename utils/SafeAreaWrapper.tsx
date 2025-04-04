import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

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
  const { isDarkMode } = useTheme();
  
  return (
    <SafeAreaView 
      style={[
        { 
          flex: 1,
          backgroundColor: isDarkMode ? 'black' : '#F5F5F5'
        }, 
        style
      ]} 
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
}); 