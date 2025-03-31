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
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
      loadChatMessages(initialChatId);
    }
    fetchChatHistory();
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

  const fetchChatHistory = async () => {
    if (!accessToken) {
      console.error('No access token available');
      return;
    }

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
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        fetchChatHistory();
      }
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
      console.log('Received messages:', data); // Debug log

      if (!data.messages || !Array.isArray(data.messages)) {
        console.error('Invalid messages format:', data);
        return;
      }

      const formattedMessages = data.messages.map((msg: any) => ({
        id: String(Date.now() + Math.random()),
        text: msg.text || '',
        isUser: msg.sender === "emp",
        timestamp: new Date(msg.timestamp || Date.now()),
      }));

      console.log('Formatted messages:', formattedMessages); // Debug log
      setMessages(formattedMessages);
      scrollToBottom();

      // Update unread count in chat history
      setChatHistory(prev => prev.map(chat => 
        chat.chat_id === chatId 
          ? { ...chat, unread_count: 0 }
          : chat
      ));
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

  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId);
    setActiveSession(null);
    setIsSidebarOpen(false);
    await loadChatMessages(chatId);
  };

  const sendMessage = async () => {
    if ((!activeSession && !selectedChatId) || !inputText.trim() || !accessToken) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    // Immediately add the user's message to the UI
    setMessages(prev => [...prev, newMessage]);
    const currentText = inputText.trim();
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
          message: currentText,
          session_id: activeSession?.session_id,
          chat_id: selectedChatId,
          sender: "emp"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from bot');
      }

      const data = await response.json();
      console.log('Bot response:', data); // Debug log
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I could not process your request.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      scrollToBottom();

      // Update chat history
      setChatHistory(prev => prev.map(chat => 
        chat.chat_id === selectedChatId 
          ? { 
              ...chat, 
              last_message: aiResponse.text,
              last_message_time: aiResponse.timestamp.toISOString(),
              unread_count: 0
            }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        // Don't resend the message automatically, just show error
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, there was an error sending your message. Please try again.',
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
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            { color: item.isUser ? 'rgba(255,255,255,0.7)' : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') }
          ]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={[
            styles.messageId,
            { color: item.isUser ? 'rgba(255,255,255,0.7)' : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') }
          ]}>
            ID: {item.id}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderChatHistoryItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={[
        styles.chatHistoryItem,
        selectedChatId === item.chat_id && styles.selectedChatItem,
        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
      ]}
      onPress={() => handleChatSelect(item.chat_id)}
    >
      <View style={styles.chatHistoryContent}>
        <Text style={[styles.chatHistoryTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
          {item.chat_mode === 'ai' ? 'AI Assistant' : 'Human Support'}
        </Text>
        <Text 
          style={[styles.chatHistoryMessage, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}
          numberOfLines={1}
        >
          {item.last_message}
        </Text>
        {item.unread_count > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: theme.COLORS.primary.main }]}>
            <Text style={styles.unreadCount}>{item.unread_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
          <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : theme.COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
            {selectedChatId ? 
              `${chatHistory.find(chat => chat.chat_id === selectedChatId)?.chat_mode === 'ai' ? 
                'AI Assistant' : 'Human Support'} (ID: ${selectedChatId})`
              : 'New Chat'
            }
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? 'white' : theme.COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {!activeSession && !selectedChatId ? (
          <View style={[styles.noSessionContainer, { 
            backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' 
          }]}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.COLORS.text.secondary} />
            <Text style={[styles.noSessionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
              Start a New Chat
            </Text>
            <Text style={[styles.noSessionText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
              Select a chat from history or start a new conversation
            </Text>
          </View>
        ) : (
          <>
            {isLoading ? (
              <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
                <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.messageList, {
                  backgroundColor: isDarkMode ? '#121212' : '#F5F5F5',
                  flexGrow: 1,
                  paddingBottom: verticalScale(16)
                }]}
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
            )}
          </>
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
        <View style={[styles.sidebar, {
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
          borderRightColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRightWidth: 1,
        }]}>
          <View style={[styles.sidebarHeader, {
            borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }]}>
            <Text style={[styles.sidebarTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
              Chat History
            </Text>
            <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
              <Ionicons 
                name="close" 
                size={24} 
                color={isDarkMode ? 'white' : theme.COLORS.text.primary} 
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={chatHistory}
            renderItem={renderChatHistoryItem}
            keyExtractor={item => item.chat_id}
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
    width: '80%',
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
  },
  sidebarTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
  },
  chatHistoryList: {
    padding: moderateScale(16),
  },
  chatHistoryItem: {
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(8),
  },
  chatHistoryContent: {
    flex: 1,
  },
  chatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHistoryTitle: {
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  chatHistoryMessage: {
    fontSize: fontScale(14),
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
  messageList: {
    padding: moderateScale(16),
    flexGrow: 1,
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
    backgroundColor: 'rgba(28, 141, 58, 0.1)',
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
  selectedChat: {
    backgroundColor: 'rgba(28, 141, 58, 0.1)',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  messageId: {
    fontSize: fontScale(10),
    ...theme.FONTS.regular,
  },
}); 