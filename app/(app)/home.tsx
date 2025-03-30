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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import theme from '../../constants/theme';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import ChatScreen from '../modals/chat';
import { API_URL } from '../../constants/api';

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

const events: EventItem[] = [
  { id: '1', title: 'Team Meeting', date: '2023-03-25 10:00 AM', type: 'Meeting' },
  { id: '2', title: 'Project Deadline', date: '2023-03-28', type: 'Deadline' },
  { id: '3', title: 'Training Session', date: '2023-03-30 2:00 PM', type: 'Training' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { accessToken } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isFromRecentChat, setIsFromRecentChat] = useState(false);
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

  useEffect(() => {
    fetchChats();
    
  }, [page]);

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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1C8D3A', '#165C27', '#0A3814']}
        style={styles.gradientBackground}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome, {user?.employee_id}</Text>
              <Text style={styles.subtitleText}>Your employee dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color="white" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>
              
            </View>
          </View>

          {/* Upcoming Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={24} color="white" />
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Your scheduled events and deadlines</Text>
            
            {events.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{event.date}</Text>
                </View>
                <View style={[styles.eventBadge, styles[event.type.toLowerCase() as keyof typeof styles] as ViewStyle]}>
                  <Text style={styles.eventBadgeText}>{event.type}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>View Calendar</Text>
              <Ionicons name="arrow-forward" size={20} color="#1C8D3A" />
            </TouchableOpacity>
          </View>

          {/* Recent Chats Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={24} color="white" />
              <Text style={styles.sectionTitle}>Recent Chats</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Your recent conversations</Text>

            {loading && page === 1 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
              </View>
            ) : (
              <>
                {chats.map((chat, index) => (
                  <TouchableOpacity 
                    key={chat.chat_id} 
                    style={styles.chatItem}
                    onPress={() => showChat(chat.chat_id)}
                  >
                    <View style={styles.chatIconContainer}>
                      <Ionicons 
                        name={chat.is_escalated ? "alert-circle" : "chatbubble-outline"} 
                        size={24} 
                        color={chat.is_escalated ? theme.COLORS.error : theme.COLORS.primary.main} 
                      />
                    </View>
                    <View style={styles.chatInfo}>
                      <View style={styles.chatHeader}>
                        <Text style={styles.chatTitle}>Chat #{chat.chat_id}</Text>
                        <Text style={styles.chatTime}>{formatDate(chat.last_message_time)}</Text>
                      </View>
                      <Text style={styles.chatMessage} numberOfLines={1}>
                        {chat.last_message}
                      </Text>
                      {chat.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadCount}>{chat.unread_count}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {hasMore && (
                  <TouchableOpacity 
                    style={styles.loadMoreButton} 
                    onPress={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.loadMoreText}>Load More</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Chat Button */}
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => showChat()}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="white" />
            <Text style={styles.chatButtonText}>Open Chat</Text>
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
                height: chatHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Dimensions.get('window').height],
                }),
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* <View style={styles.chatHeader}>
              <View style={styles.chatHandle} />
              <TouchableOpacity onPress={dismissChat} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.COLORS.text.primary} />
              </TouchableOpacity>
            </View> */}
            <ChatScreen 
              onClose={dismissChat} 
              initialChatId={selectedChatId} 
              isReadOnly={isFromRecentChat}
            />
          </Animated.View>
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
    marginRight: horizontalScale(16),
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: fontScale(12),
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
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker background for chat items
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(8),
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border.main,
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
  unreadCount: {
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
    backgroundColor: theme.COLORS.primary.main,
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
    backgroundColor: theme.COLORS.border.main,
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
});