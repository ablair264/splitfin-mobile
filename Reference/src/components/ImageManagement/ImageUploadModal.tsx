import React, { useState, useRef, useCallback } from 'react';
import styles from './ImageUploadModal.module.css';
import { Brand } from '../../hooks/useImageKit';

interface ImageUploadModalProps {
  brands: Brand[];
  onClose: () => void;
  onUploadSuccess: () => void;
  uploadImage: (file: File, brand: string) => Promise<any>;
  uploadMultiple: (files: File[], brand: string) => Promise<any>;
  defaultBrand?: string;
}

interface FilePreview {
  file: File;
  preview: string;
  name: string;
  size: number;
  brand?: string;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  brands,
  onClose,
  onUploadSuccess,
  uploadImage,
  uploadMultiple,
  defaultBrand
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>(defaultBrand || '');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [converting, setConverting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  // Process files
  const processFiles = (selectedFiles: File[]) => {
    setErrors([]);
    const validFiles: FilePreview[] = [];
    const newErrors: string[] = [];

    selectedFiles.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        newErrors.push(`${file.name} is not an image file`);
        return;
      }

      // Removed file size limit - let the server/ImageKit handle any size restrictions

      // Create file preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview: FilePreview = {
          file,
          preview: e.target?.result as string,
          name: file.name,
          size: file.size,
          brand: selectedBrand
        };
        setFiles(prev => [...prev, preview]);
      };
      reader.readAsDataURL(file);
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [selectedBrand]);

  // Remove file from preview
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Update file brand
  const updateFileBrand = (index: number, brand: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, brand } : file
    ));
  };

  // Handle upload using the hook functions
  const handleUpload = async () => {
    // Validate all files have a brand
    const filesWithoutBrand = files.filter(f => !f.brand);
    if (filesWithoutBrand.length > 0) {
      setErrors([`Please select a brand for: ${filesWithoutBrand.map(f => f.name).join(', ')}`]);
      return;
    }

    setUploading(true);
    setConverting(true);
    setUploadProgress(0);
    setErrors([]);

    try {
      // Show converting state briefly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (files.length === 1) {
        // Single file upload
        const filePreview = files[0];
        setConverting(false);
        await uploadImage(filePreview.file, filePreview.brand!);
        setUploadProgress(100);
        onUploadSuccess();
      } else {
        // Multiple file upload - group by brand
        const filesByBrand = files.reduce((acc, filePreview) => {
          const brand = filePreview.brand!;
          if (!acc[brand]) acc[brand] = [];
          acc[brand].push(filePreview.file);
          return acc;
        }, {} as Record<string, File[]>);

        setConverting(false);
        let uploadedCount = 0;
        const totalFiles = files.length;
        const uploadErrors: string[] = [];

        // Upload each brand group
        for (const [brand, brandFiles] of Object.entries(filesByBrand)) {
          try {
            const result = await uploadMultiple(brandFiles, brand);
            
            if (result.failed && result.failed.length > 0) {
              uploadErrors.push(...result.failed.map((f: any) => f.error || 'Upload failed'));
            }
            
            uploadedCount += result.successful?.length || brandFiles.length;
            setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
          } catch (error) {
            console.error(`Error uploading ${brand} images:`, error);
            uploadErrors.push(`Failed to upload ${brand} images`);
            uploadedCount += brandFiles.length; // Count as processed for progress
            setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
          }
        }

        if (uploadErrors.length > 0) {
          setErrors(uploadErrors);
        } else {
          onUploadSuccess();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors([error instanceof Error ? error.message : 'An error occurred during upload']);
    } finally {
      setUploading(false);
      setConverting(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <h2>Upload Images</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Brand Selection */}
          {/* Only show brand selection if there are multiple brands */}
          {brands.length > 1 && (
            <div className={styles.brandSelection}>
              <label>Default Brand for Upload</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className={styles.brandSelect}
              >
                <option value="">Select a brand...</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Drop Zone */}
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            <div className={styles.dropZoneContent}>
              <span className={styles.uploadIcon}>📤</span>
              <h3>Drop images here or click to browse</h3>
              <p>Support for WebP, JPG, PNG, GIF</p>
              <p className={styles.conversionNote}>Images will be automatically converted to WebP format for optimal performance</p>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className={styles.errorContainer}>
              {errors.map((error, index) => (
                <div key={index} className={styles.errorMessage}>
                  ⚠️ {error}
                </div>
              ))}
            </div>
          )}

          {/* File Previews */}
          {files.length > 0 && (
            <div className={styles.filePreviewsContainer}>
              <h3>Selected Files ({files.length})</h3>
              <div className={styles.filePreviews}>
                {files.map((file, index) => (
                  <div key={index} className={styles.filePreviewItem}>
                    <div className={styles.previewImageContainer}>
                      <img src={file.preview} alt={file.name} />
                    </div>
                    <div className={styles.previewInfo}>
                      <div className={styles.fileName} title={file.name}>
                        {file.name}
                      </div>
                      <div className={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </div>
                      <select
                        value={file.brand || ''}
                        onChange={(e) => updateFileBrand(index, e.target.value)}
                        className={styles.fileBrandSelect}
                        style={{
                          borderColor: file.brand ? 
                            brands.find(b => b.id === file.brand)?.color : 
                            'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <option value="">Select brand...</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      className={styles.removeFileBtn}
                      onClick={() => removeFile(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className={styles.uploadProgressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className={styles.progressText}>
                {converting ? 'Converting images to WebP...' : 'Uploading...'} {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {converting ? 'Converting to WebP...' : uploading ? 'Uploading...' : `Upload ${files.length} Image${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;