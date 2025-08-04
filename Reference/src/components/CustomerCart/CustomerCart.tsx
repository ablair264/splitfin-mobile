// src/components/CustomerCart/CustomerCart.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { ProgressBar } from '../CustomerProgressBar/CustomerProgressBar';
import '../CustomerCart/CustomerCart.css';

// Image cache to prevent re-fetching
const imageUrlCache = new Map<string, string | null>();

// ImageKit base URL - replace with your actual ImageKit URL
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/a7kelms9a';

interface CartItemWithImage {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  brand?: string;
  imageUrl?: string;
  optimizedImageUrl?: string;
  imageLoading?: boolean;
  imageError?: boolean;
}

export default function CustomerCart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart();
  const [itemsWithImages, setItemsWithImages] = useState<CartItemWithImage[]>([]);

  // Generate ImageKit optimized URL
  const getOptimizedImageUrl = useCallback((baseUrl: string) => {
    return `${baseUrl}/tr:w-200,h-200,c-maintain_ratio,q-80,f-auto`;
  }, []);

  // Build image URL from product data
  const buildImageUrl = useCallback((sku: string, brand: string) => {
    // Map brand names to their exact folder names
    const brandFolderMap: { [key: string]: string } = {
      'blomus': 'blomus',
      'elvang': 'elvang', 
      'gefu': 'gefu',
      'räder': 'rader',
      'rader': 'rader',
      'myflame': 'myflame',
      'my flame': 'myflame',
      'my-flame-lifestyle': 'myflame',
      'relaxound': 'relaxound',
      'remember': 'remember'
    };
    
    const brandKey = brand.toLowerCase();
    const folderName = brandFolderMap[brandKey] || brand.toLowerCase().replace(/\s+/g, '-');
    
    return `${IMAGEKIT_BASE_URL}/brand-images/${folderName}/${sku}_1.webp`;
  }, []);

  // Load image for a single item
  const loadImageForItem = useCallback(async (item: CartItemWithImage) => {
    // Skip image loading if no brand is provided
    if (!item.brand) {
      return {
        ...item,
        optimizedImageUrl: undefined,
        imageLoading: false,
        imageError: true
      };
    }

    const cacheKey = `${item.brand}-${item.sku}`;
    
    // Check cache first
    const cachedUrl = imageUrlCache.get(cacheKey);
    if (cachedUrl !== undefined) {
      return {
        ...item,
        optimizedImageUrl: cachedUrl || undefined,
        imageLoading: false,
        imageError: cachedUrl === null
      };
    }

    // Set loading state
    const loadingItem = {
      ...item,
      imageLoading: true,
      imageError: false
    };

    try {
      // Build the ImageKit URL
      const baseImageUrl = buildImageUrl(item.sku, item.brand);
      
      // Test if image exists by trying to load it
      return new Promise<CartItemWithImage>((resolve) => {
        const testImage = new Image();
        
        testImage.onload = () => {
          const optimizedUrl = getOptimizedImageUrl(baseImageUrl);
          imageUrlCache.set(cacheKey, optimizedUrl);
          resolve({
            ...item,
            optimizedImageUrl: optimizedUrl,
            imageLoading: false,
            imageError: false
          });
        };
        
        testImage.onerror = () => {
          imageUrlCache.set(cacheKey, null);
          resolve({
            ...item,
            optimizedImageUrl: undefined,
            imageLoading: false,
            imageError: true
          });
        };
        
        testImage.src = baseImageUrl;
      });
      
    } catch (error) {
      console.error('Error loading image for item:', item.sku, error);
      imageUrlCache.set(cacheKey, null);
      return {
        ...item,
        optimizedImageUrl: undefined,
        imageLoading: false,
        imageError: true
      };
    }
  }, [buildImageUrl, getOptimizedImageUrl]);

  // Load images for all cart items
  useEffect(() => {
    const loadAllImages = async () => {
      // Initialize items with loading state
      const initialItems = items.map(item => ({
        ...item,
        imageLoading: true,
        imageError: false
      }));
      setItemsWithImages(initialItems);

      // Load images for each item
      const imagePromises = items.map(item => loadImageForItem(item));
      const itemsWithLoadedImages = await Promise.all(imagePromises);
      
      setItemsWithImages(itemsWithLoadedImages);
    };

    if (items.length > 0) {
      loadAllImages();
    } else {
      setItemsWithImages([]);
    }
  }, [items, loadImageForItem]);

  const handleCheckout = () => {
    navigate('/customer/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Browse our brands to add products to your cart</p>
        <button onClick={() => navigate('/customer/brands')} className="continue-shopping">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="customer-cart">
      <ProgressBar currentStep={3} />
      <h1>Shopping Cart</h1>
      
      <div className="cart-items">
        {itemsWithImages.map(item => (
          <div key={item.id} className="cart-item">
            <div className="item-image">
              {item.imageLoading ? (
                <div className="image-loader">
                  <div className="spinner"></div>
                </div>
              ) : item.imageError || !item.optimizedImageUrl ? (
                <div className="image-placeholder">
                  <span>🖼️</span>
                </div>
              ) : (
                <img 
                  src={item.optimizedImageUrl} 
                  alt={item.name}
                  onError={(e) => {
                    // Fallback to placeholder if optimized image fails
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.png';
                  }}
                />
              )}
            </div>
            
            <div className="item-details">
              <h3>{item.name}</h3>
              <p className="item-sku">SKU: {item.sku}</p>
              {item.brand && <p className="item-brand">{item.brand}</p>}
            </div>
            
            <div className="item-quantity">
              <button 
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                +
              </button>
            </div>
            
            <div className="item-price">
              £{(item.price * item.quantity).toFixed(2)}
            </div>
            
            <button className="remove-item" onClick={() => removeFromCart(item.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>£{getTotalPrice().toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>VAT (20%)</span>
          <span>£{(getTotalPrice() * 0.2).toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>£{(getTotalPrice() * 1.2).toFixed(2)}</span>
        </div>
        
        <div className="cart-actions">
          <button onClick={clearCart} className="clear-cart">Clear Cart</button>
          <button onClick={handleCheckout} className="checkout-btn">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}