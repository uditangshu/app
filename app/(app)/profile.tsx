import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../../constants/theme';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
// import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmployeeProfile {
  employee_id: string;
  name: string;
  email: string;
  role: string;
  manager_id: string;
  is_blocked: boolean;
}

interface ProfileMenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

const profileMenuItems: ProfileMenuItem[] = [
  {
    icon: 'person-outline',
    title: 'Personal Information',
    subtitle: 'Update your profile details',
    onPress: () => {},
  },
  {
    icon: 'notifications-outline',
    title: 'Notifications',
    subtitle: 'Manage your notification preferences',
    onPress: () => {},
  },
  {
    icon: 'lock-closed-outline',
    title: 'Security',
    subtitle: 'Change password and security settings',
    onPress: () => {},
  },
  {
    icon: 'help-circle-outline',
    title: 'Help & Support',
    subtitle: 'Get help and contact support',
    onPress: () => {},
  },
  {
    icon: 'information-circle-outline',
    title: 'About',
    subtitle: 'App version and information',
    onPress: () => {},
  },
];

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Simulated profile data
      const mockProfile = {
        name: 'John Doe',
        employeeId: 'EMP2001',
        department: 'IT',
        position: 'Software Engineer',
        email: 'john.doe@company.com',
        phone: '+1 234 567 8900',
      };
      setProfile(mockProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems: ProfileMenuItem[] = [
    {
      icon: 'person-outline',
      title: 'Personal Information',
      subtitle: 'Update your personal details',
      onPress: () => {},
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'App preferences and settings',
      onPress: () => {},
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => {},
    },
    {
      icon: 'shield-outline',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => {},
    },
    {
      icon: 'log-out-outline',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      onPress: logout,
    },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.COLORS.background.default }]}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.COLORS.background.default }]}>
        <Text style={[styles.errorText, { color: theme.COLORS.error }]}>Failed to load profile data</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background.default }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: `${theme.COLORS.primary.main}20` }]}>
            <Ionicons name="person" size={40} color={theme.COLORS.primary.main} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.COLORS.text.primary }]}>{profile?.name}</Text>
            <Text style={[styles.employeeId, { color: theme.COLORS.text.secondary }]}>{profile?.employeeId}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.COLORS.text.primary }]}>Profile Information</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.COLORS.background.paper }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.COLORS.text.secondary }]}>Department</Text>
              <Text style={[styles.infoValue, { color: theme.COLORS.text.primary }]}>{profile?.department}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.COLORS.text.secondary }]}>Position</Text>
              <Text style={[styles.infoValue, { color: theme.COLORS.text.primary }]}>{profile?.position}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.COLORS.text.secondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: theme.COLORS.text.primary }]}>{profile?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.COLORS.text.secondary }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: theme.COLORS.text.primary }]}>{profile?.phone}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionHeader, { borderBottomColor: theme.COLORS.border.main }]}>
          <Text style={[styles.sectionTitle, { color: theme.COLORS.text.primary }]}>Menu</Text>
        </View>
        <View style={[styles.menuContainer, { backgroundColor: theme.COLORS.background.paper }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: theme.COLORS.background.paper }]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${theme.COLORS.primary.main}20` }]}>
                  <Ionicons name={item.icon as any} size={24} color={theme.COLORS.primary.main} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, { color: theme.COLORS.text.primary }]}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={[styles.menuItemSubtitle, { color: theme.COLORS.text.secondary }]}>{item.subtitle}</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.COLORS.text.secondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontScale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: horizontalScale(16),
    paddingTop: verticalScale(24),
    marginBottom: verticalScale(24),
  },
  avatarContainer: {
    width: horizontalScale(80),
    height: horizontalScale(80),
    borderRadius: horizontalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(16),
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: fontScale(24),
    fontWeight: "700",
    marginBottom: verticalScale(4),
  },
  employeeId: {
    fontSize: fontScale(14),
  },
  section: {
    padding: horizontalScale(16),
    marginBottom: verticalScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(16),
  },
  infoCard: {
    padding: moderateScale(16),
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  infoLabel: {
    fontSize: fontScale(14),
  },
  infoValue: {
    fontSize: fontScale(14),
    fontWeight: "500",
  },
  menuContainer: {
    borderRadius: moderateScale(12),
    marginHorizontal: horizontalScale(16),
    marginBottom: verticalScale(24),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    height: horizontalScale(40),
    borderRadius: horizontalScale(20),
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
  },
}); 