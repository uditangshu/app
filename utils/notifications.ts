import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
const configurePushNotifications = () => {
  try {
    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },

      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);

        // Process the notification data
        if (notification && notification.data) {
          // Handle notification data here
        }

        // Required on iOS only
        if (Platform.OS === 'ios' && notification) {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      // (optional) Called when the user fails to register for remote notifications. 
      // Typically occurs when APNS is having issues, or the device is a simulator
      onRegistrationError: function(err) {
        console.error(err && err.message ? err.message : 'Unknown registration error', err);
      },

      
      popInitialNotification: false, // Changed to false to handle it manually

      // IOS ONLY
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Android only (removed importance property)
      requestPermissions: true,
    });
  } catch (error) {
    console.error('Error configuring push notifications:', error);
  }

  // Create a channel for Android
  if (Platform.OS === 'android') {
    try {
      PushNotification.createChannel(
        {
          channelId: "default-channel-id",
          channelName: "Default Channel",
          channelDescription: "A channel to categorize your notifications",
          playSound: true,
          soundName: "default",
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created) => console.log(`Channel created: ${created ? 'yes' : 'no'}`)
      );
    } catch (error) {
      console.error('Error creating Android notification channel:', error);
    }
  }
};

// Initialize notifications on module import
configurePushNotifications();

// Check if notifications are enabled in settings
export async function getNotificationStatus(): Promise<boolean> {
  try {
    const savedSetting = await AsyncStorage.getItem('notificationsEnabled');
    return savedSetting === 'true';
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
}

// Request permissions for notifications
export async function requestNotificationPermissions(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, we need to request permissions explicitly
        PushNotificationIOS.requestPermissions()
          .then(permissions => {
            if (!permissions) {
              console.warn('No permissions object returned');
              AsyncStorage.setItem('notificationsEnabled', 'false');
              resolve(false);
              return;
            }
            
            const granted = permissions.alert && permissions.badge && permissions.sound;
            AsyncStorage.setItem('notificationsEnabled', granted ? 'true' : 'false');
            resolve(!!granted); // Convert to boolean with double negation
          })
          .catch(error => {
            console.error('Error requesting iOS notification permissions:', error);
            resolve(false);
          });
      } else {
        // For Android, permissions are typically granted during app installation
        // We can check if notifications are enabled via the channel
        // For simplicity, we'll just assume they are enabled
        AsyncStorage.setItem('notificationsEnabled', 'true');
        resolve(true);
      }
    } catch (error) {
      console.error('Error in requestNotificationPermissions:', error);
      resolve(false);
    }
  });
}

// Schedule a local notification
export async function scheduleNotification(
  title: string,
  body: string,
  data: Record<string, any> = {},
  delay: number = 0 // Delay in milliseconds
): Promise<string | null> {
  try {
    const isEnabled = await getNotificationStatus();
    
    if (!isEnabled) {
      console.log('Notifications are disabled, not scheduling notification');
      return null;
    }
    
    // Generate a unique ID for the notification
    const notificationId = `notification-${Date.now()}`;
    
    PushNotification.localNotification({
      // Android properties
      channelId: "default-channel-id",
      smallIcon: "ic_notification",
      bigText: body, // Expanded notification text
      subText: "Employee App", // Subtitle
      color: "#2C5EE6", // Blue color
      vibrate: true,
      vibration: 300,
      priority: "high",
      
      // iOS and Android properties
      id: notificationId,
      title: title,
      message: body,
      userInfo: data,
      playSound: true,
      
      // iOS properties
      category: data.type || "default",
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

// Schedule a notification with delay
export async function scheduleDelayedNotification(
  title: string,
  body: string,
  data: Record<string, any> = {},
  delay: number = 1000 // Delay in milliseconds, default 1 second
): Promise<string | null> {
  try {
    const isEnabled = await getNotificationStatus();
    
    if (!isEnabled) {
      console.log('Notifications are disabled, not scheduling notification');
      return null;
    }
    
    // Generate a unique ID for the notification
    const notificationId = `notification-${Date.now()}`;
    
    PushNotification.localNotificationSchedule({
      // Android properties
      channelId: "default-channel-id",
      smallIcon: "ic_notification",
      bigText: body, // Expanded notification text
      subText: "Employee App", // Subtitle
      color: "#2C5EE6", // Blue color
      vibrate: true,
      vibration: 300,
      priority: "high",
      
      // iOS and Android properties
      id: notificationId,
      title: title,
      message: body,
      userInfo: data,
      playSound: true,
      
      // iOS properties
      category: data.type || "default",
      
      // Scheduled time
      date: new Date(Date.now() + delay),
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling delayed notification:', error);
    return null;
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  PushNotification.cancelAllLocalNotifications();
  if (Platform.OS === 'ios') {
    PushNotificationIOS.removeAllDeliveredNotifications();
  }
}

// Cancel a specific notification by ID
export function cancelNotification(notificationId: string): void {
  PushNotification.cancelLocalNotifications({ id: notificationId });
}

// Set application badge number (iOS primarily, some Android support)
export async function setBadgeCount(count: number): Promise<void> {
  PushNotification.setApplicationIconBadgeNumber(count);
}

// Register for push notifications (returns token that should be sent to backend)
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    const isEnabled = await getNotificationStatus();
    
    if (!isEnabled) {
      console.log('Notifications are disabled, not registering for push');
      return false;
    }
    
    // The actual registration is handled in PushNotification.configure
    // This is called in the onRegister callback
    return true;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return false;
  }
} 