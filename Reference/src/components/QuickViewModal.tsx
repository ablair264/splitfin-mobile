import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import './quick-view.css';
import { Product } from './ProductCard';

interface QuickViewModalProps {
  product: Product;
  quantity: number;
  onQuantityChange: (n: number) => void;
  onAddToOrder: (product: Product, qty: number) => void;
  onClose: () => void;
}

interface ProductImage {
  url: string;
  index: number;
  isMain: boolean;
}

// Image cache to prevent re-fetching - shared across components
const imageUrlCache = new Map<string, string | null>();

// ImageKit base URL - replace with your actual ImageKit URL
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/a7kelms9a';

export default function QuickViewModal({
  product,
  quantity,
  onQuantityChange,
  onAddToOrder,
  onClose,
}: QuickViewModalProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
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
  const buildImageUrl = useCallback((sku: string, brand: string, imageNumber: number = 1) => {
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
    
    return `${IMAGEKIT_BASE_URL}/brand-images/${folderName}/${lowercaseSku}_${imageNumber}.webp`;
  }, []);

  // Load all images for this product
  const loadProductImages = useCallback(async () => {
    setLoading(true);
    const foundImages: ProductImage[] = [];

    const sku = product.sku;
    const brand = product.brand;
    
    console.log(`🖼️ Loading images for SKU: ${sku}, Brand: ${brand}`);
    console.log(`  Original SKU: '${sku}', Uppercase: '${sku.toUpperCase()}'`);

    // Try loading up to 5 images with the format {sku}_{number}.webp
    for (let i = 1; i <= 5; i++) {
      const cacheKey = `${brand}-${sku}-${i}`;
      
      // Check cache first
      const cachedUrl = imageUrlCache.get(cacheKey);
      if (cachedUrl !== undefined) {
        if (cachedUrl) {
          foundImages.push({ url: cachedUrl, index: foundImages.length, isMain: foundImages.length === 0 });
        }
        continue;
      }

      try {
        const baseImageUrl = buildImageUrl(sku, brand, i);
        console.log(`  Trying: ${baseImageUrl}`);
        
        // Test if image exists by trying to load it
        const testImage = new Image();
        
        await new Promise<void>((resolve, reject) => {
          testImage.onload = () => {
            const optimizedUrl = getOptimizedImageUrl(baseImageUrl, 'medium');
            imageUrlCache.set(cacheKey, optimizedUrl);
            foundImages.push({ url: optimizedUrl, index: foundImages.length, isMain: foundImages.length === 0 });
            console.log(`  ✅ Found: ${baseImageUrl}`);
            resolve();
          };
          
          testImage.onerror = () => {
            imageUrlCache.set(cacheKey, null);
            // If we've found at least one image and this one fails, we can stop
            if (foundImages.length > 0) {
              reject(new Error('No more images'));
            } else {
              resolve(); // Continue trying if no images found yet
            }
          };
          
          testImage.src = baseImageUrl;
        });
        
      } catch (error) {
        // If we've found at least one image and this one fails, we can stop
        if (foundImages.length > 0) {
          break;
        }
        continue;
      }
    }

    // If no images found, add fallback
    if (foundImages.length === 0) {
      foundImages.push({
        url: '/placeholder.png',
        index: 0,
        isMain: true
      });
    }

    console.log(`🖼️ Total images found: ${foundImages.length}`);
    setImages(foundImages);
    setLoading(false);
  }, [product.sku, product.brand, buildImageUrl, getOptimizedImageUrl]);

  // Load images when modal opens
  useEffect(() => {
    loadProductImages();
  }, [loadProductImages]);

  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  };

  const goToNext = () => {
    setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="quickview-overlay" onClick={onClose}>
      <div
        className="quickview-modal"
        onClick={e => e.stopPropagation()}
      >
        <button className="quickview-close" onClick={onClose}>
          &times;
        </button>
        
        <div className="quickview-content">
          <div className="quickview-image-container">
            {loading ? (
              <div className="quickview-image-loading">
                <div className="loading-spinner"></div>
                <p>Loading images...</p>
              </div>
            ) : (
              <div className="quickview-image-carousel">
                <div 
                  className="carousel-images"
                  ref={carouselRef}
                  style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="carousel-image"
                      loading="lazy"
                      onError={(e) => {
                        // If an image fails to load, try to replace with placeholder
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/placeholder.png') {
                          target.src = '/placeholder.png';
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Navigation arrows - only show if multiple images */}
                {images.length > 1 && (
                  <>
                    <button
                      className="carousel-nav carousel-prev"
                      onClick={goToPrevious}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      className="carousel-nav carousel-next"
                      onClick={goToNext}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="image-counter">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}

                {/* Dots indicator - only show if multiple images */}
                {images.length > 1 && (
                  <div className="carousel-dots">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => goToImage(index)}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="quickview-info">
            <h2>{product.name}</h2>
            <p className="quickview-sku">SKU: {product.sku}</p>
            <p className="quickview-price">£{product.price.toFixed(2)}</p>
            <p className="quickview-description">
              {product.pro_desc || 'No description available.'}
            </p>
            <p
              className={`quickview-status ${
                inStock ? 'in-stock' : 'back-order'
              }`}
            >
              {inStock ? '● In Stock' : '● Back Order'}
            </p>

            <div className="quickview-qty">
              <button
                onClick={() =>
                  onQuantityChange(Math.max(1, quantity - 1))
                }
                disabled={quantity <= 1}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={e =>
                  onQuantityChange(
                    Math.max(1, parseInt(e.target.value, 10) || 1)
                  )
                }
              />
              <button
                onClick={() => onQuantityChange(quantity + 1)}
              >
                ＋
              </button>
            </div>

            <button
              className="quickview-add"
              onClick={() => onAddToOrder(product, quantity)}
              disabled={!inStock}
            >
              ＋ Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
}