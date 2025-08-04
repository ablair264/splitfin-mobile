import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaSave,
  FaBarcode, 
  FaBox, 
  FaDollarSign, 
  FaWarehouse,
  FaImage,
  FaTag,
  FaInfoCircle,
  FaUpload,
  FaSpinner
} from 'react-icons/fa';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';
import { itemService } from '../../services/inventoryService';
import { ItemData, formatCurrency } from '../../types/inventory';
import styles from './EditProductModal.module.css';

interface EditProductModalProps {
  product: ItemData;
  onClose: () => void;
  onUpdate: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<{
    item_name: string;
    sku: string;
    brand: string;
    brand_normalized: string;
    category_name: string;
    unit: string;
    available_stock: number;
    stock_on_hand: number;
    reorder_level: number;
    purchase_rate: number;
    rate: number;
    tax_percentage: number;
    status: 'active' | 'inactive';
    product_type: string;
    description: string;
  }>({
    item_name: product.item_name || '',
    sku: product.sku || '',
    brand: product.brand || '',
    brand_normalized: product.brand_normalized || '',
    category_name: product.category_name || '',
    unit: product.unit || 'Each',
    available_stock: product.available_stock || 0,
    stock_on_hand: product.stock_on_hand || 0,
    reorder_level: typeof product.reorder_level === 'string' ? parseInt(product.reorder_level) || 0 : product.reorder_level || 0,
    purchase_rate: product.purchase_rate || 0,
    rate: product.rate || 0,
    tax_percentage: product.tax_percentage || 0,
    status: (product.status || 'active') as 'active' | 'inactive',
    product_type: product.product_type || 'goods',
    description: product.description || ''
  });

  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      const brand = product.brand_normalized || 'remember';
      const sku = product.sku;
      
      const imagePath = `brand-images/${brand}/${sku}_1_400x400.webp`;
      
      try {
        const imageRef = storageRef(storage, imagePath);
        const url = await getDownloadURL(imageRef);
        setImageUrl(url);
      } catch (error) {
        console.log(`No image found for ${sku}`);
      }
    };

    loadImage();
  }, [product.sku, product.brand_normalized]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name.includes('stock') || name.includes('rate') || name.includes('level') || name === 'tax_percentage'
          ? parseFloat(value) || 0
          : value
      };

      // Auto-generate brand_normalized
      if (name === 'brand') {
        newData.brand_normalized = value.toLowerCase().replace(/\s+/g, '-');
      }

      return newData;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // If there's a new image, upload it first
      if (imageFile && formData.sku) {
        const brand = formData.brand_normalized || 'remember';
        const imagePath = `brand-images/${brand}/${formData.sku}_1_400x400.webp`;
        const imageRef = storageRef(storage, imagePath);
        
        await uploadBytes(imageRef, imageFile);
      }

      // Update the product
      await itemService.updateItem(product.item_id || product.id!, formData);
      
      onUpdate();
      onClose();
    } catch (err) {
      setError('Failed to update product. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const margin = formData.purchase_rate && formData.rate
    ? ((formData.rate - formData.purchase_rate) / formData.purchase_rate * 100).toFixed(1)
    : '0';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.editProductModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit Product</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <div className={styles.editFormGrid}>
              {/* Image Upload Section */}
              <div className={styles.imageUploadSection}>
                <h4><FaImage /> Product Image</h4>
                <div className={styles.currentImage}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="New product" />
                  ) : imageUrl ? (
                    <img src={imageUrl} alt={formData.item_name} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <FaImage />
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <label className={styles.uploadBtn}>
                  <FaUpload />
                  <span>Upload New Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              </div>

              {/* Form Fields */}
              <div className={styles.formFields}>
                {/* Basic Information */}
                <div className={styles.formSection}>
                  <h4><FaInfoCircle /> Basic Information</h4>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Product Name *</label>
                      <input
                        type="text"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label><FaBarcode /> SKU *</label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label><FaTag /> Brand</label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <input
                        type="text"
                        name="category_name"
                        value={formData.category_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Unit</label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                      >
                        <option value="Each">Each</option>
                        <option value="Box">Box</option>
                        <option value="Pack">Pack</option>
                        <option value="Kg">Kg</option>
                        <option value="Liter">Liter</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className={styles.formSection}>
                  <h4><FaWarehouse /> Stock Information</h4>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Available Stock</label>
                      <input
                        type="number"
                        name="available_stock"
                        value={formData.available_stock}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Stock on Hand</label>
                      <input
                        type="number"
                        name="stock_on_hand"
                        value={formData.stock_on_hand}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Reorder Level</label>
                      <input
                        type="number"
                        name="reorder_level"
                        value={formData.reorder_level}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className={styles.formSection}>
                  <h4><FaDollarSign /> Pricing Information</h4>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Purchase Price</label>
                      <input
                        type="number"
                        name="purchase_rate"
                        value={formData.purchase_rate}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Selling Price</label>
                      <input
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Margin</label>
                      <input
                        type="text"
                        value={`${margin}%`}
                        disabled
                        className={styles.marginInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Tax Rate (%)</label>
                      <input
                        type="number"
                        name="tax_percentage"
                        value={formData.tax_percentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className={styles.formSection}>
                  <h4>Description</h4>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Enter product description..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? (
                <>
                  <FaSpinner className={styles.spinner} />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;