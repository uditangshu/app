import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  AppState,
  useWindowDimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// interface EventItem {
//   id: string;
//   title: string;
//   date: string;
//   type: 'Meeting' | 'Deadline' | 'Training';
// }

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

interface ChainItem {
  chain_id: string;
  status: string;
  notes: string;
  created_at: string;
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
  meeting_link: string;
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
    leave: Array<any>;
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
  recent_chains?: ChainItem[];
}

interface ScheduledSession {
  session_id: string;
  user_id: string;
  chat_id: string;
  status: string;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  notes: string;
}

interface PendingChat {
  chat_id: string;
  question: string;
  created_at: string;
}

interface Session {
  session_id: string;
  user_id: string;
  chat_id: string;
  status: string;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

interface Chain {
  chain_id: string;
  employee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  session_ids: string[];
  context: any;
  completed_at: string | null;
  escalated_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
}

// const events: EventItem[] = [
//   { id: '1', title: 'Team Meeting', date: '2023-03-25 10:00 AM', type: 'Meeting' },
//   { id: '2', title: 'Project Deadline', date: '2023-03-28', type: 'Deadline' },
//   { id: '3', title: 'Training Session', date: '2023-03-30 2:00 PM', type: 'Training' },
// ];

export default function HomeScreen() {
  const { user } = useAuth();
  const { accessToken } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [isFromRecentChat, setIsFromRecentChat] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [loadingScheduledSessions, setLoadingScheduledSessions] = useState(false);
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | undefined>(undefined);
  const [chains, setChains] = useState<Chain[]>([]);
  const [chainsLoading, setChainsLoading] = useState(true);
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());
  const [chainMessages, setChainMessages] = useState<{[key: string]: any}>({});
  const [selectedChainContext, setSelectedChainContext] = useState<any>(null);
  const [loadingChainMessages, setLoadingChainMessages] = useState<{[key: string]: boolean}>({});
  const PAGE_SIZE = 3;

  // Single animation value for the chat modal
  const chatAnimation = useRef(new Animated.Value(0)).current;
  
  // Add a ref for the chat handle
  const chatHandleRef = useRef<View>(null);

