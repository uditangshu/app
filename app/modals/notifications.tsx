import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
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
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [seenNotificationIds, setSeenNotificationIds] = useState<Set<string>>(new Set());
  
  const newNotifications = notifications.filter(n => !seenNotificationIds.has(n.id));
  
  useEffect(() => {
    if (visible && notifications.length > 0) {
      setSeenNotificationIds(prev => {
        const newSet = new Set(prev);
        notifications.forEach(n => newSet.add(n.id));
        return newSet;
      });
    }
  }, [visible, notifications]);

  const handleNotificationPress = (notification: Notification) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notification.id)) {
        newSet.delete(notification.id);
      } else {
        newSet.add(notification.id);
      }
      return newSet;
    });
    
    onNotificationPress(notification);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#121212' : '#F8F9FA' }]}>
        <View style={[styles.modalHeader, { 
          backgroundColor: isDarkMode ? '#1E1E1E' : 'white',
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
        }]}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? 'white' : theme.COLORS.text.primary }]}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? 'white' : theme.COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {loading && newNotifications.length > 0 ? (
            <View style={styles.loadingContainer}>
              {[1, 2, 3].map((index) => (
                <View key={index} style={[styles.notificationItem, { 
                  backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
                  borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDarkMode ? 0 : 0.1,
                  shadowRadius: 3,
                  elevation: isDarkMode ? 0 : 2,
                  marginBottom: verticalScale(12)
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
              <Ionicons name="notifications-off-outline" size={56} color={isDarkMode ? 'rgba(255,255,255,0.5)' : theme.COLORS.text.secondary} />
              <Text style={[styles.emptyText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : theme.COLORS.text.secondary }]}>No notifications</Text>
              <Text style={[styles.emptySubtext, { color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }]}>
                You're all caught up!
              </Text>
            </View>
          ) : (
            notifications.map((notification) => {
              const isExpanded = expandedNotifications.has(notification.id);
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    { 
                      backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
                      borderLeftWidth: notification.status === 'unread' ? 3 : 0,
                      borderLeftColor: notification.status === 'unread' ? '#1C8D3A' : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDarkMode ? 0 : 0.1,
                      shadowRadius: 3,
                      elevation: isDarkMode ? 0 : 2,
                      marginBottom: verticalScale(12)
                    }
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { 
                    backgroundColor: isDarkMode ? 'rgba(28, 141, 58, 0.15)' : 'rgba(28, 141, 58, 0.08)',
                    borderWidth: 0
                  }]}>
                    <Ionicons name="notifications-outline" size={24} color="#1C8D3A" />
                    {notification.status === 'unread' && (
                      <View style={[styles.unreadDot, { 
                        backgroundColor: '#FF3B30',
                        position: 'absolute',
                        top: -4,
                        right: -4,
                      }]} />
                    )}
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, { 
                      color: isDarkMode ? 'white' : theme.COLORS.text.primary,
                      fontWeight: notification.status === 'unread' ? '700' : '600'
                    }]}>
                      {notification.title}
                    </Text>
                    
                    {isExpanded && (
                      <Text style={[styles.expandedDescription, { 
                        color: isDarkMode ? 'rgba(255,255,255,0.8)' : theme.COLORS.text.primary,
                        marginTop: verticalScale(8),
                        marginBottom: verticalScale(8)
                      }]}>
                        {notification.description}
                      </Text>
                    )}
                    
                    <View style={styles.notificationFooter}>
                      <Text style={[styles.notificationTime, { 
                        color: isDarkMode ? 'rgba(255,255,255,0.5)' : theme.COLORS.text.secondary
                      }]}>
                        {formatDate(notification.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusIndicator}>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={isDarkMode ? 'rgba(255,255,255,0.5)' : theme.COLORS.text.secondary} 
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
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
    padding: moderateScale(12),
    paddingVertical: moderateScale(4),
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  modalTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
  },
  closeButton: {
    padding: moderateScale(8),
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  notificationsList: {
    flex: 1,
    padding: moderateScale(16),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  expandedDescription: {
    fontSize: fontScale(14),
    lineHeight: verticalScale(22),
    letterSpacing: 0.2,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  notificationTime: {
    fontSize: fontScale(12),
    fontWeight: '400',
  },
  statusIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: horizontalScale(8),
    height: 40,
    width: 40,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'white',
  },
  loadingContainer: {
    paddingVertical: verticalScale(8),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(24),
    marginTop: verticalScale(80),
  },
  emptyText: {
    fontSize: fontScale(18),
    fontWeight: '600',
    marginTop: verticalScale(16),
  },
  emptySubtext: {
    fontSize: fontScale(14),
    textAlign: 'center',
    marginTop: verticalScale(8),
  },
}); 