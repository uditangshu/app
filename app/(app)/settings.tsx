import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';

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
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      icon: 'moon-outline',
      title: 'Dark Mode',
      subtitle: 'Toggle dark/light theme',
      type: 'toggle',
      value: isDarkMode,
      onToggle: toggleTheme,
    },
    {
      icon: 'language-outline',
      title: 'Language',
      subtitle: 'Change app language',
      type: 'select',
      onPress: () => {},
    },
    {
      icon: 'cloud-download-outline',
      title: 'Data & Storage',
      subtitle: 'Manage app data and storage',
      type: 'action',
      onPress: () => {},
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy',
      subtitle: 'Privacy settings and permissions',
      type: 'action',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      type: 'action',
      onPress: () => {},
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and information',
      type: 'action',
      onPress: () => {},
    },
  ]);

  const { accessToken } = useAuth();

  const handleToggle = (index: number, value: boolean) => {
    const newSettings = [...settings];
    newSettings[index] = { ...newSettings[index], value };
    setSettings(newSettings);
    if (newSettings[index].onToggle) {
      newSettings[index].onToggle(value);
    }
  };

  const gradientColors = isDarkMode 
    ? ['#1C8D3A', '#165C27', '#0A3814']
    : ['#E8F5E9', '#C8E6C9', '#A5D6A7'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background.default }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>App Settings</Text>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Customize your app experience</Text>
          </View>

          <View style={styles.menuContainer}>
            {settings.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}
                onPress={() => item.type !== 'toggle' && item.onPress?.()}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
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
    padding: moderateScale(24),
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
}); 