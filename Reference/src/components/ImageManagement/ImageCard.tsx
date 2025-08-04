import React, { useState, useEffect, useRef } from 'react';
import styles from './ImageCard.module.css';
import { ImageItem } from '../../hooks/useImageKit';

interface ImageCardProps {
  image: ImageItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
  brandColor: string;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  isSelected,
  onSelect,
  onDelete,
  viewMode,
  brandColor
}) => {
  const [imageError, setImageError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copying, setCopying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate ImageKit optimized URLs
  const getOptimizedImageUrl = (url: string, transformation: 'thumbnail' | 'medium' | 'large' | 'preview') => {
    if (!url || !url.includes('ik.imagekit.io')) {
      // If no URL or not an ImageKit URL, return original
      return url || '';
    }

    const transformations = {
      thumbnail: 'tr:w-200,h-200,c-maintain_ratio,q-80,f-auto',
      medium: 'tr:w-400,h-400,c-maintain_ratio,q-85,f-auto',
      large: 'tr:w-800,h-800,c-maintain_ratio,q-90,f-auto',
      preview: 'tr:w-100,h-100,c-maintain_ratio,q-60,f-auto,bl-10'
    };

    const baseUrl = url.split('/tr:')[0]; // Remove existing transformations
    return `${baseUrl}/${transformations[transformation]}`;
  };

  // Generate responsive URLs
  const responsiveUrls = {
    thumbnail: getOptimizedImageUrl(image.url, 'thumbnail'),
    medium: getOptimizedImageUrl(image.url, 'medium'),
    large: getOptimizedImageUrl(image.url, 'large'),
    preview: getOptimizedImageUrl(image.url, 'preview')
  };

  // Implement lazy loading with Intersection Observer
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
      { 
        rootMargin: '100px', // Start loading when 100px away
        threshold: 0.01 
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Progressive loading: preview -> full image
  useEffect(() => {
    if (!isVisible) return;

    let mounted = true;

    const loadImage = async () => {
      try {
        // Start with low-quality preview if it's an ImageKit URL
        if (image.url && image.url.includes('ik.imagekit.io')) {
          setCurrentImageSrc(responsiveUrls.preview);
        }
        
        // Preload the full-quality image
        const fullImage = new Image();
        const targetUrl = viewMode === 'list' ? responsiveUrls.thumbnail : responsiveUrls.medium;
        
        fullImage.onload = () => {
          if (mounted) {
            setCurrentImageSrc(targetUrl);
            setImageLoaded(true);
          }
        };
        
        fullImage.onerror = () => {
          if (mounted) {
            setImageError(true);
          }
        };
        
        fullImage.src = targetUrl;
        
      } catch (error) {
        if (mounted) {
          setImageError(true);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [isVisible, viewMode, responsiveUrls, image.url]);

  // Clean up image on unmount
  useEffect(() => {
    return () => {
      if (imgRef.current) {
        imgRef.current.src = '';
      }
    };
  }, []);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Copy URL to clipboard (use original high-quality URL)
  const handleCopyUrl = async () => {
    try {
      const urlToCopy = image.url && image.url.includes('ik.imagekit.io') 
        ? getOptimizedImageUrl(image.url, 'large') 
        : image.url || '';
      
      await navigator.clipboard.writeText(urlToCopy);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Handle download (use high-quality image)
  const handleDownload = () => {
    const downloadUrl = image.url && image.url.includes('ik.imagekit.io') 
      ? getOptimizedImageUrl(image.url, 'large')
      : image.url || '';
      
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = image.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewMode === 'list') {
    return (
      <div 
        ref={cardRef}
        className={`${styles.imageListItem} ${isSelected ? styles.selected : ''}`}
      >
        <div className={styles.listCheckbox}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
          />
        </div>
        
        <div className={styles.listThumbnail}>
          {isVisible && !imageError ? (
            <>
              <img
                ref={imgRef}
                src={currentImageSrc || image.url || ''}
                alt={image.name}
                loading="lazy"
                onError={() => setImageError(true)}
                style={{ 
                  opacity: imageLoaded ? 1 : 0.7,
                  filter: imageLoaded ? 'none' : 'blur(5px)',
                  transition: 'opacity 0.3s ease, filter 0.3s ease'
                }}
              />
              {!imageLoaded && (
                <div className={styles.loadingOverlay}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.imagePlaceholder}>
              <span>🖼️</span>
            </div>
          )}
        </div>

        <div className={styles.listInfo}>
          <div className={styles.listName}>{image.name}</div>
          <div className={styles.listMeta}>
            <span 
              className={styles.brandTag}
              style={{ '--brand-color': brandColor } as React.CSSProperties}
            >
              {image.brandName}
            </span>
            <span>{formatFileSize(image.size)}</span>
            <span>{formatDate(image.uploadedAt)}</span>
          </div>
        </div>

        <div className={styles.listActions}>
          <button 
            className={styles.actionBtn}
            onClick={handleCopyUrl}
            title="Copy URL"
          >
            {copying ? '✓' : '📋'}
          </button>
          <button 
            className={styles.actionBtn}
            onClick={handleDownload}
            title="Download"
          >
            ⬇
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={onDelete}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={cardRef}
      className={`${styles.imageCard} ${isSelected ? styles.selected : ''}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Selection checkbox */}
      <div 
        className={styles.selectionCheckbox}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
        />
      </div>

      {/* Brand tag */}
      <div 
        className={styles.brandTag}
        style={{ '--brand-color': brandColor } as React.CSSProperties}
      >
        {image.brandName}
      </div>

      {/* Image preview with progressive loading */}
      <div className={styles.imagePreview}>
        {isVisible && !imageError ? (
          <>
            <img
              ref={imgRef}
              src={currentImageSrc || image.url || ''}
              alt={image.name}
              onError={() => setImageError(true)}
              loading="lazy"
              style={{ 
                opacity: imageLoaded ? 1 : 0.7,
                filter: imageLoaded ? 'none' : 'blur(5px)',
                transition: 'opacity 0.3s ease, filter 0.3s ease'
              }}
            />
            {!imageLoaded && (
              <div className={styles.imageLoading}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>🖼️</span>
            <p>{imageError ? 'Unable to load image' : 'Loading...'}</p>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className={styles.cardContent}>
        <h3 className={styles.imageName} title={image.name}>
          {image.name}
        </h3>
        
        <div className={styles.imageMeta}>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>💾</span>
            {formatFileSize(image.size)}
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>📅</span>
            {new Date(image.uploadedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Quick actions */}
        <div className={styles.quickActions}>
          <button 
            className={styles.quickActionBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleCopyUrl();
            }}
            title="Copy URL"
          >
            {copying ? '✓' : '📋'}
          </button>
          <button 
            className={styles.quickActionBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            title="Download"
          >
            ⬇
          </button>
          <button 
            className={`${styles.quickActionBtn} ${styles.deleteBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className={styles.expandedDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Type:</span>
            <span className={styles.detailValue}>{image.contentType}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Uploaded:</span>
            <span className={styles.detailValue}>{formatDate(image.uploadedAt)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Path:</span>
            <span className={styles.detailValue}>{image.id}</span>
          </div>
          
          {/* Show different quality options if ImageKit URL */}
          {image.url && image.url.includes('ik.imagekit.io') && (
            <div className={styles.qualityOptions}>
              <span className={styles.detailLabel}>Available sizes:</span>
              <div className={styles.qualityLinks}>
                <a 
                  href={responsiveUrls.thumbnail} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Thumbnail
                </a>
                <a 
                  href={responsiveUrls.medium} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Medium
                </a>
                <a 
                  href={responsiveUrls.large} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Large
                </a>
              </div>
            </div>
          )}
          
          <div className={styles.urlRow}>
            <input
              type="text"
              value={image.url && image.url.includes('ik.imagekit.io') ? getOptimizedImageUrl(image.url, 'large') : image.url || ''}
              readOnly
              className={styles.urlInput}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className={styles.copyUrlBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyUrl();
              }}
            >
              {copying ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCard;