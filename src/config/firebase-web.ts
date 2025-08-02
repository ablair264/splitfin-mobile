// Alternative Firebase config using Web SDK (temporary solution)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAiEWug483-fiM0kI68EiYYYdbfgssC5C0",
  authDomain: "splitfin-609c9.firebaseapp.com",
  projectId: "splitfin-609c9",
  storageBucket: "splitfin-609c9.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Helper functions remain the same
export const getCurrentUser = () => auth.currentUser;
export const isAuthenticated = () => !!auth.currentUser;
