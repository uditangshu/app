import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Employee Portal',
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
    bundleIdentifier: 'com.yourcompany.employeeportal',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/Dlogo.png',
      backgroundColor: '#000000'
    },
    package: 'com.yourcompany.employeeportal'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router'
  ],
  extra: {
    eas: {
      projectId: "7d6c330a-c84a-47cc-94ce-d05214bdf571"
    }
  }
}); 