import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Employee Portal',
  slug: 'employee-portal',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000'
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.employeeportal',
    infoPlist: {
      UIBackgroundModes: ['remote-notification']
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000'
    },
    package: 'com.yourcompany.employeeportal',
    googleServicesFile: './google-services.json',
    permissions: ['NOTIFICATIONS']
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#1C8D3A',
        sounds: ['./assets/notification.wav']
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "your-project-id"
    }
  }
}); 