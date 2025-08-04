import React, { useState } from 'react';
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
  FaSpinner,
  FaPlus
} from 'react-icons/fa';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';
import { itemService } from '../../services/inventoryService';
import styles from './AddProductModal.module.css';

interface AddProductModalProps {
  onClose: () => void;
  onAdd: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ onClose, onAdd }) => {
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
    item_name: '',
    sku: '',
    brand: '',
    brand_normalized: '',
    category_name: '',
    unit: 'Each',
    available_stock: 0,
    stock_on_hand: 0,
    reorder_level: 0,
    purchase_rate: 0,
    rate: 0,
    tax_percentage: 0,
    status: 'active',
    product_type: 'goods',
    description: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.item_name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.sku.trim()) {
      setError('SKU is required');
      return false;
    }
    if (formData.sku.toUpperCase().startsWith('XXX')) {
      setError('SKU cannot start with XXX');
      return false;
    }
    if (formData.rate <= 0) {
      setError('Selling price must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First create the product
      const createdItem = await itemService.createItem(formData);
      
      // If there's an image, upload it
      if (imageFile && formData.sku) {
        const brand = formData.brand_normalized || 'remember';
        const imagePath = `brand-images/${brand}/${formData.sku}_1_400x400.webp`;
        const imageRef = storageRef(storage, imagePath);
        
        await uploadBytes(imageRef, imageFile);
      }

      onAdd();
    } catch (err: any) {
      setError(err.message || 'Failed to add product. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.item_name || !formData.sku) {
        setError('Product name and SKU are required');
        return;
      }
      if (formData.sku.toUpperCase().startsWith('XXX')) {
        setError('SKU cannot start with XXX');
        return;
      }
    }
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const margin = formData.purchase_rate && formData.rate
    ? ((formData.rate - formData.purchase_rate) / formData.purchase_rate * 100).toFixed(1)
    : '0';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.addProductModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add New Product</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''}`}>
            <span>1</span>
            <label>Basic Info</label>
          </div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''}`}>
            <span>2</span>
            <label>Pricing & Stock</label>
          </div>
          <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''}`}>
            <span>3</span>
            <label>Image & Details</label>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className={styles.formStep}>
                <h3><FaInfoCircle /> Basic Information</h3>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      required
                      autoFocus
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label><FaBarcode /> SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="Enter unique SKU"
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
                      placeholder="Enter brand name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <input
                      type="text"
                      name="category_name"
                      value={formData.category_name}
                      onChange={handleInputChange}
                      placeholder="Enter category"
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
                    <label>Product Type</label>
                    <select
                      name="product_type"
                      value={formData.product_type}
                      onChange={handleInputChange}
                    >
                      <option value="goods">Goods</option>
                      <option value="service">Service</option>
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
            )}

            {/* Step 2: Pricing & Stock */}
            {currentStep === 2 && (
              <div className={styles.formStep}>
                <h3><FaDollarSign /> Pricing & Stock Information</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Purchase Price</label>
                    <input
                      type="number"
                      name="purchase_rate"
                      value={formData.purchase_rate}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Selling Price *</label>
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
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
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label><FaWarehouse /> Initial Stock</label>
                    <input
                      type="number"
                      name="stock_on_hand"
                      value={formData.stock_on_hand}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Available Stock</label>
                    <input
                      type="number"
                      name="available_stock"
                      value={formData.available_stock}
                      onChange={handleInputChange}
                      placeholder="0"
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
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Image & Details */}
            {currentStep === 3 && (
              <div className={styles.formStep}>
                <h3><FaImage /> Image & Additional Details</h3>
                <div className={styles.imageDetailsGrid}>
                  <div className={styles.imageUploadArea}>
                    <div className={styles.imagePreviewBox}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Product preview" />
                      ) : (
                        <div className={styles.uploadPlaceholder}>
                          <FaImage />
                          <p>No image selected</p>
                          <p className={styles.uploadHint}>Recommended: 400x400px</p>
                        </div>
                      )}
                    </div>
                    <label className={styles.uploadBtn}>
                      <FaUpload />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                      />
                    </label>
                  </div>
                  <div className={styles.detailsArea}>
                    <div className={styles.formGroup}>
                      <label>Product Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder="Enter detailed product description..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.footerLeft}>
              {currentStep > 1 && (
                <button type="button" className={styles.btnSecondary} onClick={prevStep}>
                  Previous
                </button>
              )}
            </div>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>
                Cancel
              </button>
              {currentStep < 3 ? (
                <button type="button" className={styles.btnPrimary} onClick={nextStep}>
                  Next
                </button>
              ) : (
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? (
                    <>
                      <FaSpinner className={styles.spinner} />
                      Adding Product...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Add Product
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;