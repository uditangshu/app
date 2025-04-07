import React, { useState, useRef, useEffect, createRef, useCallback } from 'react';
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
  ScrollView,
  PermissionsAndroid,
  Alert,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { fontScale, horizontalScale, moderateScale, verticalScale } from '../../utils/scaling';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { API_URL } from '../../constants/api';

// Import Voice with safer fallback
let Voice: any = null;
// Wrap in a function to avoid top-level errors affecting the whole app
const importVoice = () => {
  try {
    return require('@react-native-voice/voice').default;
  } catch (error) {
    console.error('Failed to import Voice module');
    return null;
  }
};

// Initialize Voice outside of component
Voice = importVoice();

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isSystemMessage?: boolean;
  isSessionMarker?: boolean;
  sessionId?: string;
  sender?: string;
  sessionStatus?: string;
  chainStatus?: string;
  can_end_chat?: boolean;
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
  sessionStatus?: string;
}

// Define an interface for session objects
interface SessionItem {
  session_id: string;
  chat_id?: string;
  created_at?: string;
  status?: string;
  notes?: string;
  last_message?: string;
  [key: string]: any; // Allow for additional properties
}

export default function ChatScreen({ 
  onClose, 
  initialChatId, 
  initialQuestion,
  isReadOnly = false, 
  scheduledSessions = [],
  showScrollIndicator = false,
  chainContext,
  sessionStatus
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
  const flatListRef = useRef<any>(null);
  const sidebarRef = useRef<View>(null);
  const router = useRouter();
  const [chainSessions, setChainSessions] = useState<any[]>([]);
  const [chainMessages, setChainMessages] = useState<{[key: string]: Message[]}>({});
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const sessionRefs = useRef<{[key: string]: React.RefObject<View>}>({});
  const [isTyping, setIsTyping] = useState(false);
  const [messageKey, setMessageKey] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  
  // Add a forceUpdate mechanism
  const [, forceUpdate] = useState({});
  const messagesContainerRef = useRef<View>(null);
  const messageElements = useRef<{[key: string]: React.ReactNode}>({});

  // Add a new state variable to track session status from messages
  const [messageSessionStatus, setMessageSessionStatus] = useState<string | null>(null);

  // Add a new state variable to track whether the input should be enabled or disabled
  const [canEndChat, setCanEndChat] = useState<boolean>(false);

  // Add state to track current chain_id
  const [chainId, setChainId] = useState('');

  // Add an effect to update the session status from messages
  useEffect(() => {
    // Check if any message has sessionStatus
    const messagesWithStatus = messages.filter(m => m.sessionStatus);
    if (messagesWithStatus.length > 0) {
      // Use the most recent message with status
      const latestStatusMessage = messagesWithStatus[messagesWithStatus.length - 1];
      console.log("Found message with session status:", latestStatusMessage.sessionStatus);
      setMessageSessionStatus(latestStatusMessage.sessionStatus || null);
    }
  }, [messages]);

  // Voice recognition setup
  useEffect(() => {
    // Make sure Voice is defined before setting event handlers
    if (Voice) {
      try {
        // Initialize voice recognition
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;                                                                                       

        // Set up Voice instance - using a simpler approach
        const setupVoice = async () => {
          try {
            // No need to call getSpeechRecognitionServices as it's causing errors
            console.log('Voice recognition initialized');
          } catch (e) {
            console.error('Error initializing speech recognition:', e);
          }
        };

        setupVoice();
        
        // Return cleanup function
        return () => {
         
          if (Voice) {
            Voice.destroy().then(() => {
              Voice.removeAllListeners();
            }).catch((e:any) => {
              console.error('Error destroying Voice instance:', e);
            });
          }
        };
      } catch (e) {
        console.error('Error setting up Voice event handlers:', e);
      }
    } else {
      console.error('Voice module is undefined - speech recognition will not work');
    }
  }, []);

  const onSpeechStart = () => {
    console.log('Speech recognition started');
  };

  const onSpeechEnd = () => {
    console.log('Speech recognition ended');
    setIsDictating(false);
  };

  const onSpeechResults = (e: any) => {
    if (e.value && e.value.length > 0) {
      setResults(e.value);
      // Set the first result as the input text
      setInputText((prev) => prev + ' ' + e.value[0]);
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech recognition error:', e);
    setIsDictating(false);
    
    // Show more specific error message based on error code
    let errorMessage = 'Speech recognition error';
    
    if (e.error) {
      switch (e.error.code) {
        case '7':
        case '7':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case '5':
          errorMessage = 'Speech recognition timeout. Please try again.';
          break;
        case '4':
          errorMessage = 'Speech recognition service error. Please try again.';
          break;
        case '3':
          errorMessage = 'Audio recording error. Please check your microphone.';
          break;
        case '1':
        case '2':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Speech recognition error (${e.error.code}). Please try again.`;
      }
    }
    
    // Show error toast on Android
    if (Platform.OS === 'android') {
      ToastAndroid.show(errorMessage, ToastAndroid.LONG);
    }
  };

  const startDictation = async () => {
    // Check if Voice is defined first
    if (!Voice) {
      console.error('Voice recognition is not available');
      if (Platform.OS === 'android') {
        ToastAndroid.show('Speech recognition is not available on this device', ToastAndroid.LONG);
      }
      return;
    }
    
    // If already dictating, stop
    if (isDictating) {
      try {
        await Voice.stop();
        setIsDictating(false);
      } catch (e) {
        console.error('Error stopping voice recognition:', e);
        // Force the state to reset even if there was an error
        setIsDictating(false);
      }
      return;
    }

    // Request microphone permission on Android - improved implementation
    if (Platform.OS === 'android') {
      try {
        // Check if we already have the permission
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (hasPermission) {
          // We already have permission, proceed with voice recognition
          console.log('Microphone permission already granted');
        } else {
          // Request permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission Required',
              message: 'Please allow microphone access to use voice recognition',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Microphone permission denied');
            if (Platform.OS === 'android') {
              ToastAndroid.show('Microphone permission is required for voice recognition', ToastAndroid.LONG);
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error checking microphone permission:', err);
        return;
      }
    }

    // Start voice recognition
    try {
      // Reset any previous results
      setResults([]);
      
      // Start the voice recognition service
      console.log('Starting voice recognition...');
      
      // Set the state to dictating first (for UI feedback)
      setIsDictating(true);
      
      // Start listening with proper error handling
      try {
        await Voice.start('en-US');
      } catch (e) {
        console.error('Error starting voice recognition:', e);
        setIsDictating(false); // Reset the state if starting fails
        
        if (Platform.OS === 'android') {
          ToastAndroid.show('Failed to start speech recognition. Please try again.', ToastAndroid.SHORT);
        }
      }
    } catch (e) {
      console.error('Unexpected error in speech recognition:', e);
      setIsDictating(false);
    }
  };
  
  // Add a dedicated function to force rerender
  const forceRerender = () => {
    console.log("Forcing rerender");
    setMessageKey(prev => prev + 1);
    // Double force update using both mechanisms
    forceUpdate({});
    
    // Use setTimeout to ensure state updates have propagated
    setTimeout(() => {
      console.log("Delayed force update");
      setMessageKey(prev => prev + 1);
      forceUpdate({});
    }, 300);
  };

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
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/llm/chat/initiate-chat`, {
        method: 'PATCH',  // Using PATCH as shown in the API documentation
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          chatId: pendingSession.chat_id,
          status: "bot"
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate chat: ${response.status}`);
      }

      const data = await response.json();
      console.log('Initiate chat response:', data);
      
      // Set the chat ID from the response if it exists, otherwise use the pending session's chat ID
      const chatId = data.chatId || pendingSession.chat_id;
      setSelectedChatId(chatId);
      
      // Important: Update session status to ensure input is enabled
      setMessageSessionStatus('active');
      
      // If the API response included a message, add it to the chat
      if (data.message) {
        const botMessage: Message = {
          id: Date.now().toString(),
          text: data.message,
          isUser: false,
          timestamp: new Date(),
          sender: 'bot',
          sessionStatus: data.sessionStatus || 'active',
          chainStatus: data.chainStatus,
          can_end_chat: data.can_end_chat
        };
        
        setMessages([botMessage]);
      }
      
      // Load any existing messages after initiation
      // await loadChatMessages(chatId);
      
    } catch (error) {
      console.error('Error initiating chat:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Failed to initiate chat. Please try again.',
        isUser: false,
        timestamp: new Date(),
        sender: 'system',
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
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

  // Replace the fetchChatHistory function to correctly handle the API format 
  const fetchChatHistory = async (chainIdParam = chainId) => {
    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    // Use chainId from chainContext if available
    let chainIdToUse = chainIdParam;
    if (chainContext && chainContext.chainId) {
      console.log('Using chainId from chainContext:', chainContext.chainId);
      chainIdToUse = chainContext.chainId;
    }
    
    // If chainIdParam is empty or 'default', use a different endpoint
    const isDefaultChain = !chainIdToUse || chainIdToUse === '';
    const endpoint = isDefaultChain 
      ? `${API_URL}/employee/chats` // Use the general chats endpoint for the default case
      : `${API_URL}/employee/chains/${chainIdToUse}`;
    
    console.log(`Fetching chat history from: ${endpoint}`);
    
    try {
      // Make the API request
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch chat history: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      if (isDefaultChain) {
        // If we used the default endpoint, format is different (list of chats)
        console.log('Setting chat history with general chats data');
        setChatHistory(Array.isArray(data) ? data : []);
        // Clear chain sessions when viewing general chats
        setChainSessions([]);
      } else {
        // Handle the chain-specific response format 
        if (data.session_ids && Array.isArray(data.session_ids)) {
          console.log('Chain sessions received:', data.session_ids);
          
          // Process sessions for the chain view
          const sessions = data.session_ids.map((sessionId: string) => ({
            session_id: sessionId,
            chat_id: sessionId,
            created_at: new Date().toISOString(),
            status: 'active',
            notes: `Session ${sessionId}`,
            last_message: `Chain session ${sessionId}`
          }));
          
          console.log('Setting chain sessions:', sessions.length);
          setChainSessions(sessions);
          
          // Clear regular chat history when viewing chain
          setChatHistory([]);
        } else if (data.chats && Array.isArray(data.chats)) {
          // Some chains might return chats directly
          console.log('Chain returned chat list');
          setChatHistory(data.chats);
          setChainSessions([]);
        } else {
          console.log('No valid data in chain response, clearing history');
          setChatHistory([]);
          setChainSessions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // Clear data on error
      setChatHistory([]);
      setChainSessions([]);
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
      
      // Force update after setting messages
      forceRerender();
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

  // Handle selecting a chat from the sidebar
  const handleChatSelect = async (chatId: string) => {
    console.log('Selected chat:', chatId);
    
    // If we have a chat context with chain information, try to find which chain this belongs to
    if (chainContext && chainContext.chainId) {
      // We're already in a specific chain view
      setSelectedChatId(chatId);
      loadChatMessages(chatId);
      setIsSidebarOpen(false);
      return;
    }
    
    // First, set this as the selected chat
    setSelectedChatId(chatId);
    
    // Start loading messages
    loadChatMessages(chatId);
    
    try {
      // Attempt to find which chain this chat/session belongs to
      console.log(`Checking which chain chat ${chatId} belongs to`);
      const response = await fetch(`${API_URL}/employee/session/${chatId}/chain`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Chain data for chat ${chatId}:`, data);
        
        if (data && data.chain_id && data.chain_id !== 'default') {
          console.log(`Chat ${chatId} belongs to chain ${data.chain_id}`);
          
          // Set the chain_id state to update UI
          setChainId(data.chain_id);
          
          // Fetch chat history for this specific chain
          fetchChatHistory(data.chain_id);
        } else {
          console.log(`No valid chain_id found for chat ${chatId}, using general chat list`);
          // Reset to empty string instead of 'default' to use the general chats endpoint
          setChainId('');
          fetchChatHistory('');
        }
      } else {
        console.log(`API returned ${response.status} when fetching chain for chat ${chatId}`);
        // Reset to empty string instead of 'default'
        setChainId('');
        fetchChatHistory('');
      }
    } catch (error) {
      console.error('Error fetching chain for session:', error);
      // Reset to empty string instead of 'default'
      setChainId('');
      fetchChatHistory('');
    }
    
    // Close the sidebar regardless of the outcome
    setIsSidebarOpen(false);
  };

  const sendMessage = async () => {
    // Only proceed if there's text and a selected chat
    console.log('Sending message:', inputText.trim());
    if (!inputText.trim() || !accessToken || !selectedChatId) {
      if (!selectedChatId) {
        // Show error if trying to send without a selected chat
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: 'Please select or start a conversation first.',
          isUser: false,
          timestamp: new Date(),
          sender: 'system',
        };
        setMessages(prev => [...prev, errorMessage]);
        scrollToBottom();
      }
      return;
    }

    const currentText = inputText.trim();
    
    // Create user message
    const newMessage: Message = {
      id: Date.now().toString(),
      text: currentText,
      isUser: true,
      timestamp: new Date(),
      sender: 'emp',
    };
    
    // Update messages state
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Clear input
    setInputText('');
    
    // Scroll to bottom to show the new message
    scrollToBottom();
    
    // Show typing indicator
    setIsTyping(true);

    try {
      console.log('Making API call to:', `${API_URL}/llm/chat/message`);
      
      const response = await fetch(`${API_URL}/llm/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          chatId: selectedChatId,
          message: currentText
        }),
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to get response from bot: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Bot response:', data);
      
      // Keep typing indicator for at least 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Hide typing indicator
      setIsTyping(false);
      
      // Create bot message
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || 'Sorry, I could not process your request.',
        isUser: false,
        timestamp: new Date(),
        sender: 'bot',
        sessionStatus: data.sessionStatus,
        chainStatus: data.chainStatus,
        can_end_chat: data.can_end_chat
      };
      
      // Update messages state with the new bot message
      setMessages([...updatedMessages, aiResponse]);
      
      // Check and update the session status from the bot response
      if (data.sessionStatus) {
        console.log("Received sessionStatus from API:", data.sessionStatus);
        setMessageSessionStatus(data.sessionStatus);
      }
      
      // Scroll to bottom to show the bot's response
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
      
      // Hide typing indicator
      setIsTyping(false);
      
      const shouldRetry = await handleAuthError(error);
      
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: shouldRetry 
          ? 'There was a connection issue. Please try sending your message again.' 
          : 'Sorry, there was an error sending your message. Please try again later.',
        isUser: false,
        timestamp: new Date(),
        sender: 'system',
      };
      
      // Add error message
      setMessages(prev => [...prev, errorMessage]);
      
      // Scroll to bottom to show the error message
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        // Hide scroll button when we've scrolled to bottom
        setShowScrollToBottom(false);
      }, 100);
    }
  };

  const loadAllChainMessages = async () => {
    if (!chainContext || !chainContext.allSessions || chainContext.allSessions.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      const allSessionMessages: { [key: string]: Message[] } = {};
      const combinedMessages: Message[] = [];
      const chainSessions = chainContext.allSessions;
      
      // Sort sessions by creation date in ascending order (oldest first)
      const sortedSessions = [...chainSessions].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      for (let i = 0; i < sortedSessions.length; i++) {
        const session = sortedSessions[i];
        const isLastSession = i === sortedSessions.length - 1;
        
        // Add a session marker at the BEGINNING of each session
        const sessionDate = new Date(session.created_at || Date.now());
        const formattedDate = sessionDate.toLocaleDateString(undefined, { 
          weekday: 'long',
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Add session divider before messages
        const sessionMarker: Message = {
          id: `session-marker-${session.session_id}-${i}-${Date.now()}`,
          text: `Session started: ${formattedDate}`,
          isUser: false,
          timestamp: sessionDate,
          isSessionMarker: true,
          sessionId: session.session_id,
          sender: 'system'
        };
        
        combinedMessages.push(sessionMarker);
        
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
          const formattedMessages = data.messages.map((msg: any, index: number) => ({
            id: `${session.session_id}-${msg.id || `${Date.now()}-${index}-${Math.random()}`}`,
            text: msg.text || '',
            isUser: msg.sender === "emp",
            timestamp: new Date(msg.timestamp || Date.now()),
            sessionId: session.session_id,
            sender: msg.sender || 'unknown',
          }));
          
          allSessionMessages[session.session_id] = formattedMessages;
          combinedMessages.push(...formattedMessages);
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
              if (flatListRef.current?.scrollTo) {
                flatListRef.current.scrollTo({
                  y: y - 60, // Subtract header height
                  animated: true
                });
              }
            },
            () => {
              // Fallback method if measureLayout fails
              const index = allMessages.findIndex(
                msg => msg.isSessionMarker && msg.sessionId === sessionId
              );
              if (index !== -1 && flatListRef.current?.scrollToEnd) {
                // Just scroll to the end if we can't find a good position
                flatListRef.current.scrollToEnd({
                  animated: true
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
    
    // Determine if this message starts a new session (compare with previous message)
    // Add safety checks to avoid the "Cannot read properties of undefined" error
    const isNewSession = index > 0 && 
                        item.sessionId && 
                        allMessages && 
                        allMessages[index - 1] && 
                        allMessages[index - 1].sessionId && 
                        item.sessionId !== allMessages[index - 1].sessionId && 
                        !item.isSessionMarker;
    
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
        {/* If we detect a new session without a session marker, add a light divider */}
        {isNewSession && (
          <View style={{
            height: 1,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            width: '300%',  // Make it extend beyond the message bubble
            alignSelf: 'center',
            marginVertical: 12,
            position: 'relative',
            left: '-100%'  // Center it
          }} />
        )}
        
        {item.isSessionMarker ? (
          <>
            <View style={[styles.divider, { 
              height: 2, 
              backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.5)' : 'rgba(44, 94, 230, 0.4)'
            }]} />
            
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
            
            <View style={[styles.divider, { 
              height: 2, 
              backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.5)' : 'rgba(44, 94, 230, 0.4)'
            }]} />
          </>
        ) : (
          <>
            {/* Show session ID badge if first message of a session or after a different session */}
            {isNewSession && item.sessionId && (
              <Text style={{
                fontSize: fontScale(10),
                backgroundColor: isDarkMode ? 'rgba(44, 94, 230, 0.3)' : 'rgba(44, 94, 230, 0.15)',
                color: isDarkMode ? 'rgba(255,255,255,0.8)' : theme.COLORS.primary.main,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                alignSelf: 'flex-start',
                marginBottom: 6
              }}>
                Session: {item.sessionId.substring(0, 8)}
              </Text>
            )}
            
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
              item.sender === 'system' ? [
                styles.systemBubble,
                { backgroundColor: isDarkMode ? 'rgba(100, 100, 100, 0.7)' : 'rgba(220, 220, 220, 0.9)' }
              ] : 
              item.sender && item.sender !== 'bot' && item.sender !== 'emp' ? 
                { backgroundColor: isDarkMode ? 'rgba(80, 80, 80, 1)' : 'rgba(240, 240, 240, 1)', borderLeftWidth: 2, borderLeftColor: '#E74C3C' } : 
                { backgroundColor: isDarkMode ? 'rgba(60, 60, 60, 1)' : '#E5E5E5' },
              item.text.includes('error') || item.text.includes('Error') ? {
                backgroundColor: isDarkMode ? 'rgba(120, 30, 30, 0.9)' : 'rgba(255, 235, 235, 1)',
                borderLeftWidth: 3,
                borderLeftColor: isDarkMode ? '#ff6666' : '#cc0000'
              } : {}
            ]}>
              <Text style={[
                styles.messageText, 
                { 
                  color: item.isUser ? "#ffffff" : 
                         item.sender === 'system' ? (isDarkMode ? 'rgba(255, 100, 100, 0.95)' : '#cc0000') :
                         isDarkMode ? 'rgba(255, 255, 255, 0.95)' : '#333333',
                  fontStyle: item.sender === 'system' ? 'italic' : 'normal',
                  fontWeight: item.text.includes('error') || item.text.includes('Error') ? '500' : 'normal'
                }
              ]}>
                {item.text}
              </Text>
            </View>
            <Text style={[
              styles.timestamp,
              { 
                color: item.isUser ? 'rgba(255,255,255,0.7)' : isDarkMode ? 'rgba(180,180,180,0.8)' : 'rgba(120,120,120,0.8)',
                alignSelf: item.isUser ? 'flex-end' : 'flex-start',
                marginTop: 4,
                paddingHorizontal: 4,
                fontSize: fontScale(10),
              }
            ]}>
              {item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}
            </Text>
          </>
        )}
    </View>
  );
};

  const renderChatHistoryItem = ({ item }: { item: ChatItem }) => {
    // Check if this is a chain session item - if so, only display what we need
    const isChainSession = chainContext && item.session_id !== undefined;
    
    return (
      <TouchableOpacity
        style={[
          styles.chatHistoryItem,
          selectedChatId === item.chat_id && styles.selectedChatItem,
          { 
            backgroundColor: selectedChatId === item.chat_id 
              ? (isDarkMode ? 'rgba(44, 94, 230, 0.3)' : 'rgba(44, 94, 230, 0.15)') 
              : (isDarkMode ? 'rgba(30, 40, 60, 0.3)' : 'rgba(0,0,0,0.03)'),
            marginBottom: 8,
            borderRadius: 10,
            padding: moderateScale(12),
            borderLeftWidth: selectedChatId === item.chat_id ? 3 : 0,
            borderLeftColor: '#2C5EE6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: selectedChatId === item.chat_id ? 0.2 : 0,
            shadowRadius: 2,
            elevation: selectedChatId === item.chat_id ? 2 : 0,
          }
        ]}
        onPress={() => handleChatSelect(item.chat_id)}
      >
        <View style={styles.chatHistoryContent}>
          {/* Show session_id if in chain context and the item has one */}
          {isChainSession && item.session_id && (
            <Text style={[
              styles.sessionIdText, 
              { 
                color: isDarkMode ? '#ffffff' : theme.COLORS.primary.main,
                fontSize: fontScale(13),
                fontWeight: '600',
                marginBottom: 4
              }
            ]}>
              Session {item.session_id.substring(0, 8)}
            </Text>
          )}
          
          <Text 
            style={[
              styles.chatHistoryMessage, 
              { 
                color: isDarkMode ? '#ffffff' : theme.COLORS.text.primary,
                fontSize: fontScale(14),
                fontWeight: selectedChatId === item.chat_id ? '500' : 'normal',
                marginTop: 2
              }
            ]}
            numberOfLines={2}
          >
            {isChainSession 
              ? `Chat from ${new Date(item.last_message_time).toLocaleDateString()}`
              : item.last_message}
          </Text>
          
          {!isChainSession && item.unread_count > 0 && (
            <View style={[
              styles.unreadBadge, 
              { 
                backgroundColor: theme.COLORS.primary.main,
                borderRadius: 12,
                minWidth: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 5
              }
            ]}>
              <Text style={[
                styles.unreadCount,
                {
                  color: theme.COLORS.background.paper,
                  fontSize: fontScale(12),
                  fontWeight: '600'
                }
              ]}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (chainContext) {
      console.log('Chain context provided:', chainContext);
      if (chainContext.chainId) {
        console.log('Setting chainId from chainContext:', chainContext.chainId);
        setChainId(chainContext.chainId);
      }
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
      initiateChat();
    }
    
    if (!chainContext) {
      fetchChatHistory(chainId); // Pass the chainId explicitly here
      fetchScheduledSessions();
    } else {
      // If we have chainContext, explicitly fetch history with the chainId from context
      fetchChatHistory(chainContext.chainId);
    }
  }, [initialChatId, scheduledSessions, chainContext, chainId]);

  // Add a specific useEffect to handle chainId changes
  useEffect(() => {
    if (chainId && !chainContext) {
      console.log(`Chain ID changed to ${chainId}, fetching new chat history`);
      fetchChatHistory(chainId);
    }
  }, [chainId, chainContext, accessToken]);

  // Enhance the TypingIndicator for better visibility
  const TypingIndicator = () => {
    return (
      <View style={[
        styles.messageContainer,
        { alignSelf: 'flex-start', maxWidth: '80%' }
      ]}>
        <Text style={{
          fontSize: fontScale(12),
          fontWeight: '500',
          marginHorizontal: horizontalScale(8),
          color: '#888',
          alignSelf: 'flex-start',
          marginBottom: 6,
        }}>
          Assistant
        </Text>
        <View style={[
          styles.messageBubble,
          { backgroundColor: isDarkMode ? 'rgba(60, 60, 60, 1)' : '#E5E5E5', minWidth: 70 }
        ]}>
          <View style={styles.typingContainer}>
            {[0, 1, 2].map((i) => (
              <Animated.View 
                key={`dot-${i}`}
                style={[
                  styles.typingDot, 
                  { 
                    backgroundColor: isDarkMode ? '#aaa' : '#666',
                    opacity: 0.4 + (i * 0.2) // Make dots progressively more visible
                  }
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Add a function to handle scroll events
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    
    // If we're more than 200px from the bottom, show the button
    const isCloseToBottom = contentHeight - offsetY - scrollViewHeight < 200;
    setShowScrollToBottom(!isCloseToBottom);
  };

  // Updated canSendMessages function that checks message status AND chat end status
  const canSendMessages = () => {
    // If readOnly prop is set, always return false
    if (isReadOnly) {
      return false;
    }
    
    // First check session status from messages (most reliable & recent source)
    if (messageSessionStatus === 'inactive') {
      return false;
    }
    
    // Then check prop session status
    if (sessionStatus === 'inactive') {
      return false;
    }
    
    // Then check active session from state
    if (activeSession?.status === 'inactive') {
      return false;
    }
    
    // If we have messages with can_end_chat flag, check it
    const messagesWithCanEndChat = messages.filter(m => m.can_end_chat !== undefined);
    if (messagesWithCanEndChat.length > 0) {
      // Use the most recent message with can_end_chat flag
      const latestMessage = messagesWithCanEndChat[messagesWithCanEndChat.length - 1];
      // Update the state so we can reference it elsewhere
      setCanEndChat(!!latestMessage.can_end_chat);
    }
    
    // Default to true if no other conditions apply
    return true;
  };

  const onSave = () => {
    // ... Your save logic here ...
  };

  // Function to end the current chat session
  const endChat = async () => {
    try {
      setIsLoading(true);
      
      // Make API call to end session with the new endpoint
      const response = await fetch(`${API_URL}/llm/chat/end-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          chat_id: selectedChatId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to end chat');
      }
      
      // Update messages to show chat has ended
      const endMessage: Message = {
        id: `system-${Date.now()}`,
        text: 'This chat has ended. You can start a new chat or view previous chats.',
        timestamp: new Date(),
        sender: 'system',
        sessionStatus: 'inactive',
        chainStatus: 'inactive',
        isUser: false
      };
      
      setMessages(prevMessages => [...prevMessages, endMessage]);
      setMessageSessionStatus('inactive');
      
      // Show success toast
      if (Platform.OS === 'android') {
        ToastAndroid.show('Chat session ended successfully', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Chat session ended successfully');
      }
      
      // Close the chat modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error ending chat:', error);
      Alert.alert(
        'Failed to end chat',
        'Please try again later'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to check if the chat has already ended
  const isChatEnded = () => {
    // Check for inactive status in messages
    const hasInactiveStatus = messages.some(m => m.sessionStatus === 'inactive');
    
    // Check for system messages indicating the chat has ended
    const hasEndMessage = messages.some(m => 
      m.sender === 'system' && 
      (m.text.includes('chat has ended') || m.text.includes('session has ended'))
    );
    
    return hasInactiveStatus || hasEndMessage;
  };
  
  // Update the check for the End Chat button to use this function
  const shouldShowEndChatButton = () => {
    // Remove the isReadOnly check since we'll handle that in the render
    // Always show if there are any messages
    return messages.length > 0;
  };

  // Process and group sessions by date for the sidebar
  const processSessions = useCallback((sessions: SessionItem[] = []) => {
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) return [];
    
    // Sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
      const dateB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
      return dateB - dateA;
    });
    
    // Group by date
    const sessionsByDate: {[key: string]: SessionItem[]} = {};
    
    sortedSessions.forEach(session => {
      const date = session.created_at ? new Date(session.created_at) : new Date();
      const dateKey = date.toDateString();
      
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      
      sessionsByDate[dateKey].push(session);
    });
    
    // Convert to array format for SectionList
    return Object.keys(sessionsByDate).map(date => ({
      title: date,
      data: sessionsByDate[date]
    }));
  }, []);

  // Create the grouped sessions
  const [groupedSessions, setGroupedSessions] = useState<any[]>([]);
  
  useEffect(() => {
    if (chainContext) {
      setGroupedSessions(processSessions());
    }
  }, [chainContext, processSessions]);

  // Render a session date header in the sidebar
  const renderSectionHeader = ({ section }: { section: { title: string } }) => {
    const date = new Date(section.title);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let displayDate = '';
    if (date.toDateString() === today.toDateString()) {
      displayDate = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      displayDate = 'Yesterday';
    } else {
      displayDate = date.toLocaleDateString(undefined, { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return (
      <View style={[styles.sessionDateHeader, {
        backgroundColor: isDarkMode ? 'rgba(30, 40, 60, 0.6)' : 'rgba(230, 240, 255, 0.8)',
        paddingVertical: verticalScale(6),
        paddingHorizontal: horizontalScale(12),
        marginVertical: verticalScale(4),
        borderRadius: 4,
      }]}>
        <Text style={{
          color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 30, 100, 0.8)',
          fontSize: fontScale(13),
          fontWeight: '500',
        }}>
          {displayDate}
        </Text>
      </View>
    );
  };

  // Replace the existing FlatList in the sidebar with a SectionList
  const renderSidebar = () => {
    console.log('Rendering sidebar with:', {
      hasChainSessions: chainSessions && chainSessions.length > 0,
      chainSessionsCount: chainSessions ? chainSessions.length : 0,
      hasChainContext: !!chainContext,
      hasChatHistory: chatHistory && chatHistory.length > 0,
      chatHistoryCount: chatHistory ? chatHistory.length : 0,
      chainId
    });
    
    // Give priority to chainSessions
    if (chainSessions && chainSessions.length > 0) {
      // Create grouped sessions for display
      const sessionsGrouped = processSessions(chainSessions);
      console.log('Using chainSessions for sidebar', chainSessions.length, 'sessions');
      
      return (
        <SectionList
          sections={sessionsGrouped}
          keyExtractor={(item) => item.session_id || item.chat_id || `session-${Date.now()}`}
          renderItem={({ item, index, section }: { item: any; index: number; section: any }): JSX.Element => {
            // Format time
            const date = item.created_at ? new Date(item.created_at) : new Date();
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Determine if this is the last item in the section
            const isLastInSection = index === section.data.length - 1;
            
            return (
              <>
                <TouchableOpacity
                  style={[
                    styles.chatHistoryItem,
                    selectedChatId === (item.chat_id || item.session_id) && styles.selectedChatItem,
                    { 
                      backgroundColor: selectedChatId === (item.chat_id || item.session_id)
                        ? (isDarkMode ? 'rgba(44, 94, 230, 0.3)' : 'rgba(44, 94, 230, 0.15)') 
                        : (isDarkMode ? 'rgba(30, 40, 60, 0.3)' : 'rgba(255, 255, 255, 0.7)'),
                      marginBottom: 8,
                      borderRadius: 10,
                      padding: moderateScale(12),
                      borderLeftWidth: selectedChatId === (item.chat_id || item.session_id) ? 3 : 0,
                      borderLeftColor: '#2C5EE6',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: selectedChatId === (item.chat_id || item.session_id) ? 0.2 : 0,
                      shadowRadius: 2,
                      elevation: selectedChatId === (item.chat_id || item.session_id) ? 2 : 0,
                    }
                  ]}
                  onPress={() => handleChatSelect(item.chat_id || item.session_id)}
                >
                  <View style={styles.chatHistoryContent}>
                    <View style={styles.sessionHeaderRow}>
                      <View style={styles.sessionStatusIndicator}>
                        <View style={[
                          styles.statusDot, 
                          { backgroundColor: item.status === 'completed' ? '#4CAF50' : '#2C5EE6' }
                        ]} />
                        <Text style={[
                          styles.sessionIdText, 
                          { 
                            color: isDarkMode ? '#ffffff' : theme.COLORS.primary.main,
                            fontSize: fontScale(13),
                            fontWeight: '600',
                          }
                        ]}>
                          {(item.session_id || item.chat_id || '').substring(0, 8)}
                        </Text>
                      </View>
                      <Text style={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        fontSize: fontScale(12),
                      }}>
                        {timeString}
                      </Text>
                    </View>
                    
                    {/* Add notes or last message if available */}
                    {(item.notes || item.last_message) && (
                      <Text 
                        style={[
                          styles.chatHistoryMessage, 
                          { 
                            color: isDarkMode ? '#ffffff' : theme.COLORS.text.primary,
                            fontSize: fontScale(14),
                            fontWeight: selectedChatId === (item.chat_id || item.session_id) ? '500' : 'normal',
                            marginTop: 6,
                          }
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.notes || item.last_message || `Session ${item.status || 'active'}`}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                
                {/* Add divider if not the last item in section */}
                {!isLastInSection && (
                  <View style={{
                    height: 1, 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    marginHorizontal: 20,
                    marginBottom: 8
                  }} />
                )}
              </>
            );
          }}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[styles.chatHistoryList, {
            paddingVertical: moderateScale(8),
            paddingHorizontal: moderateScale(8),
          }]}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={(): JSX.Element => (
            <View style={[styles.emptyContainer, {
              padding: moderateScale(24),
              alignItems: 'center',
              justifyContent: 'center',
            }]}>
              <Ionicons 
                name="document-text-outline"
                size={48} 
                color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} 
              />
              <Text style={[styles.emptyText, { 
                color: isDarkMode ? '#ffffff' : theme.COLORS.text.secondary,
                marginTop: moderateScale(12),
                fontSize: fontScale(16),
                textAlign: 'center',
              }]}>
                No sessions found in this chain
              </Text>
            </View>
          )}
        />
      );
    } else if (chatHistory && chatHistory.length > 0) {
      // Handle case when using regular chat history
      console.log('Using chatHistory for sidebar', chatHistory.length, 'chats');
      return (
        <FlatList
          data={chatHistory}
          renderItem={({ item }: { item: ChatItem }): JSX.Element => {
            // Format time
            const date = new Date(item.last_message_time);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <TouchableOpacity
                style={[
                  styles.chatHistoryItem,
                  selectedChatId === item.chat_id && styles.selectedChatItem,
                  { 
                    backgroundColor: selectedChatId === item.chat_id 
                      ? (isDarkMode ? 'rgba(44, 94, 230, 0.3)' : 'rgba(44, 94, 230, 0.15)') 
                      : (isDarkMode ? 'rgba(30, 40, 60, 0.3)' : 'rgba(0,0,0,0.03)'),
                    marginBottom: 8,
                    borderRadius: 10,
                    padding: moderateScale(12),
                    borderLeftWidth: selectedChatId === item.chat_id ? 3 : 0,
                    borderLeftColor: '#2C5EE6',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: selectedChatId === item.chat_id ? 0.2 : 0,
                    shadowRadius: 2,
                    elevation: selectedChatId === item.chat_id ? 2 : 0,
                  }
                ]}
                onPress={() => handleChatSelect(item.chat_id)}
              >
                <View style={styles.chatHistoryContent}>
                  <View style={styles.sessionHeaderRow}>
                    <Text style={[
                      styles.sessionIdText, 
                      { 
                        color: isDarkMode ? '#ffffff' : theme.COLORS.primary.main,
                        fontSize: fontScale(13),
                        fontWeight: '600',
                      }
                    ]}>
                      {item.chat_id ? item.chat_id.substring(0, 8) : 'Chat'}
                    </Text>
                    <Text style={{
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                      fontSize: fontScale(12),
                    }}>
                      {timeString}
                    </Text>
                  </View>
                  
                  <Text 
                    style={[
                      styles.chatHistoryMessage, 
                      { 
                        color: isDarkMode ? '#ffffff' : theme.COLORS.text.primary,
                        fontSize: fontScale(14),
                        fontWeight: selectedChatId === item.chat_id ? '500' : 'normal',
                        marginTop: 6,
                      }
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.last_message || 'No message content'}
                  </Text>

                  {item.unread_count > 0 && (
                    <View style={[
                      styles.unreadBadge, 
                      { 
                        backgroundColor: theme.COLORS.primary.main,
                        borderRadius: 12,
                        minWidth: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 5,
                        position: 'absolute',
                        top: 10,
                        right: 10
                      }
                    ]}>
                      <Text style={[
                        styles.unreadCount,
                        {
                          color: theme.COLORS.background.paper,
                          fontSize: fontScale(12),
                          fontWeight: '600'
                        }
                      ]}>{item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.chat_id}
          contentContainerStyle={[styles.chatHistoryList, { 
            paddingVertical: moderateScale(8),
            paddingHorizontal: moderateScale(8),
          }]}
          ListEmptyComponent={(): JSX.Element => (
            <View style={[styles.emptyContainer, {
              padding: moderateScale(24),
              alignItems: 'center',
              justifyContent: 'center',
            }]}>
              <Ionicons
                name="chatbubbles-outline" 
                size={48} 
                color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} 
              />
              <Text style={[styles.emptyText, { 
                color: isDarkMode ? '#ffffff' : theme.COLORS.text.secondary,
                marginTop: moderateScale(12),
                fontSize: fontScale(16),
                textAlign: 'center', 
              }]}>
                No conversations found
              </Text>
            </View>
          )}
        />
      );
    } else {
      // Show empty state
      console.log('No data for sidebar, showing empty state');
      return (
        <View style={[styles.emptyContainer, {
          padding: moderateScale(24),
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1
        }]}>
          <Ionicons
            name="chatbubbles-outline" 
            size={48} 
            color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} 
          />
          <Text style={[styles.emptyText, { 
            color: isDarkMode ? '#ffffff' : theme.COLORS.text.secondary,
            marginTop: moderateScale(12),
            fontSize: fontScale(16),
            textAlign: 'center', 
          }]}>
            {chainId ? `No sessions found in chain ${chainId}` : 'No conversations yet'}
          </Text>
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121A2E' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.container, { 
        backgroundColor: isDarkMode ? '#0F1525' : '#F5F5F5',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        marginTop: 0,
      }]} 
      edges={['bottom', 'left', 'right']}
    >
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
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          zIndex: 10,
        }]}>
          <TouchableOpacity onPressIn={toggleSidebar} style={{padding: moderateScale(6)}}>
            <Ionicons name="menu" size={24} color={theme.COLORS.background.paper} />
          </TouchableOpacity>
          
          {/* Title in center */}
          <View style={{ 
            flexGrow: 1,
            justifyContent: 'center', 
            alignItems: 'center',
          }}>
            <Text style={[styles.headerTitle, { 
              color: '#ffffff',
              fontWeight: '600',
            }]}>
              {selectedChatId ? 'Conversation' : 'New Chat'}
            </Text>
          </View>

          {/* Close button with down arrow - more subtle */}
          <TouchableOpacity 
            onPress={onClose} 
            style={{
              padding: moderateScale(8),
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              width: 36,
              height: 36,
            }}
          >
            <Ionicons name="arrow-down" size={20} color={'rgba(255, 255, 255, 0.9)'} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingBottom: verticalScale(80) // Space for the input box
          }}
          ref={flatListRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          <View style={styles.messagesContainer} ref={messagesContainerRef}>
            {!activeSession && !selectedChatId ? (
              <View style={[styles.noSessionContainer, { 
                    backgroundColor: isDarkMode ? '#0F1525' : '#F5F5F5' 
              }]}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.COLORS.text.secondary} />
                <Text style={[styles.noSessionTitle, { color: isDarkMode ? theme.COLORS.background.paper : theme.COLORS.text.primary }]}>
                  Start a New Chat
                </Text>
                <Text style={[styles.noSessionText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                  Select a chat from history or start a new conversation
                </Text>
              </View>
            ) : isLoading ? (
              <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#0F1525' : '#F5F5F5' }]}>
                <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
              </View>
            ) : (
              <View style={styles.messageList} key={`message-list-${messageKey}`}>
                {(chainContext ? allMessages : messages).length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: isDarkMode ? '#ffffff' : theme.COLORS.text.secondary }]}>
                      {chainContext ? 'No messages in this chain' : 'No messages yet. Start a conversation!'}
                    </Text>
                  </View>
                ) : (
                  <View>
                    {/* Primary message rendering */}
                    {(chainContext ? allMessages : messages).map((item, index) => (
                      <View key={`msg-${item.id}-${messageKey}`}>
                        {renderMessage({item, index})}
                      </View>
                    ))}
                    
                    {/* Typing indicator */}
                    {isTyping && <TypingIndicator />}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Scroll to bottom button - only shown when scrolled up */}
        {showScrollToBottom && (
          <TouchableOpacity 
            style={[
              styles.scrollToBottomButton,
              { 
                backgroundColor: isDarkMode ? '#2C5EE6' : '#3063E9',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)'
              }
            ]}
            onPress={scrollToBottom}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={28} color="white" />
          </TouchableOpacity>
        )}

        {/* End Chat button - only shown when:
            1. A bot message has can_end_chat flag set to true, OR
            2. User has sent 10 or more messages
            3. AND the chat is not already ended */}
        {messages.length > 0 && (
          <View style={styles.endChatButtonContainer}>
            <TouchableOpacity
              style={[
                styles.endChatButton,
                { 
                  backgroundColor: isDarkMode ? '#E74C3C' : '#FF4D4D',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)'
                }
              ]}
              onPress={endChat}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle-outline" size={22} color="white" style={{marginRight: 8}} />
              <Text style={[styles.endChatButtonText, { fontSize: fontScale(15) }]}>End Chat</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Only render input when session is active or no restrictions are set */}
        {(!isReadOnly && canSendMessages()) && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.inputWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            <View style={[styles.inputContainer, {
              backgroundColor: isDarkMode ? 'rgba(20, 30, 60, 0.95)' : theme.COLORS.background.paper,
              borderTopColor: isDarkMode ? 'rgba(44, 94, 230, 0.2)' : 'rgba(0,0,0,0.1)',
              borderTopWidth: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 5,
              paddingVertical: moderateScale(12),
              paddingHorizontal: moderateScale(16),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }]}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDarkMode ? 'rgba(40, 50, 80, 0.8)' : 'rgba(0,0,0,0.05)',
                  color: isDarkMode ? '#ffffff' : theme.COLORS.text.primary,
                  borderRadius: 24,
                  borderWidth: isDarkMode ? 1 : 0,
                  borderColor: isDarkMode ? 'rgba(60, 80, 120, 0.5)' : 'transparent',
                  paddingVertical: moderateScale(12),
                  paddingHorizontal: moderateScale(16),
                  fontSize: fontScale(16),
                  maxHeight: verticalScale(100),
                  flex: 1,
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isDictating ? "Listening..." : "Type your message..."}
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                multiline
              />
              
              {/* Microphone Button - Updated style */}
              <TouchableOpacity
                style={[
                  styles.micButton, 
                  { 
                    backgroundColor: isDictating ? 
                      (isDarkMode ? 'rgba(255, 80, 80, 0.8)' : '#ff5050') : 
                      (isDarkMode ? 'rgba(80, 100, 140, 0.8)' : 'rgba(44, 94, 230, 0.7)'),
                    marginRight: 8,
                    marginLeft: 12,
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                  }
                ]}
                onPress={startDictation}>
                <Ionicons
                  name={isDictating ? "mic" : "mic-outline"}
                  size={28}
                  color={theme.COLORS.background.paper}
                />
              </TouchableOpacity>
              
              {/* Send Button - Updated style */}
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  { 
                    backgroundColor: inputText.trim() ? '#2C5EE6' : (isDarkMode ? 'rgba(30,40,60,0.7)' : 'rgba(0,0,0,0.05)'),
                    opacity: !inputText.trim() ? 0.5 : 1,
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                  }
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim()}>
                <Ionicons
                  name="send"
                  size={28}
                  color={inputText.trim() ? theme.COLORS.background.paper : (isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* Show message when chat is read-only due to session status */}
        {(!isReadOnly && !canSendMessages()) && (
          <View style={[styles.inactiveSessionNotice, {
            backgroundColor: isDarkMode ? 'rgba(20, 30, 60, 0.95)' : 'white',
            borderTopColor: isDarkMode ? 'rgba(44, 94, 230, 0.2)' : 'rgba(0,0,0,0.1)',
            borderTopWidth: 1,
          }]}>
            <Text style={{ 
              color: isDarkMode ? '#f5f5f5' : '#333',
              textAlign: 'center',
              padding: 16,
              fontSize: fontScale(15)
            }}>
              This session is {messageSessionStatus || sessionStatus || activeSession?.status || 'not active'}. 
              {messageSessionStatus === 'inactive' && " You cannot send messages."}
            </Text>
          </View>
        )}
      </View>

      {/* Sidebar */}
      <Animated.View style={[
        styles.sidebar,
        {
          backgroundColor: isDarkMode ? 'rgba(15, 20, 35, 0.98)' : theme.COLORS.background.paper,
          borderRightColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRightWidth: 1,
          transform: [{ translateX: isSidebarOpen ? 0 : -Dimensions.get('window').width }],
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 10,
        }
      ]}>
        <View style={[styles.sidebarHeader, {
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          backgroundColor: isDarkMode ? 'rgba(20, 30, 60, 0.95)' : '#2C5EE6',
          paddingVertical: moderateScale(14),
          paddingHorizontal: moderateScale(16),
          borderBottomWidth: 1,
        }]}>
          <Text style={[styles.sidebarTitle, { 
            color: '#ffffff',
            fontWeight: '600',
            fontSize: fontScale(18),
          }]}>
            {chainContext ? 'Chain Sessions' : 'Chat History'}
          </Text>
          <TouchableOpacity 
            onPressIn={toggleSidebar}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              padding: 8,
            }}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
        {renderSidebar()}
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
    color: theme.COLORS.background.paper,
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
    flexDirection: 'column',
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
    color: theme.COLORS.background.paper,
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  messageList: {
    padding: moderateScale(16),
    width: '100%',
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
    borderRadius: 20,
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
    marginTop: 4,
    opacity: 0.8,
    backgroundColor: 'transparent',
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
    paddingVertical: verticalScale(6),
    paddingHorizontal: horizontalScale(16),
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
    color: theme.COLORS.background.paper,
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
    borderLeftColor: '#ff6666',
    borderRadius: 16,
  },
  sessionMarker: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: verticalScale(12),
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(12),
    borderRadius: 8,
  },
  
  sessionMarkerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
  },
  
  sessionMarkerText: {
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  
  divider: {
    width: '100%',
    height: 1,
    marginVertical: verticalScale(8),
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
  inputWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  
  messagesContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: horizontalScale(8),
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  scrollToBottomButton: {
    position: 'absolute',
    left: '50%',
    bottom: verticalScale(90),
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 100,
    borderWidth: 2,
    transform: [{ translateX: -22 }], // Center the button by offsetting half its width
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
  endChatButtonContainer: {
    position: 'absolute',
    left: horizontalScale(16),
    bottom: verticalScale(90), // Move higher up to ensure visibility
    zIndex: 999, // Higher z-index to ensure it's on top
  },
  endChatButton: {
    paddingHorizontal: 16,
    paddingVertical: 10, // Slightly taller
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 8, // Increased elevation
    borderWidth: 2, // Thicker border
  },
  endChatButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: fontScale(14),
  },
  sessionDateHeader: {
    backgroundColor: 'rgba(230, 240, 255, 0.8)',
    paddingVertical: verticalScale(6),
    paddingHorizontal: horizontalScale(12),
    marginVertical: verticalScale(4),
    borderRadius: 4,
  },
  sessionDateHeaderText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fontScale(13),
    fontWeight: '500',
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
}); 