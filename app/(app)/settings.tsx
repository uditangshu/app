import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import { getNotificationStatus, requestNotificationPermissions, registerForPushNotifications } from '../../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingItem {
  icon: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'select' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check if notifications are enabled on component mount
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const isEnabled = await getNotificationStatus();
      setNotificationsEnabled(isEnabled);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        // If user is enabling notifications, request permissions
        const granted = await requestNotificationPermissions();
        
        if (!granted) {
          // Permission denied
          showToast('Notification permission denied');
          return false;
        }
        
        // Register for push notifications
        const registered = await registerForPushNotifications();
        
        if (!registered) {
          showToast('Failed to register for push notifications');
          return false;
        }
        
        // Permission granted and registration successful
        showToast('Notifications enabled');
        await AsyncStorage.setItem('notificationsEnabled', 'true');
        return true;
      } else {
        // User is disabling notifications
        await AsyncStorage.setItem('notificationsEnabled', 'false');
        showToast('Notifications disabled');
        return false;
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showToast('Failed to update notification settings');
      return notificationsEnabled; // Return current state on error
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const [settings, setSettings] = useState<SettingItem[]>([
    {
      icon: 'moon-outline',
      title: 'Dark Mode',
      subtitle: 'Toggle dark/light theme',
      type: 'toggle',
      value: isDarkMode,
      onToggle: () => toggleTheme(),
    },
    {
      icon: 'notifications-outline',
      title: 'Push Notifications',
      subtitle: 'Enable or disable push notifications',
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: async (value) => {
        const newValue = await toggleNotifications(value);
        setNotificationsEnabled(newValue);
        return newValue;
      },
    },
    {
      icon: 'language-outline',
      title: 'Language',
      subtitle: 'Change app language',
      type: 'select',
      onPress: () => {
        console.log('Feature coming soon: Language settings');
        showToast('Language settings coming soon');
      },
    },
    {
      icon: 'cloud-download-outline',
      title: 'Data & Storage',
      subtitle: 'Manage app data and storage',
      type: 'action',
      onPress: () => {
        console.log('Feature coming soon: Data & Storage settings');
        showToast('Data & Storage settings coming soon');
      },
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy',
      subtitle: 'Privacy settings and permissions',
      type: 'action',
      onPress: () => {
        console.log('Feature coming soon: Privacy settings');
        showToast('Privacy settings coming soon');
      },
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      type: 'action',
      onPress: () => {
        console.log('Feature coming soon: Help & Support');
        showToast('Help & Support coming soon');
      },
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and information',
      type: 'action',
      onPress: () => {
        console.log('Feature coming soon: About information');
        showToast('About information coming soon');
      },
    },
  ]);

  // Update settings when notificationsEnabled changes
  useEffect(() => {
    const newSettings = [...settings];
    // Find the notifications setting (should be at index 1)
    const notificationSettingIndex = newSettings.findIndex(
      setting => setting.title === 'Push Notifications'
    );
    
    if (notificationSettingIndex !== -1) {
      newSettings[notificationSettingIndex] = {
        ...newSettings[notificationSettingIndex],
        value: notificationsEnabled
      };
      setSettings(newSettings);
    }
  }, [notificationsEnabled]);

  const handleToggle = (index: number, value: boolean) => {
    const newSettings = [...settings];
    newSettings[index] = { ...newSettings[index], value };
    setSettings(newSettings);
    if (newSettings[index].onToggle) {
      newSettings[index].onToggle(value);
    }
  };

  const gradientColors = isDarkMode 
    ? ['#2C5EE6', '#1A3A99', '#0A1E4D']
    : ['#E8F1FF', '#C8E1FF', '#A5D1FF'];

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: 'transparent' }]}
      edges={['right', 'bottom', 'left']}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
      >
        <ScrollView style={styles.scrollView}>
          <View style={[styles.section, { marginTop: verticalScale(20) }]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>App Settings</Text>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Customize your app experience</Text>
          </View>

          <View style={styles.menuContainer}>
            {settings.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}
                onPress={() => {
                  if (item.type === 'toggle') {
                    handleToggle(index, !item.value);
                  } else if (item.onPress) {
                    item.onPress();
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
                    <Ionicons name={item.icon as any} size={24} color={theme.COLORS.primary.main} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={[styles.menuItemTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={[styles.menuItemSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                {item.type === 'toggle' && (
                  <Switch
                    value={item.value}
                    onValueChange={(value) => handleToggle(index, value)}
                    trackColor={{ false: isDarkMode ? 'rgba(255,255,255,0.2)' : theme.COLORS.text.secondary, true: theme.COLORS.primary.main }}
                    thumbColor={isDarkMode ? 'white' : theme.COLORS.background.paper}
                    onTouchStart={(e) => e.stopPropagation()}
                  />
                )}
                {item.type !== 'toggle' && (
                  <Ionicons name="chevron-forward" size={24} color={isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Version 1.0.0</Text>
            <Text style={[styles.copyrightText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>© 2024 Your Company. All rights reserved.</Text>
          </View>
        </ScrollView>

        {toastVisible && (
          <View style={[styles.toast, { 
            backgroundColor: isDarkMode ? 'rgba(10,10,10,0.9)' : 'rgba(255,255,255,0.95)',
            borderColor: isDarkMode ? 'rgba(50,50,50,0.5)' : 'rgba(230,230,230,0.8)',
          }]}>
            <Ionicons 
              name="time-outline" 
              size={18} 
              color={isDarkMode ? '#2C5EE6' : theme.COLORS.primary.main} 
            />
            <Text style={[styles.toastText, { 
              color: isDarkMode ? 'white' : '#333',
            }]}>{toastMessage}</Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: moderateScale(24),
    paddingBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: fontScale(28),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  sectionSubtitle: {
    fontSize: fontScale(16),
    fontWeight: "400",
  },
  menuContainer: {
    paddingHorizontal: moderateScale(16),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderRadius: 12,
    marginBottom: verticalScale(8),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: fontScale(16),
    fontWeight: "500",
    marginBottom: verticalScale(4),
  },
  menuItemSubtitle: {
    fontSize: fontScale(14),
    fontWeight: "400",
  },
  versionContainer: {
    padding: moderateScale(24),
    alignItems: 'center',
  },
  versionText: {
    fontSize: fontScale(14),
    fontWeight: "400",
    marginBottom: verticalScale(4),
  },
  copyrightText: {
    fontSize: fontScale(12),
    fontWeight: "400",
  },
  toast: {
    position: 'absolute',
    bottom: verticalScale(20),
    alignSelf: 'center',
    width: '70%',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
  },
  toastText: {
    fontSize: fontScale(14),
    fontWeight: '500',
    marginLeft: horizontalScale(8),
  },
}); 