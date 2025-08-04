import React, { useState, useEffect, useCallback, memo } from 'react';
import './allproducts.css';
import { FaCheck, FaPlus } from 'react-icons/fa';

interface Product {
  id: string;
  name: string;
  sku: string;
  stockLevel: number;
  retailPrice: number;
  price: number;
  brand: string;
  brand_normalized: string;
  imageUrl?: string;
  creation_date?: string;
  created_at?: string;
  date_created?: string;
  modified_date?: string;
  updated_at?: string;
  last_modified?: string;
  [key: string]: any;
}

interface CardProps {
  product: Product;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToOrder: () => void;
  isSelected: boolean;
  imageRoot: HTMLElement | null;
  children: React.ReactNode;
  style?: React.CSSProperties;
  showNewBadge?: boolean;
}

export type { Product };

// Image cache to prevent re-fetching
const imageUrlCache = new Map<string, string | null>();

// Clear cache for debugging (can be called from browser console)
(window as any).clearImageCache = () => {
  imageUrlCache.clear();
  console.log('🧽 Image cache cleared!');
};

// ImageKit base URL - replace with your actual ImageKit URL
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/a7kelms9a';

const ProductCard = memo(({
  product,
  quantity,
  onQuantityChange,
  onAddToOrder,
  isSelected,
  imageRoot,
  children,
  style,
  showNewBadge = false,
}: CardProps) => {
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
    
    // Extract the base URL and file path
    const urlParts = baseUrl.split('/brand-images/');
    if (urlParts.length !== 2) return baseUrl; // Return as-is if URL format is unexpected
    
    const basePath = urlParts[0];
    const filePath = urlParts[1];
    
    // Insert transformation before the file path
    return `${basePath}/${transformations[transformation]}/brand-images/${filePath}`;
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
    // Note: Based on testing, images appear to be stored with UPPERCASE SKUs
    const lowercaseSku = sku.toLowerCase();
    
    // Note: Using _1_400x400.webp format as that seems to be the standard
    // If images are stored differently, update this pattern
    return `${IMAGEKIT_BASE_URL}/brand-images/${folderName}/${lowercaseSku}_1_400x400.webp`;
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

      console.log(`🔍 Loading image for SKU: ${product.sku}, Brand: ${product.brand}`);
      console.log(`  Original SKU: '${product.sku}', Uppercase: '${product.sku.toUpperCase()}'`);

      try {
        // Build the ImageKit URL
        const baseImageUrl = buildImageUrl(product.sku, product.brand);
        console.log(`  Trying: ${baseImageUrl}`);
        
        // Test if image exists by trying to load it
        const testImage = new Image();
        
        testImage.onload = () => {
          const optimizedUrl = getOptimizedImageUrl(baseImageUrl, 'medium');
          console.log(`  ✅ Found: ${baseImageUrl}`);
          console.log(`  ✅ Optimized URL: ${optimizedUrl}`);
          imageUrlCache.set(cacheKey, optimizedUrl);
          setImageUrl(optimizedUrl);
          setImageLoading(false);
          setImageError(false);
        };
        
        testImage.onerror = async () => {
          console.log(`  ❌ No image found for ${product.sku} (tried: ${baseImageUrl})`);
          
          // Try alternative URL formats
          const alternativeUrls = [
            // Try without transformation
            buildImageUrl(product.sku, product.brand).replace('_400x400.webp', '.webp'),
            // Try without the _1 suffix
            buildImageUrl(product.sku, product.brand).replace('_1_400x400.webp', '.webp'),
            // Try with different file extensions
            buildImageUrl(product.sku, product.brand).replace('.webp', '.jpg'),
            buildImageUrl(product.sku, product.brand).replace('.webp', '.png')
          ];
          
          console.log('  🔄 Trying alternative URLs:', alternativeUrls);
          
          let foundAlternative = false;
          
          for (const altUrl of alternativeUrls) {
            const altImage = new Image();
            const success = await new Promise<boolean>(resolve => {
              altImage.onload = () => resolve(true);
              altImage.onerror = () => resolve(false);
              altImage.src = altUrl;
            });
            
            if (success) {
              console.log(`  ✅ Found alternative: ${altUrl}`);
              const optimizedUrl = getOptimizedImageUrl(altUrl, 'medium');
              imageUrlCache.set(cacheKey, optimizedUrl);
              setImageUrl(optimizedUrl);
              setImageLoading(false);
              setImageError(false);
              foundAlternative = true;
              break;
            }
          }
          
          if (!foundAlternative) {
            imageUrlCache.set(cacheKey, null);
            setImageUrl('');
            setImageLoading(false);
            setImageError(true);
          }
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
      <div className={`product-card ${isSelected ? 'selected' : ''}`} style={style}>
        {/* New Badge */}
        {showNewBadge && (
          <div className="product-card__new-badge">
            New
          </div>
        )}

        <div className="product-card__image-container-square">
          <div className="product-card__image-wrapper-square">
            
            {imageLoading ? (
              <div className="image-skeleton">
                <div className="dmb-spinner"></div>
              </div>
            ) : imageError || !imageUrl ? (
              <div className="dmb-image-placeholder">
                <span>No Image</span>
              </div>
            ) : (
              <img 
                src={imageUrl}
                alt={product.name}
                className="product-card__image-img"
                loading="lazy"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={() => {
                  setImageError(true);
                  setImageUrl('');
                }}
              />
            )}
            
          </div>
        </div>

        <div className="product-card__body">
          <h3 className="product-card__title" title={product.name}>
            {product.name}
          </h3>

          <div className="product-card__meta">
            <span className="sku-value">{product.sku}</span>
          </div>

          <div className="product-card__price-display">
            <span className="currency-symbol">£</span>
            <span className="price-amount">{product.retailPrice.toFixed(2)}</span>
          </div>

          <div className="product-card__status">
            <span className={`status-indicator ${inStock ? 'in-stock' : 'back-order'}`}>
              ●
            </span>
            {inStock ? `${product.stockLevel} in stock` : 'Out of Stock'}
          </div>
          
          <div className="product-card__qty">
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

          <div className="product-card__actions">
            <button
              className={`product-card__btn product-card__btn--add ${
                isSelected ? 'added' : ''
              }`}
              onClick={handleAddToOrder}
              type="button"
            >
              {isSelected ? <FaCheck /> : <FaPlus />}
              <span>{isSelected ? 'Added' : 'Add'}</span>
            </button>

            {children && React.isValidElement(children) && 
              React.cloneElement(children, {
                className: 'product-card__btn product-card__btn--details',
              } as any)
            }
          </div>
        </div>
      </div>

      {showAddedNotification && (
        <div className="notification-toast notification-success">
          <FaCheck />
          <span>Item added to order</span>
        </div>
      )}
    </>
  );
});

ProductCard.displayName = 'ProductCard';

export { ProductCard };