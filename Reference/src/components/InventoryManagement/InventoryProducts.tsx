import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FaBox, 
  FaSearch, 
  FaFilter, 
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaImage
} from 'react-icons/fa';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { storage } from '../../firebase';
import { itemService } from '../../services/inventoryService';
import { ItemData, formatCurrency, getStockStatus } from '../../types/inventory';
import { ProgressLoader } from '../ProgressLoader';
import ProductDetailsModal from './ProductDetailsModal';
import EditProductModal from './EditProductModal';
import AddProductModal from './AddProductModal';
import './InventoryProducts.css';

const ITEMS_PER_PAGE = 25;

// Extended ItemData type with imageUrl for this component
interface ItemDataWithImage extends ItemData {
  imageUrl?: string;
}

// Brand configuration
const BRANDS = [
  { name: 'All Brands', value: '' },
  { name: 'Blomus', value: 'blomus' },
  { name: 'Elvang', value: 'elvang' },
  { name: 'My Flame Lifestyle', value: 'my-flame-lifestyle' },
  { name: 'Räder', value: 'rader' },
  { name: 'Remember', value: 'remember' },
  { name: 'Relaxound', value: 'relaxound' }
];

// Sort options
const SORT_OPTIONS = [
  { label: 'Newest to Oldest', value: 'created_newest' },
  { label: 'Oldest to Newest', value: 'created_oldest' },
  { label: 'A - Z', value: 'name_asc' },
  { label: 'Stock Count (Ascending)', value: 'stock_asc' },
  { label: 'Stock Count (Descending)', value: 'stock_desc' }
];

