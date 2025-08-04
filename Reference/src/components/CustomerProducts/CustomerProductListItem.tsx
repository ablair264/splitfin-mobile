import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaCheck, FaPlus, FaEye } from 'react-icons/fa';
import styles from './CustomerProductListItem.module.css';

interface Product {
  id: string;
  name: string;
  sku: string;
  stockLevel: number;
  price: number;
  brand: string;
  [key: string]: any;
}

interface CustomerProductListItemProps {
  product: Product;
  quantity: number;
  isSelected: boolean;
  onQuantityChange: (qty: number) => void;
  onAddToOrder: () => void;
  onQuickView: () => void;
}

// Image cache to prevent re-fetching
const imageUrlCache = new Map<string, string | null>();

// ImageKit base URL - replace with your actual ImageKit URL
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/a7kelms9a';

export function CustomerProductListItem({
  product,
  quantity,
  isSelected,
  onQuantityChange,
  onAddToOrder,
  onQuickView
}: CustomerProductListItemProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Generate ImageKit optimized URL
  const getOptimizedImageUrl = useCallback((baseUrl: string, transformation: 'thumbnail' | 'preview') => {
    const transformations = {
      thumbnail: 'tr:w-200,h-200,c-maintain_ratio,q-80,f-auto',
      preview: 'tr:w-100,h-100,c-maintain_ratio,q-60,f-auto,bl-10'
    };
    
    return `${baseUrl}/${transformations[transformation]}`;
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
      'my-flame': 'myflame',
      'relaxound': 'relaxound',
      'remember': 'remember'
    };
    
    const brandKey = brand.toLowerCase();
    const folderName = brandFolderMap[brandKey] || brand.toLowerCase().replace(/\s+/g, '-');
    
    return `${IMAGEKIT_BASE_URL}/brand-images/${folderName}/${sku}_1.webp`;
  }, []);

  // Check cache on mount
  useEffect(() => {
    const cacheKey = `${product.brand}-${product.sku}`;
    const cachedUrl = imageUrlCache.get(cacheKey);
    
    if (cachedUrl !== undefined) {
      setImageUrl(cachedUrl);
      setImageLoaded(cachedUrl !== null);
      setImageError(cachedUrl === null);
    }
  }, [product.sku, product.brand]);

  // Intersection Observer for lazy loading
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
    if (isVisible && imageUrl === null && !imageError) {
      const cacheKey = `${product.brand}-${product.sku}`;
      
      // Double-check cache
      const cachedUrl = imageUrlCache.get(cacheKey);
      if (cachedUrl !== undefined) {
        setImageUrl(cachedUrl);
        setImageLoaded(cachedUrl !== null);
        setImageError(cachedUrl === null);
        return;
      }

      const fetchImage = async () => {
        try {
          // Build the ImageKit URL
          const baseImageUrl = buildImageUrl(product.sku, product.brand);
          
          // Test if image exists
          const testImage = new Image();
          
          testImage.onload = () => {
            const optimizedUrl = getOptimizedImageUrl(baseImageUrl, 'thumbnail');
            imageUrlCache.set(cacheKey, optimizedUrl);
            setImageUrl(optimizedUrl);
            setImageLoaded(true);
            setImageError(false);
          };
          
          testImage.onerror = () => {
            imageUrlCache.set(cacheKey, null);
            setImageUrl(null);
            setImageLoaded(false);
            setImageError(true);
          };
          
          testImage.src = baseImageUrl;
          
        } catch (error) {
          console.error('Error loading image:', error);
          imageUrlCache.set(cacheKey, null);
          setImageUrl(null);
          setImageLoaded(false);
          setImageError(true);
        }
      };

      fetchImage();
    }
  }, [isVisible, imageUrl, imageError, product.sku, product.brand, buildImageUrl, getOptimizedImageUrl]);

  const handleQuantityChange = useCallback((newQty: number) => {
    onQuantityChange(Math.max(1, newQty));
  }, [onQuantityChange]);

  // Placeholder image path - update this to match your actual placeholder
  const placeholderImage = '/placeholder.png';

  return (
    <div ref={itemRef} className={`${styles.productListItem} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.productListImage}>
        {!isVisible ? (
          <div className={styles.imagePlaceholder}>
            <div className={styles.imageLoader}></div>
          </div>
        ) : (
          <img 
            src={imageError || !imageUrl ? placeholderImage : imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => {
              setImageError(true);
              setImageUrl(null);
            }}
            onLoad={() => setImageLoaded(true)}
            style={{
              opacity: imageLoaded ? 1 : 0.7,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}
      </div>
      
      <div className={styles.productListInfo}>
        <div className={styles.productListDetails}>
          <h3 className={styles.productListTitle}>{product.name}</h3>
          <div className={styles.productListMeta}>
            <span>{product.sku}</span>
            <span>•</span>
            <span className={product.stockLevel > 0 ? styles.inStock : styles.backOrder}>
              {product.stockLevel > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
        
        <div className={styles.productListControls}>
          <div className={styles.productListPrice}>£{product.price.toFixed(2)}</div>
          
          <div className={styles.productListQty}>
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
            />
            <button onClick={() => handleQuantityChange(quantity + 1)}>
              +
            </button>
          </div>
          
          <div className={styles.productListActions}>
            <button
              className={`${styles.productBtn} ${styles.productBtnAdd} ${isSelected ? styles.added : ''}`}
              onClick={onAddToOrder}
            >
              {isSelected ? <FaCheck /> : <FaPlus />}
            </button>
            <button
              className={`${styles.productBtn} ${styles.productBtnDetails}`}
              onClick={onQuickView}
            >
              <FaEye />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}