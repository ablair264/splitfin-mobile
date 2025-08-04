# Image Management Quick Start Guide

## 🚀 Quick Setup

### 1. Import the Component

```tsx
import ImageManagement from './components/ImageManagement';
```

### 2. Add to Your Routes

```tsx
<Route path="/images" element={<ImageManagement />} />
```

### 3. Add to Navigation

```tsx
<Link to="/images">
  <span>🖼️</span> Image Management
</Link>
```

That's it! The component is now ready to use.

## 📁 File Structure

```
ImageManagement/
├── ImageManagement.tsx          # Main component
├── ImageManagement.module.css   # Styles
├── ImageCard.tsx               # Image cards
├── ImageUploadModal.tsx        # Upload modal
└── types.ts                    # TypeScript types
```

## 🎨 Features

- **Dark Theme**: Matches your existing Splitfin design
- **Brand Organization**: Images organized by brand folders
- **Drag & Drop Upload**: Easy multi-file uploads
- **Search & Filter**: Find images quickly
- **Bulk Operations**: Select and manage multiple images
- **Responsive**: Works on all devices

## 🔧 Customization

### Change Brands

Edit the `BRANDS` array in `ImageManagement.tsx`:

```tsx
const BRANDS: Brand[] = [
  { id: 'blomus', name: 'Blomus', color: '#79d5e9' },
  { id: 'new-brand', name: 'New Brand', color: '#ff6b6b' },
];
```

### Firebase Storage Structure

Images are stored in:
```
brand-images/
  ├── blomus/
  ├── elvang/
  ├── gefu/
  └── ...
```

## 🔐 Security

Make sure your Firebase Storage rules allow authenticated access:

```javascript
match /brand-images/{brand}/{allPaths=**} {
  allow read, write: if request.auth != null;
}
```

## 📱 Mobile Optimized

- Stacked layout on small screens
- Touch-friendly controls
- Optimized image loading

## 🎯 Usage Tips

1. **Upload Multiple Files**: Drag multiple images into the upload area
2. **Quick Actions**: Hover over images for quick copy/download/delete
3. **Bulk Delete**: Select multiple images and delete at once
4. **Search**: Type to filter images by filename
5. **Brand Filter**: Click brand pills to filter by brand

## 🛠️ Troubleshooting

### Images Not Loading
- Check Firebase Storage rules
- Verify authentication is working
- Check browser console for errors

### Upload Failing
- Ensure file is under 10MB
- Check it's a valid image format (JPG, PNG, GIF, WebP)
- Verify Firebase Storage quota

## 📈 Future Enhancements

Consider adding:
- Image optimization before upload
- Batch operations (rename, move)
- Integration with product management
- Advanced search filters
- Export functionality
