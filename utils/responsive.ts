import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (based on iPhone 11 Pro)
const baseWidth = 375;
const baseHeight = 812;

// Scale factors
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

// Responsive scaling functions
export const horizontalScale = (size: number): number => {
  return size * widthScale;
};

export const verticalScale = (size: number): number => {
  return size * heightScale;
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (widthScale - 1) * factor;
};

export const fontScale = (size: number): number => {
  return size * Math.min(widthScale, heightScale);
};

// Device type detection
export const isTablet = (): boolean => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  return Math.sqrt(Math.pow(adjustedWidth, 2) + Math.pow(adjustedHeight, 2)) >= 1000;
};

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

// Responsive layout helpers
export const isSmallScreen = SCREEN_WIDTH < breakpoints.sm;
export const isMediumScreen = SCREEN_WIDTH >= breakpoints.sm && SCREEN_WIDTH < breakpoints.md;
export const isLargeScreen = SCREEN_WIDTH >= breakpoints.md && SCREEN_WIDTH < breakpoints.lg;
export const isXLargeScreen = SCREEN_WIDTH >= breakpoints.lg;

// Responsive spacing
export const spacing = {
  xs: verticalScale(4),
  sm: verticalScale(8),
  md: verticalScale(16),
  lg: verticalScale(24),
  xl: verticalScale(32),
};

// Responsive font sizes
export const fontSize = {
  xs: fontScale(12),
  sm: fontScale(14),
  md: fontScale(16),
  lg: fontScale(18),
  xl: fontScale(20),
  xxl: fontScale(24),
  xxxl: fontScale(32),
}; 