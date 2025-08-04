# Image Management Component

A comprehensive image management system for Splitfin that matches your existing dark theme design system.

## Features

- **Brand-based Organization**: Images are organized by brand folders in Firebase Storage
- **Bulk Upload**: Upload multiple images at once with drag-and-drop support
- **Search & Filter**: Search images by name and filter by brand
- **Grid/List Views**: Toggle between grid and list views
- **Bulk Operations**: Select and delete multiple images at once
- **Image Preview**: Quick preview with metadata and URL copying
- **Responsive Design**: Fully responsive with mobile optimization
- **Dark Theme**: Matches your existing Splitfin design system

## Usage

### Basic Implementation

```tsx
import ImageManagement from './components/ImageManagement';

function App() {
  return (
    <div>
      <ImageManagement />
    </div>
  );
}
```

### Integration with Your Navigation

Add to your existing navigation/routing:

```tsx
// In your router configuration
<Route path="/admin/images" element={<ImageManagement />} />

// In your navigation menu
<Link to="/admin/images" className={styles.navLink}>
  <span>🖼️</span> Image Management
</Link>
```

### Firebase Storage Rules

Make sure your Firebase Storage rules allow read/write access to the brand-images folder:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /brand-images/{brand}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Component Structure

```
ImageManagement/
├── ImageManagement.tsx          # Main component
├── ImageManagement.module.css   # Main styles
├── ImageCard.tsx               # Individual image card
├── ImageCard.module.css        # Card styles
├── ImageUploadModal.tsx        # Upload modal
├── ImageUploadModal.module.css # Modal styles
├── types.ts                    # TypeScript interfaces
└── index.ts                    # Export file
```

## Customization

### Adding/Modifying Brands

Update the `BRANDS` array in `ImageManagement.tsx`:

```tsx
const BRANDS: Brand[] = [
  { id: 'blomus', name: 'Blomus', color: '#79d5e9' },
  { id: 'new-brand', name: 'New Brand', color: '#ff6b6b' },
  // Add more brands...
];
```

### Styling

All styles use CSS modules and follow your existing design patterns:
- Dark background colors: `#0f1419`, `#1a1f2a`
- Primary accent: `#79d5e9`, `#4daeac`
- Border colors: `rgba(255, 255, 255, 0.1)`
- Text colors: `#ffffff`, `rgba(255, 255, 255, 0.7)`

### Performance Optimization

- Images are lazy loaded in grid view
- List view is more efficient for large datasets
- Pagination can be added by modifying the `fetchImages` function

## API Reference

### ImageItem Interface

```typescript
interface ImageItem {
  id: string;           // Firebase Storage path
  name: string;         // File name
  url: string;          // Download URL
  brand: string;        // Brand ID
  brandName: string;    // Brand display name
  size: number;         // File size in bytes
  uploadedAt: string;   // ISO date string
  contentType: string;  // MIME type
}
```

### Brand Interface

```typescript
interface Brand {
  id: string;
  name: string;
  color: string;  // Hex color for UI
}
```

## Features Breakdown

### Search
- Real-time search by file name
- Clear search button
- Search indicator in input field

### Filtering
- Filter by brand with pill buttons
- Shows count per brand
- "All Brands" option

### Sorting
- Sort by name (alphabetical)
- Sort by date (newest first)
- Sort by size (largest first)

### Bulk Actions
- Select all checkbox
- Individual selection
- Bulk delete with confirmation

### Upload Modal
- Drag and drop support
- Multiple file selection
- Brand assignment per file
- Upload progress indicator
- File size validation (10MB max)
- Image type validation

### Views
- Grid view: Visual focus with larger previews
- List view: Efficient for many images

## Mobile Responsiveness

The component includes comprehensive responsive design:
- Stacked layout on mobile
- Touch-friendly controls
- Optimized grid columns
- Collapsible stats on small screens

## Error Handling

- Failed image loads show placeholder
- Upload errors are displayed clearly
- Network errors handled gracefully
- User-friendly error messages

## Future Enhancements

Consider adding:
- Image editing capabilities
- Batch rename functionality
- Advanced filters (date range, size range)
- Image compression before upload
- Tags/categories beyond brands
- Export functionality
- Integration with your product management
