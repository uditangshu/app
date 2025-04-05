import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, DimensionValue, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

interface ShimmerProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
  backgroundColor?: string;
  highlightColor?: string;
}

const Shimmer: React.FC<ShimmerProps> = ({ 
  width, 
  height, 
  borderRadius = 4, 
  style,
  backgroundColor,
  highlightColor
}) => {
  const { isDarkMode } = useTheme();
  const animatedValue = new Animated.Value(0);

  // Default colors based on theme
  const defaultBgColor = isDarkMode ? 'rgba(80, 80, 80, 0.2)' : 'rgba(230, 230, 230, 0.5)';
  const defaultHighlightStart = isDarkMode ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0)';
  const defaultHighlightMiddle = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)';
  const defaultHighlightEnd = isDarkMode ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0)';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [typeof width === 'number' ? -width : -100, typeof width === 'number' ? width : 100],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: backgroundColor || defaultBgColor,
        } as ViewStyle,
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            defaultHighlightStart,
            highlightColor || defaultHighlightMiddle,
            defaultHighlightEnd,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default Shimmer; 