import React, { useEffect, useState } from 'react';
import { 
  FaTimes, 
  FaBarcode, 
  FaBox, 
  FaDollarSign, 
  FaWarehouse,
  FaImage,
  FaTag,
  FaInfoCircle,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { storage } from '../../firebase';
import { ItemData, formatCurrency, getStockStatus } from '../../types/inventory';
import styles from './ProductDetailsModal.module.css';

interface ProductDetailsModalProps {
  product: ItemData;
  onClose: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

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
        setImageUrl('');
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [product.sku, product.brand_normalized]);

  const stockStatus = getStockStatus(product);
  const StatusIcon = stockStatus.isOut ? FaExclamationTriangle : 
                     stockStatus.isLow ? FaExclamationTriangle : 
                     FaCheckCircle;

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Product Details</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.productDetailsGrid}>
            {/* Image Section */}
            <div className={styles.productImageSection}>
              {imageLoading ? (
                <div className={styles.imageSkeleton}>
                  <div className={styles.spinner}></div>
                </div>
              ) : imageUrl ? (
                <img src={imageUrl} alt={product.item_name} className={styles.productDetailImage} />
              ) : (
                <div className={styles.imagePlaceholderLarge}>
                  <FaImage />
                  <span>No Image Available</span>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className={styles.productInfoSection}>
              <div className={styles.productTitleSection}>
                <h3>{product.item_name || 'Unnamed Product'}</h3>
                <div className={`${styles.statusBadge} ${styles[`status${stockStatus.color.charAt(0).toUpperCase() + stockStatus.color.slice(1)}`]}`}>
                  <StatusIcon />
                  <span>{stockStatus.status}</span>
                </div>
              </div>

              <div className={styles.detailGroups}>
                {/* Basic Information */}
                <div className={styles.detailGroup}>
                  <h4><FaInfoCircle /> Basic Information</h4>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label><FaBarcode /> SKU</label>
                      <span>{product.sku || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label><FaTag /> Brand</label>
                      <span>{product.brand || 'Unknown'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Category</label>
                      <span>{product.category_name || 'Uncategorized'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Unit</label>
                      <span>{product.unit || 'Each'}</span>
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className={styles.detailGroup}>
                  <h4><FaWarehouse /> Stock Information</h4>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label>Available Stock</label>
                      <span className={styles.stockValue}>{product.available_stock || product.stock_on_hand || 0}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Stock on Hand</label>
                      <span>{product.stock_on_hand || 0}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Reorder Level</label>
                      <span>{product.reorder_level || 0}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Stock Value</label>
                      <span>{formatCurrency((product.stock_on_hand || 0) * (product.purchase_rate || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className={styles.detailGroup}>
                  <h4><FaDollarSign /> Pricing Information</h4>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label>Purchase Price</label>
                      <span className={styles.priceValue}>{formatCurrency(product.purchase_rate || 0)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Selling Price</label>
                      <span className={styles.priceValue}>{formatCurrency(product.rate || 0)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Margin</label>
                      <span className={styles.marginValue}>
                        {product.purchase_rate && product.rate
                          ? ((((product.rate - product.purchase_rate) / product.purchase_rate) * 100).toFixed(1) + '%')
                          : 'N/A'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Tax Rate</label>
                      <span>{product.tax_percentage ? `${product.tax_percentage}%` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className={styles.detailGroup}>
                  <h4><FaCalendarAlt /> Additional Information</h4>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label>Created Date</label>
                      <span>{formatDate(product.created_time || product.created_at)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Last Modified</label>
                      <span>{formatDate(product.last_modified_time || product.updated_at)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Status</label>
                      <span className={`${styles.statusText} ${product.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                        {product.status || 'Active'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Item Type</label>
                      <span>{product.product_type || 'Goods'}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className={styles.detailGroup}>
                    <h4>Description</h4>
                    <p className={styles.productDescription}>{product.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;