import React, { useState, useEffect, useCallback, memo } from 'react';
import { FaCheck, FaPlus, FaEye } from 'react-icons/fa';
import styles from './CustomerProductCard.module.css';

interface Product {
  id: string;
  name: string;
  sku: string;
  stockLevel: number;
  price: number;
  brand: string;
  imageUrl?: string;
  created_time?: string;
  [key: string]: any;
}

interface CustomerProductCardProps {
  product: Product;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToOrder: () => void;
  isSelected: boolean;
  showNewBadge?: boolean;
  onQuickView: () => void;
}

// Image cache to prevent re-fetching
const imageUrlCache = new Map<string, string | null>();

// ImageKit base URL - replace with your actual ImageKit URL
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/a7kelms9a';

export const CustomerProductCard = memo(({
  product,
  quantity,
  onQuantityChange,
  onAddToOrder,
  isSelected,
  showNewBadge = false,
  onQuickView,
}: CustomerProductCardProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showAddedNotification, setShowAddedNotification] = useState(false);
  
  const inStock = product.stockLevel > 0;

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
      'my-flame': 'myflame',
      'relaxound': 'relaxound',
      'remember': 'remember'
    };
    
    const brandKey = brand.toLowerCase();
    const folderName = brandFolderMap[brandKey] || brand.toLowerCase().replace(/\s+/g, '-');
    
    return `${IMAGEKIT_BASE_URL}/brand-images/${folderName}/${sku}_1.webp`;
  }, []);

  useEffect(() => {
    const loadImage = async () => {
      const cacheKey = `${product.brand}-${product.sku}`;
      
      // Check cache first
      const cachedUrl = imageUrlCache.get(cacheKey);
      if (cachedUrl !== undefined) {
        setImageUrl(cachedUrl || '');
        setImageLoading(false);
        setImageError(cachedUrl === null);
        return;
      }

      setImageLoading(true);
      setImageError(false);

      try {
        // Build the ImageKit URL
        const baseImageUrl = buildImageUrl(product.sku, product.brand);
        
        // Test if image exists by trying to load it
        const testImage = new Image();
        
        testImage.onload = () => {
          const optimizedUrl = getOptimizedImageUrl(baseImageUrl, 'medium');
          imageUrlCache.set(cacheKey, optimizedUrl);
          setImageUrl(optimizedUrl);
          setImageLoading(false);
          setImageError(false);
        };
        
        testImage.onerror = () => {
          imageUrlCache.set(cacheKey, null);
          setImageUrl('');
          setImageLoading(false);
          setImageError(true);
        };
        
        testImage.src = baseImageUrl;
        
      } catch (error) {
        console.error('Error loading image:', error);
        imageUrlCache.set(cacheKey, null);
        setImageUrl('');
        setImageLoading(false);
        setImageError(true);
      }
    };

    loadImage();
  }, [product.sku, product.brand, buildImageUrl]);

  const handleAddToOrder = useCallback(() => {
    onAddToOrder();
    if (!isSelected) {
      setShowAddedNotification(true);
      setTimeout(() => setShowAddedNotification(false), 3000);
    }
  }, [onAddToOrder, isSelected]);

  const handleQuantityChange = useCallback((newQty: number) => {
    onQuantityChange(Math.max(1, newQty));
  }, [onQuantityChange]);

  return (
    <>
      <div className={`${styles.productCard} ${isSelected ? styles.selected : ''}`}>
        {showNewBadge && (
          <div className={styles.newBadge}>
            New
          </div>
        )}

        <div className={styles.imageContainer}>
          <div className={styles.imageWrapper}>
            {imageLoading ? (
              <div className={styles.imageSkeleton}>
                <div className={styles.spinner}></div>
              </div>
            ) : imageError || !imageUrl ? (
              <div className={styles.imagePlaceholder}>
                <span>No Image</span>
              </div>
            ) : (
              <img 
                src={imageUrl}
                alt={product.name}
                className={styles.productImage}
                loading="lazy"
                onError={() => {
                  setImageError(true);
                  setImageUrl('');
                }}
              />
            )}
          </div>
        </div>

        <div className={styles.productBody}>
          <h3 className={styles.productTitle} title={product.name}>
            {product.name}
          </h3>

          <div className={styles.productMeta}>
            <span className={styles.skuValue}>{product.sku}</span>
          </div>

          <div className={styles.priceDisplay}>
            <span className={styles.currencySymbol}>£</span>
            <span>{product.price.toFixed(2)}</span>
          </div>

          <div className={styles.productStatus}>
            <span className={`${styles.statusIndicator} ${inStock ? styles.inStock : styles.backOrder}`}>
              ●
            </span>
            {inStock ? `${product.stockLevel} in stock` : 'Out of Stock'}
          </div>
          
          <div className={styles.productQty}>
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              type="button"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
            />
            <button 
              onClick={() => handleQuantityChange(quantity + 1)}
              type="button"
            >
              +
            </button>
          </div>

          <div className={styles.productActions}>
            <button
              className={`${styles.productBtn} ${styles.productBtnAdd} ${
                isSelected ? styles.added : ''
              }`}
              onClick={handleAddToOrder}
              type="button"
            >
              {isSelected ? <FaCheck /> : <FaPlus />}
              <span>{isSelected ? 'Added' : 'Add'}</span>
            </button>

            <button
              className={`${styles.productBtn} ${styles.productBtnDetails}`}
              onClick={onQuickView}
              type="button"
            >
              <FaEye />
            </button>
          </div>
        </div>
      </div>

      {showAddedNotification && (
        <div className={styles.notificationToast}>
          <FaCheck />
          <span>Item added to order</span>
        </div>
      )}
    </>
  );
});

CustomerProductCard.displayName = 'CustomerProductCard';