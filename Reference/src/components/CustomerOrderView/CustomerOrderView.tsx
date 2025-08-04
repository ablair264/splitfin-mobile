// src/components/CustomerOrderView/CustomerOrderView.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { 
  FaArrowLeft, 
  FaPrint, 
  FaMapMarkerAlt, 
  FaShippingFast,
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaClipboardCheck,
  FaFileAlt,
  FaRedo
} from 'react-icons/fa';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import styles from './CustomerOrderView.module.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB3fpUZexx1zRETMigOVtWFUNDe9Xe_sfs';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ color: "#f5f1f2" }]
    },
    {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#ffffff" }]
    },
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [{ color: "#5c4a4f" }]
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#c58390" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#8a7a7f" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#e8e0e2" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#ede5e7" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#fefcfd" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#e8e0e2" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#d4c3c7" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#8a7a7f" }]
    }
  ]
};

interface OrderItem {
  id: string;
  item_id: string;
  name: string;
  sku: string;
  quantity: number;
  rate: number;
  total: number;
  brand?: string;
  quantity_shipped?: number;
  quantity_packed?: number;
  quantity_delivered?: number;
  line_item_id?: string;
  description?: string;
  item_total?: number;
  item_sub_total?: number;
}

interface Package {
  carrier?: string;
  tracking_number?: string;
  delivery_date?: string;
  shipment_date?: string;
  status?: string;
  service?: string;
  package_number?: string;
  quantity?: number;
  shipment_order?: {
    tracking_number?: string;
    tracking_url?: string;
    shipment_status?: string;
    delivery_date?: string;
  };
}

interface Order {
  id: string;
  salesorder_id: string;
  salesorder_number: string;
  date: string;
  total: number;
  status: string;
  line_items?: OrderItem[];
  line_items_count?: number;
  customer_id: string;
  customer_name: string;
  company_name?: string;
  shipping_address?: any;
  billing_address?: any;
  tracking_number?: string;
  delivery_date?: string;
  shipment_date?: string;
  created_time?: string;
  last_modified_time?: string;
  notes?: string;
  sub_total?: number;
  tax_total?: number;
  shipping_charges?: number;
  discount_amount?: number;
  discount_percent?: number;
  packages?: Package[];
  shipment_status?: string;
  current_sub_status?: string;
  shipped_status?: string;
  invoiced_status?: string;
  quantity?: number;
  quantity_shipped?: number;
  quantity_packed?: number;
  quantity_invoiced?: number;
}

interface TimelineStep {
  label: string;
  icon: React.ElementType;
  date?: string;
  active: boolean;
  completed: boolean;
}

const orderStatusSteps = [
  { key: 'confirmed', label: 'Order Confirmed', icon: FaClipboardCheck },
  { key: 'packed', label: 'Order Packed', icon: FaBox },
  { key: 'shipped', label: 'Order Shipped', icon: FaTruck },
  { key: 'delivered', label: 'Delivered', icon: FaCheckCircle }
];

