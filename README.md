# Splitfin Mobile App

A React Native mobile application for the Splitfin inventory management system. Built with Expo, React Native, and Firebase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Firebase project configuration files

### Installation

1. Install dependencies:
```bash
cd SplitMobile
npm install
```

2. Set up Firebase (see FIREBASE_SETUP.md for detailed instructions):
   - Add `google-services.json` to `android/app/`
   - Add `GoogleService-Info.plist` to iOS project

3. Start the development server:
```bash
npm start
# or
expo start
```

4. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # App configuration (Firebase, etc.)
├── hooks/              # Custom React hooks
├── navigation/         # React Navigation setup
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── dashboard/     # Dashboard screens
│   ├── products/      # Product management
│   ├── orders/        # Order management
│   └── customers/     # Customer management
├── services/          # API and external services
├── store/             # Zustand state management
│   ├── authStore.ts   # Authentication state
│   └── cartStore.ts   # Shopping cart state
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **UI Components**: React Native Paper, React Native Elements
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Forms**: React Hook Form
- **API Client**: Axios
- **Data Fetching**: TanStack Query (React Query)

## 📱 Features

### Phase 1 (Current) ✅
- [x] Authentication (Login/Signup)
- [x] Navigation structure
- [x] Firebase integration
- [x] State management setup
- [x] Type definitions
- [ ] Basic UI components

### Phase 2 (In Progress) 🚧
- [ ] Dashboard with metrics
- [ ] Product browsing
- [ ] Shopping cart
- [ ] Order placement
- [ ] Customer profile

### Phase 3 (Planned) 📋
- [ ] Order history
- [ ] Invoice management
- [ ] Push notifications
- [ ] Offline support
- [ ] Advanced search/filters

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```
API_BASE_URL=https://api.splitfin.com
```

### Firebase Configuration
Ensure you have the correct Firebase configuration files:
- Android: `android/app/google-services.json`
- iOS: `ios/GoogleService-Info.plist`

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations

### State Management
- Use Zustand stores for global state
- Keep component state local when possible
- Implement proper data persistence

### Navigation
- Use typed navigation with TypeScript
- Implement proper deep linking support
- Handle navigation state persistence

## 🚀 Deployment

### iOS
1. Configure signing in Xcode
2. Build: `expo build:ios`
3. Upload to App Store Connect

### Android
1. Configure keystore
2. Build: `expo build:android`
3. Upload to Google Play Console

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS build errors**
   ```bash
   cd ios && pod install
   ```

3. **Android build errors**
   ```bash
   cd android && ./gradlew clean
   ```

## 📄 License

This project is proprietary and confidential.
