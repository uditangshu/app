import { ExpoConfig, ConfigContext } from 'expo/config';

// Get environment variables
const APP_ENV = process.env.APP_ENV || 'development';
const isProduction = APP_ENV === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isProduction ? 'Employee Portal' : 'Employee Portal (Dev)',
  slug: 'employee-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/DeLogo.png',
    resizeMode: 'contain',
    backgroundColor: '#000000'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.employeeapp',
    buildNumber: '1.0.0',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/Dlogo.png',
      backgroundColor: '#000000'
    },
    package: isProduction ? 
      'com.yourcompany.employeeportal' : 
      'com.yourcompany.employeeportal.dev',
    permissions: ["RECORD_AUDIO"]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
  ],
  extra: {
    eas: {
      projectId: "3161714f-2328-47b7-93c2-bcc729042808"
    },
    appEnv: APP_ENV
  },
  updates: {
    url: 'https://u.expo.dev/3161714f-2328-47b7-93c2-bcc729042808'
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  }
});