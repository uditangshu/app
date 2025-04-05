import React, { useState, useRef, useEffect, createRef } from 'react';
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
  ToastAndroid,
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
  isSystemMessage?: boolean;
  isSessionMarker?: boolean;
  sessionId?: string;
  sender?: string;
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
  session_id?: string;
}

interface ChatScreenProps {
  onClose: () => void;
  initialChatId?: string | null;
  initialQuestion?: string;
  isReadOnly?: boolean;
  scheduledSessions?: ScheduledSession[];
  showScrollIndicator?: boolean;
  chainContext?: any;
}

export default function ChatScreen({ 
  onClose, 
  initialChatId, 
  initialQuestion,
  isReadOnly = false, 
  scheduledSessions = [],
  showScrollIndicator = false,
  chainContext
}: ChatScreenProps) {
  const { accessToken, refreshAccessToken, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ScheduledSession | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [isFromRecentChat, setIsFromRecentChat] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sidebarRef = useRef<View>(null);
  const router = useRouter();
  const [chainSessions, setChainSessions] = useState<any[]>([]);
  const [chainMessages, setChainMessages] = useState<{[key: string]: Message[]}>({});
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const sessionRefs = useRef<{[key: string]: React.RefObject<View>}>({});

  const toggleSidebar = () => {
    console.log('toggleSidebar', isSidebarOpen);

    // ToastAndroid.show('toggleSidebar', ToastAndroid.SHORT);
    
    setIsSidebarOpen(prev => !prev);
  };

  const handleSidebarPress = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const initiateChat = async () => {
    if (!accessToken || isLoading) return;

    setIsLoading(true);
    try {
      // Find a pending session to use
      const pendingSession = scheduledSessions.find(
        session => session.status === 'pending'
      );

      if (!pendingSession) {
        console.error('No pending sessions available');
        return;
      }

      const response = await fetch(`${API_URL}/llm/chat/initiate-chat`, {
        method: 'PATCH',  // Using PATCH as shown in the API documentation
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
      console.log('Chat initiated:', data);
      
      // If successful, set the new chat ID
      if (data) {
        setSelectedChatId(data);
        // Also refresh chat history
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
    if (chainContext && chainContext.allSessions) {
      // Create refs for each session
      const refs: {[key: string]: React.RefObject<View>} = {};
      chainContext.allSessions.forEach((session: any) => {
        refs[session.session_id] = createRef<View>();
      });
      sessionRefs.current = refs;
    }
  }, [chainContext]);

  useEffect(() => {
    if (initialQuestion && messages.length === 0) {
      // Add the initial question as a system message
      setMessages([{
        id: Date.now().toString(),
        text: initialQuestion,
        isUser: false,
        timestamp: new Date(),
        isSystemMessage: true,
        sender: 'system'
      }]);
    }
  }, [initialQuestion]);

  useEffect(() => {
    if (chainContext && chainContext.allSessions && chainContext.allSessions.length > 0) {
      // Format the chain sessions into a format compatible with chatHistory
      const formattedChainSessions = chainContext.allSessions.map((session: any) => ({
        chat_id: session.chat_id,
        last_message: session.last_message || 'Session in this chain',
        last_message_time: session.timestamp || new Date().toISOString(),
        unread_count: 0,
        total_messages: session.messages?.length || 0,
        chat_mode: 'chain',
        is_escalated: false,
        session_id: session.session_id // Add session_id for reference
      }));
      setChainSessions(formattedChainSessions);
    }
  }, [chainContext]);

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

  const fetchScheduledSessions = async () => {
    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    try {
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
      
      // If we have sessions and a selected chat, find the matching session
      if (data && Array.isArray(data) && data.length > 0 && selectedChatId) {
        const matchingSession = data.find(
          (session: ScheduledSession) => 
            session.chat_id === selectedChatId && 
            session.status === 'pending'
        );
        
        if (matchingSession) {
          setActiveSession(matchingSession);
        }
      }
    } catch (error) {
      console.error('Error fetching scheduled sessions:', error);
      const shouldRetry = await handleAuthError(error);
      if (shouldRetry) {
        fetchScheduledSessions();
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
        sender: msg.sender || 'unknown',
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
    setIsSidebarOpen(false);
    
    if (chainContext) {
      // For chain views, don't show it as an "active session"
      setActiveSession(null);
      
      // But still get the session ID for scrolling
      const selectedSession = chainSessions.find(session => session.chat_id === chatId);
      if (selectedSession && selectedSession.session_id) {
        // Scroll to the selected session
        scrollToSession(selectedSession.session_id);
      }
    } else {
      // Original code for non-chain chats
      if (accessToken) {
        try {
          const response = await fetch(`${API_URL}/employee/scheduled-sessions`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const sessions = await response.json();
            const matchingSession = sessions.find(
              (session: ScheduledSession) => 
                session.chat_id === chatId && 
                session.status === 'pending'
            );
            
            setActiveSession(matchingSession || null);
          }
        } catch (error) {
          console.error('Error checking session for chat:', error);
          setActiveSession(null);
        }
      }
      
      await loadChatMessages(chatId);
    }
  };

  const sendMessage = async () => {
    // Only proceed if there's an active session with "pending" status
    if (!activeSession || activeSession.status !== "pending" || !inputText.trim() || !accessToken) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
      sender: 'emp',
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
          session_id: activeSession.session_id, // Always use the active session ID
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
        sender: 'bot',
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
          sender: 'system',
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

  const loadAllChainMessages = async () => {
    if (!chainContext || !accessToken) return;
    
    setIsLoading(true);
    const allSessionMessages: {[key: string]: Message[]} = {};
    const combinedMessages: Message[] = [];
    
    try {
      // Load messages for each session in the chain
      for (let i = 0; i < chainContext.allSessions.length; i++) {
        const session = chainContext.allSessions[i];
        const isLastSession = i === chainContext.allSessions.length - 1;
        
        try {
          const response = await fetch(`${API_URL}/employee/chats/${session.chat_id}/messages`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to load messages for session ${session.session_id}`);
          }

          const data = await response.json();
          
          if (!data.messages || !Array.isArray(data.messages)) {
            console.error('Invalid messages format:', data);
            continue;
          }

          // Format and add the session messages
          const formattedMessages = data.messages.map((msg: any) => ({
            id: `${session.session_id}-${msg.id || Date.now() + Math.random()}`,
            text: msg.text || '',
            isUser: msg.sender === "emp",
            timestamp: new Date(msg.timestamp || Date.now()),
            sessionId: session.session_id,
            sender: msg.sender || 'unknown',
          }));
          
          allSessionMessages[session.session_id] = formattedMessages;
          combinedMessages.push(...formattedMessages);

          // Add a session marker AFTER this session's messages IF this is not the last session
          // if (!isLastSession && formattedMessages.length > 0) {
          //   // Get the next session for the marker
          //   const nextSession = chainContext.allSessions[i + 1];
          //   const nextSessionDate = new Date(nextSession.created_at || Date.now());
          //   const formattedDate = `${nextSessionDate.toLocaleDateString()} ${nextSessionDate.toLocaleTimeString()}`;
            
          //   const sessionMarker: Message = {
          //     id: `session-end-${session.session_id}`,
          //     text: `New Session Starting: ${formattedDate}`,
          //     isUser: false,
          //     timestamp: nextSessionDate,
          //     isSessionMarker: true,
          //     sessionId: nextSession.session_id,
          //     sender: 'system'
          //   };
            
          //   combinedMessages.push(sessionMarker);
          // }
        } catch (error) {
          console.error(`Error loading messages for session ${session.session_id}:`, error);
        }
      }
      
      // Sort all messages by timestamp
      combinedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setChainMessages(allSessionMessages);
      setAllMessages(combinedMessages);
    } catch (error) {
      console.error('Error loading chain messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSession = (sessionId: string) => {
    const ref = sessionRefs.current[sessionId];
    setTimeout(() => {
      if (ref && ref.current && flatListRef.current) {
        try {
          ref.current.measureLayout(
            flatListRef.current.getScrollableNode(),
            (_, y) => {
              flatListRef.current?.scrollToOffset({
                offset: y - 60, // Subtract header height
                animated: true
              });
            },
            () => {
              // Fallback method if measureLayout fails
              const index = allMessages.findIndex(
                msg => msg.isSessionMarker && msg.sessionId === sessionId
              );
              if (index !== -1) {
                flatListRef.current?.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0,
                  viewOffset: -60
                });
              }
            }
          );
        } catch (error) {
          console.log("Error scrolling to session:", error);
        }
      }
    }, 300); // Add a slight delay to ensure layout is complete
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    // Set a ref for session markers
    const ref = item.isSessionMarker && item.sessionId ? 
      sessionRefs.current[item.sessionId] : null;
    
    return (
      <View 
        ref={ref || undefined}
        style={[
          styles.messageContainer,
          item.isSessionMarker && [
            styles.sessionMarker,
            { backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.2)' : 'rgba(44, 94, 230, 0.15)' }
          ],
          !item.isSessionMarker && {
            alignSelf: item.isUser ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }
        ]}
      >
        {item.isSessionMarker ? (
          <>
            <View style={[styles.divider, { height: 2, backgroundColor: 'rgba(44, 94, 230, 0.4)' }]} />
            
            <View style={styles.sessionMarkerContent}>
              <Ionicons name="time-outline" size={24} color={theme.COLORS.primary.main} />
              <View style={{marginLeft: horizontalScale(12), flex: 1}}>
                <Text style={[
                  styles.sessionMarkerText, 
                  { 
                    color: theme.COLORS.primary.main, 
                    fontSize: fontScale(16),
                    fontWeight: '600' 
                  }
                ]}>
                  {item.text}
                </Text>
                <Text style={{
                  fontSize: fontScale(12),
                  color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary,
                  marginTop: 6
                }}>
                  Session ID: {item.sessionId ? item.sessionId.substring(0, 10) : ''}
                </Text>
              </View>
            </View>
            
            <View style={[styles.divider, { height: 2, backgroundColor: 'rgba(44, 94, 230, 0.4)' }]} />
          </>
        ) : (
          <>
            {/* Only show sender label for non-user messages, avoid showing it twice */}
            {!item.isUser && item.sender && (
              <Text style={{
                fontSize: item.sender !== 'bot' && item.sender !== 'emp' && item.sender !== 'system' ? 
                  fontScale(13) : fontScale(12),
                fontWeight: item.sender !== 'bot' && item.sender !== 'emp' && item.sender !== 'system' ? 
                  'bold' : '500',
                marginHorizontal: horizontalScale(8),
                color: item.sender !== 'bot' && item.sender !== 'emp' && item.sender !== 'system' ? 
                  '#E74C3C' : '#888',
                alignSelf: 'flex-start',
                marginBottom: 6,
                ...(item.sender !== 'bot' && item.sender !== 'emp' && item.sender !== 'system' ? {
                  backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4
                } : {})
              }}>
                {item.sender === 'bot' ? 'Assistant' : 
                 item.sender === 'system' ? 'System' : 
                 item.sender}
              </Text>
            )}
            
            <View style={[
              styles.messageBubble,
              item.isUser ? styles.userBubble : 
              item.sender === 'system' ? styles.systemBubble : 
              item.sender && item.sender !== 'bot' && item.sender !== 'emp' ? 
                { backgroundColor: isDarkMode ? 'rgba(60, 60, 60, 1)' : 'rgba(240, 240, 240, 1)', borderLeftWidth: 2, borderLeftColor: '#E74C3C' } : 
                { backgroundColor: isDarkMode ? '#333333' : '#E5E5E5' },
            ]}>
              <Text style={[
                styles.messageText, 
                { 
                  color: item.isUser ? 'white' : (isDarkMode ? 'white' : '#333333'),
                  fontStyle: item.isSystemMessage ? 'italic' : 'normal'
                }
              ]}>
                {item.text}
              </Text>
            </View>
            <Text style={[
              styles.timestamp,
              { 
                color: item.isUser ? 'rgba(255,255,255,0.7)' : 'rgba(150,150,150,0.8)',
                alignSelf: item.isUser ? 'flex-end' : 'flex-start',
                marginTop: 4
              }
            ]}>
              {item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false})}
            </Text>
          </>
        )}
      </View>
    );
  };

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
        {/* Show session_id if in chain context and the item has one */}
        {chainContext && item.session_id && (
          <Text style={[
            styles.sessionIdText, 
            { color: theme.COLORS.primary.main }
          ]}>
            Session ID: {item.session_id}
          </Text>
        )}
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

  useEffect(() => {
    if (chainContext) {
      loadAllChainMessages();
      // Don't set active session for chain context
      setActiveSession(null);
    } else if (initialChatId) {
      setSelectedChatId(initialChatId);
      loadChatMessages(initialChatId);
      
      // Check if there's a scheduled session for this chat
      if (scheduledSessions && scheduledSessions.length > 0) {
        const matchingSession = scheduledSessions.find(
          session => session.chat_id === initialChatId && session.status === 'pending'
        );
        if (matchingSession) {
          setActiveSession(matchingSession);
        }
      }
    } else if (!selectedChatId && !isFromRecentChat) {
      // If this is a new chat without a selected chat ID, initiate a new chat
      initiateChat();
    }
    
    if (!chainContext) {
      fetchChatHistory();
      fetchScheduledSessions();
    }
  }, [initialChatId, scheduledSessions, chainContext]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      marginTop: 0,
    }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.mainContent}>
        <View style={[styles.header, {
          backgroundColor: '#2C5EE6',
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          paddingTop: 0,
          borderRadius: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: moderateScale(12),
        }]}>
          <TouchableOpacity onPressIn={toggleSidebar} style={{padding: moderateScale(6)}}>
            <Ionicons name="menu" size={24} color={'white'} />
          </TouchableOpacity>
          
          {/* Combined title and scroll area with subtle indicator */}
          <TouchableOpacity 
            style={{ 
              flexGrow: 1,
              flexDirection: 'row',
              justifyContent: 'center', 
              alignItems: 'center',
              paddingVertical: moderateScale(8),
              marginHorizontal: moderateScale(8),
              borderRadius: 4,
            }}
            onPress={scrollToBottom}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerTitle, { 
              color: 'white',
              marginRight: horizontalScale(4),
            }]}>
              {selectedChatId ? 'Conversation' : 'New Chat'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {activeSession && (
          <View style={[styles.activeSessionContainer, { 
            backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.1)' : 'rgba(44, 94, 230, 0.05)'
          }]}>
            <View style={styles.sessionHeader}>
              <Ionicons name="calendar-outline" size={20} color={theme.COLORS.primary.main} />
              <Text style={[styles.sessionTitle, { color: theme.COLORS.primary.main }]}>
                Active Session
              </Text>
            </View>
            <View style={styles.sessionDetails}>
              <Text style={[styles.sessionId, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                ID: {activeSession.session_id}
              </Text>
              <Text style={[styles.sessionTime, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                {new Date(activeSession.scheduled_at).toLocaleString()}
              </Text>
              {activeSession.notes && (
                <Text style={[styles.sessionNotes, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                  Notes: {activeSession.notes}
                </Text>
              )}
            </View>
          </View>
        )}

        {!activeSession && !selectedChatId ? (
          <View style={[styles.noSessionContainer, { 
            backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5' 
          }]}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.COLORS.text.secondary} />
            <Text style={[styles.noSessionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
              Start a New Chat
            </Text>
            <Text style={[styles.noSessionText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
              Select a chat from history or start a new conversation
            </Text>
          </View>
        ) : selectedChatId && (!activeSession || activeSession.status !== "pending") ? (
          <>
            {isLoading ? (
              <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5' }]}>
                <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
              </View>
            ) : (
              <>
                <FlatList
                  ref={flatListRef}
                  data={chainContext ? allMessages : messages}
                  renderItem={renderMessage}
                  keyExtractor={item => item.id}
                  contentContainerStyle={[styles.messageList, {
                    backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5',
                    flexGrow: 1,
                    paddingBottom: verticalScale(16)
                  }]}
                  onContentSizeChange={() => {
                    // Only auto-scroll to bottom on non-chain view
                    if (!chainContext) scrollToBottom();
                  }}
                  onLayout={() => {
                    // Only auto-scroll to bottom on non-chain view
                    if (!chainContext) scrollToBottom();
                  }}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                        {chainContext ? 'No messages in this chain' : 'No messages yet. Start a conversation!'}
                      </Text>
                    </View>
                  )}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={21}
                  initialNumToRender={10}
                  showsVerticalScrollIndicator={true}
                  scrollEventThrottle={16}
                />
              </>
            )}
          </>
        ) : !activeSession || activeSession.status !== "pending" ? (
          <View style={[styles.noSessionContainer, { 
            backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5' 
          }]}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.COLORS.error} />
            <Text style={[styles.noSessionTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
              No Active Session
            </Text>
            <Text style={[styles.noSessionText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
              You need a pending scheduled session to chat with the AI assistant.
            </Text>
            
            {scheduledSessions && scheduledSessions.length > 0 ? (
              <View style={styles.scheduledSessionsList}>
                <Text style={[styles.scheduledSessionsTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                  Upcoming Sessions:
                </Text>
                {scheduledSessions
                  .filter(session => session.status === 'pending')
                  .map(session => (
                    <View 
                      key={session.session_id} 
                      style={[styles.scheduledSessionItem, { 
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: theme.COLORS.primary.main
                      }]}
                    >
                      <Text style={[styles.sessionId, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                        ID: {session.session_id}
                      </Text>
                      <Text style={[styles.sessionTime, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                        {new Date(session.scheduled_at).toLocaleString()}
                      </Text>
                      <Text style={[styles.sessionStatus, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                        Status: {session.status}
                      </Text>
                    </View>
                  ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary, marginTop: verticalScale(16) }]}>
                No pending sessions are available. Please check back later.
              </Text>
            )}
          </View>
        ) : (
          <>
            {isLoading ? (
              <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5' }]}>
                <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.messageList, {
                  backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5',
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

        {(!isReadOnly && activeSession && activeSession.status === "pending") && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}>
            <View style={[styles.inputContainer, {
              backgroundColor: isDarkMode ? 'rgba(20, 30, 60, 0.9)' : 'white',
              borderTopColor: isDarkMode ? 'rgba(44, 94, 230, 0.2)' : 'rgba(0,0,0,0.1)'
            }]}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDarkMode ? 'rgba(30, 40, 70, 0.8)' : 'rgba(0,0,0,0.05)',
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
                    backgroundColor: inputText.trim() ? '#2C5EE6' : (isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.05)'),
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
      <Animated.View style={[
        styles.sidebar,
        {
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
          borderRightColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRightWidth: 1,
          transform: [{ translateX: isSidebarOpen ? 0 : -Dimensions.get('window').width }],
        }
      ]}>
        <View style={[styles.sidebarHeader, {
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }]}>
          <Text style={[styles.sidebarTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
            {chainContext ? 'Chain Sessions' : 'Session History'}
          </Text>
          <TouchableOpacity onPressIn={toggleSidebar}>
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={isDarkMode ? 'white' : theme.COLORS.text.primary} 
            />
          </TouchableOpacity>
        </View>
        <FlatList
          data={chainContext ? chainSessions : chatHistory}
          renderItem={renderChatHistoryItem}
          keyExtractor={item => item.chat_id}
          contentContainerStyle={styles.chatHistoryList}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                {chainContext ? 'No sessions in this chain' : 'No chat history available'}
              </Text>
            </View>
          )}
        />
      </Animated.View>

      {/* Add overlay when sidebar is open */}
      {isSidebarOpen && (
        <TouchableOpacity 
          style={styles.sidebarOverlay}
          activeOpacity={1}
          onPress={handleSidebarPress}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
    backgroundColor: theme.COLORS.background.paper,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2C5EE6',
    height: 50,
  },
  menuButton: {
    marginRight: horizontalScale(16),
  },
  headerTitle: {
    fontSize: fontScale(18),
    color: 'white',
    ...theme.FONTS.medium,
    textAlign: 'center',
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
    marginTop: verticalScale(30),
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
    marginVertical: verticalScale(4),
    paddingHorizontal: horizontalScale(16),
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
  },
  userBubble: {
    backgroundColor: '#2C5EE6',
  },
  aiBubble: {
    backgroundColor: '#333333', // This will be overridden in the component
  },
  messageText: {
    fontSize: fontScale(16),
    ...theme.FONTS.regular,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: fontScale(11),
    ...theme.FONTS.regular,
    marginHorizontal: horizontalScale(4),
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
    marginTop: verticalScale(8),
  },
  selectedChatItem: {
    backgroundColor: 'rgba(44, 94, 230, 0.1)',
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
    backgroundColor: 'rgba(44, 94, 230, 0.1)',
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
  sessionBadge: {
    fontSize: fontScale(12),
    marginTop: verticalScale(2),
    ...theme.FONTS.regular,
  },
  activeSessionContainer: {
    margin: moderateScale(16),
    borderRadius: 12,
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(44, 94, 230, 0.2)',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  sessionTitle: {
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
    marginLeft: horizontalScale(8),
  },
  sessionDetails: {
    marginLeft: horizontalScale(28),
  },
  sessionId: {
    fontSize: fontScale(14),
    ...theme.FONTS.regular,
  },
  sessionTime: {
    fontSize: fontScale(14),
    ...theme.FONTS.regular,
    marginTop: verticalScale(4),
  },
  sessionNotes: {
    fontSize: fontScale(14),
    ...theme.FONTS.regular,
    marginTop: verticalScale(4),
  },
  scheduledSessionsList: {
    width: '100%',
    marginTop: verticalScale(16),
    paddingHorizontal: horizontalScale(16),
  },
  scheduledSessionsTitle: {
    fontSize: fontScale(16),
    ...theme.FONTS.medium,
    marginBottom: verticalScale(8),
  },
  scheduledSessionItem: {
    padding: moderateScale(12),
    borderRadius: 8,
    marginBottom: verticalScale(8),
    borderLeftWidth: 4,
  },
  sessionStatus: {
    fontSize: fontScale(12),
    ...theme.FONTS.regular,
    marginTop: verticalScale(4),
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  systemBubble: {
    backgroundColor: 'rgba(100, 100, 100, 0.7)',
    borderLeftWidth: 3,
    borderLeftColor: '#888',
  },
  sessionMarker: {
    alignSelf: 'center',
    backgroundColor: 'rgba(44, 94, 230, 0.15)',
    borderRadius: 12,
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(44, 94, 230, 0.5)',
    marginVertical: verticalScale(32),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  sessionMarkerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionMarkerText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    marginLeft: horizontalScale(8),
  },
  senderLabel: {
    fontSize: fontScale(12),
    fontWeight: '500',
    marginHorizontal: horizontalScale(8),
  },
  sessionIdText: {
    fontSize: fontScale(12),
    fontWeight: '500',
    marginBottom: verticalScale(4),
  },
  scrollIndicatorInHeader: {
    marginRight: horizontalScale(8),
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(44, 94, 230, 0.4)',
    marginVertical: verticalScale(16),
    width: '100%',
  },
}); 