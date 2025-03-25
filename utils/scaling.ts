import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const horizontalScale = (size: number) => (width / 375) * size;
export const verticalScale = (size: number) => (height / 812) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (horizontalScale(size) - size) * factor;
export const fontScale = (size: number) => horizontalScale(size); 