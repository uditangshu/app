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

interface ChatScreenProps {
  onClose: () => void;
  initialChatId?: string | null;
  isReadOnly?: boolean;
}

export default function ChatScreen({ onClose, initialChatId, isReadOnly = false }: ChatScreenProps) {
  const { accessToken, refreshAccessToken, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ScheduledSession | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAllChats();
  }, []);

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

  const fetchAllChats = async () => {
    if (!accessToken) {
      console.error('No access token available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/employee/chats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      const formattedChats = data.chats.map((chat: ChatData) => ({
        id: chat.id,
        lastMessage: chat.last_message || 'No messages yet',
        timestamp: new Date(chat.created_at),
        unreadCount: chat.unread_count || 0,
        messages: chat.messages || [],
      }));

      setChatHistory(formattedChats);
      
      // If there's an initial chat ID, load its messages
      if (initialChatId) {
        const selectedChat = formattedChats.find((chat: ChatData) => chat.id === initialChatId);
        if (selectedChat) {
          setSelectedChatId(initialChatId);
          setMessages(selectedChat.messages);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        fetchAllChats();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId);
    setActiveSession(null);
    setIsSidebarOpen(false);

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
      const formattedMessages = data.messages.map((msg: any) => ({
        id: String(Date.now() + Math.random()),
        text: msg.text,
        isUser: msg.sender === "emp",
        timestamp: new Date(msg.timestamp),
      }));

      setMessages(formattedMessages);
      scrollToBottom();

      // Update chat history with new messages
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: formattedMessages, lastMessage: formattedMessages[formattedMessages.length - 1]?.text || chat.lastMessage }
          : chat
      ));
    } catch (error) {
      console.error('Error loading chat messages:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        handleChatSelect(chatId);
      }
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

      // Update chat history with new messages
      setChatHistory(prev => prev.map(chat => 
        chat.id === selectedChatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, newMessage, aiResponse],
              lastMessage: aiResponse.text,
              unreadCount: 0
            }
          : chat
      ));
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

  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer, 
      item.isUser ? [
        styles.userMessage,
        { borderBottomRightRadius: 4 }
      ] : [
        styles.aiMessage,
        { 
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.05)',
          borderBottomLeftRadius: 4 
        }
      ]
    ]}>
      {!item.isUser && (
        <View style={[styles.profileCircle, { 
          backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.2)' : `${theme.COLORS.primary.main}20` 
        }]}>
          <Ionicons name="leaf-outline" size={20} color={theme.COLORS.primary.main} />
        </View>
      )}
      <View style={[
        styles.messageContent,
        item.isUser ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }
      ]}>
        <Text style={[
          styles.messageText,
          { color: item.isUser ? 'white' : (isDarkMode ? 'white' : theme.COLORS.text.primary) }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          { color: item.isUser ? 'rgba(255,255,255,0.7)' : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') }
        ]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
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
    <SafeAreaView style={[styles.container, { 
      backgroundColor: isDarkMode ? '#121212' : '#F5F5F5',
      marginTop: -20
    }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.mainContent}>
        <View style={[styles.header, { 
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'white',
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }]}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : theme.COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
            {selectedChatId ? `Chat #${selectedChatId}` : 'New Chat'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? 'white' : theme.COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {!activeSession && !selectedChatId ? (
          <View style={[styles.noSessionContainer, { 
            backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' 
          }]}>
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
            contentContainerStyle={[styles.messageList, {
              backgroundColor: isDarkMode ? '#121212' : '#F5F5F5'
            }]}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />
        )}

        {(!isReadOnly && (activeSession || selectedChatId)) && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}>
            <View style={[styles.inputContainer, {
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'white',
              borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }]}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.05)',
                  color: isDarkMode ? 'white' : theme.COLORS.text.primary,
                  borderRadius: 20,
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  { 
                    backgroundColor: inputText.trim() ? '#1C8D3A' : (isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.05)'),
                    opacity: !inputText.trim() ? 0.5 : 1
                  }
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim()}>
                <Ionicons
                  name="send"
                  size={24}
                  color={inputText.trim() ? 'white' : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)')}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    paddingTop: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  menuButton: {
    marginRight: horizontalScale(16),
  },
  closeButton: {
    marginLeft: 'auto',
  },
  headerTitle: {
    fontSize: fontScale(20),
    color: 'white',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  messageContent: {
    padding: moderateScale(12),
    borderRadius: 20,
    flex: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1C8D3A',
    borderRadius: 20,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderRadius: 20,
  },
  messageText: {
    color: theme.COLORS.text.primary,
    fontSize: fontScale(16),
    ...theme.FONTS.regular,
  },
  timestamp: {
    fontSize: fontScale(12),
    color: 'rgba(255,255,255,0.5)',
    marginTop: verticalScale(4),
    ...theme.FONTS.regular,
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
    fontSize: fontScale(16),
    ...theme.FONTS.regular,
  },
  sendButton: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(8),
    marginTop: verticalScale(4),
  },
}); 