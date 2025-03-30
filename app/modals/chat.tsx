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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { fontScale, horizontalScale, moderateScale, verticalScale } from '../../utils/scaling';
import { useAuth } from '../../contexts/AuthContext';
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

interface ChatScreenProps {
  onClose: () => void;
  initialChatId?: string | null;
  isReadOnly?: boolean;
}

export default function ChatScreen({ onClose, initialChatId, isReadOnly = false }: ChatScreenProps) {
  const { accessToken, refreshAccessToken, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ScheduledSession | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [chatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      lastMessage: 'Hello! How can I help you today?',
      timestamp: new Date(),
      unreadCount: 0,
    },
    {
      id: '2',
      lastMessage: 'Thanks for your help!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      unreadCount: 2,
    },
    // Add more chat history items as needed
  ]);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
      loadChatMessages(initialChatId);
    } else {
      fetchScheduledSessions();
    }
  }, [initialChatId]);

  const handleAuthError = async (error: any) => {
    if (error.message === 'Failed to fetch scheduled sessions' || 
        error.message === 'Failed to load chat messages' ||
        error.message === 'Failed to get response from bot') {
      try {
        // Attempt to refresh the token
        await refreshAccessToken(accessToken || '');
        return true; // Token refreshed successfully
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        await logout(); // Force logout if refresh fails
        return false;
      }
    }
    return false;
  };

  const fetchScheduledSessions = async () => {
    if (!accessToken) {
      console.error('No access token available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        'https://backend-deployment-792.as.r.appspot.com/employee/scheduled-sessions',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      console.log('response', response);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled sessions');
      }

      const data = await response.json();
      const activeSession = data.sessions.find((session: ScheduledSession) => session.status === 'active');
      setActiveSession(activeSession || null);

      if (activeSession) {
        setMessages([
          {
            id: '1',
            text: `Hello! You have an active session scheduled for ${new Date(activeSession.scheduled_at).toLocaleString()}. How can I help you today?`,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching scheduled sessions:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        fetchScheduledSessions(); // Retry the fetch with new token
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    if (!accessToken) {
      console.error('No access token available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/employee/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load chat messages');
      }

      const data = await response.json();
      const formattedMessages = data.messages.map((msg: any) => ({
        id: String(Date.now() + Math.random()),
        text: msg.text,
        isUser: msg.sender === "emp",
        timestamp: new Date(msg.timestamp),
      }));

      setMessages(formattedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading chat messages:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        loadChatMessages(chatId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const sendMessage = async () => {
    if ((!activeSession && !selectedChatId) || !inputText.trim() || !accessToken) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    scrollToBottom();

    try {
      const response = await fetch(`${API_URL}/llm/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: inputText.trim(),
          session_id: activeSession?.session_id,
          chat_id: selectedChatId,
          sender: "emp"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from bot');
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I could not process your request.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        sendMessage();
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, there was an error processing your message. Please try again.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        scrollToBottom();
      }
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    setActiveSession(null); // Clear active session when selecting a chat
    toggleSidebar();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.aiMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const renderChatHistoryItem = ({ item }: { item: ChatHistory }) => (
    <TouchableOpacity 
      style={[
        styles.chatHistoryItem,
        selectedChatId === item.id && styles.selectedChatItem
      ]}
      onPress={() => handleChatSelect(item.id)}
    >
      <View style={styles.chatHistoryContent}>
        <Text style={styles.chatHistoryId}>Chat #{item.id}</Text>
        <Text style={styles.chatHistoryMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        <Text style={styles.chatHistoryTimestamp}>
          {item.timestamp.toLocaleDateString()}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Toggle sidebar without animation
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sidebar */}
      {isSidebarOpen && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Chat History</Text>
            <TouchableOpacity onPress={toggleSidebar}>
              <Ionicons name="close" size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={chatHistory}
            renderItem={renderChatHistoryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatHistoryList}
          />
        </View>
      )}

      {/* Main Chat UI */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={theme.COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {selectedChatId ? `Chat #${selectedChatId}` : 'New Chat'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {!activeSession && !selectedChatId ? (
          <View style={styles.noSessionContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.COLORS.text.secondary} />
            <Text style={styles.noSessionTitle}>No Active Session</Text>
            <Text style={styles.noSessionText}>
              You don't have any scheduled chat sessions at the moment.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />
        )}

        {(!isReadOnly && (activeSession || selectedChatId)) && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor={theme.COLORS.text.secondary}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim()}>
                <Ionicons
                  name="send"
                  size={24}
                  color={inputText.trim() ? theme.COLORS.primary.main : theme.COLORS.text.secondary}
                />
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
    backgroundColor: theme.COLORS.background.default,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border.main,
    backgroundColor: theme.COLORS.background.paper,
  },
  menuButton: {
    marginRight: horizontalScale(16),
  },
  closeButton: {
    marginLeft: 'auto',
  },
  headerTitle: {
    fontSize: fontScale(20),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.medium,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: theme.COLORS.background.paper,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border.main,
  },
  sidebarTitle: {
    fontSize: fontScale(20),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.medium,
  },
  chatHistoryList: {
    padding: moderateScale(16),
  },
  chatHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border.main,
  },
  chatHistoryContent: {
    flex: 1,
    marginRight: horizontalScale(12),
  },
  chatHistoryId: {
    fontSize: fontScale(16),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.medium,
    marginBottom: verticalScale(4),
  },
  chatHistoryMessage: {
    fontSize: fontScale(14),
    color: theme.COLORS.text.secondary,
    ...theme.FONTS.regular,
  },
  chatHistoryTimestamp: {
    fontSize: fontScale(12),
    color: theme.COLORS.text.secondary,
    ...theme.FONTS.regular,
    marginTop: verticalScale(4),
  },
  unreadBadge: {
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(4),
  },
  unreadCount: {
    color: 'white',
    fontSize: fontScale(12),
    ...theme.FONTS.medium,
  },
  messageList: {
    padding: moderateScale(16),
  },
  messageContainer: {
    maxWidth: '80%',
    padding: moderateScale(12),
    borderRadius: 12,
    marginBottom: verticalScale(8),
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1C8D3A',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.COLORS.background.paper,
  },
  messageText: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.regular,
  },
  timestamp: {
    fontSize: fontScale(12),
    color: theme.COLORS.text.secondary,
    marginTop: verticalScale(4),
    ...theme.FONTS.regular,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: moderateScale(16),
    backgroundColor: theme.COLORS.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border.main,
  },
  input: {
    flex: 1,
    minHeight: verticalScale(40),
    maxHeight: verticalScale(100),
    backgroundColor: theme.COLORS.background.paper,
    borderRadius: 20,
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
    marginRight: horizontalScale(8),
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.regular,
  },
  sendButton: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    backgroundColor: theme.COLORS.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background.paper,
  },
  noSessionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(24),
  },
  noSessionTitle: {
    fontSize: fontScale(20),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.medium,
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  noSessionText: {
    fontSize: fontScale(16),
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    ...theme.FONTS.regular,
  },
  content: {
    flex: 1,
  },
  selectedChatItem: {
  backgroundColor: theme.COLORS.background.paper,
  },
}); 