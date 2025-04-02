import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'primary';
  }>;
  onClose?: () => void;
}

export default function CustomModal({
  visible,
  title,
  message,
  buttons,
  onClose,
}: CustomModalProps) {
  const { theme, isDarkMode } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View 
          style={[
            styles.modalContainer,
            { 
              backgroundColor: isDarkMode ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.COLORS.primary.main}20` }]}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={32} 
                color={theme.COLORS.primary.main} 
              />
            </View>
            <Text style={[styles.title, { color: theme.COLORS.text.primary }]}>
              {title}
            </Text>
            <Text style={[styles.message, { color: theme.COLORS.text.secondary }]}>
              {message}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'primary' && { backgroundColor: theme.COLORS.primary.main },
                  button.style === 'cancel' && { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
                  button.style === 'default' && { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
                  index < buttons.length - 1 && styles.buttonMargin,
                ]}
                onPress={button.onPress}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { 
                      color: button.style === 'primary' 
                        ? theme.COLORS.text.primary 
                        : theme.COLORS.text.secondary 
                    }
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.85,
    borderRadius: 16,
    padding: moderateScale(24),
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  iconContainer: {
    width: horizontalScale(64),
    height: horizontalScale(64),
    borderRadius: horizontalScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  title: {
    fontSize: fontScale(24),
    fontWeight: '600',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  message: {
    fontSize: fontScale(16),
    textAlign: 'center',
    lineHeight: verticalScale(24),
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: verticalScale(48),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonMargin: {
    marginBottom: verticalScale(12),
  },
  buttonText: {
    fontSize: fontScale(16),
    fontWeight: '500',
  },
}); 