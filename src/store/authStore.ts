// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setFirebaseUser: (firebaseUser: FirebaseAuthTypes.User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuthState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          const userCredential = await auth().signInWithEmailAndPassword(email, password);
          const firebaseUser = userCredential.user;
          
          // Fetch user data from Firestore
          const userDoc = await firestore()
            .collection('users')
            .doc(firebaseUser.uid)
            .get();
            
          if (userDoc.exists) {
            const userData = userDoc.data() as User;
            set({
              user: { id: firebaseUser.uid, ...userData },
              firebaseUser,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error('User data not found');
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signUp: async (email, password, displayName) => {
        try {
          set({ isLoading: true, error: null });
          
          const userCredential = await auth().createUserWithEmailAndPassword(email, password);
          const firebaseUser = userCredential.user;
          
          // Update display name
          await firebaseUser.updateProfile({ displayName });
          
          // Create user document in Firestore
          const userData: User = {
            id: firebaseUser.uid,
            email,
            displayName,
            role: 'customer',
            createdAt: new Date(),
          };
          
          await firestore()
            .collection('users')
            .doc(firebaseUser.uid)
            .set(userData);
            
          set({
            user: userData,
            firebaseUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await auth().signOut();
          set({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      resetPassword: async (email) => {
        try {
          set({ isLoading: true, error: null });
          await auth().sendPasswordResetEmail(email);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const { user } = get();
          
          if (!user) throw new Error('No user logged in');
          
          // Update Firestore
          await firestore()
            .collection('users')
            .doc(user.id)
            .update(data);
            
          // Update local state
          set({
            user: { ...user, ...data },
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      checkAuthState: () => {
        const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const userDoc = await firestore()
                .collection('users')
                .doc(firebaseUser.uid)
                .get();
                
              if (userDoc.exists) {
                const userData = userDoc.data() as User;
                set({
                  user: { id: firebaseUser.uid, ...userData },
                  firebaseUser,
                  isAuthenticated: true,
                  isLoading: false,
                });
              }
            } catch (error: any) {
              set({ error: error.message, isLoading: false });
            }
          } else {
            set({
              user: null,
              firebaseUser: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        });
        
        return unsubscribe;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
