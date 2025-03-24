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
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';

interface SettingItem {
  icon: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'select' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const settingsItems: SettingItem[] = [
  {
    icon: 'moon-outline',
    title: 'Dark Mode',
    subtitle: 'Toggle dark/light theme',
    type: 'toggle',
    value: true,
    onToggle: () => {},
  },
  {
    icon: 'notifications-outline',
    title: 'Push Notifications',
    subtitle: 'Receive app notifications',
    type: 'toggle',
    value: true,
    onToggle: () => {},
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
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingItem[]>(settingsItems);

  const handleToggle = (index: number, value: boolean) => {
    const newSettings = [...settings];
    newSettings[index] = { ...newSettings[index], value };
    setSettings(newSettings);
    settingsItems[index].onToggle?.(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <Text style={styles.sectionSubtitle}>Customize your app experience</Text>
        </View>

        <View style={styles.menuContainer}>
          {settings.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => item.type !== 'toggle' && item.onPress?.()}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={24} color={theme.COLORS.primary.main} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
              </View>
              {item.type === 'toggle' && (
                <Switch
                  value={item.value}
                  onValueChange={(value) => handleToggle(index, value)}
                  trackColor={{ false: theme.COLORS.text.secondary, true: theme.COLORS.primary.main }}
                  thumbColor={theme.COLORS.background.paper}
                />
              )}
              {item.type !== 'toggle' && (
                <Ionicons name="chevron-forward" size={24} color={theme.COLORS.text.secondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Your Company. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: horizontalScale(16),
    paddingTop: verticalScale(24),
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(24),
    ...theme.FONTS.bold,
    marginBottom: verticalScale(4),
  },
  sectionSubtitle: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(14),
  },
  menuContainer: {
    padding: horizontalScale(16),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.background.paper,
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(8),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    borderRadius: horizontalScale(20),
    backgroundColor: `${theme.COLORS.primary.main}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
    marginBottom: verticalScale(4),
  },
  menuItemSubtitle: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(14),
  },
  versionContainer: {
    alignItems: 'center',
    padding: horizontalScale(16),
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(16),
  },
  versionText: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(14),
    marginBottom: verticalScale(4),
  },
  copyrightText: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(12),
  },
}); 