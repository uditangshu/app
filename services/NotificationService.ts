import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_URL } from '../constants/api';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private _expoPushToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async registerForPushNotifications(accessToken: string) {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Get the token that uniquely identifies this device
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });

      this._expoPushToken = expoPushToken.data;

      // Register the token with your backend
      await this.registerDeviceWithBackend(accessToken);

      // Configure specific settings for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1C8D3A',
        });
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  }

  private async registerDeviceWithBackend(accessToken: string) {
    if (!this._expoPushToken) return;

    try {
      const response = await fetch(`${API_URL}/employee/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token: this._expoPushToken,
          device_type: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register device token with backend');
      }
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  }

  async unregisterDevice(accessToken: string) {
    if (!this._expoPushToken) return;

    try {
      const response = await fetch(`${API_URL}/employee/unregister-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token: this._expoPushToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unregister device token');
      }

      this._expoPushToken = null;
    } catch (error) {
      console.error('Error unregistering device token:', error);
    }
  }

  // Add notification listeners
  addNotificationListeners(onNotification: (notification: Notifications.Notification) => void) {
    const notificationListener = Notifications.addNotificationReceivedListener(onNotification);
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap
      console.log('Notification tapped:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }
} 