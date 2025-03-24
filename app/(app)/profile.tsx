import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';

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
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editImageButton}>
              <Ionicons name="camera-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.role}>Senior Software Engineer</Text>
          <Text style={styles.department}>Technology Department</Text>
        </View>

        {/* Profile Menu */}
        <View style={styles.menuContainer}>
          {profileMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
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
              <Ionicons name="chevron-forward" size={24} color={theme.COLORS.text.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    padding: horizontalScale(16),
    paddingTop: verticalScale(24),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: verticalScale(16),
  },
  profileImage: {
    width: horizontalScale(100),
    height: horizontalScale(100),
    borderRadius: horizontalScale(50),
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.COLORS.primary.main,
    width: horizontalScale(32),
    height: horizontalScale(32),
    borderRadius: horizontalScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.COLORS.background.default,
  },
  name: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(24),
    ...theme.FONTS.bold,
    marginBottom: verticalScale(4),
  },
  role: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
    marginBottom: verticalScale(4),
  },
  department: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(14),
  },
  menuContainer: {
    padding: horizontalScale(16),
    marginTop: verticalScale(24),
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.background.paper,
    padding: moderateScale(16),
    borderRadius: 8,
    margin: horizontalScale(16),
    marginTop: verticalScale(24),
    marginBottom: verticalScale(32),
  },
  logoutText: {
    color: theme.COLORS.error,
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
    marginLeft: horizontalScale(8),
  },
}); 