// src/config/firebase.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase is configured through native configuration files:
// - android/app/google-services.json
// - ios/GoogleService-Info.plist

// Enable offline persistence for Firestore
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

// Export Firebase services
export { auth, firestore };

// Helper function to get the current user
export const getCurrentUser = () => auth().currentUser;

// Helper function to check if user is authenticated
export const isAuthenticated = () => !!auth().currentUser;
