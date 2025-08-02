// src/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem, Cart } from '../types';

interface CartState extends Cart {
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          );

          let newItems;
          if (existingItem) {
            // Update quantity if item already exists
            newItems = state.items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            // Add new item
            newItems = [...state.items, { product, quantity }];
          }

          const total = newItems.reduce(
            (sum, item) => sum + item.product.rate * item.quantity,
            0
          );
          const itemCount = newItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return { items: newItems, total, itemCount };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) => item.product.id !== productId
          );

          const total = newItems.reduce(
            (sum, item) => sum + item.product.rate * item.quantity,
            0
          );
          const itemCount = newItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return { items: newItems, total, itemCount };
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          );

          const total = newItems.reduce(
            (sum, item) => sum + item.product.rate * item.quantity,
            0
          );
          const itemCount = newItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return { items: newItems, total, itemCount };
        });
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },

      getItemQuantity: (productId) => {
        const item = get().items.find(
          (item) => item.product.id === productId
        );
        return item?.quantity || 0;
      },

      isInCart: (productId) => {
        return get().items.some((item) => item.product.id === productId);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
