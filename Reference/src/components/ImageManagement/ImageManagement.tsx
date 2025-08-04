import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ImageManagement.module.css';
import ImageCard from './ImageCard';
import Pagination from '../Pagination/Pagination'; // Assumes Pagination component exists
import ImageUploadModal from './ImageUploadModal';
import { useImageKit } from '../../hooks/useImageKit';
import LottieLoader from '../LottieLoader';
import CacheStatus from '../CacheStatus';

// Constants
const IMAGES_PER_PAGE = 50; // Set how many images to show per page

const ImageManagement: React.FC = () => {
  // --- Hooks and Routing ---
  const { brandId } = useParams<{ brandId?: string }>();
  const navigate = useNavigate();
  const {
    images,
    loading,
    error,
    brands,
    getBrandName,
    getBrandColor,
    uploadImage,
    uploadMultiple,
    deleteImage,
    deleteBulk,
    refreshImages,
    fetchImages,
    hasMore,
    clearCache,
  } = useImageKit({ brandId }); // Simplified hook usage

  // --- UI and Data State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date'); // Default to date sorting to see newest first
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- Effects ---

  // Reset page to 1 when filters or data source changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedImages([]); // Also clear selection on data change
  }, [brandId, searchQuery, sortBy]);

  // Force refresh when brandId changes
  useEffect(() => {
    if (brandId !== undefined) {
      console.log(`Brand changed to: ${brandId || 'all brands'}`);
      // Clear current images to show loading state
      setSelectedImages([]);
      setCurrentPage(1);
    }
  }, [brandId]);

  // --- State for total images count ---
  const [totalImages, setTotalImages] = useState(0);
  const [allImages, setAllImages] = useState<any[]>([]);

  // --- Memoized Data Processing ---

  // Filter and sort images based on UI controls
  const processedImages = useMemo(() => {
    let filtered = [...images];

    // Filter by search query (client-side)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img =>
        img.name.toLowerCase().includes(query) ||
        (img.brandName && img.brandName.toLowerCase().includes(query))
      );
    }

    // Sort images - ensure date sorting is newest first
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          // Newest first (b - a)
          const dateA = new Date(a.uploadedAt || 0).getTime();
          const dateB = new Date(b.uploadedAt || 0).getTime();
          return dateB - dateA;
        case 'size':
          return b.size - a.size;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [images, searchQuery, sortBy]);

  // For server-side pagination, we just show what we fetched
  const currentImages = processedImages;
  
  // --- Handlers ---

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setCurrentPage(1); // Reset to first page
      // Force clear cache and reload
      await clearCache();
      console.log('Force refreshing all images...');
      await refreshImages();
    } catch (err) {
      console.error('Error refreshing images:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshImages, clearCache]);

  const handleUploadSuccess = useCallback(async () => {
    setShowUploadModal(false);
    // Clear cache before refreshing to ensure we see new images
    await clearCache();
    await handleRefresh();
  }, [handleRefresh, clearCache]);
  
  const handleBrandClick = useCallback((brandIdToSelect: string) => {
    navigate(brandIdToSelect === 'all' ? '/images' : `/images/${brandIdToSelect}`);
  }, [navigate]);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await deleteImage(imageId);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }, [deleteImage]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedImages.length === 0) return;
    const confirmMessage = `Are you sure you want to delete ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}?`;
    if (!window.confirm(confirmMessage)) return;
    try {
      await deleteBulk(selectedImages);
    } catch (err) {
      console.error('Error deleting images:', err);
    }
  }, [selectedImages, deleteBulk]);

  const handleSelectImage = useCallback((imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const currentImageIds = currentImages.map(img => img.id);
    const allSelected = currentImageIds.every(id => selectedImages.includes(id));
    if (allSelected) {
      setSelectedImages(prev => prev.filter(id => !currentImageIds.includes(id)));
    } else {
      setSelectedImages(prev => [...new Set([...prev, ...currentImageIds])]);
    }
  }, [currentImages, selectedImages]);
  
  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Fetch new page of images from server
    const skip = (pageNumber - 1) * IMAGES_PER_PAGE;
    fetchImages({ 
      skip, 
      limit: IMAGES_PER_PAGE,
      folder: brandId ? `brand-images/${brandId}` : 'brand-images'
    });
  }, [brandId, fetchImages]);

  // --- Derived State for UI ---

  const stats = useMemo(() => {
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const brandCounts = brands.map(brand => ({
      ...brand,
      count: images.filter(img => img.brand === brand.id).length
    }));
    const activeBrands = brandCounts.filter(b => b.count > 0).length;
    return { totalSize, brandCounts, activeBrands };
  }, [images, brands]);

  const allDisplayedSelected = currentImages.length > 0 && currentImages.every(img => selectedImages.includes(img.id));

  // --- Render ---

  return (
    <div className={styles.imageManagementContainer}>
      {/* Header */}
      <div className={styles.imageHeader}>
        <div className={styles.headerLeft}>
          <h1>Image Management{brandId ? ` - ${getBrandName(brandId)}` : ''}</h1>
          <p className={styles.headerSubtitle}>
            {brandId ? `Manage product images for ${getBrandName(brandId)}` : 'Manage product images across all brands'}
          </p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.uploadButton} onClick={() => setShowUploadModal(true)}>
            <span>📤</span> Upload Images
          </button>
          <button
            className={`${styles.refreshButton} ${refreshing ? styles.refreshing : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span className={styles.refreshIcon}>🔄</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
         <div className={styles.statCard}>
           <div className={styles.statIcon}>🖼️</div>
           <div className={styles.statContent}>
             <h3>Total Images</h3>
             <p className={styles.statValue}>{images.length}</p>
           </div>
         </div>
         <div className={styles.statCard}>
           <div className={styles.statIcon}>💾</div>
           <div className={styles.statContent}>
             <h3>Total Size</h3>
             <p className={styles.statValue}>
               {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
             </p>
           </div>
         </div>
         <div className={styles.statCard}>
           <div className={styles.statIcon}>🏷️</div>
           <div className={styles.statContent}>
             <h3>Active Brands</h3>
             <p className={styles.statValue}>
               {stats.activeBrands} / {brands.length}
             </p>
           </div>
         </div>
         <div className={styles.statCard}>
           <div className={styles.statIcon}>👁️</div>
           <div className={styles.statContent}>
             <h3>Showing</h3>
             <p className={styles.statValue}>
               {currentImages.length} / {processedImages.length}
             </p>
           </div>
         </div>
       </div>

      {/* Brand Filter Pills */}
      {!brandId && (
        <div className={styles.brandFilters}>
          <button
            className={`${styles.brandPill} ${!brandId ? styles.active : ''}`}
            onClick={() => handleBrandClick('all')}
          >
            All Brands ({images.length})
          </button>
          {stats.brandCounts.map(brand => (
            <button
              key={brand.id}
              className={`${styles.brandPill} ${brandId === brand.id ? styles.active : ''}`}
              onClick={() => handleBrandClick(brand.id)}
              style={{ '--brand-color': brand.color } as React.CSSProperties}
            >
              {brand.name} ({brand.count})
            </button>
          ))}
        </div>
      )}

      {/* Controls Section */}
      <div className={styles.controlsSection}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search images by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className={styles.controlsRight}>
          {selectedImages.length > 0 && (
            <div className={styles.selectionInfo}>
              <span>{selectedImages.length} selected</span>
              <button className={styles.bulkDeleteBtn} onClick={handleBulkDelete}>
                Delete Selected
              </button>
            </div>
          )}

          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date (Newest First)</option>
            <option value="size">Sort by Size</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <span>⊞</span>
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <span>☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select All Checkbox */}
      {currentImages.length > 0 && (
        <div className={styles.selectAllContainer}>
          <input
            type="checkbox"
            id="selectAll"
            checked={allDisplayedSelected}
            onChange={handleSelectAll}
          />
          <label htmlFor="selectAll">
            Select All on Page ({currentImages.length})
          </label>
        </div>
      )}

      {/* Content Area */}
      <div className={styles.contentArea}>
        {loading ? (
          <div className={styles.loadingState}>
            <LottieLoader />
            <p>Loading images...</p>
          </div>
        ) : processedImages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🖼️</div>
            <h3>No images found</h3>
            <p>
              {searchQuery
                ? `No images match "${searchQuery}"`
                : brandId
                  ? `No images for ${getBrandName(brandId)}`
                  : 'Upload your first image to get started'
              }
            </p>
            {searchQuery && (
              <button className={styles.clearFiltersBtn} onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`${styles.imagesGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
              {currentImages.map(image => (
                <ImageCard
                  key={image.id}
                  image={image}
                  isSelected={selectedImages.includes(image.id)}
                  onSelect={() => handleSelectImage(image.id)}
                  onDelete={() => handleDeleteImage(image.id)}
                  viewMode={viewMode}
                  brandColor={getBrandColor(image.brand)}
                />
              ))}
            </div>

            {/* Pagination Component */}
            {/* Show pagination if we have more than one page worth of images or hasMore is true */}
            {(images.length === IMAGES_PER_PAGE || hasMore || currentPage > 1) && (
              <Pagination
                currentPage={currentPage}
                totalImages={hasMore ? (currentPage + 1) * IMAGES_PER_PAGE : currentPage * images.length}
                imagesPerPage={IMAGES_PER_PAGE}
                paginate={paginate}
              />
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <ImageUploadModal
          brands={brandId ? brands.filter(b => b.id === brandId) : brands}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
          uploadImage={uploadImage}
          uploadMultiple={uploadMultiple}
          defaultBrand={brandId}
        />
      )}

      {/* Cache Status */}
      <CacheStatus onCacheCleared={handleRefresh} />
    </div>
  );
};

export default ImageManagement;