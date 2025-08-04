import React, { useState, useEffect, useCallback } from 'react';
import styles from './CustomerQuickViewModal.module.css';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockLevel: number;
  brand: string;
  description?: string;
  imageUrl?: string;
  [key: string]: any;
}

interface CustomerQuickViewModalProps {
  product: Product;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToOrder: () => void;
  onClose: () => void;
}

// Image cache to prevent re-fetching
const imageUrlCache = new Map<string, string | null>();

// ImageKit base URL - replace with your actual ImageKit URL
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/a7kelms9a';

export function CustomerQuickViewModal({
  product,
  quantity,
  onQuantityChange,
  onAddToOrder,
  onClose
}: CustomerQuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Generate ImageKit optimized URL
  const getOptimizedImageUrl = useCallback((baseUrl: string, transformation: 'large' | 'medium') => {
    const transformations = {
      large: 'tr:w-800,h-800,c-maintain_ratio,q-90,f-auto',
      medium: 'tr:w-400,h-400,c-maintain_ratio,q-85,f-auto'
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

  // Load image when modal opens
  useEffect(() => {
    const loadImage = async () => {
      const cacheKey = `${product.brand}-${product.sku}`;
      
      // Check cache first
      const cachedUrl = imageUrlCache.get(cacheKey);
      if (cachedUrl !== undefined) {
        setImageUrl(cachedUrl);
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
          const optimizedUrl = getOptimizedImageUrl(baseImageUrl, 'large');
          imageUrlCache.set(cacheKey, optimizedUrl);
          setImageUrl(optimizedUrl);
          setImageLoading(false);
          setImageError(false);
        };
        
        testImage.onerror = () => {
          imageUrlCache.set(cacheKey, null);
          setImageUrl(null);
          setImageLoading(false);
          setImageError(true);
        };
        
        testImage.src = baseImageUrl;
        
      } catch (error) {
        console.error('Error loading image:', error);
        imageUrlCache.set(cacheKey, null);
        setImageUrl(null);
        setImageLoading(false);
        setImageError(true);
      }
    };

    loadImage();
  }, [product.sku, product.brand, buildImageUrl, getOptimizedImageUrl]);

  const handleAddToCart = () => {
    onAddToOrder();
    onClose();
  };

  const handleQuantityChange = useCallback((newQty: number) => {
    onQuantityChange(Math.max(1, newQty));
  }, [onQuantityChange]);

  // For now, we'll work with a single image, but this structure supports multiple images in the future
  const images = imageUrl ? [imageUrl] : [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.content}>
          <div className={styles.imagesSection}>
            <div className={styles.mainImage}>
              {imageLoading ? (
                <div className={styles.imageLoader}>
                  <div className={styles.spinner}></div>
                  <p>Loading image...</p>
                </div>
              ) : imageError || !imageUrl ? (
                <div className={styles.imagePlaceholder}>
                  <span>🖼️</span>
                  <p>No Image Available</p>
                </div>
              ) : (
                <img 
                  src={imageUrl} 
                  alt={product.name}
                  onError={() => {
                    setImageError(true);
                    setImageUrl(null);
                  }}
                />
              )}
            </div>
            
            {/* Placeholder for future multiple image support */}
            {images.length > 1 && (
              <div className={styles.imageThumbnails}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`${styles.thumbnail} ${selectedImage === idx ? styles.active : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className={styles.infoSection}>
            <h2>{product.name}</h2>
            <p className={styles.sku}>SKU: {product.sku}</p>
            <div className={styles.price}>£{product.price.toFixed(2)}</div>
            
            {product.description && (
              <div className={styles.description}>
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}
            
            <div className={styles.quantitySection}>
              <label>Quantity:</label>
              <div className={styles.quantitySelector}>
                <button 
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input 
                  type="number" 
                  min={1}
                  value={quantity} 
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                />
                <button onClick={() => handleQuantityChange(quantity + 1)}>+</button>
              </div>
            </div>
            
            <div className={styles.actions}>
              <button 
                className={styles.addButton}
                onClick={handleAddToCart}
                disabled={product.stockLevel === 0}
              >
                {product.stockLevel === 0 ? 'Out of Stock' : 'Add to Order'}
              </button>
            </div>
            
            <div className={styles.stock}>
              {product.stockLevel > 0 ? (
                <span className={styles.inStock}>✓ In Stock ({product.stockLevel} available)</span>
              ) : (
                <span className={styles.outOfStock}>× Out of Stock</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}