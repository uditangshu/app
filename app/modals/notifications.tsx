import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { fontScale, horizontalScale, moderateScale, verticalScale } from '../../utils/responsive';

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

export default function NotificationsModal({
  visible,
  onClose,
  notifications,
  loading,
  onLoadMore,
  onNotificationPress,
}: NotificationsModalProps) {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNotificationPress = (notification: Notification) => {
    setSelectedNotification(notification);
    onNotificationPress(notification);
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.status === 'unread' && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.notificationDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.notificationTime}>{formatDate(item.created_at)}</Text>
      </View>
      {item.status === 'unread' && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={theme.COLORS.primary.main} />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={localNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
          />
        </View>

        {/* Detailed Notification Modal */}
        <Modal
          visible={!!selectedNotification}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedNotification(null)}
        >
          <View style={styles.detailModalContainer}>
            <View style={styles.detailModalContent}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailHeaderTitle}>Notification Details</Text>
                <TouchableOpacity 
                  onPress={() => setSelectedNotification(null)}
                  style={styles.detailCloseButton}
                >
                  <Ionicons name="close" size={24} color={theme.COLORS.text.primary} />
                </TouchableOpacity>
              </View>
              
              {selectedNotification && (
                <View style={styles.detailContent}>
                  <Text style={styles.detailTitle}>{selectedNotification.title}</Text>
                  <Text style={styles.detailTime}>
                    {formatDate(selectedNotification.created_at)}
                  </Text>
                  <Text style={styles.detailDescription}>
                    {selectedNotification.description}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.COLORS.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border.main,
  },
  headerTitle: {
    fontSize: fontScale(20),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.bold,
  },
  closeButton: {
    padding: moderateScale(4),
  },
  listContent: {
    padding: moderateScale(16),
  },
  notificationItem: {
    flexDirection: 'row',
    padding: moderateScale(12),
    borderRadius: 8,
    marginBottom: verticalScale(8),
    backgroundColor: theme.COLORS.background.paper,
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: `${theme.COLORS.primary.main}15`,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fontScale(16),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.medium,
    marginBottom: verticalScale(4),
  },
  notificationDescription: {
    fontSize: fontScale(14),
    color: theme.COLORS.text.secondary,
    marginBottom: verticalScale(4),
  },
  notificationTime: {
    fontSize: fontScale(12),
    color: theme.COLORS.text.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.COLORS.primary.main,
    marginLeft: horizontalScale(8),
  },
  loaderContainer: {
    paddingVertical: verticalScale(16),
    alignItems: 'center',
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  detailModalContent: {
    backgroundColor: theme.COLORS.background.default,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border.main,
  },
  detailHeaderTitle: {
    fontSize: fontScale(18),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.bold,
  },
  detailCloseButton: {
    padding: moderateScale(4),
  },
  detailContent: {
    padding: moderateScale(16),
  },
  detailTitle: {
    fontSize: fontScale(20),
    color: theme.COLORS.text.primary,
    ...theme.FONTS.bold,
    marginBottom: verticalScale(8),
  },
  detailTime: {
    fontSize: fontScale(14),
    color: theme.COLORS.text.secondary,
    marginBottom: verticalScale(16),
  },
  detailDescription: {
    fontSize: fontScale(16),
    color: theme.COLORS.text.primary,
    lineHeight: 24,
  },
}); 