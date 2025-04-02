import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';
import Shimmer from '../components/Shimmer';

interface EmployeeProfile {
  employee_id: string;
  name: string;
  email: string;
  role: string;
  manager_id: string;
}

interface ProfileMenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
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

export const ProfileShimmer = () => {
  const { isDarkMode } = useTheme();
  const shimmerColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const shimmerHighlight = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <LinearGradient
        colors={isDarkMode ? ['#1C8D3A', '#165C27', '#0A3814'] : ['#E8F5E9', '#C8E6C9', '#A5D6A7']}
        style={styles.gradientBackground}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header Shimmer */}
          <View style={styles.header}>
            <View style={[styles.circleContainer, { backgroundColor: shimmerColor }]} />
          </View>

          {/* Profile Information Section */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: shimmerColor }]} />
              <View style={[styles.sectionTitleShimmer, { backgroundColor: shimmerColor }]} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <View style={[styles.labelShimmer, { backgroundColor: shimmerColor }]} />
                <View style={[styles.valueShimmer, { backgroundColor: shimmerColor }]} />
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.labelShimmer, { backgroundColor: shimmerColor }]} />
                <View style={[styles.valueShimmer, { backgroundColor: shimmerColor }]} />
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.labelShimmer, { backgroundColor: shimmerColor }]} />
                <View style={[styles.valueShimmer, { backgroundColor: shimmerColor }]} />
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.labelShimmer, { backgroundColor: shimmerColor }]} />
                <View style={[styles.valueShimmer, { backgroundColor: shimmerColor }]} />
              </View>
            </View>
          </View>

          {/* Menu Items Shimmer */}
          <View style={styles.menuContainer}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <View key={index} style={[styles.menuItem, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: shimmerColor }]} />
                  <View style={styles.menuItemText}>
                    <View style={[styles.menuItemTitleShimmer, { backgroundColor: shimmerColor }]} />
                    <View style={[styles.menuItemSubtitleShimmer, { backgroundColor: shimmerColor }]} />
                  </View>
                </View>
                <View style={[styles.chevronShimmer, { backgroundColor: shimmerColor }]} />
              </View>
            ))}
          </View>

          {/* Logout Button Shimmer */}
          <View style={[styles.logoutButton, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={[styles.logoutIconShimmer, { backgroundColor: shimmerColor }]} />
            <View style={[styles.logoutTextShimmer, { backgroundColor: shimmerColor }]} />
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default function ProfileScreen() {
  const { logout, accessToken } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/employee/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: 'transparent' }]}
        edges={['right', 'bottom', 'left']}
      >
        <ScrollView style={styles.scrollView}>
          <ProfileShimmer />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.COLORS.background.default }]}>
        <Text style={[styles.errorText, { color: theme.COLORS.error }]}>Failed to load profile data</Text>
      </View>
    );
  }

  const gradientColors = isDarkMode 
    ? ['#1C8D3A', '#165C27', '#0A3814']
    : ['#E8F5E9', '#C8E6C9', '#A5D6A7'];

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
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={[styles.circleContainer, { 
              backgroundColor: theme.COLORS.primary.main,
              borderWidth: isDarkMode ? 4 : 0,
              borderColor: 'rgba(0, 0, 0, 0.5)'
            }]}>
              <Text style={[styles.employeeId, { color: theme.COLORS.background.paper }]}>
                {profile.employee_id}
              </Text>
            </View>
          </View>

          {/* Profile Information */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={24} color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
              <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                Profile Information
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Employee ID</Text>
                <Text style={[styles.value, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{profile.employee_id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Email</Text>
                <Text style={[styles.value, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{profile.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Role</Text>
                <Text style={[styles.value, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{profile.role}</Text>
              </View>
              {profile.manager_id && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Manager ID</Text>
                  <Text style={[styles.value, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{profile.manager_id}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Profile Menu */}
          <View style={styles.menuContainer}>
            {profileMenuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}10` }]}>
                    <Ionicons name={item.icon as any} size={24} color={theme.COLORS.primary.main} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={[styles.menuItemTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={[styles.menuItemSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.COLORS.error} />
            <Text style={[styles.logoutText, { color: theme.COLORS.error }]}>Logout</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    padding: horizontalScale(16),
    paddingTop: verticalScale(24),
    marginTop: verticalScale(30),
  },
  circleContainer: {
    width: horizontalScale(120),
    height: horizontalScale(120),
    borderRadius: horizontalScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  employeeId: {
    fontSize: fontScale(20),
    fontWeight: '700',
  },
  section: {
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
    borderRadius: 12,
    marginHorizontal: horizontalScale(16),
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: fontScale(20),
    fontWeight: '700',
    marginLeft: horizontalScale(8),
  },
  profileInfo: {
    gap: verticalScale(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fontScale(14),
  },
  value: {
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  menuContainer: {
    padding: horizontalScale(16),
    marginTop: verticalScale(24),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: fontScale(16),
    fontWeight: '500',
    marginBottom: verticalScale(4),
  },
  menuItemSubtitle: {
    fontSize: fontScale(14),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(16),
    borderRadius: 8,
    marginHorizontal: horizontalScale(16),
    marginTop: verticalScale(24),
    marginBottom: verticalScale(32),
  },
  logoutText: {
    fontSize: fontScale(16),
    fontWeight: '500',
    marginLeft: horizontalScale(8),
  },
  profileContainer: {
    padding: moderateScale(16),
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    marginBottom: verticalScale(16),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(24),
  },
  profileStat: {
    alignItems: 'center',
  },
  profileDetails: {
    width: '100%',
  },
  sectionTitleShimmer: {
    height: verticalScale(24),
    width: horizontalScale(200),
    borderRadius: 4,
    marginLeft: horizontalScale(8),
  },
  labelShimmer: {
    height: verticalScale(16),
    width: horizontalScale(100),
    borderRadius: 4,
  },
  valueShimmer: {
    height: verticalScale(16),
    width: horizontalScale(150),
    borderRadius: 4,
  },
  menuItemTitleShimmer: {
    height: verticalScale(20),
    width: horizontalScale(200),
    borderRadius: 4,
    marginBottom: verticalScale(4),
  },
  menuItemSubtitleShimmer: {
    height: verticalScale(16),
    width: horizontalScale(150),
    borderRadius: 4,
  },
  chevronShimmer: {
    width: horizontalScale(24),
    height: verticalScale(24),
    borderRadius: 12,
  },
  logoutIconShimmer: {
    width: horizontalScale(24),
    height: verticalScale(24),
    borderRadius: 12,
    marginRight: horizontalScale(8),
  },
  logoutTextShimmer: {
    height: verticalScale(20),
    width: horizontalScale(80),
    borderRadius: 4,
  },
}); 