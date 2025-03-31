import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import Shimmer from '../components/Shimmer';

interface Notification {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  created_at: string;
  status: 'read' | 'unread';
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading: boolean;
  onLoadMore: () => void;
  onNotificationPress: (notification: Notification) => void;
}

export default function NotificationsModal({ visible, onClose, notifications, loading, onLoadMore, onNotificationPress }: NotificationsModalProps) {
  const { accessToken } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleNotificationPress = (notification: Notification) => {
    setSelectedNotification(notification);
    onNotificationPress(notification);
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseDetail = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedNotification(null);
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : '#F5F5F5' }]}>
        <View style={[styles.modalHeader, { 
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'white',
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }]}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? 'white' : theme.COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.notificationsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              {[1, 2, 3].map((index) => (
                <View key={index} style={[styles.notificationItem, { 
                  backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'white',
                  borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDarkMode ? 0 : 0.1,
                  shadowRadius: 2,
                  elevation: isDarkMode ? 0 : 2,
                  marginBottom: verticalScale(8)
                }]}>
                  <Shimmer width={40} height={40} borderRadius={20} />
                  <View style={styles.notificationContent}>
                    <Shimmer width={200} height={16} />
                    <Shimmer width={150} height={14} style={{ marginTop: verticalScale(4) }} />
                  </View>
                </View>
              ))}
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={isDarkMode ? 'rgba(255,255,255,0.5)' : theme.COLORS.text.secondary} />
              <Text style={[styles.emptyText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>No notifications</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'white',
                    borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDarkMode ? 0 : 0.1,
                    shadowRadius: 2,
                    elevation: isDarkMode ? 0 : 2,
                    marginBottom: verticalScale(8)
                  }
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={[styles.iconContainer, { 
                  backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.1)' : `${theme.COLORS.primary.main}10`,
                  borderWidth: isDarkMode ? 0 : 1,
                  borderColor: `${theme.COLORS.primary.main}20`
                }]}>
                  <Ionicons name="notifications-outline" size={24} color={theme.COLORS.primary.main} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, { 
                    color: isDarkMode ? 'white' : theme.COLORS.text.primary,
                    fontWeight: notification.status === 'unread' ? '600' : '500'
                  }]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationDescription, { 
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary,
                    opacity: notification.status === 'unread' ? 1 : 0.8
                  }]}>
                    {notification.description}
                  </Text>
                  <Text style={[styles.notificationTime, { 
                    color: isDarkMode ? 'rgba(255,255,255,0.5)' : theme.COLORS.text.secondary
                  }]}>
                    {formatDate(notification.created_at)}
                  </Text>
                </View>
                {notification.status === 'unread' && (
                  <View style={[styles.unreadDot, { 
                    backgroundColor: theme.COLORS.primary.main,
                    elevation: isDarkMode ? 0 : 2
                  }]} />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Notification Detail Modal */}
        <Modal
          visible={!!selectedNotification}
          transparent={true}
          animationType="none"
          onRequestClose={handleCloseDetail}
        >
          <Animated.View 
            style={[
              styles.detailModalOverlay,
              { 
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
                opacity: fadeAnim,
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.detailModalContent,
                { 
                  backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                  transform: [{ translateY }],
                }
              ]}
            >
              <View style={styles.detailModalHeader}>
                <View style={[styles.detailIconContainer, { backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.2)' : `${theme.COLORS.primary.main}20` }]}>
                  <Ionicons name="notifications-outline" size={24} color={theme.COLORS.primary.main} />
                </View>
                <Text style={[styles.detailModalTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                  {selectedNotification?.title}
                </Text>
                <TouchableOpacity onPress={handleCloseDetail} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={isDarkMode ? 'white' : theme.COLORS.text.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.detailModalTime, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>
                {selectedNotification && formatDate(selectedNotification.created_at)}
              </Text>
              <ScrollView style={styles.detailModalBody}>
                <Text style={[styles.detailModalDescription, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>
                  {selectedNotification?.description}
                </Text>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontScale(20),
    fontWeight: '700',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  notificationsList: {
    flex: 1,
  },
  loadingContainer: {
    padding: moderateScale(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(24),
  },
  emptyText: {
    fontSize: fontScale(16),
    marginTop: verticalScale(16),
  },
  notificationItem: {
    flexDirection: 'row',
    padding: moderateScale(16),
    borderRadius: 12,
    marginHorizontal: horizontalScale(16),
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  notificationContent: {
    flex: 1,
    marginRight: horizontalScale(8),
  },
  notificationTitle: {
    fontSize: fontScale(16),
    marginBottom: verticalScale(4),
  },
  notificationDescription: {
    fontSize: fontScale(14),
    marginBottom: verticalScale(4),
    lineHeight: verticalScale(20),
  },
  notificationTime: {
    fontSize: fontScale(12),
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: horizontalScale(8),
    alignSelf: 'center',
  },
  detailModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(16),
  },
  detailModalTitle: {
    fontSize: fontScale(24),
    fontWeight: '700',
    flex: 1,
    marginRight: horizontalScale(16),
  },
  detailModalTime: {
    fontSize: fontScale(14),
    marginBottom: verticalScale(24),
  },
  detailModalBody: {
    flex: 1,
  },
  detailModalDescription: {
    fontSize: fontScale(16),
    lineHeight: verticalScale(24),
  },
}); 