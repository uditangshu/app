import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ViewStyle,
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import ChatScreen from '../modals/chat';
import { API_URL } from '../../constants/api';
import NotificationsModal from '../modals/notifications';
import Shimmer from '../components/Shimmer';
import { useTheme } from '../../contexts/ThemeContext';

interface EventItem {
  id: string;
  title: string;
  date: string;
  type: 'Meeting' | 'Deadline' | 'Training';
}

interface ChatItem {
  chat_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  total_messages: number;
  chat_mode: string;
  is_escalated: boolean;
}

interface ChatResponse {
  chats: ChatItem[];
  total_chats: number;
}

interface Notification {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  created_at: string;
  status: 'read' | 'unread';
}

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

const events: EventItem[] = [
  { id: '1', title: 'Team Meeting', date: '2023-03-25 10:00 AM', type: 'Meeting' },
  { id: '2', title: 'Project Deadline', date: '2023-03-28', type: 'Deadline' },
  { id: '3', title: 'Training Session', date: '2023-03-30 2:00 PM', type: 'Training' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { accessToken } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isFromRecentChat, setIsFromRecentChat] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const PAGE_SIZE = 3;

  const pan = useRef(new Animated.ValueXY()).current;
  const chatHeight = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          pan.setValue({ x: 0, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          dismissChat();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/employee/chats?page=${page}&limit=${PAGE_SIZE}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data: ChatResponse = await response.json();
      setChats(prevChats => page === 1 ? data.chats : [...prevChats, ...data.chats]);
      setHasMore(data.chats.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (page = 1, isRefresh = false) => {
    if (!accessToken || (notificationsLoading && !isRefresh)) return;
    
    try {
      setNotificationsLoading(true);
      const response = await fetch(
        `${API_URL}/employee/ping?page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      const newNotifications = data.notifications || [];
      
      // If it's a refresh or first page, replace the notifications
      // Otherwise, append new notifications
      setNotifications(prev => 
        isRefresh || page === 1 ? newNotifications : [...prev, ...newNotifications]
      );
      
      setHasMoreNotifications(newNotifications.length === 10);
      setNotificationsPage(page);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleLoadMoreNotifications = () => {
    if (!notificationsLoading && hasMoreNotifications) {
      fetchNotifications(notificationsPage + 1, false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (notification.status === 'unread') {
      // Update notification status locally
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, status: 'read' as const } : n
        )
      );

    
      try {
        const response = await fetch(
          `${API_URL}/employee/notification/${notification.id}/read`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to mark notification as read');
        }

        // Refresh notifications after marking as read
        fetchNotifications(1, true);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Revert local state if server update fails
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, status: 'unread' as const } : n
          )
        );
      }
    }
  };

  const fetchProfile = async () => {
    if (!accessToken) return;
    
    try {
      setIsProfileLoading(true);
      const response = await fetch(
        `${API_URL}/employee/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchNotifications(1, true);
    fetchProfile();
    
    
    const interval = setInterval(() => {
      fetchNotifications(1, true);
    }, 15000); 

    return () => clearInterval(interval);
  }, []);

  // Add new useEffect for page changes - only ping API
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        fetchNotifications(1, true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const showChat = (chatId?: string) => {
    if (chatId) {
      setSelectedChatId(chatId);
      setIsFromRecentChat(true);
    } else {
      setSelectedChatId(null);
      setIsFromRecentChat(false);
    }
    setIsChatVisible(true);
    
    Animated.spring(chatHeight, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const dismissChat = () => {
    Animated.timing(chatHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsChatVisible(false);
      setSelectedChatId(null);
      setIsFromRecentChat(false);
    });
  };

  const chatTranslateY = pan.y.interpolate({
    inputRange: [0, Dimensions.get('window').height],
    outputRange: [0, Dimensions.get('window').height],
    extrapolate: 'clamp',
  });

  const chatOpacity = chatHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const renderChatItemShimmer = () => (
    <View style={[styles.chatItem, { backgroundColor: theme.COLORS.background.paper }]}>
      <View style={styles.chatIconContainer}>
        <Shimmer width={40} height={40} borderRadius={20} />
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Shimmer width={120} height={16} />
          <Shimmer width={60} height={12} />
        </View>
        <Shimmer 
          width={Dimensions.get('window').width - 140} 
          height={14} 
          style={{ marginTop: verticalScale(4) }} 
        />
      </View>
    </View>
  );

  const gradientColors = isDarkMode 
    ? ['#1C8D3A', '#165C27', '#0A3814']
    : ['#E8F5E9', '#C8E6C9', '#A5D6A7'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.COLORS.background.default }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.scrollView}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
            if (isCloseToBottom) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.welcomeText, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Welcome, {user?.employee_id}</Text>
              <Text style={[styles.subtitleText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Your employee dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => setNotificationModalVisible(true)}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={isDarkMode ? 'white' : theme.COLORS.text.primary}
                />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.COLORS.error }]}>
                    <Text style={[styles.badgeText, { color: theme.COLORS.background.paper }]}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Updates Section */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={24} color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
              <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Your Updates</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Recent activity and performance</Text>

            <View style={styles.updateGrid}>
              {isProfileLoading ? (
                <>
                  {/* Mood Score Card */}
                  <View style={[styles.updateCard, styles.updateCardShimmer]}>
                    <View style={styles.updateIconContainer}>
                      <Shimmer width={24} height={24} borderRadius={12} />
                    </View>
                    <View style={styles.updateContent}>
                      <Shimmer width={70} height={14} />
                      <View style={[styles.valueContainer, { marginTop: verticalScale(4) }]}>
                        <Shimmer width={30} height={24} />
                        <Shimmer width={20} height={24} style={{ marginLeft: 4 }} />
                      </View>
                      <View style={[styles.subtextContainer, { marginTop: verticalScale(4) }]}>
                        <Shimmer width={20} height={12} />
                        <Shimmer width={50} height={12} style={{ marginLeft: 4 }} />
                      </View>
                    </View>
                  </View>

                  {/* Upcoming Meetings Card */}
                  <View style={[styles.updateCard, styles.updateCardShimmer]}>
                    <View style={styles.updateIconContainer}>
                      <Shimmer width={24} height={24} borderRadius={12} />
                    </View>
                    <View style={styles.updateContent}>
                      <Shimmer width={70} height={14} />
                      <View style={[styles.valueContainer, { marginTop: verticalScale(4) }]}>
                        <Shimmer width={20} height={24} />
                      </View>
                      <Shimmer width={50} height={12} style={{ marginTop: verticalScale(4) }} />
                    </View>
                  </View>

                  {/* Sessions Card */}
                  <View style={[styles.updateCard, styles.updateCardShimmer]}>
                    <View style={styles.updateIconContainer}>
                      <Shimmer width={24} height={24} borderRadius={12} />
                    </View>
                    <View style={styles.updateContent}>
                      <Shimmer width={60} height={14} />
                      <View style={[styles.valueContainer, { marginTop: verticalScale(4) }]}>
                        <Shimmer width={20} height={24} />
                      </View>
                      <Shimmer width={60} height={12} style={{ marginTop: verticalScale(4) }} />
                    </View>
                  </View>

                  {/* Performance Card */}
                  <View style={[styles.updateCard, styles.updateCardShimmer]}>
                    <View style={styles.updateIconContainer}>
                      <Shimmer width={24} height={24} borderRadius={12} />
                    </View>
                    <View style={styles.updateContent}>
                      <Shimmer width={90} height={14} />
                      <View style={[styles.valueContainer, { marginTop: verticalScale(4) }]}>
                        <Shimmer width={30} height={24} />
                        <Shimmer width={20} height={24} style={{ marginLeft: 4 }} />
                      </View>
                      <Shimmer width={100} height={12} style={{ marginTop: verticalScale(4) }} />
                    </View>
                  </View>
                </>
              ) : profile ? (
                <>
                  {/* Mood Score */}
                  <View style={[styles.updateCard, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)' }]}>
                    <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
                      <Ionicons name="happy-outline" size={24} color={theme.COLORS.primary.main} />
                    </View>
                    <Text style={[styles.updateLabel, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>Mood Score</Text>
                    <Text style={[styles.updateValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                      {profile.mood_stats.average_score.toFixed(1)}/5
                    </Text>
                    <Text style={[styles.updateSubtext, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>
                      {profile.mood_stats.total_sessions} sessions
                    </Text>
                  </View>

                  {/* Upcoming Meetings */}
                  <View style={[styles.updateCard, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)' }]}>
                    <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
                      <Ionicons name="calendar" size={24} color={theme.COLORS.primary.main} />
                    </View>
                    <Text style={[styles.updateLabel, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>Upcoming</Text>
                    <Text style={[styles.updateValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{profile.upcoming_meets}</Text>
                    <Text style={[styles.updateSubtext, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>meetings</Text>
                  </View>

                  {/* Upcoming Sessions */}
                  <View style={[styles.updateCard, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)' }]}>
                    <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
                      <Ionicons name="people" size={24} color={theme.COLORS.primary.main} />
                    </View>
                    <Text style={[styles.updateLabel, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>Sessions</Text>
                    <Text style={[styles.updateValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{profile.upcoming_sessions}</Text>
                    <Text style={[styles.updateSubtext, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>upcoming</Text>
                  </View>

                  {/* Latest Performance */}
                  {profile.company_data.performance.length > 0 && (
                    <View style={[styles.updateCard, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)' }]}>
                      <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
                        <Ionicons name="trophy" size={24} color={theme.COLORS.primary.main} />
                      </View>
                      <Text style={[styles.updateLabel, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>Performance</Text>
                      <Text style={[styles.updateValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                        {profile.company_data.performance[0].Performance_Rating}/5
                      </Text>
                      <Text style={[styles.updateSubtext, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>
                        {profile.company_data.performance[0].Manager_Feedback}
                      </Text>
                    </View>
                  )}

                  {/* Latest Activity */}
                  {profile.company_data.activity.length > 0 && (
                    <View style={[styles.updateCard, styles.updateCardWide, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)' }]}>
                      <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
                        <Ionicons name="time" size={24} color={theme.COLORS.primary.main} />
                      </View>
                      <Text style={[styles.updateLabel, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>Today's Work</Text>
                      <Text style={[styles.updateValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                        {profile.company_data.activity[0].Work_Hours}h
                      </Text>
                      <Text style={[styles.updateSubtext, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>
                        {profile.company_data.activity[0].Meetings_Attended} meetings
                      </Text>
                    </View>
                  )}
                </>
              ) : null}
            </View>
          </View>
          

          {/* Recent Chats Section */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={24} color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
              <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Recent Chats</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>Your recent conversations</Text>

            {loading && page === 1 ? (
              <View style={styles.chatList}>
                {[1, 2, 3].map((key) => (
                  <View key={key} style={styles.chatItemShimmer}>
                    {renderChatItemShimmer()}
                  </View>
                ))}
              </View>
            ) : (
              <>
                {chats.map((chat, index) => (
                  <TouchableOpacity 
                    key={chat.chat_id} 
                    style={[styles.chatItem, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }]}
                    onPress={() => showChat(chat.chat_id)}
                  >
                    <View style={[styles.chatIconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}20` }]}>
                      <Ionicons 
                        name={chat.is_escalated ? "warning-outline" : "chatbubble-outline"} 
                        size={24} 
                        color={theme.COLORS.primary.main} 
                      />
                    </View>
                    <View style={styles.chatInfo}>
                      <View style={styles.chatHeader}>
                        <Text style={[styles.chatTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                          {chat.chat_mode === 'ai' ? 'AI Assistant' : 'Human Support'}
                        </Text>
                        <Text style={[styles.chatTime, { color: isDarkMode ? 'rgba(255,255,255,0.5)' : theme.COLORS.text.secondary }]}>
                          {formatDate(chat.last_message_time)}
                        </Text>
                      </View>
                      <Text style={[styles.chatMessage, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]} numberOfLines={1}>
                        {chat.last_message}
                      </Text>
                      {chat.unread_count > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.COLORS.primary.main }]}>
                          <Text style={[styles.unreadBadgeText, { color: theme.COLORS.background.paper }]}>
                            {chat.unread_count}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {hasMore && (
                  <TouchableOpacity 
                    style={[styles.loadMoreButton, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.2)' : `${theme.COLORS.primary.main}20` }]} 
                    onPress={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
                    ) : (
                      <Text style={[styles.loadMoreText, { color: isDarkMode ? 'white' : theme.COLORS.primary.main }]}>Load More</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Chat Button */}
          <TouchableOpacity 
            style={[styles.chatButton, { backgroundColor: theme.COLORS.primary.main }]}
            onPress={() => showChat()}
          >
            <Ionicons name="add" size={24} color={theme.COLORS.background.paper} />
            <Text style={[styles.chatButtonText, { color: theme.COLORS.background.paper }]}>
              New Chat
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Chat Modal */}
        {isChatVisible && (
          <Animated.View
            style={[
              styles.chatModal,
              {
                transform: [{ translateY: chatTranslateY }],
                opacity: chatOpacity,
                backgroundColor: theme.COLORS.background.paper,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.chatHeader}>
              <View style={styles.chatHandle} />
              <TouchableOpacity onPress={dismissChat} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            <ChatScreen 
              onClose={dismissChat} 
              initialChatId={selectedChatId} 
              isReadOnly={isFromRecentChat}
            />
          </Animated.View>
        )}

        <NotificationsModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
          notifications={notifications}
          loading={notificationsLoading}
          onLoadMore={handleLoadMoreNotifications}
          onNotificationPress={handleNotificationPress}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: horizontalScale(16),
    paddingTop: Platform.OS === 'android' ? verticalScale(40) : verticalScale(16),
    backgroundColor: 'transparent',
  },
  welcomeText: {
    color: 'white',
    fontSize: fontScale(24),
    fontWeight: 'bold',
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(14),
    marginTop: verticalScale(4),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: moderateScale(4),
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: fontScale(12),
    ...theme.FONTS.medium,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: moderateScale(8),
    borderRadius: 8,
  },
  profileText: {
    color: 'white',
    marginRight: horizontalScale(4),
  },
  section: {
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
    backgroundColor: 'rgba(0,0,0,0.8)', // Darker background for sections
    borderRadius: 12,
    marginHorizontal: horizontalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    color: 'white',
    fontSize: fontScale(20),
    fontWeight: 'bold',
    marginLeft: horizontalScale(8),
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(14),
    marginBottom: verticalScale(16),
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker background for event items
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(8),
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: 'white',
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  eventDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(14),
    marginTop: verticalScale(4),
  },
  eventBadge: {
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: 16,
  },
  meeting: {
    backgroundColor: '#1C8D3A',
  },
  deadline: {
    backgroundColor: '#FF4B4B',
  },
  training: {
    backgroundColor: '#4B7BFF',
  },
  eventBadgeText: {
    color: 'white',
    fontSize: fontScale(12),
    fontWeight: '500',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(16),
  },
  viewMoreText: {
    color: '#1C8D3A',
    fontSize: fontScale(16),
    fontWeight: '500',
    marginRight: horizontalScale(8),
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(12),
  },
  chatInfo: {
    marginLeft: horizontalScale(12),
    flex: 1,
  },
  chatTitle: {
    color: 'white',
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  chatMessage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(14),
    marginTop: verticalScale(4),
  },
  chatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 141, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: verticalScale(4),
  },
  chatTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontScale(12),
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: verticalScale(20),
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: 'rgba(28, 141, 58, 0.2)',
    padding: moderateScale(12),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  loadMoreText: {
    color: 'white',
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: verticalScale(8),
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker background for quick action buttons
    padding: moderateScale(16),
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  quickActionText: {
    color: 'white',
    fontSize: fontScale(14),
    fontWeight: '500',
    marginTop: verticalScale(8),
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(16),
    borderRadius: 8,
    margin: horizontalScale(16),
    marginTop: verticalScale(24),
    marginBottom: verticalScale(32),
  },
  chatButtonText: {
    color: 'white',
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
    marginLeft: horizontalScale(8),
  },
  chatModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.COLORS.background.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  chatHandle: {
    width: horizontalScale(40),
    height: verticalScale(4),
    backgroundColor: theme.COLORS.border.main,
    borderRadius: 2,
    marginBottom: verticalScale(8),
  },
  closeButton: {
    position: 'absolute',
    right: horizontalScale(16),
    top: verticalScale(16),
  },
  updateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: verticalScale(8),
  },
  updateCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: moderateScale(16),
    borderRadius: 12,
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  updateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 141, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fontScale(14),
    ...theme.FONTS.medium,
  },
  updateValue: {
    color: 'white',
    fontSize: fontScale(24),
    ...theme.FONTS.bold,
    marginTop: verticalScale(4),
  },
  updateSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: fontScale(12),
    marginTop: verticalScale(4),
  },
  updateCardWide: {
    width: '100%', // Make the last card full width
  },
  shimmerContainer: {
    marginBottom: verticalScale(8),
  },
  updateCardContent: {
    flex: 1,
  },
  updateTextContainer: {
    marginTop: verticalScale(12),
  },
  updateCardShimmer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  chatItemShimmer: {
    marginBottom: verticalScale(8),
  },
  chatList: {
    marginTop: verticalScale(8),
  },
  updateContent: {
    marginTop: verticalScale(12),
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPlaceholder: {
    fontSize: fontScale(16),
  },
});