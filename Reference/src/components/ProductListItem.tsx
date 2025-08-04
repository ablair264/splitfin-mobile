// src/components/ProductListItem.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from './ProductCard';

interface ProductListItemProps {
  product: Product;
  quantity: number;
  isSelected: boolean;
  onQuantityChange: (qty: number) => void;
  onAddToOrder: () => void;
  onQuickView: () => void;
}

// Image cache to prevent re-fetching - shared across components
const imageUrlCache = new Map<string, string | null>();

// ImageKit base URL - replace with your actual ImageKit URL
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/a7kelms9a';

export function ProductListItem({
  product,
  quantity,
  isSelected,
  onQuantityChange,
  onAddToOrder,
  onQuickView
}: ProductListItemProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Generate ImageKit optimized URL
  const getOptimizedImageUrl = (baseUrl: string, transformation: 'thumbnail' | 'medium' | 'preview') => {
    const transformations = {
      thumbnail: 'tr:w-200,h-200,c-maintain_ratio,q-80,f-auto',
      medium: 'tr:w-400,h-400,c-maintain_ratio,q-85,f-auto',
      preview: 'tr:w-100,h-100,c-maintain_ratio,q-60,f-auto,bl-10'
    };
    
    return `${baseUrl}/${transformations[transformation]}`;
  };

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
    
    // Convert SKU to uppercase to match ImageKit storage
    const lowercaseSku = sku.toLowerCase();
    
    return `${IMAGEKIT_BASE_URL}/brand-images/${folderName}/${lowercaseSku}_1_400x400.webp`;
  }, []);

  // Check cache on mount
  useEffect(() => {
    const cacheKey = `${product.brand}-${product.sku}`;
    const cachedUrl = imageUrlCache.get(cacheKey);
    if (cachedUrl !== undefined) {
      setImageUrl(cachedUrl || '/placeholder.png');
      setImageError(cachedUrl === null);
    }
  }, [product.sku, product.brand]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.01, rootMargin: '100px' }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch image when visible
  useEffect(() => {
    if (isVisible && imageUrl === null) {
      const fetchImage = async () => {
        const cacheKey = `${product.brand}-${product.sku}`;
        const cachedUrl = imageUrlCache.get(cacheKey);
        if (cachedUrl !== undefined) {
          setImageUrl(cachedUrl || '/placeholder.png');
          setImageError(cachedUrl === null);
          return;
        }

        try {
          // Build the ImageKit URL
          const baseImageUrl = buildImageUrl(product.sku, product.brand);
          
          // Test if image exists by trying to load it
          const testImage = new Image();
          
          testImage.onload = () => {
            const optimizedUrl = getOptimizedImageUrl(baseImageUrl, 'thumbnail');
            imageUrlCache.set(cacheKey, optimizedUrl);
            setImageUrl(optimizedUrl);
            setImageError(false);
          };
          
          testImage.onerror = () => {
            imageUrlCache.set(cacheKey, null);
            setImageUrl('/placeholder.png');
            setImageError(true);
          };
          
          testImage.src = baseImageUrl;
          
        } catch (error) {
          console.error('Error loading image:', error);
          const cacheKey = `${product.brand}-${product.sku}`;
          imageUrlCache.set(cacheKey, null);
          setImageUrl('/placeholder.png');
          setImageError(true);
        }
      };
      fetchImage();
    }
  }, [isVisible, imageUrl, product.sku, product.brand, buildImageUrl, getOptimizedImageUrl]);

  return (
    <div ref={itemRef} className={`product-list-item ${isSelected ? 'selected' : ''}`}>
      <div className="product-list-image">
        <img 
          src={imageUrl || '/placeholder.png'} 
          alt={product.name}
          loading="lazy"
          onError={() => {
            setImageError(true);
            setImageUrl('/placeholder.png');
          }}
        />
      </div>
      
      <div className="product-list-info">
        <div className="product-list-details">
          <h3 className="product-list-title">{product.name}</h3>
          <div className="product-list-meta">
            <span>{product.sku}</span>
            <span>•</span>
            <span className={product.stockLevel > 0 ? 'in-stock' : 'back-order'}>
              {product.stockLevel > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
        
        <div className="product-list-controls">
          <div className="product-list-price">£{product.retailPrice.toFixed(2)}</div>
          
          <div className="product-list-qty">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => onQuantityChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
            <button onClick={() => onQuantityChange(quantity + 1)}>
              +
            </button>
          </div>
          
          <div className="product-list-actions">
            <button
              className={`product-card__btn product-card__btn--add ${isSelected ? 'added' : ''}`}
              onClick={onAddToOrder}
            >
              {isSelected ? '✔' : '+'}
            </button>
            <button
              className="product-card__btn product-card__btn--details"
              onClick={onQuickView}
            >
              👁
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}