  // Create a separate panResponder specifically for the handle
  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to significant downward gestures
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Convert drag distance to a value between 0 and 1
          const dragRatio = Math.min(1, gestureState.dy / (Dimensions.get('window').height / 2));
          // Set animation value based on drag (1 - dragRatio to invert the scale)
          chatAnimation.setValue(1 - dragRatio);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged more than 20% of screen height or with velocity > 0.5, dismiss
        if (gestureState.dy > Dimensions.get('window').height * 0.15 || gestureState.vy > 0.3) {
          dismissChat();
        } else {
          // Otherwise snap back to top with spring animation
          Animated.spring(chatAnimation, {
            toValue: 1,
            useNativeDriver: false,
            tension: 100,
            friction: 12, 
          }).start();
        }
      },
    })
  ).current;

  const initiateChat = async (chatId?: string | null, chainId: string | null = null) => {
    if (!accessToken) {
      console.log("Initiate chat aborted: No access token");
      return;
    }

    console.log("Initiating chat...");
    setLoading(true);
    
    try {
      // If chatId is not provided, get the most recent pending session
      if (!chatId) {
      const pendingSessions = scheduledSessions.filter(
        session => session.status === 'pending'
      );
      
      console.log("Available pending sessions:", pendingSessions.length);
     
      if (pendingSessions.length === 0) {
        console.error('No pending sessions available');
        return;
      }

      // Sort by creation date to get the latest session
      pendingSessions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const pendingSession = pendingSessions[0];
      console.log("Selected pending session with chatId:", pendingSession.chat_id);

      // Check if chat ID is valid
      if (!pendingSession.chat_id) {
        console.error("Invalid chat ID in pending session");
        return;
      }
        
        chatId = pendingSession.chat_id;
      }

      const requestBody = {
        chatId: chatId,
        status: "bot"
      };

      const response = await fetch(`${API_URL}/llm/chat/initiate-chat`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        console.error("API error:", await response.text());
        throw new Error('Failed to initiate chat');
      }

      const data = await response.json();
      console.log('Chat initiated successfully:', data);
      
      // If API returns a chatId, use that (mainly for chainId requests)
      const finalChatId = data.chatId || chatId;
      setSelectedChatId(finalChatId);
      
      // Show the chat immediately after a successful API call
      showChat(finalChatId);
      
    } catch (error) {
      console.error('Error initiating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (pageNum: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setNotificationsLoading(true);
      }

      const response = await fetch(
        `${API_URL}/employee/ping?page=${pageNum}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Sort notifications by created_at date (newest first)
        const sortedNotifications = data.notifications.sort((a: Notification, b: Notification) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        if (isLoadMore) {
          setNotifications(prev => {
            const combined = [...prev, ...sortedNotifications];
            // Sort combined list and remove duplicates
            return Array.from(new Map(combined.map(item => [item.id, item])).values())
              .sort((a: Notification, b: Notification) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          });
        } else {
          // For initial load or refresh, just set the sorted list
          setNotifications(sortedNotifications);
        }
        
        setHasMoreNotifications(data.notifications.length === 10);
        setNotificationsPage(pageNum);
      }
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

  const fetchScheduledSessions = async () => {
    if (!accessToken) return;
    
    try {
      setLoadingScheduledSessions(true);
      const response = await fetch(`${API_URL}/employee/scheduled-sessions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scheduled sessions');
      }

      const data = await response.json();
      console.log('Scheduled sessions:', data);
      setScheduledSessions(data);
    } catch (error) {
      console.error('Error fetching scheduled sessions:', error);
    } finally {
      setLoadingScheduledSessions(false);
    }
  };

  const toggleChainExpand = (chainId: string) => {
    console.log("Toggling chain:", chainId);
    setExpandedChains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chainId)) {
        newSet.delete(chainId);
      } else {
        newSet.add(chainId);
        // Fetch chain messages when expanding
        fetchChainMessages(chainId);
      }
      return newSet;
    });
  };

  const fetchChainMessages = async (chainId: string) => {
    if (!accessToken) return;
    
    try {
      // Set loading state for this specific chain
      setLoadingChainMessages(prev => ({
        ...prev,
        [chainId]: true
      }));
      
      // Use the exact API endpoint
      const response = await fetch(`${API_URL}/employee/chains/${chainId}/messages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chain messages');
      }

      const data = await response.json();
      console.log('Chain messages response for', chainId, 'received');
      
      setChainMessages(prev => ({
        ...prev,
        [chainId]: data
      }));
    } catch (error) {
      console.error('Error fetching chain messages:', error);
    } finally {
      // Clear loading state for this chain
      setLoadingChainMessages(prev => ({
        ...prev,
        [chainId]: false
      }));
    }
  };

  const fetchSessionDetails = async (sessionId: string, chainId: string) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      
      // First, make sure we have the chain messages
      if (!chainMessages[chainId]) {
        await fetchChainMessages(chainId);
      }
      
      // Find the session within the chain
      const chainData = chainMessages[chainId];
      const sessionData = chainData?.sessions?.find(
        (s: { session_id: string }) => s.session_id === sessionId
      );
      
      if (sessionData && sessionData.chat_id) {
        // Open the chat with additional context parameters
        openChatWithContext(sessionData.chat_id, {
          chainId: chainId,
          sessionId: sessionId,
          allSessions: chainData.sessions || []
        });
      } else {
        console.error('No chat_id found for this session');
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  // New function to open chat with context
  const openChatWithContext = (chatId: string, context: any) => {
    // Get the session status if available
    let currentSessionStatus = "inactive";
    const session = context.allSessions.find(
      (s: { chat_id: string }) => s.chat_id === chatId
    );
    
    if (session) {
      currentSessionStatus = session.status || "inactive";
    }
    
    // Make sure chainId is included in the context
    const updatedContext = {
      ...context,
      chainId: context.chainId || context.chainId // Use the chainId provided in context
    };
    
    console.log('Opening chat with context:', updatedContext);
    
    setSelectedChatId(chatId);
    setSelectedChainContext(updatedContext); // Pass the updated context with chainId
    setIsChatVisible(true);
    
    // Animate from 0 to 1
    Animated.spring(chatAnimation, {
      toValue: 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  };

  useEffect(() => {
    // Initialize data...
    // loadChats('');  
    fetchScheduledSessions();
    fetchProfile();
    loadChains();
    fetchNotifications(1, true);
    
    const interval = setInterval(() => {
      // loadChats('');
      fetchNotifications(1, true);
    }, 60000);

    return () => {
      clearInterval(interval);
    };
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

  // Add a function to format dates as requested
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric'
    };
    
    // Only add year if it's not the current year
    if (date.getFullYear() !== currentYear) {
      options.year = 'numeric';
    }
    
    return date.toLocaleDateString(undefined, options);
  };

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      // Don't call fetchChats, it's commented out
      // Also don't fetch chains anymore
    }
  };

  const showChat = (chatId: string) => {
    if (!chatId) {
      console.error('No chat ID provided to showChat');
      return;
    }
    
    console.log('Directly entering existing chat:', chatId);
    
    // Set the chat ID
      setSelectedChatId(chatId);
      setIsFromRecentChat(true);
    
    // Make the chat visible
    setIsChatVisible(true);
    
    // Animate from 0 to 1
    Animated.spring(chatAnimation, {
      toValue: 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  };

  const dismissChat = () => {
    // Animate from 1 to 0
    Animated.spring(chatAnimation, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
    }).start(() => {
      setIsChatVisible(false);
      setSelectedChatId(undefined);
      setIsFromRecentChat(false);
    });
  };

  // Derive translateY and opacity from a single animation value
  const chatTranslateY = chatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height, 0],
    extrapolate: 'clamp',
  });

  const chatOpacity = chatAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
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
    ? ['#2C5EE6', '#1A3A99', '#0A1E4D'] // Dark blue gradient
    : ['#E8F1FF', '#C8E1FF', '#A5D1FF']; // Light blue gradient

  // Add View Chain Details button to chain items
  const renderChainItem = ({ chain }: { chain: ChainItem }) => {
                  const isExpanded = expandedChains.has(chain.chain_id);
                  return (
                    <View key={chain.chain_id} style={styles.chainContainer}>
                      <TouchableOpacity 
          onPress={() => toggleChainExpand(chain.chain_id)}
                        style={[
                          styles.recentChainItem,
                          { 
                            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
                            borderLeftWidth: 5,
                            borderLeftColor: chain.status === 'active' 
                              ? '#4CAF50' // Green for active
                              : chain.status === 'completed' 
                                ? '#2C5EE6' // Blue for completed
                                : '#FFC107', // Yellow for other statuses
                            borderBottomLeftRadius: isExpanded ? 0 : 8,
                            borderBottomRightRadius: isExpanded ? 0 : 8,
                          }
                        ]}
                      >
                        <View style={styles.recentChainHeader}>
                          <View style={styles.recentChainTitleContainer}>
                            <Ionicons 
                              name={chain.status === 'active' ? "ellipse" : "checkmark-circle"} 
                              size={16} 
                              color={chain.status === 'active' ? '#4CAF50' : '#2C5EE6'} 
                              style={{ marginRight: 8 }}
                            />
                            <Text style={[
                              styles.recentChainTitle, 
                              { color: isDarkMode ? 'white' : theme.COLORS.text.primary }
                            ]}>
                              Chain {chain.chain_id.substring(5, 11)}
                            </Text>
                          </View>
                          <View style={styles.expandIconContainer}>
                            <View style={[
                              styles.statusBadge, 
                              { 
                                backgroundColor: chain.status === 'active' 
                                  ? 'rgba(76, 175, 80, 0.2)' // Light green for active
                                  : 'rgba(44, 94, 230, 0.2)', // Light blue for completed
                                marginRight: 8
                }]}>
                              <Text style={[
                                styles.statusText,
                                { 
                                  color: chain.status === 'active' ? '#4CAF50' : '#2C5EE6',
                                  fontWeight: 'bold'
                                }
                              ]}>
                                {chain.status.charAt(0).toUpperCase() + chain.status.slice(1)}
                              </Text>
                            </View>
                            <Ionicons 
                              name={isExpanded ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color={isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary} 
                            />
                          </View>
                        </View>
                        
                        <View style={styles.recentChainDetails}>
                          <Text style={[
                            styles.recentChainDate, 
                            { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }
                          ]}>
                            Created: {formatDate(chain.created_at)}
                          </Text>
                          
                          {chain.notes && (
                            <Text style={[
                              styles.recentChainNotes, 
                              { color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }
                            ]}>
                              Notes: {chain.notes}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      
                      {/* Display sessions when expanded */}
                      {isExpanded && (
                        <View style={[
                          styles.sessionsContainer, 
                          { 
                            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                          }
                        ]}>
                          {loadingChainMessages[chain.chain_id] ? (
                            // Show shimmer loading effect with proper theme support
                            <>
                              {chain.status === 'active' ? (
                                // For active chains, randomly show either session shimmers or empty state for demo purposes
                                Math.random() > 0.5 ? (
                                  // Show session shimmers
                                  [1, 2].map((index) => (
                                    <View key={`shimmer-${index}`} style={styles.sessionItem}>
                                      <View style={styles.sessionHeader}>
                                        <Shimmer 
                                          width={150} 
                                          height={16} 
                                          backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                          highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                        />
                                      </View>
                                      <View style={[
                                        styles.messageContainer,
                                        { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', marginTop: verticalScale(8) }
                                      ]}>
                                        <Shimmer 
                                          width={80} 
                                          height={12} 
                                          style={{ marginBottom: 8 }} 
                                          backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                          highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                        />
                                        <Shimmer 
                                          width={250} 
                                          height={16} 
                                          style={{ marginBottom: 8 }} 
                                          backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                          highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                        />
                                        <Shimmer 
                                          width={80} 
                                          height={10} 
                                          style={{ alignSelf: 'flex-end' }} 
                                          backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                          highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                        />
                                      </View>
                                    </View>
                                  ))
                                ) : (
                                  // Show empty state shimmer with button placeholder
                                  <View style={styles.emptySessionsContainer}>
                                    <Shimmer 
                                      width={200} 
                                      height={20} 
                                      style={{ marginBottom: verticalScale(16) }} 
                                      backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                      highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                    />
                                    <Shimmer 
                                      width={180} 
                                      height={40} 
                                      style={{ borderRadius: 8 }} 
                                      backgroundColor={isDarkMode ? 'rgba(44, 94, 230, 0.2)' : 'rgba(44, 94, 230, 0.1)'}
                                      highlightColor={isDarkMode ? 'rgba(44, 94, 230, 0.5)' : 'rgba(44, 94, 230, 0.3)'}
                                    />
                                  </View>
                                )
                              ) : (
                                // For completed chains, just show session shimmers
                                [1, 2].map((index) => (
                                  <View key={`shimmer-${index}`} style={styles.sessionItem}>
                                    <View style={styles.sessionHeader}>
                                      <Shimmer 
                                        width={150} 
                                        height={16} 
                                        backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                        highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                      />
                                    </View>
                                    <View style={[
                                      styles.messageContainer,
                                      { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', marginTop: verticalScale(8) }
                                    ]}>
                                      <Shimmer 
                                        width={80} 
                                        height={12} 
                                        style={{ marginBottom: 8 }} 
                                        backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                        highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                      />
                                      <Shimmer 
                                        width={250} 
                                        height={16} 
                                        style={{ marginBottom: 8 }} 
                                        backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                        highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                      />
                                      <Shimmer 
                                        width={80} 
                                        height={10} 
                                        style={{ alignSelf: 'flex-end' }} 
                                        backgroundColor={isDarkMode ? 'rgba(70, 70, 70, 0.2)' : 'rgba(230, 230, 230, 0.5)'}
                                        highlightColor={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}
                                      />
                                    </View>
                                  </View>
                                ))
                              )}
                            </>
                          ) : chainMessages[chain.chain_id]?.sessions && chainMessages[chain.chain_id]?.sessions.length > 0 ? (
                            // Render actual sessions if loaded
                            chainMessages[chain.chain_id].sessions.map((session: any) => {
                              // Get the last message from the session's messages array
                              const lastMessage = session.messages?.length > 0 
                                ? session.messages[session.messages.length - 1] 
                                : null;
                              const hasMessages = session.messages?.length > 0;
                              const isEscalated = session.is_escalated === true;
                              
                              return (
                                <View 
                                  key={session.session_id}
                                  style={[
                                    styles.sessionItem, 
                                    { 
                                      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                      borderLeftWidth: 3,
                                      borderLeftColor: isEscalated 
                                        ? '#E74C3C' // Red for escalated
                                          : hasMessages 
                                            ? '#2C5EE6' // Blue for active with messages
                                            : '#4CAF50', // Green for no messages
                                    }
                                  ]}
                                >
                                  <View style={styles.sessionContent}>
                                    <View style={styles.sessionHeader}>
                                      <Text style={[styles.sessionId, { color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#333' }]}>
                                        Session: {session.session_id}
                                      </Text>
                                      <View style={styles.sessionStatus}>
                                        {isEscalated && (
                                          <View style={[styles.statusBadge, { backgroundColor: 'rgba(231, 76, 60, 0.2)' }]}>
                                            <Text style={[styles.statusText, { color: '#E74C3C' }]}>Escalated</Text>
                                          </View>
                                        )}
                                      </View>
                                    </View>
                                    
                                    {hasMessages ? (
                                      // Show message preview for sessions with messages
                                      <View style={[
                                        styles.messageContainer, 
                                        { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)' }
                                      ]}>
                                        <Text style={[styles.messageSender, { color: isDarkMode ? theme.COLORS.primary.main : theme.COLORS.primary.dark }]}>
                                          {lastMessage.sender === 'emp' ? 'You' : 
                                           lastMessage.sender === 'bot' ? 'Bot' : 
                                           lastMessage.sender === 'hr' ? 'HR' : 
                                           lastMessage.sender.charAt(0).toUpperCase() + lastMessage.sender.slice(1)}:
                                        </Text>
                                        <Text 
                                          style={[styles.messageText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}
                                          numberOfLines={2}
                                        >
                                          {lastMessage.text}
                                        </Text>
                                        <Text style={[styles.messageTime, { color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
                                          {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                      </View>
                                    ) : (
                                      // Show placeholder for sessions with no messages
                                      <Text style={[styles.noMessageText, { color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
                                        No messages available
                                      </Text>
                                    )}
                                    
                                    {/* Action buttons based on session state */}
                                    <View style={styles.sessionActions}>
                                      {!hasMessages ? (
                                        // Show Initiate Session button for sessions with no messages
                                        <TouchableOpacity
                                          style={[styles.sessionActionButton, { backgroundColor: theme.COLORS.primary.main }]}
                                          onPress={() => {
                                            console.log('Initiating session:', session.session_id);
                              initiateChat(session.chat_id);
                                          }}
                                        >
                                          <Text style={styles.sessionActionButtonText}>Initiate Session</Text>
                                        </TouchableOpacity>
                                      ) : !isEscalated ? (
                                        // Show Enter Chat button for sessions with messages but not escalated
                                        <TouchableOpacity
                                          style={[styles.sessionActionButton, { backgroundColor: '#2C5EE6' }]}
                                          onPress={() => {
                                            console.log('Entering chat for session:', session.session_id);
                                            showChat(session.chat_id);
                                          }}
                                        >
                                          <Text style={styles.sessionActionButtonText}>Enter Chat</Text>
                                        </TouchableOpacity>
                                      ) : null}
                                    </View>
                                  </View>
                                </View>
                              );
                            })
                          ) : (
                            <View style={styles.emptySessionsContainer}>
                              <Text style={[styles.noMessageText, { padding: moderateScale(16), textAlign: 'center' }]}>
                                No sessions found
                              </Text>
                              {/* Add Initiate New Session button for chains with no sessions */}
                              {chain.status === 'active' && (
                                <TouchableOpacity
                                  style={[styles.createSessionButton, { backgroundColor: theme.COLORS.primary.main }]}
                    onPress={() => {
                      console.log('Initiating new session for chain:', chain.chain_id);
                      initiateChat(null, chain.chain_id);
                                  }}
                                >
                                  <Ionicons name="add-circle-outline" size={16} color="white" style={{marginRight: 8}} />
                                  <Text style={styles.createSessionButtonText}>Initiate New Session</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      )}
      </View>
    );
  };

  // const loadChats = async (chain_id: string) => {
  //   try {
  //     setLoading(true);
      
  //     const response = await fetch(
  //       `${API_URL}/employee/chains/${chain_id}?page=${page}&limit=${PAGE_SIZE}`,
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${accessToken}`,
  //         },
  //       }
  //     );
      
  //     if (!response.ok) {
  //       console.error('Failed to fetch chats:', response.status, response.statusText);
  //       throw new Error('Failed to fetch chats');
  //     }

  //     const data: ChatResponse = await response.json();
      
  //     setChats(data.chats);
  //     setHasMore(data.chats.length >= PAGE_SIZE);
  //     setPage(1);
  //   } catch (error) {
  //     console.error('Error fetching chats:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadChains = async () => {
    if (!accessToken) return;
    
    try {
      setChainsLoading(true);
      
      const response = await fetch(`${API_URL}/employee/chains`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chains');
      }

      const data = await response.json();
      setChains(data.chains || []);
                                    } catch (error) {
      console.error('Error fetching chains:', error);
                                    } finally {
      setChainsLoading(false);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: 'transparent' }]}
      edges={['right', 'bottom', 'left']}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.scrollView}
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
                    <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.1)' : '#2C5EE6' }]}>
                      <Ionicons name="happy-outline" size={24} color={isDarkMode ? theme.COLORS.primary.main : 'white'} />
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
                    <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.1)' : '#2C5EE6' }]}>
                      <Ionicons name="calendar" size={24} color={isDarkMode ? theme.COLORS.primary.main : 'white'} />
                    </View>
                    <Text style={[styles.updateLabel, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>Upcoming</Text>
                    <Text style={[styles.updateValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{profile.upcoming_meets}</Text>
                    {profile.meeting_link ? (
                      <TouchableOpacity 
                        onPress={() => {
                          if (profile.meeting_link) {
                            Linking.openURL(profile.meeting_link).catch(err => 
                              console.error('Error opening meeting link:', err)
                            );
                          }
                        }}
                        style={styles.meetingLinkContainer}
                      >
                        <Text 
                          style={[
                            styles.updateSubtext, 
                            { 
                              color: theme.COLORS.primary.main,
                              textDecorationLine: 'underline'
                            }
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {profile.meeting_link}
                        </Text>
                        <Ionicons 
                          name="open-outline" 
                          size={14} 
                          color={theme.COLORS.primary.main} 
                          style={{ marginLeft: 4 }} 
                        />
                      </TouchableOpacity>
                    ) : (
                      <Text style={[styles.updateSubtext, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>
                        No meetings scheduled
                      </Text>
                    )}
                  </View>

                  {/* Upcoming Sessions */}
                  <View style={[styles.updateCard, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)' }]}>
                    <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.1)' : '#2C5EE6' }]}>
                      <Ionicons name="people" size={24} color={isDarkMode ? theme.COLORS.primary.main : 'white'} />
                    </View>
                    <Text style={[styles.updateLabel, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.COLORS.text.secondary }]}>Sessions</Text>
                    <Text style={[styles.updateValue, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>{profile.upcoming_sessions}</Text>
                    <Text style={[styles.updateSubtext, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : theme.COLORS.text.secondary }]}>upcoming</Text>
                  </View>

                  {/* Latest Performance */}
                  {profile.company_data.performance.length > 0 && (
                    <View style={[styles.updateCard, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)' }]}>
                      <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.1)' : '#2C5EE6' }]}>
                        <Ionicons name="trophy" size={24} color={isDarkMode ? theme.COLORS.primary.main : 'white'} />
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
                      <View style={[styles.updateIconContainer, { backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.1)' : '#2C5EE6' }]}>
                        <Ionicons name="time" size={24} color={isDarkMode ? theme.COLORS.primary.main : 'white'} />
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
          

          {/* Recent Chains Section - From Profile Data */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="git-branch-outline" size={24} color={isDarkMode ? 'white' : theme.COLORS.primary.main} />
              <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Recent Conversations</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
              Your most recent conversation chains
            </Text>

            {isProfileLoading ? (
              // Loading shimmer
              <View style={styles.chatList}>
                {[1, 2, 3].map((key) => (
                  <View key={key} style={styles.chatItemShimmer}>
                    {renderChatItemShimmer()}
                  </View>
                ))}
              </View>
            ) : profile?.recent_chains && profile.recent_chains.length > 0 ? (
              // Render profile recent chains
              <View style={styles.recentChainsList}>
                {profile.recent_chains.map((chain) => {
                  const isExpanded = expandedChains.has(chain.chain_id);
                  return (
                    <View key={chain.chain_id} style={styles.chainContainer}>
                      {renderChainItem({ chain })}
                    </View>
                  );
                })}
              </View>
            ) : (
              // No chains message
              <View style={[styles.emptyChains, { padding: 20 }]}>
                <Text style={[
                  styles.emptyText, 
                  { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }
                ]}>
                  No recent conversation chains found
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Chat Modal */}
        {isChatVisible && (
          <Animated.View
            style={[
              styles.chatModal,
              {
                transform: [{ translateY: chatTranslateY }],
                opacity: chatOpacity,
              },
            ]}
          >
          
            
            {/* Chat content without pan responder */}
            <View style={{flex: 1}}>
              <ChatScreen
                onClose={dismissChat}
                initialChatId={selectedChatId}
                initialQuestion={selectedQuestion}
                scheduledSessions={scheduledSessions}
                sessionStatus={selectedChatId ? 
                  scheduledSessions.find(session => session.chat_id === selectedChatId)?.status || 'inactive' 
                  : 'inactive'}
                {...(selectedChainContext ? { chainContext: selectedChainContext } : {})}
              />
            </View>
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

        {/* Chat Modal */}
        {isChatModalVisible && (
          <ChatScreen
            onClose={() => {
              setIsChatModalVisible(false);
              setSelectedChatId(undefined);
              setSelectedQuestion(undefined);
            }}
            initialChatId={selectedChatId}
            initialQuestion={selectedQuestion}
            scheduledSessions={scheduledSessions}
            sessionStatus={selectedChatId ? 
              scheduledSessions.find(session => session.chat_id === selectedChatId)?.status || 'inactive' 
              : 'inactive'}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    marginHorizontal: horizontalScale(16),
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(16),
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: fontScale(18),
    fontWeight: '600',
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
    backgroundColor: '#2C5EE6',
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
    color: '#2C5EE6',
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
    backgroundColor: 'rgba(44, 94, 230, 0.1)',
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
    padding: moderateScale(12),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: verticalScale(8),
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadMoreText: {
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
    overflow: 'hidden',
    marginTop: 0,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  chatHandle: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    backgroundColor: '#2C5EE6',
  },
  handleBar: {
    width: horizontalScale(40),
    height: verticalScale(5),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: moderateScale(2.5),
  },
  scrollIndicatorContainer: {
    alignItems: 'center',
    marginTop: verticalScale(4),
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
    backgroundColor: 'rgba(44, 94, 230, 0.1)',
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
  chainContainer: {
    marginBottom: verticalScale(16),
  },
  chainMetaInfo: {
    marginTop: verticalScale(8),
  },
  sessionsContainer: {
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
  },
  sessionItem: {
    padding: moderateScale(12),
    borderRadius: 8,
    marginTop: verticalScale(8),
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  sessionId: {
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: fontScale(12),
    fontWeight: '500',
  },
  messageContainer: {
    marginTop: verticalScale(8),
    padding: moderateScale(8),
    borderRadius: 8,
  },
  messageSender: {
    fontSize: fontScale(12),
    fontWeight: '500',
  },
  messageText: {
    fontSize: fontScale(14),
    marginTop: verticalScale(4),
  },
  messageTime: {
    fontSize: fontScale(10),
    alignSelf: 'flex-end',
    marginTop: verticalScale(4),
  },
  noMessageText: {
    fontSize: fontScale(12),
    color: 'rgba(255,255,255,0.5)',
  },
  chatId: {
    fontSize: fontScale(12),
    fontWeight: '500',
  },
  chatHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(12),
  },
  selectedChatItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sessionTitle: {
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  sessionIdText: {
    fontSize: fontScale(12),
    fontWeight: '500',
  },
  recentChainsList: {
    marginTop: verticalScale(8),
  },
  recentChainItem: {
    padding: moderateScale(12),
    borderRadius: 8,
    marginBottom: verticalScale(8),
  },
  recentChainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  recentChainTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentChainTitle: {
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  recentChainDetails: {
    marginLeft: horizontalScale(8),
    marginTop: verticalScale(4),
  },
  recentChainDate: {
    fontSize: fontScale(12),
  },
  recentChainNotes: {
    fontSize: fontScale(12),
    marginTop: verticalScale(2),
  },
  emptyChains: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
  },
  emptyText: {
    fontSize: fontScale(14),
    textAlign: 'center',
  },
  expandIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  sessionActionButton: {
    padding: moderateScale(8),
    borderRadius: 8,
    alignItems: 'center',
  },
  sessionActionButtonText: {
    color: 'white',
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptySessionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
  },
  createSessionButton: {
    flexDirection: 'row',
    padding: moderateScale(12),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSessionButtonText: {
    color: 'white',
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  micButton: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveSessionNotice: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 100,
  },
  meetingLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
    paddingVertical: verticalScale(4),
    paddingHorizontal: horizontalScale(2),
    borderRadius: 4,
  },
});