import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { fontScale, horizontalScale, moderateScale, verticalScale } from '../../utils/scaling';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { API_URL } from '../../constants/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  messages: Message[];
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

interface ChatData {
  id: string;
  last_message: string;
  created_at: string;
  unread_count: number;
  messages: any[];
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

interface ChatScreenProps {
  onClose: () => void;
  initialChatId?: string | null;
  isReadOnly?: boolean;
  scheduledSessions?: ScheduledSession[];
}

export default function ChatScreen({ onClose, initialChatId, isReadOnly = false, scheduledSessions = [] }: ChatScreenProps) {
  const { accessToken, refreshAccessToken, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ScheduledSession | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Animation values
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const initiateChat = async () => {
    if (!accessToken || isLoading) return;

    setIsLoading(true);
    try {
      const pendingSession = scheduledSessions.find(
        session => session.status === 'pending'
      );

      if (!pendingSession) {
        console.error('No pending sessions available');
        return;
      }

      const response = await fetch(`${API_URL}/llm/chat/initiate-chat`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          chatId: "string",
          status: "bot"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate chat');
      }

      const data = await response.json();
      if (data) {
        setSelectedChatId(data);
        fetchChatHistory();
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        initiateChat();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
      loadChatMessages(initialChatId);
      
      if (scheduledSessions && scheduledSessions.length > 0) {
        const matchingSession = scheduledSessions.find(
          session => session.chat_id === initialChatId && session.status === 'pending'
        );
        if (matchingSession) {
          setActiveSession(matchingSession);
        }
      }
    } else if (!selectedChatId) {
      initiateChat();
    }
    fetchChatHistory();
  }, [initialChatId, scheduledSessions]);

  const handleAuthError = async (error: any) => {
    if (error.message === 'Failed to fetch scheduled sessions' || 
        error.message === 'Failed to load chat messages' ||
        error.message === 'Failed to get response from bot') {
      try {
        await refreshAccessToken(accessToken || '');
        return true;
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        await logout();
        return false;
      }
    }
    return false;
  };

  const fetchChatHistory = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_URL}/employee/chats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      setChatHistory(data.chats);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_URL}/employee/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load chat messages');
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedChatId || !accessToken) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    try {
      const response = await fetch(`${API_URL}/llm/chat/${selectedChatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: inputText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.message) {
        const botMessage: Message = {
          id: Date.now().toString(),
          text: data.message,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        sendMessage();
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage,
      { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
    ]}>
      <View style={styles.messageContent}>
        <Text style={[styles.messageText, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  const renderChatHistoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.chatHistoryItem,
        selectedChatId === item.chat_id && styles.selectedChatItem,
        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
      ]}
      onPress={() => {
        setSelectedChatId(item.chat_id);
        loadChatMessages(item.chat_id);
      }}
    >
      <View style={styles.chatHistoryContent}>
        <Text style={[styles.chatHistoryTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
          {item.last_message || 'New Chat'}
        </Text>
        <Text style={[styles.chatHistoryTimestamp, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
          {new Date(item.last_message_time).toLocaleString()}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: theme.COLORS.primary.main }]}>
          <Text style={styles.unreadCount}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'white',
        borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={isDarkMode ? 'white' : theme.COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
          Chat with AI
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
          </View>
        ) : !activeSession || activeSession.status !== "pending" ? (
          <View style={styles.noSessionContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.COLORS.error} />
            <Text style={[styles.noSessionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
              No Active Session
            </Text>
            <Text style={[styles.noSessionText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
              You need a pending scheduled session to chat with the AI assistant.
            </Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatContainer}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={scrollToBottom}
              onLayout={scrollToBottom}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                    No messages yet. Start a conversation!
                  </Text>
                </View>
              )}
            />
            <View style={[styles.inputContainer, {
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'white',
              borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }]}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: isDarkMode ? 'white' : theme.COLORS.text.primary,
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.COLORS.primary.main }]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: moderateScale(40),
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSessionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(24),
  },
  noSessionTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  noSessionText: {
    fontSize: fontScale(16),
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: moderateScale(16),
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: verticalScale(8),
    borderRadius: 12,
    padding: moderateScale(12),
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1C8D3A',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: fontScale(16),
  },
  timestamp: {
    fontSize: fontScale(12),
    color: 'rgba(255,255,255,0.5)',
    marginTop: verticalScale(4),
  },
  inputContainer: {
    flexDirection: 'row',
    padding: moderateScale(16),
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: verticalScale(40),
    maxHeight: verticalScale(100),
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
    marginRight: horizontalScale(8),
    borderRadius: 20,
    fontSize: fontScale(16),
  },
  sendButton: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(32),
  },
  emptyText: {
    fontSize: fontScale(16),
    textAlign: 'center',
  },
  chatHistoryItem: {
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(8),
  },
  chatHistoryContent: {
    flex: 1,
  },
  chatHistoryTitle: {
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  chatHistoryTimestamp: {
    fontSize: fontScale(12),
  },
  unreadBadge: {
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  selectedChatItem: {
    backgroundColor: 'rgba(28, 141, 58, 0.1)',
  },
}); 