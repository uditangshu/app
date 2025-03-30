import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';

interface EmployeeProfile {
  employee_id: string;
  name: string;
  email: string;
  role: string;
  manager_id: string;
  is_blocked: boolean;
  mood_stats: {
    average_score: number;
    total_sessions: number;
    emotion_distribution: {
      [key: string]: number;
    };
    last_5_scores: number[];
  };
  chat_summary: {
    chat_id: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
    total_messages: number;
    chat_mode: string;
    is_escalated: boolean;
  };
  upcoming_meets: number;
  upcoming_sessions: number;
  company_data: {
    activity: Array<{
      Date: string;
      Teams_Messages_Sent: number;
      Emails_Sent: number;
      Meetings_Attended: number;
      Work_Hours: number;
    }>;
    leave: Array<{
      Leave_Type: string;
      Leave_Days: number;
      Leave_Start_Date: string;
      Leave_End_Date: string;
    }>;
    vibemeter: Array<{
      Response_Date: string;
      Vibe_Score: number;
      Emotion_Zone: string;
    }>;
  };
}

export default function StatisticsScreen() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/employee/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data: EmployeeProfile = await response.json();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile data</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Mood Statistics */}
        <LinearGradient
          colors={['rgba(134, 188, 37, 0.1)', 'rgba(134, 188, 37, 0.05)']}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={24} color={theme.COLORS.text.primary} />
            <Text style={styles.sectionTitle}>Mood Statistics</Text>
          </View>
          <View style={styles.moodStats}>
            <View style={styles.statRow}>
              <Text style={styles.label}>Average Score</Text>
              <Text style={styles.value}>{profile.mood_stats.average_score}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.label}>Total Sessions</Text>
              <Text style={styles.value}>{profile.mood_stats.total_sessions}</Text>
            </View>
            <View style={styles.emotionDistribution}>
              <Text style={styles.subheader}>Emotion Distribution</Text>
              {Object.entries(profile.mood_stats?.emotion_distribution || {}).map(([emotion, count]) => (
                <View key={emotion} style={styles.emotionRow}>
                  <Text style={styles.emotionLabel}>{emotion}</Text>
                  <Text style={styles.emotionValue}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Leave Information */}
        <LinearGradient
          colors={['rgba(134, 188, 37, 0.1)', 'rgba(134, 188, 37, 0.05)']}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color={theme.COLORS.text.primary} />
            <Text style={styles.sectionTitle}>Leave Information</Text>
          </View>
          {profile.company_data.leave.length > 0 ? (
            <View style={styles.leaveInfo}>
              {profile.company_data.leave.map((leave, index) => (
                <View key={index} style={styles.leaveRow}>
                  <Text style={styles.leaveType}>{leave.Leave_Type}</Text>
                  <Text style={styles.leaveDays}>{leave.Leave_Days} days</Text>
                  <Text style={styles.leaveDates}>
                    {new Date(leave.Leave_Start_Date).toLocaleDateString()} - 
                    {new Date(leave.Leave_End_Date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No leave records found</Text>
          )}
        </LinearGradient>

        {/* Performance & Vibe */}
        <LinearGradient
          colors={['rgba(134, 188, 37, 0.1)', 'rgba(134, 188, 37, 0.05)']}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up-outline" size={24} color={theme.COLORS.text.primary} />
            <Text style={styles.sectionTitle}>Performance & Vibe</Text>
          </View>
          {profile.company_data.vibemeter.length > 0 ? (
            <View style={styles.vibeInfo}>
              {profile.company_data.vibemeter.map((vibe, index) => (
                <View key={index} style={styles.vibeRow}>
                  <Text style={styles.vibeDate}>
                    {new Date(vibe.Response_Date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.vibeScore}>Score: {vibe.Vibe_Score}</Text>
                  <Text style={styles.vibeZone}>{vibe.Emotion_Zone}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No vibe data available</Text>
          )}
        </LinearGradient>
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
    color: theme.COLORS.error,
    fontSize: fontScale(16),
  },
  section: {
    marginBottom: verticalScale(16),
    borderRadius: 12,
    marginHorizontal: horizontalScale(16),
    padding: horizontalScale(16),
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(20),
    ...theme.FONTS.bold,
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
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(14),
  },
  value: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(14),
    ...theme.FONTS.medium,
  },
  moodStats: {
    gap: verticalScale(16),
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emotionDistribution: {
    gap: verticalScale(8),
  },
  subheader: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
    marginBottom: verticalScale(8),
  },
  emotionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
  },
  emotionLabel: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(14),
  },
  emotionValue: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(14),
    ...theme.FONTS.medium,
  },
  leaveInfo: {
    gap: verticalScale(12),
  },
  leaveRow: {
    backgroundColor: 'rgba(134, 188, 37, 0.05)',
    padding: moderateScale(12),
    borderRadius: 8,
    gap: verticalScale(4),
  },
  leaveType: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
  },
  leaveDays: {
    color: theme.COLORS.primary.main,
    fontSize: fontScale(14),
    ...theme.FONTS.medium,
  },
  leaveDates: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(12),
  },
  vibeInfo: {
    gap: verticalScale(12),
  },
  vibeRow: {
    backgroundColor: 'rgba(134, 188, 37, 0.05)',
    padding: moderateScale(12),
    borderRadius: 8,
    gap: verticalScale(4),
  },
  vibeDate: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(12),
  },
  vibeScore: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(14),
    ...theme.FONTS.medium,
  },
  vibeZone: {
    color: theme.COLORS.primary.main,
    fontSize: fontScale(14),
    ...theme.FONTS.medium,
  },
  noDataText: {
    color: theme.COLORS.text.secondary,
    fontSize: fontScale(14),
    textAlign: 'center',
    padding: moderateScale(16),
  },
}); 