export default function CustomerOrderView() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        setError('Please log in to view order details');
        return;
      }

      // Get customer ID from session storage or fetch it
      let customerId = sessionStorage.getItem('customerId');
      
      if (!customerId) {
        // Fetch customer data from customers collection using Firebase UID
        const customerQuery = query(
          collection(db, 'customers'),
          where('firebase_uid', '==', auth.currentUser.uid)
        );
        const customerSnapshot = await getDocs(customerQuery);
        
        if (customerSnapshot.empty) {
          setError('Customer profile not found');
          return;
        }

        const customerDoc = customerSnapshot.docs[0];
        customerId = customerDoc.id;
        setCustomerData(customerDoc.data());
        sessionStorage.setItem('customerId', customerId);
      } else {
        // Get customer data
        const customerDoc = await getDoc(doc(db, 'customers', customerId));
        if (customerDoc.exists()) {
          setCustomerData(customerDoc.data());
        }
      }

      // Load order from customers_orders subcollection
      const orderDoc = await getDoc(doc(db, 'customers', customerId, 'customers_orders', orderId));
      
      if (!orderDoc.exists()) {
        setError('Order not found');
        return;
      }

      const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;
      
      // Try to load the full order data from sales_orders collection if we have salesorder_id
      if (orderData.salesorder_id) {
        try {
          const salesOrderDoc = await getDoc(doc(db, 'sales_orders', orderData.salesorder_id));
          if (salesOrderDoc.exists()) {
            const salesOrderData = salesOrderDoc.data();
            console.log('Sales order data found:', salesOrderData);
            
            // Merge important fields from sales_orders
            if (salesOrderData.packages && !orderData.packages) {
              orderData.packages = salesOrderData.packages;
            }
            if (salesOrderData.shipping_address && !orderData.shipping_address) {
              orderData.shipping_address = salesOrderData.shipping_address;
            }
            if (salesOrderData.shipment_date && !orderData.shipment_date) {
              orderData.shipment_date = salesOrderData.shipment_date;
            }
            if (salesOrderData.shipped_status && !orderData.shipped_status) {
              orderData.shipped_status = salesOrderData.shipped_status;
            }
          }
        } catch (error) {
          console.error('Error fetching from sales_orders:', error);
        }
      }
      
      // If line_items is not present but line_items_count > 0, try to fetch from subcollection
      if ((!orderData.line_items || orderData.line_items.length === 0) && orderData.line_items_count && orderData.line_items_count > 0) {
        try {
          // Try the order_line_items subcollection first (actual Firebase structure)
          const orderLineItemsRef = collection(db, 'sales_orders', orderData.salesorder_id, 'order_line_items');
          const orderLineItemsSnapshot = await getDocs(orderLineItemsRef);
          
          if (!orderLineItemsSnapshot.empty) {
            orderData.line_items = orderLineItemsSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                item_id: data.item_id,
                name: data.name || data.item_name,
                sku: data.sku,
                quantity: data.quantity,
                rate: data.rate,
                total: data.item_total || data.total || (data.quantity * data.rate),
                brand: data.brand,
                quantity_shipped: data.quantity_shipped,
                quantity_packed: data.quantity_packed,
                quantity_delivered: data.quantity_delivered,
                description: data.description,
                line_item_id: data.line_item_id
              } as OrderItem;
            });
          } else {
            // Fallback to line_items subcollection in customers_orders
            const lineItemsRef = collection(db, 'customers', customerId, 'customers_orders', orderId, 'line_items');
            const lineItemsSnapshot = await getDocs(lineItemsRef);
            
            if (!lineItemsSnapshot.empty) {
              orderData.line_items = lineItemsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              } as OrderItem));
            }
          }
        } catch (error) {
          console.error('Error fetching line items subcollection:', error);
        }
      }
      
      // Extract tracking information from packages array
      if (orderData.packages && Array.isArray(orderData.packages) && orderData.packages.length > 0) {
        const firstPackage = orderData.packages[0];
        if (firstPackage.tracking_number || firstPackage.shipment_order?.tracking_number) {
          orderData.tracking_number = firstPackage.tracking_number || firstPackage.shipment_order?.tracking_number;
        }
        if (firstPackage.shipment_date) {
          orderData.shipment_date = firstPackage.shipment_date;
        }
        if (firstPackage.shipment_order?.delivery_date || firstPackage.delivery_date) {
          orderData.delivery_date = firstPackage.shipment_order?.delivery_date || firstPackage.delivery_date;
        }
      }
      
      // Log for debugging
      console.log('Order loaded:', {
        order_number: orderData.salesorder_number,
        line_items: orderData.line_items,
        line_items_count: orderData.line_items_count,
        status: orderData.status,
        current_sub_status: orderData.current_sub_status,
        shipment_status: orderData.shipment_status,
        packages: orderData.packages,
        shipping_address: orderData.shipping_address,
        tracking_number: orderData.tracking_number
      });
      
      setOrder(orderData);
      
      // Geocode shipping address for map
      const addressToGeocode = orderData.shipping_address || customerData?.address;
      if (addressToGeocode?.zip || addressToGeocode?.postal_code) {
        geocodePostcode(addressToGeocode.zip || addressToGeocode.postal_code, addressToGeocode.country || 'UK');
      }

    } catch (err) {
      console.error('Error loading order details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatAddress = (address?: any): string => {
    if (!address) return 'No address provided';
    
    const parts = [];
    if (address.attention) parts.push(address.attention);
    if (address.address || address.street) parts.push(address.address || address.street);
    if (address.street2) parts.push(address.street2);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip || address.postal_code) parts.push(address.zip || address.postal_code);
    if (address.country) parts.push(address.country);
    
    return parts.filter(Boolean).join(', ');
  };

  const getOrderTimeline = (order: Order): TimelineStep[] => {
    const status = order.status?.toLowerCase() || '';
    const shipmentStatus = order.shipment_status?.toLowerCase() || '';
    const shippedStatus = order.shipped_status?.toLowerCase() || '';
    const currentSubStatus = order.current_sub_status?.toLowerCase() || '';
    
    // Map closed/fulfilled status to delivered
    const isDelivered = status === 'delivered' || status === 'closed' || status === 'fulfilled' || shipmentStatus === 'delivered';
    const isShipped = isDelivered || status === 'shipped' || shipmentStatus === 'shipped' || shippedStatus === 'shipped' || shippedStatus === 'partially_shipped';
    const isPacked = isShipped || status === 'packed';
    const isConfirmed = isPacked || status === 'confirmed' || currentSubStatus !== 'draft';
    const isPartiallyShipped = shippedStatus === 'partially_shipped' || status === 'partially_shipped';
    
    const timeline: TimelineStep[] = [
      {
        label: 'Order Placed',
        icon: FaFileAlt,
        date: formatDate(order.date),
        active: true,
        completed: true
      },
      {
        label: 'Order Confirmed',
        icon: FaCheckCircle,
        date: isConfirmed ? formatDate(order.date) : undefined,
        active: isConfirmed && !isPacked,
        completed: isConfirmed
      },
      {
        label: 'Packed & Ready',
        icon: FaBox,
        date: isPacked ? formatDate(order.shipment_date || order.date) : undefined,
        active: isPacked && !isShipped,
        completed: isPacked
      },
      {
        label: 'Shipped',
        icon: FaTruck,
        date: isShipped && order.shipment_date ? formatDate(order.shipment_date) : undefined,
        active: isShipped && !isDelivered,
        completed: isShipped
      },
      {
        label: 'Delivered',
        icon: FaCheckCircle,
        date: isDelivered && order.delivery_date ? formatDate(order.delivery_date) : undefined,
        active: isDelivered,
        completed: isDelivered
      }
    ];

    return timeline;
  };

  const getOrderStatusIndex = (order: Order): number => {
    const status = order.status?.toLowerCase() || '';
    const shipmentStatus = order.shipment_status?.toLowerCase() || '';
    const shippedStatus = order.shipped_status?.toLowerCase() || '';
    const currentSubStatus = order.current_sub_status?.toLowerCase() || '';
    
    // Debug logging
    console.log('Order status check:', {
      salesorder_number: order.salesorder_number,
      status,
      currentSubStatus,
      shipmentStatus,
      shippedStatus
    });
    
    // Map closed/fulfilled status to delivered - check all conditions
    if (status === 'delivered' || status === 'closed' || status === 'fulfilled' || 
        currentSubStatus === 'closed' || shipmentStatus === 'delivered') {
      return 3; // Delivered
    }
    if (status === 'shipped' || shipmentStatus === 'shipped' || shippedStatus === 'shipped' || shippedStatus === 'partially_shipped') return 2;
    if (status === 'packed') return 1;
    if (status === 'confirmed' || (currentSubStatus && currentSubStatus !== 'draft')) return 0;
    
    return -1;
  };

  const handleBack = () => {
    navigate('/customer/orders');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReorder = () => {
    // Navigate to new order with items pre-filled
    navigate('/customer/new-order', { state: { reorderItems: order?.line_items } });
  };
  
  const geocodePostcode = async (postcode: string, country: string = 'UK') => {
    if (!postcode) return;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode)},${country}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setMapCenter({ lat: location.lat, lng: location.lng });
      }
    } catch (err) {
      console.error('Error geocoding postcode:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Error loading order</h3>
        <p>{error || 'Order not found'}</p>
        <button onClick={handleBack} className={styles.backButton}>
          <FaArrowLeft /> Back to Orders
        </button>
      </div>
    );
  }

  const currentStatusIndex = getOrderStatusIndex(order);
  const timeline = getOrderTimeline(order);
  const isDelivered = order.status?.toLowerCase() === 'delivered' || 
                     order.status?.toLowerCase() === 'closed' || 
                     order.status?.toLowerCase() === 'fulfilled' ||
                     order.shipment_status?.toLowerCase() === 'delivered';

  return (
    <div className={styles.orderDetailContainer}>
      {/* Header */}
      <div className={styles.orderHeader}>
        <button onClick={handleBack} className={styles.backButton}>
          <FaArrowLeft />
        </button>
        <div className={styles.headerActions}>
          <button onClick={handlePrint} className={styles.actionButton} title="Print">
            <FaPrint />
          </button>
          {isDelivered && (
            <button onClick={handleReorder} className={styles.actionButton} title="Reorder">
              <FaRedo />
            </button>
          )}
        </div>
      </div>

      {/* Timeline Progress - Moved Above */}
      <div className={styles.orderTimeline}>
        <div className={styles.timelineProgress}>
          <div 
            className={styles.timelineProgressBar}
            style={{ width: `${((currentStatusIndex + 1) / timeline.length) * 100}%` }}
          />
        </div>
        <div className={styles.timelineSteps}>
          {timeline.map((step, index) => (
            <div 
              key={index} 
              className={`${styles.timelineStep} ${step.completed ? styles.completed : ''} ${step.active ? styles.active : ''}`}
            >
              <div className={styles.timelineIcon}>
                <step.icon />
              </div>
              <div className={styles.timelineLabel}>{step.label}</div>
              {step.date && <div className={styles.timelineDate}>{step.date}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Top Cards Row */}
      <div className={styles.topCardsRow}>
        {/* Order Status Card */}
        <div className={styles.statusCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Sales Order No.</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
              <h2 className={styles.orderNumber}>#{order.salesorder_number}</h2>
              <div style={{ fontSize: '14px', color: '#5c4a4f' }}>
                <div style={{ fontWeight: '600', color: '#2d1b20' }}>Order Date</div>
                <div style={{ color: '#5c4a4f' }}>{formatDate(order.date)}</div>
              </div>
            </div>
          </div>
          <div className={styles.statusSteps}>
            {orderStatusSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              
              return (
                <div 
                  key={step.key} 
                  className={`${styles.statusStep} ${isActive ? styles.active : ''} ${isCurrent ? styles.current : ''}`}
                >
                  <div className={styles.statusIcon}>
                    <Icon />
                  </div>
                  <span className={styles.statusLabel}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracking Information Card */}
        <div className={styles.trackingCard}>
          <h3 className={styles.cardTitle}>Tracking Information</h3>
          {(order.packages && order.packages.length > 0 && order.packages.some(pkg => pkg.tracking_number)) || order.tracking_number ? (
            <div className={styles.trackingDetails}>
              {order.packages && order.packages.length > 0 ? (
                order.packages.map((pkg, index) => (
                  <div key={index} style={{ marginBottom: index < order.packages!.length - 1 ? '15px' : '0' }}>
                    {pkg.tracking_number && (
                      <div className={styles.trackingInfo}>
                        <span className={styles.label}>Tracking Number {order.packages!.length > 1 ? `(Package ${index + 1})` : ''}</span>
                        <span className={styles.trackingNumber}>{pkg.tracking_number}</span>
                      </div>
                    )}
                    {pkg.carrier && (
                      <div className={styles.deliveryInfo}>
                        <span className={styles.label}>Carrier</span>
                        <span className={styles.deliveryDate}>{pkg.carrier}</span>
                      </div>
                    )}
                    {pkg.service && (
                      <div className={styles.deliveryInfo}>
                        <span className={styles.label}>Service</span>
                        <span className={styles.deliveryDate}>{pkg.service}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : order.tracking_number ? (
                <div className={styles.trackingInfo}>
                  <span className={styles.label}>Tracking Number</span>
                  <span className={styles.trackingNumber}>{order.tracking_number}</span>
                </div>
              ) : null}
              {order.shipment_date && (
                <div className={styles.deliveryInfo}>
                  <span className={styles.label}>Shipment Date</span>
                  <span className={styles.deliveryDate}>{formatDate(order.shipment_date)}</span>
                </div>
              )}
              {order.delivery_date && (
                <div className={styles.deliveryInfo}>
                  <span className={styles.label}>Delivery Date</span>
                  <span className={styles.deliveryDate}>{formatDate(order.delivery_date)}</span>
                </div>
              )}
              {order.shipped_status === 'partially_shipped' && (
                <div className={styles.deliveryInfo} style={{ marginTop: '10px' }}>
                  <span className={styles.label} style={{ color: '#e67e22' }}>Status</span>
                  <span className={styles.deliveryDate} style={{ color: '#e67e22', fontWeight: '600' }}>Partially Shipped</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.trackingDetails}>
              <p style={{ textAlign: 'center', color: '#8a7a7f' }}>
                No tracking information available yet
              </p>
            </div>
          )}
        </div>

        {/* Shipping Details Card */}
        <div className={styles.shippingCard}>
          <h3 className={styles.cardTitle}>Shipping Details</h3>
          <div className={styles.shippingContent}>
            <div className={styles.addressDetails}>
              <div className={styles.addressGrid}>
                <div className={styles.addressLine} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.label}>Address</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(order.shipping_address?.address || order.shipping_address?.street) && (
                      <span className={styles.value} style={{ color: '#2d1b20' }}>
                        {order.shipping_address.address || order.shipping_address.street}
                      </span>
                    )}
                    {order.shipping_address?.street2 && (
                      <span className={styles.value} style={{ color: '#2d1b20' }}>
                        {order.shipping_address.street2}
                      </span>
                    )}
                    {(order.shipping_address?.city || order.shipping_address?.state || order.shipping_address?.zip) && (
                      <span className={styles.value} style={{ color: '#2d1b20' }}>
                        {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.zip]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    )}
                    {order.shipping_address?.country && (
                      <span className={styles.value} style={{ color: '#2d1b20' }}>
                        {order.shipping_address.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.mapContainer}>
              {mapCenter ? (
                <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={15}
                    options={mapOptions}
                  >
                    <Marker position={mapCenter} />
                  </GoogleMap>
                </LoadScript>
              ) : (
                <div className={styles.mapPlaceholder}>
                  <FaMapMarkerAlt />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Section */}
      <div className={styles.orderDetailsSection}>
        <div className={styles.detailsGrid}>
          {/* Order Items Card */}
          <div className={styles.orderItemsCard}>
            <h3>Order Items</h3>
            
            <div className={styles.itemsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.tableRow}>
                  <div className={styles.tableCell}>Item</div>
                  <div className={styles.tableCell}>SKU</div>
                  <div className={styles.tableCell}>Qty</div>
                  <div className={styles.tableCell}>Rate</div>
                  <div className={styles.tableCell}>Total</div>
                </div>
              </div>
              <div className={styles.tableBody}>
                {order.line_items?.map((item, index) => (
                  <div key={item.id || index} className={styles.tableRow}>
                    <div className={styles.tableCell} data-label="Item">
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.name}</span>
                        {item.brand && <span className={styles.itemBrand}>{item.brand}</span>}
                        {order.shipped_status === 'partially_shipped' && item.quantity_shipped !== undefined && item.quantity_shipped < item.quantity && (
                          <span className={styles.itemBrand} style={{ color: '#e67e22' }}>
                            ({item.quantity_shipped} of {item.quantity} shipped)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.tableCell} data-label="SKU">{item.sku}</div>
                    <div className={styles.tableCell} data-label="Qty">{item.quantity}</div>
                    <div className={styles.tableCell} data-label="Rate">{formatCurrency(item.rate)}</div>
                    <div className={styles.tableCell} data-label="Total">
                      <strong>{formatCurrency(item.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.orderSummary}>
              {order.sub_total !== undefined && (
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.sub_total)}</span>
                </div>
              )}
              {order.discount_amount !== undefined && order.discount_amount > 0 && (
                <div className={styles.summaryRow}>
                  <span>
                    Discount
                    {order.discount_percent !== undefined && ` (${order.discount_percent}%)`}
                  </span>
                  <span className={styles.discount}>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.tax_total !== undefined && order.tax_total > 0 && (
                <div className={styles.summaryRow}>
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_total)}</span>
                </div>
              )}
              {order.shipping_charges !== undefined && order.shipping_charges > 0 && (
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping_charges)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Order Actions */}
            {isDelivered && (
              <div className={styles.orderActions}>
                <button onClick={handleReorder} className={styles.reorderBtn}>
                  <FaRedo /> Reorder Items
                </button>
              </div>
            )}
          </div>

          {/* Additional Order Information */}
          {order.notes && (
            <div className={styles.notesSection}>
              <h3>Order Notes</h3>
              <p>{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
