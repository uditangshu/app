import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
    created_at: string;
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
    performance: Array<{
      Review_Period: string;
      Performance_Rating: number;
      Manager_Feedback: string;
      Promotion_Consideration: boolean;
    }>;
    vibemeter: Array<{
      Response_Date: string;
      Vibe_Score: number;
    }>;
  };
}

export const StatisticsShimmer = () => {
  const { theme, isDarkMode } = useTheme();
  
  const sectionStyle = {
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
    padding: horizontalScale(16),
    marginHorizontal: horizontalScale(16),
    borderRadius: 12,
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
    padding: moderateScale(16),
    borderRadius: 12,
    marginBottom: verticalScale(12),
  };

  return (
    <ScrollView style={styles.scrollView}>
      {/* Header Shimmer */}
      <View style={styles.header}>
        <Shimmer 
          width={180} 
          height={32} 
          style={{ marginBottom: verticalScale(8) }}
        />
        <Shimmer 
          width={240} 
          height={20}
        />
      </View>

      {/* Activity Section Shimmer */}
      <View style={[sectionStyle, { marginTop: 0 }]}>
        <View style={styles.sectionHeader}>
          <Shimmer width={24} height={24} borderRadius={12} />
          <Shimmer 
            width={120} 
            height={24} 
            style={{ marginLeft: horizontalScale(8) }}
          />
        </View>
        {[1, 2].map((index) => (
          <View key={`activity-shimmer-${index}`} style={cardStyle}>
            <Shimmer 
              width={120} 
              height={16} 
              style={{ marginBottom: verticalScale(12) }}
            />
            <View style={styles.activityStats}>
              {[1, 2, 3].map((statIndex) => (
                <View key={`stat-${statIndex}`} style={styles.activityStat}>
                  <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
                    <Shimmer width={20} height={20} borderRadius={10} />
                  </View>
                  <Shimmer 
                    width={40} 
                    height={24} 
                    style={{ marginVertical: verticalScale(4) }}
                  />
                  <Shimmer width={60} height={12} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Performance Review Section Shimmer */}
      <View style={sectionStyle}>
        <View style={styles.sectionHeader}>
          <Shimmer width={24} height={24} borderRadius={12} />
          <Shimmer 
            width={160} 
            height={24} 
            style={{ marginLeft: horizontalScale(8) }}
          />
        </View>
        {[1, 2].map((index) => (
          <View key={`review-shimmer-${index}`} style={cardStyle}>
            <View style={styles.reviewHeader}>
              <Shimmer width={140} height={20} />
              <View style={[styles.ratingContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.2)' : `${theme.COLORS.primary.main}30` }]}>
                <Shimmer width={40} height={20} />
              </View>
            </View>
            <Shimmer 
              width={'100%'} 
              height={60} 
              style={{ marginTop: verticalScale(8) }}
            />
            <View style={[styles.promotionBadge, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.2)' : `${theme.COLORS.primary.main}30` }]}>
              <Shimmer width={120} height={20} />
            </View>
          </View>
        ))}
      </View>

      {/* Leave History Section Shimmer */}
      <View style={[sectionStyle, { marginBottom: verticalScale(24) }]}>
        <View style={styles.sectionHeader}>
          <Shimmer width={24} height={24} borderRadius={12} />
          <Shimmer 
            width={120} 
            height={24} 
            style={{ marginLeft: horizontalScale(8) }}
          />
        </View>
        {[1, 2].map((index) => (
          <View key={`leave-shimmer-${index}`} style={cardStyle}>
            <View style={styles.leaveHeader}>
              <Shimmer width={120} height={20} />
              <Shimmer width={60} height={16} />
            </View>
            <Shimmer 
              width={200} 
              height={14} 
              style={{ marginTop: verticalScale(4) }}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default function StatisticsScreen() {
  const { accessToken } = useAuth();
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

  const gradientColors = isDarkMode 
    ? ['#1C8D3A', '#165C27', '#0A3814']
    : ['#E8F5E9', '#C8E6C9', '#A5D6A7'];

  const renderStatCard = (title: string, value: string | number, icon: string, subtitle?: string) => (
    <View style={[styles.statCard, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255, 255, 255, 0.8)' }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
        <Ionicons name={icon as any} size={24} color={theme.COLORS.primary.main} />
      </View>
      <Text style={[styles.statTitle, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>{title}</Text>
      <Text style={[styles.statValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderShimmerCard = () => (
    <View style={[styles.statCard, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255, 255, 255, 0.8)' }]}>
      <View style={styles.iconContainer}>
        <Shimmer width={24} height={24} borderRadius={12} />
      </View>
      <Shimmer width={100} height={16} style={{ marginTop: verticalScale(8) }} />
      <Shimmer width={60} height={24} style={{ marginTop: verticalScale(4) }} />
      <Shimmer width={80} height={14} style={{ marginTop: verticalScale(4) }} />
    </View>
  );

  const renderActivityCard = (activity: any) => (
    <View style={[styles.activityCard, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
      <View style={styles.activityHeader}>
        <Text style={[styles.activityDate, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
          {new Date(activity.Date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.activityStats}>
        <View style={styles.activityStat}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
            <Ionicons name="chatbubbles-outline" size={20} color={theme.COLORS.primary.main} />
          </View>
          <Text style={[styles.activityValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
            {activity.Teams_Messages_Sent}
          </Text>
          <Text style={[styles.activityLabel, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
            Messages
          </Text>
        </View>
        <View style={styles.activityStat}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
            <Ionicons name="mail-outline" size={20} color={theme.COLORS.primary.main} />
          </View>
          <Text style={[styles.activityValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
            {activity.Emails_Sent}
          </Text>
          <Text style={[styles.activityLabel, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
            Emails
          </Text>
        </View>
        <View style={styles.activityStat}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
            <Ionicons name="people-outline" size={20} color={theme.COLORS.primary.main} />
          </View>
          <Text style={[styles.activityValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
            {activity.Meetings_Attended}
          </Text>
          <Text style={[styles.activityLabel, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
            Meetings
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPerformanceSection = () => (
    <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="trophy-outline" size={24} color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
        <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Performance Review</Text>
      </View>
      {profile?.company_data.performance.map((review, index) => (
        <View key={`performance-${review.Review_Period}-${index}`} style={[styles.reviewCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' }]}>
          <View style={styles.reviewHeader}>
            <Text style={[styles.reviewPeriod, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
              {review.Review_Period}
            </Text>
            <View style={[styles.ratingContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.2)' : `${theme.COLORS.primary.main}30` }]}>
              <Text style={[styles.ratingText, { color: theme.COLORS.primary.main }]}>
                {review.Performance_Rating}/5
              </Text>
            </View>
          </View>
          <Text style={[styles.reviewFeedback, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
            {review.Manager_Feedback}
          </Text>
          {review.Promotion_Consideration && (
            <View style={[styles.promotionBadge, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.2)' : `${theme.COLORS.primary.main}30` }]}>
              <Ionicons name="trending-up" size={16} color={theme.COLORS.primary.main} />
              <Text style={[styles.promotionText, { color: theme.COLORS.primary.main }]}>
                Promotion Consideration
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderVibeSection = () => (
    <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="pulse-outline" size={24} color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
        <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Vibe Meter</Text>
      </View>
      {profile?.company_data.vibemeter.map((vibe, index) => (
        <View key={`vibe-${vibe.Response_Date}-${index}`} style={[styles.vibeCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' }]}>
          <Text style={[styles.vibeDate, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
            {new Date(vibe.Response_Date).toLocaleDateString()}
          </Text>
          <View style={styles.vibeScoreContainer}>
            <View style={[styles.vibeScore, { 
              backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.2)' : `${theme.COLORS.primary.main}30`,
              width: `${(vibe.Vibe_Score / 5) * 100}%`
            }]} />
          </View>
          <Text style={[styles.vibeScoreText, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
            {vibe.Vibe_Score}/5
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background.default }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
      >
        <ScrollView style={styles.scrollView}>
          {loading ? (
            <StatisticsShimmer />
          ) : (
            <>
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Statistics</Text>
                <Text style={[styles.headerSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                  Your performance metrics
                </Text>
              </View>

              {/* Activity Section */}
              <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', marginTop: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="analytics-outline" size={24} color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Recent Activity</Text>
                </View>
                {profile?.company_data.activity.map((activity, index) => (
                  <View key={`activity-${activity.Date}-${index}`}>
                    {renderActivityCard(activity)}
                  </View>
                ))}
              </View>

              {/* Performance Review Section */}
              {renderPerformanceSection()}

              {/* Vibe Meter Section */}
              {renderVibeSection()}

              {/* Leave History Section */}
              <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', marginBottom: verticalScale(24) }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar-outline" size={24} color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Leave History</Text>
                </View>
                {profile?.company_data.leave.map((leave, index) => (
                  <View key={`leave-${leave.Leave_Start_Date}-${index}`} style={[styles.leaveItem, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)' }]}>
                    <View style={styles.leaveHeader}>
                      <Text style={[styles.leaveType, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{leave.Leave_Type}</Text>
                      <Text style={[styles.leaveDays, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>
                        {leave.Leave_Days} days
                      </Text>
                    </View>
                    <Text style={[styles.leaveDate, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>
                      {new Date(leave.Leave_Start_Date).toLocaleDateString()} - {new Date(leave.Leave_End_Date).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
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
  header: {
    padding: horizontalScale(16),
    paddingTop: verticalScale(24),
    paddingBottom: verticalScale(16),
  },
  headerTitle: {
    fontSize: fontScale(28),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  headerSubtitle: {
    fontSize: fontScale(16),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: horizontalScale(16),
    marginTop: verticalScale(16),
  },
  statCard: {
    width: '48%',
    padding: moderateScale(16),
    borderRadius: 12,
    marginBottom: verticalScale(16),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  statTitle: {
    fontSize: fontScale(14),
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: fontScale(24),
    fontWeight: '700',
    marginBottom: verticalScale(4),
  },
  statSubtitle: {
    fontSize: fontScale(12),
  },
  section: {
    padding: horizontalScale(16),
    marginHorizontal: horizontalScale(16),
    marginTop: verticalScale(24),
    borderRadius: 12,
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
  leaveItem: {
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(8),
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  leaveType: {
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  leaveDays: {
    fontSize: fontScale(14),
  },
  leaveDate: {
    fontSize: fontScale(12),
  },
  statisticsContainer: {
    padding: moderateScale(16),
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    margin: horizontalScale(16),
  },
  statisticsHeader: {
    marginBottom: verticalScale(16),
  },
  chartsContainer: {
    width: '100%',
  },
  chartSection: {
    marginBottom: verticalScale(24),
  },
  activityCard: {
    padding: moderateScale(16),
    borderRadius: 12,
    marginBottom: verticalScale(12),
  },
  activityHeader: {
    marginBottom: verticalScale(12),
  },
  activityDate: {
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityStat: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: fontScale(20),
    fontWeight: '700',
    marginVertical: verticalScale(4),
  },
  activityLabel: {
    fontSize: fontScale(12),
  },
  reviewCard: {
    padding: moderateScale(16),
    borderRadius: 12,
    marginBottom: verticalScale(12),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  reviewPeriod: {
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  ratingContainer: {
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: 16,
  },
  ratingText: {
    fontSize: fontScale(14),
    fontWeight: '600',
  },
  reviewFeedback: {
    fontSize: fontScale(14),
    lineHeight: 20,
  },
  promotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: 16,
    marginTop: verticalScale(12),
    alignSelf: 'flex-start',
  },
  promotionText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    marginLeft: horizontalScale(4),
  },
  vibeCard: {
    padding: moderateScale(16),
    borderRadius: 12,
    marginBottom: verticalScale(12),
  },
  vibeDate: {
    fontSize: fontScale(14),
    marginBottom: verticalScale(8),
  },
  vibeScoreContainer: {
    height: verticalScale(8),
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  vibeScore: {
    height: '100%',
    borderRadius: 4,
  },
  vibeScoreText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    marginTop: verticalScale(8),
  },
}); 