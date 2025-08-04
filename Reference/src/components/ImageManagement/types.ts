// types.ts - TypeScript interfaces for Image Management

export interface ImageItem {
  id: string;              // Firebase Storage full path
  name: string;            // File name
  url: string;             // Download URL
  brand: string;           // Brand ID
  brandName: string;       // Brand display name
  size: number;            // File size in bytes
  uploadedAt: string;      // ISO date string
  contentType: string;     // MIME type
}

export interface Brand {
  id: string;
  name: string;
  color: string;          // Hex color for UI elements
}

export interface UploadProgress {
  fileName: string;
  progress: number;       // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}
