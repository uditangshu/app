import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
  Dimensions,
  Modal,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';

interface ChatHistory {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
}

// Separate component for chat message
const ChatMessage = React.memo(({ 
  item, 
  messageScale,
}: { 
  item: Message; 
  messageScale: Animated.Value;
}) => {
  const messageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(messageAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.otherMessage,
        {
          opacity: messageAnim,
          transform: [
            {
              translateY: messageAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.messageBubble,
          item.sender === 'user' ? styles.userBubble : styles.otherBubble,
          {
            transform: [{ scale: item.sender === 'user' ? messageScale : 1 }],
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.sender === 'user' ? styles.userMessageText : styles.otherMessageText,
          ]}
        >
          {item.text}
        </Text>
      </Animated.View>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Animated.View>
  );
});

// Separate component for chat history item
const ChatHistoryItem = React.memo(({ 
  item, 
  index 
}: { 
  item: ChatHistory; 
  index: number;
}) => {
  const itemAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.chatHistoryItem,
        {
          opacity: itemAnim,
          transform: [
            {
              translateX: itemAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.chatHistoryTouchable}
        activeOpacity={0.7}
      >
        <View style={styles.chatHistoryContent}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        <View style={styles.chatHistoryRight}>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.unreadCount > 0 && (
            <Animated.View
              style={[
                styles.unreadBadge,
                {
                  transform: [
                    {
                      scale: itemAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'other',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistories] = useState<ChatHistory[]>([
    {
      id: '1',
      name: 'John Doe',
      lastMessage: 'Hey, how are you?',
      timestamp: new Date(),
      unreadCount: 2,
    },
    {
      id: '2',
      name: 'Jane Smith',
      lastMessage: 'See you tomorrow!',
      timestamp: new Date(),
      unreadCount: 0,
    },
  ]);

  // Animation values
  const sidebarAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const messageScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  // Sidebar animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: isSidebarOpen ? 0 : -Dimensions.get('window').width,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isSidebarOpen ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSidebarOpen]);

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: 'user',
        timestamp: new Date(),
      };
      
      // Animate message sending
      messageScale.setValue(0.8);
      Animated.spring(messageScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter' && !event.nativeEvent.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage
      item={item}
      messageScale={messageScale}
    />
  );

  const renderChatHistory = ({ item, index }: { item: ChatHistory; index: number }) => (
    <ChatHistoryItem item={item} index={index} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setIsSidebarOpen(!isSidebarOpen)}
          activeOpacity={0.7}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: sidebarAnim.interpolate({
                    inputRange: [-Dimensions.get('window').width, 0],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons
              name="menu"
              size={24}
              color={theme.COLORS.text.primary}
            />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: sidebarAnim }],
            },
          ]}
        >
          <FlatList
            data={chatHistories}
            renderItem={renderChatHistory}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatHistoryList}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={() => setIsSidebarOpen(false)}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message... (Press Enter to send)"
                placeholderTextColor={theme.COLORS.text.secondary}
                multiline
                onKeyPress={handleKeyPress}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: inputText.trim() ? 1 : 0.8,
                      },
                    ],
                  }}
                >
                  <Ionicons
                    name="send"
                    size={24}
                    color={inputText.trim() ? theme.COLORS.primary.main : theme.COLORS.text.secondary}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.COLORS.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.background.default,
  },
  menuButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...theme.FONTS.bold,
    fontSize: 20,
    color: theme.COLORS.text.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: theme.COLORS.background.paper,
    zIndex: 1,
    borderRightWidth: 1,
    borderRightColor: theme.COLORS.background.default,
  },
  chatHistoryList: {
    padding: 16,
  },
  chatHistoryItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.background.default,
  },
  chatHistoryContent: {
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    ...theme.FONTS.medium,
    fontSize: 16,
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
  },
  chatHistoryRight: {
    alignItems: 'flex-end',
  },
  unreadBadge: {
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  unreadCount: {
    color: theme.COLORS.background.paper,
    fontSize: 12,
    ...theme.FONTS.medium,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: theme.COLORS.primary.main,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: theme.COLORS.background.paper,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: theme.COLORS.background.paper,
  },
  otherMessageText: {
    color: theme.COLORS.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: theme.COLORS.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.background.default,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: theme.COLORS.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 0,
  },
  overlayTouchable: {
    flex: 1,
  },
  chatHistoryTouchable: {
    flex: 1,
    flexDirection: 'row',
  },
}); 