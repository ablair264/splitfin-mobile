// src/hooks/useImageKit.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageItem, Brand } from '../components/ImageManagement/types';
import { enhancedDashboardCache } from '../utils/enhancedDashboardCache';

// Re-export types for convenience (so other components can import everything from the hook)
export type { ImageItem, Brand, UploadProgress } from '../components/ImageManagement/types';

// API configuration for Vite
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// WebP conversion quality (0.85 = 85% quality, good balance of quality and file size)
// Lower values = smaller files but lower quality (0.7-0.8 for thumbnails)
// Higher values = larger files but better quality (0.9-0.95 for high-quality images)
const WEBP_QUALITY = 0.85;

// Brand configuration - IDs must match ImageKit folder names exactly
const BRANDS: Brand[] = [
  { id: 'blomus', name: 'Blomus', color: '#79d5e9' }, // Fixed back to 'blomus'
  { id: 'elvang', name: 'Elvang', color: '#4daeac' },
  { id: 'gefu', name: 'GEFU', color: '#61bc8e' },
  { id: 'my-flame', name: 'MyFlame', color: '#fbbf24' }, // Changed from 'myflame' to match ImageKit
  { id: 'ppd', name: 'PPD', color: '#f77d11' },
  { id: 'rader', name: 'Räder', color: '#db2777' },
  { id: 'remember', name: 'Remember', color: '#8b5cf6' }, // Make sure this matches the folder name exactly
  { id: 'relaxound', name: 'Relaxound', color: '#3b82f6' }
];

interface UseImageKitOptions {
  autoLoad?: boolean;
  itemsPerPage?: number;
  cacheTTL?: number; // Cache time-to-live in milliseconds
  userId?: string; // User ID for cache isolation
  brandId?: string; // Specific brand to fetch images for
}

interface UseImageKitReturn {
  // State
  images: ImageItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadedBrands: Set<string>;
  
  // Actions
  fetchImages: (options?: FetchOptions) => Promise<void>;
  fetchImagesByBrand: (brandId: string) => Promise<void>;
  uploadImage: (file: File, brand: string) => Promise<any>;
  uploadMultiple: (files: File[], brand: string) => Promise<any>;
  deleteImage: (fileId: string) => Promise<void>;
  deleteBulk: (fileIds: string[]) => Promise<void>;
  refreshImages: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Utility
  getBrandColor: (brandId: string) => string;
  getBrandName: (brandId: string) => string;
  brands: Brand[];
}

interface FetchOptions {
  skip?: number;
  limit?: number;
  searchQuery?: string;
  tags?: string;
  folder?: string;
  append?: boolean;
}

