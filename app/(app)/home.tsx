import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';
import { horizontalScale, verticalScale, moderateScale, fontScale } from '../../utils/responsive';

interface EventItem {
  id: string;
  title: string;
  date: string;
  type: 'Meeting' | 'Deadline' | 'Training';
}

interface ChatItem {
  department: string;
  message: string;
}

const events: EventItem[] = [
  { id: '1', title: 'Team Meeting', date: '2023-03-25 10:00 AM', type: 'Meeting' },
  { id: '2', title: 'Project Deadline', date: '2023-03-28', type: 'Deadline' },
  { id: '3', title: 'Training Session', date: '2023-03-30 2:00 PM', type: 'Training' },
];

const chats: ChatItem[] = [
  { department: 'HR Department', message: 'About leave policy...' },
  { department: 'Tech Support', message: 'Laptop issue resolution...' },
  { department: 'Sales Team', message: 'Discussion on new product launch...' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1C8D3A', '#165C27', '#0A3814']}
        style={styles.gradientBackground}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome, EMP2001</Text>
              <Text style={styles.subtitleText}>Your employee dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color="white" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileButton}>
                <Text style={styles.profileText}>EMP2001</Text>
                <Ionicons name="chevron-down" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Upcoming Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={24} color="white" />
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Your scheduled events and deadlines</Text>
            
            {events.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{event.date}</Text>
                </View>
                <View style={[styles.eventBadge, styles[event.type.toLowerCase() as keyof typeof styles] as ViewStyle]}>
                  <Text style={styles.eventBadgeText}>{event.type}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>View Calendar</Text>
              <Ionicons name="arrow-forward" size={20} color="#1C8D3A" />
            </TouchableOpacity>
          </View>

          {/* Recent Chats Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={24} color="white" />
              <Text style={styles.sectionTitle}>Recent Chats</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Your recent conversations</Text>

            {chats.map((chat, index) => (
              <TouchableOpacity key={index} style={styles.chatItem}>
                <Ionicons name="chatbubble-outline" size={24} color="#1C8D3A" />
                <View style={styles.chatInfo}>
                  <Text style={styles.chatTitle}>{chat.department}</Text>
                  <Text style={styles.chatMessage}>{chat.message}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.openChatButton}>
              <Text style={styles.openChatText}>Open Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash-outline" size={24} color="white" />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Common tasks and resources</Text>

            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="document-text-outline" size={24} color="white" />
                <Text style={styles.quickActionText}>Documents</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="calendar-outline" size={24} color="white" />
                <Text style={styles.quickActionText}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="notifications-outline" size={24} color="white" />
                <Text style={styles.quickActionText}>Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="chatbubbles-outline" size={24} color="white" />
                <Text style={styles.quickActionText}>Messages</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: horizontalScale(16),
    paddingTop: Platform.OS === 'android' ? verticalScale(40) : verticalScale(16),
    backgroundColor: 'transparent',
  },
  welcomeText: {
    color: 'white',
    fontSize: fontScale(24),
    fontWeight: 'bold',
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(14),
    marginTop: verticalScale(4),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    marginRight: horizontalScale(16),
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: fontScale(12),
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: moderateScale(8),
    borderRadius: 8,
  },
  profileText: {
    color: 'white',
    marginRight: horizontalScale(4),
  },
  section: {
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
    backgroundColor: 'rgba(0,0,0,0.3)', // Darker, almost transparent black
    borderRadius: 12,
    marginHorizontal: horizontalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    color: 'white',
    fontSize: fontScale(20),
    fontWeight: 'bold',
    marginLeft: horizontalScale(8),
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(14),
    marginBottom: verticalScale(16),
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', // Darker background for event items
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(8),
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: 'white',
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  eventDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(14),
    marginTop: verticalScale(4),
  },
  eventBadge: {
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: 16,
  },
  meeting: {
    backgroundColor: '#1C8D3A',
  },
  deadline: {
    backgroundColor: '#FF4B4B',
  },
  training: {
    backgroundColor: '#4B7BFF',
  },
  eventBadgeText: {
    color: 'white',
    fontSize: fontScale(12),
    fontWeight: '500',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(16),
  },
  viewMoreText: {
    color: '#1C8D3A',
    fontSize: fontScale(16),
    fontWeight: '500',
    marginRight: horizontalScale(8),
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', // Darker background for chat items
    padding: moderateScale(16),
    borderRadius: 8,
    marginBottom: verticalScale(8),
  },
  chatInfo: {
    marginLeft: horizontalScale(12),
    flex: 1,
  },
  chatTitle: {
    color: 'white',
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  chatMessage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(14),
    marginTop: verticalScale(4),
  },
  openChatButton: {
    backgroundColor: '#1C8D3A',
    padding: moderateScale(16),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: verticalScale(16),
  },
  openChatText: {
    color: 'white',
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: verticalScale(8),
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.2)', // Darker background for quick action buttons
    padding: moderateScale(16),
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  quickActionText: {
    color: 'white',
    fontSize: fontScale(14),
    fontWeight: '500',
    marginTop: verticalScale(8),
  },
});