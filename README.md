# Employee Portal App

A modern React Native application for employee management, built with Expo and TypeScript.

## Features

- Authentication (Login/Register)
- Responsive Design
- Dark Mode Support
- Bottom Tab Navigation
- Profile Management
- Settings Management
- Event Calendar
- Chat System

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd app-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on your preferred platform:
- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Scan the QR code with Expo Go app on your physical device

## Project Structure

```
app-frontend/
├── app/
│   ├── (app)/           # Authenticated app screens
│   │   ├── home.tsx     # Home screen
│   │   ├── profile.tsx  # Profile screen
│   │   ├── settings.tsx # Settings screen
│   │   └── _layout.tsx  # App layout with bottom tabs
│   ├── (auth)/          # Authentication screens
│   │   ├── login.tsx    # Login screen
│   │   ├── register.tsx # Registration screen
│   │   └── _layout.tsx  # Auth layout
│   └── _layout.tsx      # Root layout
├── constants/
│   └── theme.ts         # Theme configuration
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── utils/
│   └── responsive.ts    # Responsive utilities
└── package.json
```

## Technologies Used

- React Native
- Expo
- TypeScript
- Expo Router
- AsyncStorage
- React Context API

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## CI/CD Setup Instructions

### Setting up the EXPO_TOKEN for GitHub Actions

1. Generate an Expo access token:
   - Login to your Expo account on https://expo.dev
   - Go to your account settings
   - Select the "Access Tokens" tab
   - Click "Create" to generate a new token
   - Give it a name like "GitHub Actions" and create the token
   - Copy the token value

2. Add the token to GitHub repository secrets:
   - Go to your GitHub repository
   - Click on "Settings" → "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name it `EXPO_TOKEN`
   - Paste the Expo access token value
   - Click "Add secret"

3. Ensure your workflow will now have access to the token through `${{ secrets.EXPO_TOKEN }}`

## Triggering Builds and Deployments

- **Automatic builds** will be triggered on pushes to `main` and `production` branches
- **Manual builds** can be triggered from the "Actions" tab by selecting the "EAS Build and Submit" workflow
- Pushing to the `production` branch will trigger a production build and submission to stores
- Other branches will create preview builds

#   a p p 
 
 