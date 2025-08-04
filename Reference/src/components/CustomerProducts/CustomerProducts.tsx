// CustomerProducts.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { FaSearch, FaTh, FaList, FaTimes } from 'react-icons/fa';
import styles from './CustomerProducts.module.css';
import { ProgressBar } from '../CustomerProgressBar/CustomerProgressBar';
import { CustomerProductCard } from './CustomerProductCard';
import { CustomerProductListItem } from './CustomerProductListItem';
import { CustomerQuickViewModal } from './CustomerQuickViewModal';

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  type?: string;
  category?: string[];
  price: number;
  imageUrl?: string;
  description?: string;
  stockLevel: number;
  item_id?: string;
  created_time?: string;
  status?: string;
}

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Array<{
    product: Product;
    quantity: number;
  }>;
  orderTotal: number;
  onRemoveItem: (productId: string) => void;
  onReviewOrder: () => void;
  onClearOrder: () => void;
}

// Order Summary Modal Component
const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  orderTotal,
  onRemoveItem,
  onReviewOrder,
  onClearOrder
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.orderSummaryModalOverlay} onClick={onClose}>
      <div className={styles.orderSummaryModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.orderSummaryHeader}>
          <h3>Order Summary</h3>
          <button className={styles.closeModalBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.selectedItemsList}>
          {selectedItems.length === 0 ? (
            <p className={styles.noItemsMessage}>No items in order yet</p>
          ) : (
            selectedItems.map(({ product, quantity }) => (
              <div key={product.id} className={styles.selectedItem}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{product.name}</span>
                  <span className={styles.itemSku}>{product.sku}</span>
                </div>
                <div className={styles.itemQuantity}>
                  <span>{quantity} × £{product.price.toFixed(2)}</span>
                </div>
                <button
                  className={styles.itemRemoveBtn}
                  onClick={() => onRemoveItem(product.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className={styles.orderSummaryFooter}>
          <div className={styles.orderTotalLarge}>
            Total: <strong>£{orderTotal.toFixed(2)}</strong>
          </div>
          <div className={styles.orderActions}>
            <button
              className={styles.reviewOrderBtn}
              onClick={onReviewOrder}
              disabled={selectedItems.length === 0}
            >
              Review Order
            </button>
            <button
              className={styles.btnOutlineSecondary}
              onClick={onClearOrder}
              disabled={selectedItems.length === 0}
            >
              Clear Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function CustomerProducts() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const brandParam = brandId || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hideOutOfStock, setHideOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState<'none' | 'price-asc' | 'price-desc'>('none');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const [visibleProducts, setVisibleProducts] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const [zohoCustomerId, setZohoCustomerId] = useState<string | null>(null);

  // Get Zoho customer ID on mount
  useEffect(() => {
    getZohoCustomerId();
  }, []);

  const getZohoCustomerId = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const customerQuery = query(
        collection(db, 'customer_data'),
        where('firebase_uid', '==', user.uid)
      );
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerData = customerSnapshot.docs[0].data();
        const customerId = customerData.zoho_data?.customer_id || customerData.customer_id;
        setZohoCustomerId(customerId);
      }
    } catch (error) {
      console.error('Error getting Zoho customer ID:', error);
    }
  };

  // Load user's cart from Firebase on component mount
  useEffect(() => {
    loadUserCart();
  }, [zohoCustomerId]);

  const loadUserCart = async () => {
    const user = auth.currentUser;
    if (!user || !zohoCustomerId) return;

    try {
      const localCart = localStorage.getItem('customerOrder');
      
      if (!localCart || localCart === '[]') {
        await setDoc(doc(db, 'carts', zohoCustomerId), {
          items: [],
          updatedAt: new Date().toISOString(),
          customerId: zohoCustomerId,
          firebaseUid: user.uid
        });
        return;
      }

      const cartDoc = await getDoc(doc(db, 'carts', zohoCustomerId));
      if (cartDoc.exists()) {
        const cartData = cartDoc.data();
        if (cartData.items && cartData.items.length > 0) {
          localStorage.setItem('customerOrder', JSON.stringify(cartData.items));
          window.dispatchEvent(new Event('orderUpdated'));
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveUserCart = async (cartItems: any[]) => {
    const user = auth.currentUser;
    if (!user || !zohoCustomerId) return;

    try {
      await setDoc(doc(db, 'carts', zohoCustomerId), {
        items: cartItems,
        updatedAt: new Date().toISOString(),
        customerId: zohoCustomerId,
        firebaseUid: user.uid
      });
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const fetchProducts = async () => {
    console.log('Fetching products for brand:', brandParam);
    setLoading(true);
    
    try {
      const normalizedBrand = brandParam.toLowerCase()
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ß/g, 'ss');
      
      const variations = [
        brandParam,
        brandParam.toLowerCase(),
        brandParam.charAt(0).toUpperCase() + brandParam.slice(1).toLowerCase(),
        brandParam.toUpperCase(),
        normalizedBrand,
        normalizedBrand.charAt(0).toUpperCase() + normalizedBrand.slice(1).toLowerCase(),
        brandParam.replace(/a/g, 'ä').toLowerCase(),
        brandParam.replace(/ae/g, 'ä').toLowerCase(),
        'räder',
        'Räder',
        'RÄDER',
        'rader',
        'Rader',
        'RADER'
      ];
      
      const uniqueVariations = [...new Set(variations)];
      
      let allProducts: Product[] = [];
      let foundProducts = false;
      
      const isRaderBrand = normalizedBrand === 'rader' || brandParam.toLowerCase() === 'räder';
      
      for (const variation of uniqueVariations) {
        console.log(`Trying variation: "${variation}"`);
        
        const manufacturerQuery = query(
          collection(db, 'items'),
          where('Manufacturer', '==', variation)
        );
        
        const snap = await getDocs(manufacturerQuery);
        
        if (!snap.empty) {
          console.log(`Found ${snap.size} products with Manufacturer="${variation}"`);
          
          const productsWithoutImages = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              sku: data.sku || data.SKU || '',
              name: data.item_name || data.name || '',
              brand: data.Manufacturer || data.manufacturer || data.brand || '',
              type: data.type || '',
              category: data.category || [],
              price: data.rate || data.purchase_rate || 0,
              description: data.description || '',
              stockLevel: data.actual_available_stock || data.available_stock || data.stock_on_hand || 0,
              item_id: data.item_id,
              created_time: data.created_time || data.created_at || null,
              status: data.status || 'active'
            } as Product;
          }).filter(p => p.status !== 'inactive');
          
          allProducts = productsWithoutImages;
          foundProducts = true;
          break;
        }
      }
      
      if (!foundProducts) {
        for (const variation of uniqueVariations) {
          const brandQuery = query(
            collection(db, 'items'),
            where('brand', '==', variation)
          );
          
          const snap = await getDocs(brandQuery);
          
          if (!snap.empty) {
            console.log(`Found ${snap.size} products with brand="${variation}"`);
            
            const productsWithoutImages = snap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                sku: data.sku || data.SKU || '',
                name: data.item_name || data.name || '',
                brand: data.brand || data.Manufacturer || '',
                type: data.type || '',
                category: data.category || [],
                price: data.rate || data.purchase_rate || 0,
                description: data.description || '',
                stockLevel: data.actual_available_stock || data.available_stock || data.stock_on_hand || 0,
                item_id: data.item_id,
                created_time: data.created_time || data.created_at || null,
                status: data.status || 'active'
              } as Product;
            }).filter(p => p.status !== 'inactive');
            
            allProducts = productsWithoutImages;
            foundProducts = true;
            break;
          }
        }
      }
      
      if (isRaderBrand) {
        console.log('Fetching additional Rader products by item_name...');
        
        const allItemsQuery = query(collection(db, 'items'));
        const allItemsSnap = await getDocs(allItemsQuery);
        
        const raderVariations = ['rader', 'räder', 'RADER', 'RÄDER', 'Rader', 'Räder'];
        
        const additionalProducts = allItemsSnap.docs
          .filter(doc => {
            const data = doc.data();
            const itemName = (data.item_name || data.name || '').trim();
            const firstWord = itemName.split(' ')[0].toLowerCase();
            
            return raderVariations.some(variation => 
              firstWord === variation.toLowerCase()
            ) && data.status !== 'inactive';
          })
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              sku: data.sku || data.SKU || '',
              name: data.item_name || data.name || '',
              brand: data.Manufacturer || data.manufacturer || data.brand || 'Räder',
              type: data.type || '',
              category: data.category || [],
              price: data.rate || data.purchase_rate || 0,
              description: data.description || '',
              stockLevel: data.actual_available_stock || data.available_stock || data.stock_on_hand || 0,
              item_id: data.item_id,
              created_time: data.created_time || data.created_at || null,
              status: data.status || 'active'
            } as Product;
          });
        
        console.log(`Found ${additionalProducts.length} additional Rader products by item_name`);
        
        const existingIds = new Set(allProducts.map(p => p.id));
        const uniqueAdditionalProducts = additionalProducts.filter(p => !existingIds.has(p.id));
        
        allProducts = [...allProducts, ...uniqueAdditionalProducts];
        foundProducts = true;
      }
      
      if (foundProducts && allProducts.length > 0) {
        // Initialize quantities
        const qInit: Record<string, number> = {};
        allProducts.forEach(p => {
          qInit[p.id] = 1;
        });
        
        setProducts(allProducts);
        setQuantities(qInit);
      } else {
        console.log('No products found for any variation of:', brandParam);
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (brandParam) {
      fetchProducts();
    }
  }, [brandParam]);

  const types = useMemo(() => {
    const typeSet = new Set(products.map(p => p.type).filter(t => t && t !== ''));
    return ['all', ...Array.from(typeSet).sort()];
  }, [products]);

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    products.forEach(product => {
      if (product.category && Array.isArray(product.category)) {
        product.category.forEach(cat => {
          if (cat) catSet.add(cat);
        });
      }
    });
    return ['all', ...Array.from(catSet).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesType = selectedType === 'all' || product.type === selectedType;
      const matchesCategory = selectedCategory === 'all' || 
        (product.category && Array.isArray(product.category) && 
         product.category.includes(selectedCategory));
      const matchesSearch = product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          product.sku.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStock = !hideOutOfStock || product.stockLevel > 0;
      
      return matchesType && matchesCategory && matchesSearch && matchesStock;
    });

    // Default sorting by newest first
    if (sortBy === 'none') {
      filtered.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, debouncedSearch, selectedType, selectedCategory, hideOutOfStock, sortBy]);

  // Infinite scroll setup
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleProducts < filteredProducts.length) {
          setVisibleProducts(prev => Math.min(prev + 20, filteredProducts.length));
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [filteredProducts.length, visibleProducts]);

  // Reset visible products when filters change
  useEffect(() => {
    setVisibleProducts(12);
  }, [debouncedSearch, hideOutOfStock, selectedCategory, selectedType, sortBy]);

  const selectedTotal = useMemo(() => {
    return filteredProducts.reduce((sum, p) => {
      if (!selected[p.id]) return sum;
      return sum + p.price * (quantities[p.id] || 1);
    }, 0);
  }, [filteredProducts, selected, quantities]);

  const handleQtyChange = useCallback((id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  }, []);

  const handleAddToOrder = useCallback((prod: Product) => {
    setSelected((prev) => ({ ...prev, [prod.id]: !prev[prod.id] }));
    
    // Update localStorage
    const existingOrder = JSON.parse(localStorage.getItem('customerOrder') || '[]');
    const existingItemIndex = existingOrder.findIndex((item: any) => item.product.id === prod.id);
    
    if (existingItemIndex > -1) {
      existingOrder.splice(existingItemIndex, 1);
    } else {
      existingOrder.push({ product: prod, quantity: quantities[prod.id] || 1 });
    }
    
    localStorage.setItem('customerOrder', JSON.stringify(existingOrder));
    saveUserCart(existingOrder);
    window.dispatchEvent(new Event('orderUpdated'));
  }, [quantities, saveUserCart]);

  const handleClearOrder = useCallback(() => {
    setSelected({});
    localStorage.setItem('customerOrder', '[]');
    saveUserCart([]);
    window.dispatchEvent(new Event('orderUpdated'));
  }, [saveUserCart]);

  const handleReviewOrder = useCallback(() => {
    const itemsToReview = filteredProducts
      .filter((p) => selected[p.id])
      .map((p) => ({
        product: p,
        quantity: quantities[p.id] || 1,
      }));
    
    // Save to cart and navigate to checkout
    const cartItems = itemsToReview.map(item => ({
      id: item.product.id,
      item_id: item.product.item_id || item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      price: item.product.price,
      quantity: item.quantity,
      brand: item.product.brand,
      imageUrl: item.product.imageUrl
    }));
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    navigate('/customer/checkout');
  }, [filteredProducts, selected, quantities, navigate]);

  const isNewProduct = useCallback((product: Product) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (product.created_time) {
      return new Date(product.created_time) > thirtyDaysAgo;
    }
    
    return false;
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (!brandParam) {
    return (
      <div className={styles.empty}>
        <p>Please select a brand to view products.</p>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className={styles.empty}>
        <h2>No products found</h2>
        <p>No products available for {brandParam}.</p>
        <p>Please check back later or contact support.</p>
      </div>
    );
  }

  return (
    <div className={styles.customerProductsPage}>
      <ProgressBar currentStep={2} />
      
      <div className={styles.topBar}>
        <div className={styles.topBarControls}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          {types.length > 1 && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              {types.slice(1).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          )}

          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              {categories.slice(1).map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="none">Sort by</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'grid' ? styles.active : ''}
              onClick={() => setViewMode('grid')}
            >
              <FaTh />
            </button>
            <button
              className={viewMode === 'list' ? styles.active : ''}
              onClick={() => setViewMode('list')}
            >
              <FaList />
            </button>
          </div>

          <div className={styles.filterGroup}>
            <button
              className={`${styles.customToggle} ${!hideOutOfStock ? styles.active : ''}`}
              onClick={() => setHideOutOfStock(!hideOutOfStock)}
              aria-label="Toggle out of stock visibility"
            >
              <span className={styles.toggleTrack}>
                <span className={styles.toggleThumb} />
              </span>
            </button>
            <span className={styles.toggleLabel}>Hide out of stock</span>
          </div>
        </div>

        <div className={styles.orderSummary} onClick={() => setShowOrderModal(true)}>
          <span className={styles.orderTotal}>
            Total: <strong>£{selectedTotal.toFixed(2)}</strong>
            <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
              ({Object.values(selected).filter(Boolean).length} items)
            </span>
          </span>
          <div className={styles.orderSummaryButtons}>
            <button
              className={styles.reviewOrderBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleReviewOrder();
              }}
              disabled={selectedTotal === 0}
            >
              Review Order
            </button>
            <button
              className={styles.btnOutlineSecondary}
              onClick={(e) => {
                e.stopPropagation();
                handleClearOrder();
              }}
              disabled={selectedTotal === 0}
            >
              Clear Order
            </button>
          </div>
        </div>
      </div>

      <div className={styles.gridWrapper}>
        {viewMode === 'grid' ? (
          <>
            <div className={styles.productsGrid}>
              {filteredProducts.slice(0, visibleProducts).map((product) => (
                <CustomerProductCard
                  key={product.id}
                  product={product}
                  quantity={quantities[product.id] || 1}
                  onQuantityChange={(q) => handleQtyChange(product.id, q)}
                  onAddToOrder={() => handleAddToOrder(product)}
                  isSelected={!!selected[product.id]}
                  showNewBadge={isNewProduct(product)}
                  onQuickView={() => setQuickViewProduct(product)}
                />
              ))}
            </div>
            {visibleProducts < filteredProducts.length && (
              <div ref={loadMoreRef} className={styles.loadMoreTrigger} />
            )}
          </>
        ) : (
          <>
            <div className={styles.productsList}>
              {filteredProducts.slice(0, visibleProducts).map((product) => (
                <CustomerProductListItem
                  key={product.id}
                  product={product}
                  quantity={quantities[product.id] || 1}
                  isSelected={!!selected[product.id]}
                  onQuantityChange={(q) => handleQtyChange(product.id, q)}
                  onAddToOrder={() => handleAddToOrder(product)}
                  onQuickView={() => setQuickViewProduct(product)}
                />
              ))}
            </div>
            {visibleProducts < filteredProducts.length && (
              <div ref={loadMoreRef} className={styles.loadMoreTrigger} />
            )}
          </>
        )}
      </div>

      {quickViewProduct && (
        <CustomerQuickViewModal
          product={quickViewProduct}
          quantity={quantities[quickViewProduct.id] || 1}
          onQuantityChange={(q) => handleQtyChange(quickViewProduct.id, q)}
          onAddToOrder={() => handleAddToOrder(quickViewProduct)}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      <OrderSummaryModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        selectedItems={filteredProducts
          .filter((p) => selected[p.id])
          .map((p) => ({
            product: p,
            quantity: quantities[p.id] || 1
          }))}
        orderTotal={selectedTotal}
        onRemoveItem={(productId) => {
          setSelected(prev => ({ ...prev, [productId]: false }));
          const updatedOrder = filteredProducts
            .filter(p => selected[p.id] && p.id !== productId)
            .map(p => ({ product: p, quantity: quantities[p.id] || 1 }));
          localStorage.setItem('customerOrder', JSON.stringify(updatedOrder));
          saveUserCart(updatedOrder);
          window.dispatchEvent(new Event('orderUpdated'));
        }}
        onReviewOrder={() => {
          setShowOrderModal(false);
          handleReviewOrder();
        }}
        onClearOrder={() => {
          handleClearOrder();
          setShowOrderModal(false);
        }}
      />
    </div>
  );
}