const InventoryProducts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ItemDataWithImage[]>([]);
  const [allItems, setAllItems] = useState<ItemDataWithImage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    stockFilter: searchParams.get('filter') || '',
    sort: searchParams.get('sort') || 'stock_desc'
  });

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ItemDataWithImage | null>(null);

  // Image URLs cache to prevent repeated Firebase calls
  const [imageUrlCache, setImageUrlCache] = useState<Record<string, string>>({});

  const loadProductImage = async (item: ItemDataWithImage): Promise<string> => {
    const brand = item.brand_normalized || 'remember';
    const sku = item.sku;
    
    // Check cache first
    const cacheKey = `${brand}-${sku}`;
    if (imageUrlCache[cacheKey]) {
      return imageUrlCache[cacheKey];
    }
    
    // Use the same format as ProductCard: {sku}_1_400x400.webp
    const imagePath = `brand-images/${brand}/${sku}_1_400x400.webp`;
    
    try {
      const imageRef = storageRef(storage, imagePath);
      const url = await getDownloadURL(imageRef);
      
      // Cache the URL
      setImageUrlCache(prev => ({ ...prev, [cacheKey]: url }));
      return url;
    } catch (error) {
      console.log(`No image found for ${sku}`);
      return '';
    }
  };

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterOptions: any = {
        status: 'active',
      };

      // Handle stock filters
      if (filters.stockFilter === 'low-stock') {
        filterOptions.lowStock = true;
      } else if (filters.stockFilter === 'out-of-stock') {
        filterOptions.outOfStock = true;
      }

      const { items: loadedItems } = await itemService.getItems(filterOptions, 5000);
      
      // Filter out products where SKU starts with "XXX" or status is inactive
      let filteredItems = loadedItems.filter(item => 
        !item.sku?.startsWith('XXX') && item.status === 'active'
      );
      
      // Store all items for client-side filtering
      setAllItems(filteredItems);
      
      // Apply filters
      applyFiltersAndSort(filteredItems);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFiltersAndSort = useCallback((itemsList: ItemDataWithImage[]) => {
    let filteredItems = [...itemsList];
    
    // Apply brand filter
    if (filters.brand) {
      filteredItems = filteredItems.filter(item => item.brand_normalized === filters.brand);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.item_name?.toLowerCase().includes(searchLower) ||
        item.sku?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply stock filter
    if (filters.stockFilter === 'in-stock') {
      filteredItems = filteredItems.filter(item => (item.stock_on_hand || 0) > 0);
    } else if (filters.stockFilter === 'out-of-stock') {
      filteredItems = filteredItems.filter(item => (item.stock_on_hand || 0) === 0);
    }
    
    // Apply sorting
    const sortedItems = [...filteredItems].sort((a, b) => {
      switch (filters.sort) {
        case 'created_newest':
          return new Date(b.created_time || 0).getTime() - new Date(a.created_time || 0).getTime();
        case 'created_oldest':
          return new Date(a.created_time || 0).getTime() - new Date(b.created_time || 0).getTime();
        case 'name_asc':
          return (a.item_name || '').localeCompare(b.item_name || '');
        case 'stock_asc':
          return (a.stock_on_hand || 0) - (b.stock_on_hand || 0);
        case 'stock_desc':
          return (b.stock_on_hand || 0) - (a.stock_on_hand || 0);
        default:
          return 0;
      }
    });

    // Pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Load images for the current page
    Promise.all(
      paginatedItems.map(async (item) => {
        const imageUrl = await loadProductImage(item);
        return { ...item, imageUrl };
      })
    ).then(itemsWithImages => {
      setItems(itemsWithImages);
    });

    setTotalItems(sortedItems.length);
    setTotalPages(Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  }, [filters, currentPage]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (allItems.length > 0) {
      applyFiltersAndSort(allItems);
    }
  }, [filters, currentPage, applyFiltersAndSort, allItems]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (item: ItemDataWithImage) => {
    setSelectedProduct(item);
    setShowDetailsModal(true);
  };

  const handleEditProduct = (item: ItemDataWithImage) => {
    setSelectedProduct(item);
    setShowEditModal(true);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleProductUpdate = () => {
    loadItems(); // Refresh the list after update
  };

  const handleProductAdd = () => {
    loadItems(); // Refresh the list after adding
    setShowAddModal(false);
  };

  if (loading && items.length === 0) {
    return (
      <div className="inventory-products-loading">
        <ProgressLoader 
          progress={0} 
          messages={[
            "Loading Products",
            "Fetching inventory data",
            "Processing product images"
          ]}
          submessage="Please wait while we load your product catalog..."
        />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="inventory-products-error">
        <FaTimesCircle />
        <h3>Error Loading Products</h3>
        <p>{error}</p>
        <button onClick={() => loadItems()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="inventory-products">
      <div className="products-header">
        <div className="header-content">
          <h1>Products</h1>
          <p>Manage your inventory items</p>
        </div>
        <button 
          className="add-product-btn"
          onClick={handleAddProduct}
        >
          <FaPlus />
          Add New Product
        </button>
      </div>

      <div className="filters-section">
        {/* Filters Row */}
        <div className="filters-row">
          <div className="stock-filter">
            <label className="filter-label">Filter by Stock Status</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filters.stockFilter === '' ? 'active' : ''}`}
                onClick={() => handleFilterChange('stockFilter', '')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${filters.stockFilter === 'in-stock' ? 'active' : ''}`}
                onClick={() => handleFilterChange('stockFilter', 'in-stock')}
              >
                In Stock
              </button>
              <button 
                className={`filter-btn ${filters.stockFilter === 'out-of-stock' ? 'active' : ''}`}
                onClick={() => handleFilterChange('stockFilter', 'out-of-stock')}
              >
                Out of Stock
              </button>
            </div>
          </div>

          <div className="sort-dropdown">
            <label className="filter-label">Sort by</label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="sort-select"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand Tabs */}
        <div className="brand-tabs">
          {BRANDS.map(brand => (
            <button
              key={brand.value}
              className={`brand-tab ${filters.brand === brand.value ? 'active' : ''}`}
              onClick={() => handleFilterChange('brand', brand.value)}
            >
              {brand.name}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="products-content">
        {items.length === 0 ? (
          <div className="no-products">
            <FaBox />
            <h3>No Products Found</h3>
            <p>Try adjusting your filters or add a new product.</p>
          </div>
        ) : (
          <>
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Brand</th>
                    <th>Stock</th>
                    <th>Purchase Price</th>
                    <th>Selling Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const stockStatus = getStockStatus(item);
                    const StatusIcon = stockStatus.isOut ? FaTimesCircle : 
                                     stockStatus.isLow ? FaExclamationTriangle : 
                                     FaCheckCircle;
                    
                    return (
                      <tr key={item.id || item.item_id} className="product-row">
                        <td className="image-cell">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.item_name || 'Product'} 
                              className="product-image"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`product-image-placeholder ${item.imageUrl ? 'hidden' : ''}`}>
                            <FaImage />
                          </div>
                        </td>
                        <td className="product-name-cell">
                          <div className="product-name-info">
                            <h4>{item.item_name || 'Unnamed Product'}</h4>
                            <span className="product-description">{item.description || ''}</span>
                          </div>
                        </td>
                        <td className="sku-cell">{item.sku || 'N/A'}</td>
                        <td className="brand-cell">
                          {item.brand_normalized ? 
                            item.brand_normalized.charAt(0).toUpperCase() + item.brand_normalized.slice(1) : 
                            'Unknown'
                          }
                        </td>
                        <td className="stock-cell">
                          <div className="stock-info">
                            <span className="stock-amount">{item.stock_on_hand || 0}</span>
                            <span className="reorder-level">
                              Reorder: {item.reorder_level || 0}
                            </span>
                          </div>
                        </td>
                        <td className="price-cell">{formatCurrency(item.purchase_rate || 0)}</td>
                        <td className="price-cell">{formatCurrency(item.rate || 0)}</td>
                        <td className="status-cell">
                          <span className={`stock-badge ${stockStatus.isOut ? 'stock-out' : stockStatus.isLow ? 'stock-low' : 'stock-in'}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button 
                              className="inv-btn inview-btn"
                              onClick={() => handleViewDetails(item)}
                              title="View Details"
                            >
                              View
                            </button>
                            <button 
                              className="inv-btn inedit-btn"
                              onClick={() => handleEditProduct(item)}
                              title="Edit Product"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination-section">
              <div className="pagination-info">
                <span>Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} products</span>
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft />
                  Previous
                </button>
                <div className="page-numbers">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`page-btn ${pageNum === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showDetailsModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onUpdate={handleProductUpdate}
        />
      )}

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleProductAdd}
        />
      )}
    </div>
  );
};

export default InventoryProducts;