export const useImageKit = (options: UseImageKitOptions = {}): UseImageKitReturn => {
  const { 
    autoLoad = true, 
    itemsPerPage = 50,
    cacheTTL = 10 * 60 * 1000, // 10 minutes default
    userId = 'default', // Default user ID for cache
    brandId // Specific brand to fetch images for
  } = options;
  
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadedBrands, setLoadedBrands] = useState<Set<string>>(new Set()); // Track which brands we've loaded
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Convert ImageKit response to ImageItem format
  const convertImageKitToImageItem = useCallback((imagekitImage: any): ImageItem => {
    // Validate required fields
    if (!imagekitImage || !imagekitImage.fileId) {
      console.error('Invalid ImageKit image object:', imagekitImage);
      throw new Error('Invalid image data from ImageKit');
    }
    
    // Extract brand from folder path
    // ImageKit API returns 'filePath' like: /brand-images/blomus/62168_1_400x400.webp
    const filePath = imagekitImage.filePath || '';
    const folderParts = filePath.split('/').filter((part: string) => part);
    
    // Find brand - it should be the folder after 'brand-images'
    let brandFromFolder = '';
    const brandIndex = folderParts.findIndex(part => part === 'brand-images');
    if (brandIndex >= 0 && folderParts[brandIndex + 1]) {
      brandFromFolder = folderParts[brandIndex + 1];
    }
    
    // Map folder names to brand IDs (handle case variations)
    const folderToBrandId: Record<string, string> = {
      'blomus': 'blomus',
      'Blomus': 'blomus',
      'BLOMUS': 'blomus',
      'elvang': 'elvang',
      'Elvang': 'elvang',
      'ELVANG': 'elvang',
      'my-flame': 'my-flame',
      'MyFlame': 'my-flame',
      'myflame': 'my-flame',
      'ppd': 'ppd',
      'PPD': 'ppd',
      'rader': 'rader',
      'Rader': 'rader',
      'RADER': 'rader',
      'räder': 'rader',
      'Räder': 'rader',
      'remember': 'remember',
      'Remember': 'remember',
      'REMEMBER': 'remember',
      'relaxound': 'relaxound',
      'Relaxound': 'relaxound',
      'RELAXOUND': 'relaxound',
      'gefu': 'gefu',
      'GEFU': 'gefu',
      'Gefu': 'gefu'
    };
    
    const normalizedBrandFromFolder = folderToBrandId[brandFromFolder] || brandFromFolder.toLowerCase();
    
    // Also check tags as backup
    const brandFromTags = imagekitImage.tags?.find((tag: string) => 
      BRANDS.some(brand => brand.id === tag.toLowerCase())
    );
    
    const brandId = normalizedBrandFromFolder || brandFromTags || '';
    const brandName = BRANDS.find(b => b.id === brandId)?.name || brandId || 'Unknown';

    // Log only first few for debugging to avoid spam
    if (Math.random() < 0.02) { // Log 2% of images
      console.log(`Image ${imagekitImage.name}: path=${filePath}, brand=${brandId}`);
    }

    // Log specific image if found
    if (imagekitImage.name && imagekitImage.name.includes('CRS10')) {
      console.log('Found CRS10 image:', {
        name: imagekitImage.name,
        fileId: imagekitImage.fileId,
        createdAt: imagekitImage.createdAt,
        updatedAt: imagekitImage.updatedAt,
        filePath: imagekitImage.filePath,
        url: imagekitImage.url
      });
    }
    
    // Log date fields for debugging
    if (Math.random() < 0.05) { // Log 5% of images
      console.log(`Image ${imagekitImage.name} dates:`, {
        createdAt: imagekitImage.createdAt,
        updatedAt: imagekitImage.updatedAt,
        uploadedAt: imagekitImage.uploadedAt
      });
    }

    return {
      id: imagekitImage.fileId || '',
      name: imagekitImage.name || 'Unnamed',
      url: imagekitImage.url || '',
      brand: brandId,
      brandName: brandName,
      size: imagekitImage.size || 0,
      // Use createdAt as the primary date field, fall back to updatedAt
      uploadedAt: imagekitImage.createdAt || imagekitImage.updatedAt || new Date().toISOString(),
      contentType: imagekitImage.fileType || imagekitImage.type || 'image/webp'
    };
  }, []);

  // API functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}/api/imagekit${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  };

  // Fetch images from backend - FIXED: Removed circular dependency on 'images'
  const fetchImages = useCallback(async (fetchOptions: FetchOptions = {}) => {
    // Prevent concurrent fetches
    if (!isMountedRef.current) return;
    
    // Rate limiting: ensure at least 1 second between requests
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    
    if (timeSinceLastFetch < 1000) {
      // Cancel any pending fetch
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Schedule this fetch for later
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          fetchImages(fetchOptions);
        }
      }, 1000 - timeSinceLastFetch);
      return;
    }
    
    setLastFetchTime(now);
    
    try {
      setError(null);
      
      if (!fetchOptions.append) {
        setLoading(true);
      }

      // Use brand-specific folder if brandId is provided
      const folder = brandId ? `brand-images/${brandId}` : 'brand-images';
      const cacheKey = brandId ? `brand-images-${brandId}` : 'brand-images';
      
      // Skip cache entirely to ensure we always see the latest images
      const skipCache = true; // Keep cache disabled until we fix the date issue
      
      if (!fetchOptions.append && fetchOptions.skip === 0 && !fetchOptions.searchQuery && !skipCache) {
        const cached = await enhancedDashboardCache.get<ImageItem[]>(userId, cacheKey);
        if (cached && cached.length > 0) {
          console.log(`Loaded ${cached.length} images from cache for ${brandId || 'all brands'}`);
          setImages(cached);
          setLoading(false);
          // Don't set hasMore to false - we need to check server for total count
          return;
        }
      }

      const params = new URLSearchParams({
        skip: (fetchOptions.skip || 0).toString(),
        limit: (fetchOptions.limit || itemsPerPage).toString(),
        folder: fetchOptions.folder || folder,
        ...(fetchOptions.searchQuery && { searchQuery: fetchOptions.searchQuery }),
        ...(fetchOptions.tags && { tags: fetchOptions.tags }),
      });

      console.log(`Fetching images with params:`, params.toString());
      console.log(`Fetching from folder: ${fetchOptions.folder || folder}`);
      const response = await apiCall(`/images?${params}`);
      
      console.log(`API returned ${response.images?.length || 0} images`);
      
      if (response.images && Array.isArray(response.images)) {
        const convertedImages = response.images
          .filter((img: any) => img && img.fileId)
          .map(convertImageKitToImageItem);
        
        // Log the first few images to see what we're getting
        if (convertedImages.length > 0) {
          console.log('First 3 images received:', convertedImages.slice(0, 3).map(img => ({
            name: img.name,
            url: img.url,
            uploadedAt: img.uploadedAt,
            brand: img.brand
          })));
        }
        
        if (fetchOptions.append) {
          setImages(prevImages => [...prevImages, ...convertedImages]);
        } else {
          setImages(convertedImages);
        }
        
        // Set hasMore based on whether we got a full page
        setHasMore(convertedImages.length === (fetchOptions.limit || itemsPerPage));
        
        // Cache only the first page without search
        if (!fetchOptions.append && fetchOptions.skip === 0 && !fetchOptions.searchQuery && convertedImages.length > 0) {
          await enhancedDashboardCache.set(userId, cacheKey, convertedImages);
          console.log(`Cached ${convertedImages.length} images for ${brandId || 'all brands'}`);
        }
      } else {
        if (!fetchOptions.append) {
          setImages([]);
        }
        setHasMore(false);
      }
      
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, convertImageKitToImageItem, userId, lastFetchTime, brandId]); // Added brandId to deps

  // Helper function to convert image to WebP
  const convertToWebP = async (file: File, quality: number = 0.85): Promise<File> => {
    // Check file size limit (skip conversion for files over 50MB to avoid browser issues)
    const MAX_SIZE_FOR_CONVERSION = 50 * 1024 * 1024; // 50MB - increased from 20MB
    if (file.size > MAX_SIZE_FOR_CONVERSION) {
      console.warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB) for browser conversion, skipping`);
      const originalName = file.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const extension = lastDotIndex > -1 ? originalName.substring(lastDotIndex) : '';
      
      const underscoreIndex = nameWithoutExt.indexOf('_');
      const newNameWithoutExt = underscoreIndex > -1 ? nameWithoutExt.substring(0, underscoreIndex) : nameWithoutExt;
      const newName = newNameWithoutExt + extension;
      
      return new File([file], newName, { type: file.type });
    }
    
    // Check if browser supports WebP
    const supportsWebP = await (async () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
    })();
    
    // If WebP is not supported, just rename the file
    if (!supportsWebP) {
      console.warn('WebP not supported in this browser, skipping conversion');
      const originalName = file.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const extension = lastDotIndex > -1 ? originalName.substring(lastDotIndex) : '';
      
      const underscoreIndex = nameWithoutExt.indexOf('_');
      const newNameWithoutExt = underscoreIndex > -1 ? nameWithoutExt.substring(0, underscoreIndex) : nameWithoutExt;
      const newName = newNameWithoutExt + extension;
      
      return new File([file], newName, { type: file.type });
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert to WebP'));
                return;
              }
              
              // Extract the original filename without extension
              const originalName = file.name;
              const lastDotIndex = originalName.lastIndexOf('.');
              const nameWithoutExt = lastDotIndex > -1 ? originalName.substring(0, lastDotIndex) : originalName;
              
              // Get characters up to first underscore
              const underscoreIndex = nameWithoutExt.indexOf('_');
              const newNameWithoutExt = underscoreIndex > -1 ? nameWithoutExt.substring(0, underscoreIndex) : nameWithoutExt;
              const newName = newNameWithoutExt + '.webp';
              
              // Create new File object with WebP blob
              const webpFile = new File([blob], newName, { type: 'image/webp' });
              
              // Log size reduction
              const reduction = ((file.size - blob.size) / file.size * 100).toFixed(1);
              console.log(`Converted ${file.name} to WebP: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${reduction}% reduction)`);
              
              // If the WebP is actually larger (can happen with some PNGs), use the original
              if (blob.size > file.size) {
                console.warn(`WebP conversion increased file size, using original format`);
                const originalName = file.name;
                const lastDotIndex = originalName.lastIndexOf('.');
                const nameWithoutExt = lastDotIndex > -1 ? originalName.substring(0, lastDotIndex) : originalName;
                const extension = lastDotIndex > -1 ? originalName.substring(lastDotIndex) : '';
                
                const underscoreIndex = nameWithoutExt.indexOf('_');
                const newNameWithoutExt = underscoreIndex > -1 ? nameWithoutExt.substring(0, underscoreIndex) : nameWithoutExt;
                const newName = newNameWithoutExt + extension;
                
                resolve(new File([file], newName, { type: file.type }));
              } else {
                resolve(webpFile);
              }
            },
            'image/webp',
            quality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Upload single image
  const uploadImage = useCallback(async (file: File, brand: string) => {
    try {
      setError(null);
      
      let fileToUpload: File;
      
      // Check if file is already WebP
      if (file.type === 'image/webp') {
        // File is already WebP, just rename it
        const originalName = file.name;
        const lastDotIndex = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > -1 ? originalName.substring(0, lastDotIndex) : originalName;
        
        // Get characters up to first underscore
        const underscoreIndex = nameWithoutExt.indexOf('_');
        const newNameWithoutExt = underscoreIndex > -1 ? nameWithoutExt.substring(0, underscoreIndex) : nameWithoutExt;
        const newName = newNameWithoutExt + '.webp';
        
        fileToUpload = new File([file], newName, { type: file.type });
      } else {
        // Convert to WebP (this also handles renaming)
        console.log(`Converting ${file.name} to WebP...`);
        fileToUpload = await convertToWebP(file, WEBP_QUALITY);
      }
      
      const formData = new FormData();
      formData.append('brand', brand);
      formData.append('image', fileToUpload);

      const response = await fetch(`${API_BASE}/api/imagekit/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Add the new image to the state
      const newImage = convertImageKitToImageItem(result);
      setImages(prev => [newImage, ...prev]);
      
      return result;
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      throw err;
    }
  }, [convertImageKitToImageItem, convertToWebP]);

  // Upload multiple images
  const uploadMultiple = useCallback(async (files: File[], brand: string) => {
    try {
      setError(null);
      
      const formData = new FormData();
      
      // Convert all files to WebP (with renaming)
      const convertedFiles: File[] = [];
      
      for (const file of files) {
        let fileToUpload: File;
        
        if (file.type === 'image/webp') {
          // File is already WebP, just rename it
          const originalName = file.name;
          const lastDotIndex = originalName.lastIndexOf('.');
          const nameWithoutExt = lastDotIndex > -1 ? originalName.substring(0, lastDotIndex) : originalName;
          
          // Get characters up to first underscore
          const underscoreIndex = nameWithoutExt.indexOf('_');
          const newNameWithoutExt = underscoreIndex > -1 ? nameWithoutExt.substring(0, underscoreIndex) : nameWithoutExt;
          const newName = newNameWithoutExt + '.webp';
          
          fileToUpload = new File([file], newName, { type: file.type });
        } else {
          // Convert to WebP (this also handles renaming)
          console.log(`Converting ${file.name} to WebP...`);
          fileToUpload = await convertToWebP(file, WEBP_QUALITY);
        }
        
        convertedFiles.push(fileToUpload);
      }
      
      // IMPORTANT: Append brand field BEFORE files to ensure proper order
      formData.append('brand', brand);
      
      // Then append the converted files
      convertedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${API_BASE}/api/imagekit/upload-multiple`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response error:', errorText);
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Add successful uploads to state
      if (result.successful && result.successful.length > 0) {
        const newImages = result.successful.map(convertImageKitToImageItem);
        setImages(prev => [...newImages, ...prev]);
      }
      
      return result;
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
      throw err;
    }
  }, [convertImageKitToImageItem, convertToWebP]);

  // Delete single image
  const deleteImage = useCallback(async (fileId: string) => {
    try {
      setError(null);
      
      await apiCall(`/images/${fileId}`, { method: 'DELETE' });
      
      // Remove from state
      setImages(prev => prev.filter(img => img.id !== fileId));
      
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      throw err;
    }
  }, []);

  // Delete multiple images
  const deleteBulk = useCallback(async (fileIds: string[]) => {
    try {
      setError(null);
      
      const result = await apiCall('/images/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ fileIds })
      });
      
      // Remove successfully deleted images from state
      if (result.successful && result.successful.length > 0) {
        setImages(prev => prev.filter(img => !result.successful.includes(img.id)));
      }
      
      // Handle errors if any
      if (result.failed && result.failed.length > 0) {
        console.warn('Some images failed to delete:', result.failed);
        setError(`Failed to delete ${result.failed.length} images`);
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting images:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete images');
      throw err;
    }
  }, []);

  // Fetch images for a specific brand
  const fetchImagesByBrand = useCallback(async (brandId: string) => {
    // Don't fetch if already loading
    if (loading) return;
    
    // Check if we've already loaded this brand
    if (loadedBrands.has(brandId)) {
      console.log(`Brand ${brandId} already loaded`);
      return;
    }
    
    // For now, let's just use the main fetch with all images
    // and rely on client-side filtering
    // This avoids the complex merging logic that seems to be broken
    console.log(`Loading brand ${brandId} - using client-side filtering`);
  }, [loading, loadedBrands]);

  // Clear all cached images
  const clearCache = useCallback(async () => {
    if (brandId) {
      // Clear specific brand cache
      await enhancedDashboardCache.remove(userId, `brand-images-${brandId}`);
    } else {
      // Clear all brand-specific caches
      for (const brand of BRANDS) {
        await enhancedDashboardCache.remove(userId, `brand-images-${brand.id}`);
      }
      // Clear the main cache
      await enhancedDashboardCache.remove(userId, 'brand-images');
    }
    console.log('Image cache cleared');
  }, [userId, brandId]);

  // Refresh images (clear cache and reload)
  const refreshImages = useCallback(async () => {
    console.log(`Refreshing images for ${brandId || 'all brands'}`);
    setImages([]);
    setLoadedBrands(new Set());
    setHasMore(true);
    await clearCache(); // Clear cache before reloading
    
    // Force a fresh fetch by adding a timestamp to bypass any potential caching
    const folder = brandId ? `brand-images/${brandId}` : 'brand-images';
    await fetchImages({ 
      skip: 0, 
      limit: itemsPerPage, 
      folder,
      append: false
    });
  }, [fetchImages, itemsPerPage, clearCache, brandId]);

  // Utility functions
  const getBrandColor = useCallback((brandId: string): string => {
    return BRANDS.find(brand => brand.id === brandId)?.color || '#79d5e9';
  }, []);

  const getBrandName = useCallback((brandId: string): string => {
    return BRANDS.find(brand => brand.id === brandId)?.name || brandId;
  }, []);

  // FIXED: Track mount status and prevent multiple initial loads
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Reset state and fetch flag when brandId changes
  useEffect(() => {
    // Clear the fetch flag
    hasFetchedRef.current = false;
    
    // Clear current images to ensure fresh data
    setImages([]);
    setLoadedBrands(new Set());
    setHasMore(true);
    
    console.log(`Brand changed in hook to: ${brandId || 'all brands'}`);
  }, [brandId]);

  // FIXED: Separate effect for initial load with proper dependencies
  useEffect(() => {
    const loadInitialData = async () => {
      // Prevent multiple initial loads
      if (hasFetchedRef.current || !autoLoad || !isMountedRef.current) {
        return;
      }
      
      hasFetchedRef.current = true;
      
      // Skip cache for now to ensure we always see the latest images
      const skipCacheOnMount = true;
      
      if (!skipCacheOnMount) {
        try {
          // Try to load from cache first
          const cacheKey = brandId ? `brand-images-${brandId}` : 'brand-images';
          const cached = await enhancedDashboardCache.get<ImageItem[]>(userId, cacheKey);
          if (cached && cached.length > 0) {
            console.log(`Loading ${cached.length} images from cache on mount for ${brandId || 'all brands'}`);
            setImages(cached);
            setHasMore(false); // Assume cache has all images
            return;
          }
        } catch (e) {
          console.error('Failed to load from cache:', e);
        }
      }
      
      // Only fetch if no cache
      console.log(`No cache found for ${brandId || 'all brands'}, fetching from server`);
      // Add a small delay to avoid immediate requests on mount
      setTimeout(() => {
        if (isMountedRef.current) {
          const folder = brandId ? `brand-images/${brandId}` : 'brand-images';
          fetchImages({ limit: itemsPerPage, folder });
        }
      }, 100);
    };
    
    loadInitialData();
  }, [autoLoad, userId, itemsPerPage, fetchImages, brandId]); // Added brandId

  return {
    // State
    images,
    loading,
    error,
    hasMore,
    loadedBrands,
    
    // Actions
    fetchImages,
    fetchImagesByBrand,
    uploadImage,
    uploadMultiple,
    deleteImage,
    deleteBulk,
    refreshImages,
    clearCache,
    
    // Utility
    getBrandColor,
    getBrandName,
    brands: BRANDS,
  };
};
