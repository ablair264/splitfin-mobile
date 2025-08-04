import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, limit, onSnapshot, updateDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  FaArrowLeft, 
  FaFileInvoice, 
  FaPrint, 
  FaEdit, 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaShippingFast,
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaWarehouse,
  FaClipboardCheck,
  FaEye,
  FaCalendar,
  FaPlus,
  FaRoute,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { ProgressLoader } from './ProgressLoader';
import styles from './ViewOrder.module.css';

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
      elementType: "geometry",
      stylers: [{ color: "#1a1f2a" }]
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#0f1419" }]
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#8b98a5" }]
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#79d5e9" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4daeac" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#2c3e50" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4daeac" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#2c3e50" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1a1f2a" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#79d5e9" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#34495e" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1a1f2a" }]
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#79d5e9" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2c3e50" }]
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4daeac" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0f1419" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4daeac" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#0f1419" }]
    }
  ]
};

interface SalesOrder {
  id: string;
  salesorder_id: string;
  salesorder_number: string;
  customer_id: string;
  customer_name: string;
  company_name: string;
  date: string;
  created_time: string;
  total: number;
  status: string;
  current_sub_status: string;
  salesperson_id: string;
  salesperson_name: string;
  shipping_address?: Address;
  billing_address?: Address;
  notes?: string;
  sub_total?: number;
  sub_total_exclusive_of_discount?: number;
  tax_total?: number;
  shipping_charges?: number;
  adjustment?: number;
  discount?: number;
  discount_amount?: number;
  discount_percent?: number;
  courier?: string;
  tracking_number?: string;
  delivery_date?: string;
  shipped_status?: string;
  packages?: any;
  line_items?: any;
  mobile?: string;
  first_name?: string;
  last_name?: string;
  contact_person_email?: string;
  invoice_split?: boolean;
  invoices?: any[];
  ship_live?: ShipLiveData; // NEW: Live shipping data from ShipStation
  [key: string]: any;
}

// NEW: ShipStation live tracking data structure
interface ShipLiveData {
  shipstation_shipment_id?: string;
  tracking_updates?: TrackingUpdate[];
  current_status?: string;
  estimated_delivery?: string;
  carrier_status?: string;
  last_updated?: string;
  delivery_confirmation?: {
    delivered_at?: string;
    signed_by?: string;
    delivery_notes?: string;
  };
}

interface TrackingUpdate {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
  carrier_status_code?: string;
}

interface LineItem {
  id: string;
  item_id: string;
  item_name: string;
  name?: string;
  sku: string;
  quantity: number;
  quantity_shipped?: number;
  rate: number;
  total: number;
  item_total?: number;
  brand?: string;
  discount?: number;
  tax?: number;
}

interface Address {
  address?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  zip?: string;
  phone?: string;
  attention?: string;
}

interface Customer {
  id: string;
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  shipping_address?: Address;
  billing_address?: Address;
  website?: string;
  contact_persons?: any[];
  outstanding_receivable_amount?: number;
  unused_credits_receivable_amount?: number;
}

const orderStatusSteps = [
  { key: 'confirmed', label: 'Order Confirmed', icon: FaClipboardCheck },
  { key: 'sent_to_warehouse', label: 'Sent to Warehouse', icon: FaWarehouse },
  { key: 'packed', label: 'Order Packed', icon: FaBox },
  { key: 'shipped', label: 'Order Shipped', icon: FaTruck },
  { key: 'delivered', label: 'Delivered', icon: FaCheckCircle }
];

type TabFilter = 'all' | 'shipped' | 'partial' | 'awaiting';

export default function ViewOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  
  // NEW: Real-time tracking state
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [activePackageTab, setActivePackageTab] = useState(0);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
      
      // NEW: Set up real-time listener for shipping updates
      const unsubscribe = onSnapshot(
        doc(db, 'sales_orders', orderId),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const updatedOrder = { id: docSnapshot.id, ...docSnapshot.data() } as SalesOrder;
            setOrder(prev => ({
              ...prev,
              ...updatedOrder,
              // Preserve loaded line items if they exist
              line_items: prev?.line_items || updatedOrder.line_items
            }));
          }
        },
        (error) => {
          console.error('Error listening to order updates:', error);
        }
      );

      return () => unsubscribe();
    }
  }, [orderId]);

  // Reset activePackageTab when order changes or if tab is out of bounds
  useEffect(() => {
    if (order?.packages) {
      const packageCount = Object.keys(order.packages).length;
      if (activePackageTab >= packageCount) {
        setActivePackageTab(0);
      }
    }
  }, [order?.packages, activePackageTab]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load order
      const orderDoc = await getDoc(doc(db, 'sales_orders', orderId));
      if (!orderDoc.exists()) {
        setError('Order not found');
        return;
      }

      const orderData = { id: orderDoc.id, ...orderDoc.data() } as SalesOrder;
      setOrder(orderData);

      // Load line items from the order document
      if (orderData.line_items && Array.isArray(orderData.line_items)) {
        const items: LineItem[] = orderData.line_items.map((item: any, index: number) => ({
          id: item.line_item_id || `item-${index}`,
          item_id: item.item_id,
          item_name: item.item_name || item.name,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          quantity_shipped: item.quantity_shipped || 0,
          rate: item.rate,
          total: item.total || item.item_total,
          item_total: item.item_total,
          brand: item.brand,
          discount: item.discount,
          tax: item.tax_percentage
        }));
        setLineItems(items);
      }

      // Load customer details
      if (orderData.customer_id) {
        try {
          // First try to find by document ID
          const customerDoc = await getDoc(doc(db, 'customers', orderData.customer_id));
          
          if (customerDoc.exists()) {
            const customerData = { 
              id: customerDoc.id, 
              ...customerDoc.data() 
            } as Customer;
            setCustomer(customerData);
            
            // Geocode shipping address after customer data is loaded
            const postcode = orderData.shipping_address?.zip || customerData.shipping_address?.zip;
            if (postcode) {
              geocodePostcode(postcode);
            }
          } else {
            // If not found by ID, try searching by zoho_customer_id
            const customerQuery = query(
              collection(db, 'customers'),
              where('zoho_customer_id', '==', orderData.customer_id),
              limit(1)
            );
            const customerSnapshot = await getDocs(customerQuery);
            if (!customerSnapshot.empty) {
              const customerData = { 
                id: customerSnapshot.docs[0].id, 
                ...customerSnapshot.docs[0].data() 
              } as Customer;
              setCustomer(customerData);
              
              // Geocode shipping address after customer data is loaded
              const postcode = orderData.shipping_address?.zip || customerData.shipping_address?.zip;
              if (postcode) {
                geocodePostcode(postcode);
              }
            } else {
              // If no customer data, try to geocode with just order data
              const postcode = orderData.shipping_address?.zip;
              if (postcode) {
                geocodePostcode(postcode);
              }
            }
          }
        } catch (err) {
          console.error('Error loading customer:', err);
          // Try to geocode with just order data if customer fetch fails
          const postcode = orderData.shipping_address?.zip;
          if (postcode) {
            geocodePostcode(postcode);
          }
        }
      }

      // Check for invoices
      if (orderData.salesorder_id) {
        try {
          const invoiceQuery = query(
            collection(db, 'invoices'),
            where('salesorder_id', '==', orderData.salesorder_id)
          );
          const invoiceSnapshot = await getDocs(invoiceQuery);
          if (!invoiceSnapshot.empty) {
            const invoicesData = invoiceSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setInvoices(invoicesData);
            setInvoice(invoicesData[0]); // Set the first invoice as primary
          }
        } catch (err) {
          console.error('Error loading invoices:', err);
        }
      }

      // Set invoices from order data if available
      if (orderData.invoices && Array.isArray(orderData.invoices)) {
        setInvoices(orderData.invoices);
      }

      // Fetch company logo
      if (orderData.contact_person_email) {
        fetchCompanyLogo(orderData.contact_person_email);
      }

    } catch (err) {
      console.error('Error loading order details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to manually refresh tracking data from ShipStation
  const refreshTrackingData = async () => {
    if (!order?.id) return;
    
    setTrackingLoading(true);
    setTrackingError(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/refresh-tracking/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh tracking data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // The onSnapshot listener will automatically update the order data
        console.log('Tracking data refreshed successfully');
      } else {
        setTrackingError(result.error || 'Failed to refresh tracking data');
      }
    } catch (err) {
      console.error('Error refreshing tracking data:', err);
      setTrackingError(err instanceof Error ? err.message : 'Failed to refresh tracking data');
    } finally {
      setTrackingLoading(false);
    }
  };

  // NEW: Get the latest tracking status
  const getLatestTrackingStatus = (): { status: string; description: string; timestamp?: string } => {
    if (!order?.ship_live?.tracking_updates || order.ship_live.tracking_updates.length === 0) {
      return { status: 'unknown', description: 'No tracking information available' };
    }
    
    const latest = order.ship_live.tracking_updates
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    return {
      status: latest.status,
      description: latest.description,
      timestamp: latest.timestamp
    };
  };

  // NEW: Get tracking status icon
  const getTrackingStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <FaCheckCircle style={{ color: '#22c55e' }} />;
      case 'in_transit':
      case 'out_for_delivery':
        return <FaTruck style={{ color: '#79d5e9' }} />;
      case 'exception':
      case 'delivery_exception':
        return <FaExclamationTriangle style={{ color: '#ef4444' }} />;
      default:
        return <FaClock style={{ color: '#8b98a5' }} />;
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatAddress = (address?: Address): string => {
    if (!address) return 'No address provided';
    
    const parts = [];
    if (address.attention) parts.push(address.attention);
    if (address.address || address.street) parts.push(address.address || address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip) parts.push(address.zip);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  };

  const getOrderStatusIndex = (order: SalesOrder): number => {
    // Use live tracking data if available
    if (order.ship_live?.current_status) {
      const status = order.ship_live.current_status.toLowerCase();
      if (status === 'delivered') return 4;
      if (status.includes('transit') || status.includes('shipped')) return 3;
      if (status.includes('packed') || status.includes('ready')) return 2;
    }
    
    // Fallback to existing logic
    if (!order.packages || Object.keys(order.packages).length === 0) {
      return 1; // Sent to warehouse (packages field is empty)
    }
    
    // Check if any package has shipment info
    const hasShipmentInfo = Object.values(order.packages).some((pkg: any) => 
      pkg.shipment_order && pkg.shipment_order.shipment_date
    );
    
    if (hasShipmentInfo) {
      // Check if any shipment date has passed
      const hasShippedPackages = Object.values(order.packages).some((pkg: any) => {
        if (pkg.shipment_order?.shipment_date) {
          const shipmentDate = new Date(pkg.shipment_order.shipment_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day
          return shipmentDate <= today;
        }
        return false;
      });
      
      // Check if delivered
      const isDelivered = order.current_sub_status?.toLowerCase() === 'delivered' || 
                         order.status?.toLowerCase() === 'delivered' ||
                         order.ship_live?.current_status?.toLowerCase() === 'delivered';
      
      if (isDelivered) {
        return 4; // Delivered
      } else if (hasShippedPackages) {
        return 3; // Shipped (shipment date has passed)
      } else {
        return 2; // Packed (has shipment info but date hasn't passed yet)
      }
    }
    
    return 2; // Packed (packages exist but not shipped)
  };

  const getLineItemStatus = (item: LineItem): string => {
    const shipped = item.quantity_shipped || 0;
    const total = item.quantity;
    
    if (shipped === 0) return 'awaiting';
    if (shipped < total) return 'partial';
    return 'shipped';
  };

  const filterLineItems = (items: LineItem[]): LineItem[] => {
    if (activeTab === 'all') return items;
    
    return items.filter(item => {
      const status = getLineItemStatus(item);
      return status === activeTab;
    });
  };

  const fetchCompanyLogo = async (email: string) => {
    if (!email) return;
    
    const domain = email.split('@')[1];
    const commonDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com'];
    
    if (commonDomains.includes(domain)) {
      return;
    }
    
    try {
      // Try to fetch logo from clearbit or similar service
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      const response = await fetch(logoUrl);
      if (response.ok) {
        setCompanyLogo(logoUrl);
      }
    } catch (err) {
      console.error('Error fetching company logo:', err);
    }
  };

  const geocodePostcode = async (postcode: string) => {
    if (!postcode) return;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode)},UK&key=${GOOGLE_MAPS_API_KEY}`
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

  const getCourierLogo = (carrier: string): string => {
    const carrierLower = carrier?.toLowerCase() || '';
    if (carrierLower === 'ups') return '/ups.png';
    if (carrierLower === 'royal mail') return '/royalmail.png';
    if (carrierLower === 'dpd') return '/dpd.png';
    return '/courier.png';
  };

  const handleBack = () => {
    navigate('/orders');
  };

  const handleViewInvoice = (invoiceId?: string) => {
    if (invoiceId) {
      navigate(`/invoice/${invoiceId}`);
    } else if (invoices && invoices.length > 0) {
      const firstInvoice = invoices[0];
      if (firstInvoice.invoice_id) {
        navigate(`/invoice/${firstInvoice.invoice_id}`);
      } else if (firstInvoice.id) {
        navigate(`/invoice/${firstInvoice.id}`);
      }
    }
  };

  const handleGenerateInvoice = () => {
    navigate('/invoice/new', { state: { orderId: order?.id, orderData: order } });
  };

  const handleEditInvoice = () => {
    if (invoice) {
      navigate(`/invoice/edit/${invoice.id}`, { state: { orderId: order?.id, orderData: order } });
    }
  };

  const handleGenerateAdditionalInvoice = () => {
    navigate('/invoice/new', { state: { orderId: order?.id, orderData: order, isAdditional: true } });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    console.log('Edit order:', orderId);
  };

  const handleApproveOrder = async () => {
    if (!order || !window.confirm('Are you sure you want to approve this order?')) return;
    
    setApproving(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://splitfin-zoho-api.onrender.com';
      
      // Update status in Zoho
      const zohoUpdateResponse = await fetch(`${apiUrl}/api/zoho/update-salesorder-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          salesorder_id: order.salesorder_id,
          status: 'confirmed'
        })
      });
      
      if (!zohoUpdateResponse.ok) {
        throw new Error('Failed to update order status in Zoho');
      }
      
      // Update status in Firebase
      await updateDoc(doc(db, 'sales_orders', order.id), {
        status: 'confirmed',
        current_sub_status: 'confirmed',
        approvedBy: auth.currentUser?.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Send approval email
      await fetch(`${apiUrl}/api/emails/order-approved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: order.customer_name ? (customer?.email || order.contact_person_email) : '',
          customerName: order.customer_name,
          orderNumber: order.reference_number || order.id,
          zohoOrderNumber: order.salesorder_number,
          items: lineItems.map(item => ({
            name: item.item_name || item.name,
            sku: item.sku,
            price: item.rate,
            quantity: item.quantity
          })),
          subtotal: order.sub_total || 0,
          vat: order.tax_total || 0,
          total: order.total || 0,
          shippingAddress: {
            address1: order.shipping_address?.address || order.shipping_address?.street || '',
            street2: order.shipping_address?.street2 || '',
            city: order.shipping_address?.city || '',
            county: order.shipping_address?.state || '',
            postcode: order.shipping_address?.zip || ''
          },
          purchaseOrderNumber: order.reference_number || '',
          deliveryNotes: order.notes || ''
        })
      });
      
      // Create notification for customer
      if (order.customer_id) {
        await addDoc(collection(db, 'notifications'), {
          type: 'order_approved',
          recipientId: order.customer_id,
          title: 'Order Approved',
          message: `Your order ${order.salesorder_number} has been approved and is being processed.`,
          createdAt: new Date().toISOString(),
          read: false,
          data: {
            orderId: order.id,
            orderNumber: order.salesorder_number,
            zohoOrderId: order.salesorder_id
          }
        });
      }
      
      alert('Order approved successfully!');
      
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <ProgressLoader
          progress={50}
          messages={[
            'Loading order details...',
            'Fetching line items...',
            'Getting customer information...'
          ]}
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Error loading order</h3>
        <p>{error || 'Order not found'}</p>
        <button onClick={handleBack} className={styles.adminBackButton}>
          <FaArrowLeft /> Back to Orders
        </button>
      </div>
    );
  }

  const currentStatusIndex = getOrderStatusIndex(order);
  const filteredItems = filterLineItems(lineItems);
  const latestTracking = getLatestTrackingStatus();

  return (
    <div className={styles.orderDetailContainer}>
      {/* Header */}
      <div className={styles.orderHeader}>
        <button onClick={handleBack} className={styles.adminBackButton}>
          <FaArrowLeft />
        </button>
        <div className={styles.headerActions}>
          {/* Show Approve button for draft/pending orders */}
          {(order?.status === 'draft' || order?.status === 'pending' || order?.status === 'pending_approval') && (
            <button 
              onClick={handleApproveOrder} 
              disabled={approving}
              className={styles.actionButtonPrimary} 
              title="Approve Order"
              style={{
                background: 'linear-gradient(135deg, #61bc8e 0%, #4daeac 100%)',
                color: '#0f1419',
                fontWeight: '600',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: approving ? 'not-allowed' : 'pointer',
                opacity: approving ? 0.6 : 1
              }}
            >
              {approving ? 'Approving...' : 'Approve Order'}
            </button>
          )}
          {invoices.length > 0 ? (
            <>
              <button onClick={() => handleViewInvoice()} className={styles.actionButton} title="View Invoice">
                <FaFileInvoice />
              </button>
              <button onClick={handleEditInvoice} className={styles.actionButton} title="Edit Invoice">
                <FaEdit />
              </button>
              {order?.invoice_split && (
                <button onClick={handleGenerateAdditionalInvoice} className={styles.actionButton} title="Generate Additional Invoice">
                  <FaPlus />
                </button>
              )}
            </>
          ) : (
            <button onClick={handleGenerateInvoice} className={styles.actionButton} title="Generate Invoice">
              <FaFileInvoice />
            </button>
          )}
          <button onClick={handlePrint} className={styles.actionButton} title="Print">
            <FaPrint />
          </button>
          <button onClick={handleEdit} className={styles.actionButton} title="Edit Order">
            <FaEdit />
          </button>
        </div>
      </div>

      {/* Customer Details Card - Full Width, Compact */}
      <div className={styles.customerDetailsCard} style={{ width: '100%', marginBottom: '20px', padding: '16px 24px' }}>
        <div className={styles.customerHeader} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
            <div className={styles.customerAvatar} style={{ width: '40px', height: '40px', fontSize: '18px' }}>
              {companyLogo ? (
                <img src={companyLogo} alt="Company logo" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              ) : (
                order.customer_name.charAt(0).toUpperCase()
              )}
            </div>
            <h3 style={{ fontSize: '16px', display: 'inline', margin: 0 }}>Customer Details</h3>
          </div>
        </div>
        
        <div className={styles.customerInfo} style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className={styles.infoGroup}>
            <span className={styles.label}>Customer</span>
            <span className={styles.value}>{order.customer_name}</span>
            {order.company_name && (
              <span className={styles.value} style={{ fontSize: '13px', opacity: 0.8 }}>{order.company_name}</span>
            )}
          </div>
          
          {(order.mobile || customer?.mobile || customer?.phone) && (
            <div className={styles.infoGroup}>
              <span className={styles.label}>Phone</span>
              <span className={styles.value}>{order.mobile || customer?.mobile || customer?.phone}</span>
            </div>
          )}
          
          {(order.contact_person_email || customer?.email) && (
            <div className={styles.infoGroup}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{order.contact_person_email || customer?.email}</span>
            </div>
          )}
          
          {customer && (
            <>
              {customer.outstanding_receivable_amount !== undefined && (
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Outstanding</span>
                  <span className={styles.value}>{formatCurrency(customer.outstanding_receivable_amount)}</span>
                </div>
              )}
              {customer.unused_credits_receivable_amount !== undefined && customer.unused_credits_receivable_amount > 0 && (
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Credits</span>
                  <span className={styles.value}>{formatCurrency(customer.unused_credits_receivable_amount)}</span>
                </div>
              )}
            </>
          )}
          
          <button
          onClick={() => navigate(`/customer/${order.customer_id}`)}
          className={styles.viewCustomerButton}
          style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: '13px' }}
          >
          <FaEye /> View Customer
          </button>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className={styles.topCardsRow}>
        {/* Order Status Card */}
        <div className={styles.statusCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Sales Order No.</span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
              <h2 className={styles.adminOrderNumber}>#{order.salesorder_number}</h2>
              <div className={styles.adminCardTitle}>
                <div style={{ fontWeight: '600' }}>Order Date</div>
                <div>{formatDate(order.date)}</div>
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

        {/* Enhanced Package Information Card with Live Tracking */}
        <div className={styles.courierCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.adminCardTitle}>Package Information</h3>
            {order.ship_live && (
              <button 
                onClick={refreshTrackingData}
                disabled={trackingLoading}
                className={styles.actionButtonSecondary}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                title="Refresh tracking data"
              >
                {trackingLoading ? <FaClock /> : <FaRoute />}
              </button>
            )}
          </div>

          {/* Live Tracking Status */}
          {order.ship_live && (
            <div style={{ 
              background: 'rgba(121, 213, 233, 0.1)', 
              border: '1px solid rgba(121, 213, 233, 0.2)',
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '16px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {getTrackingStatusIcon(latestTracking.status)}
                <span style={{ fontWeight: '600', color: '#ffffff' }}>
                  {latestTracking.description}
                </span>
              </div>
              {latestTracking.timestamp && (
                <div style={{ fontSize: '12px', color: '#8b98a5' }}>
                  Last updated: {formatDateTime(latestTracking.timestamp)}
                </div>
              )}
              {order.ship_live.estimated_delivery && (
                <div style={{ fontSize: '12px', color: '#79d5e9', marginTop: '4px' }}>
                  Estimated delivery: {formatDate(order.ship_live.estimated_delivery)}
                </div>
              )}
            </div>
          )}

          {/* Package Details */}
          {order.packages && Object.keys(order.packages).length > 0 ? (
            <>
              {/* Package tabs */}
              {Object.keys(order.packages).length > 1 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '16px',
                  borderBottom: '1px solid rgba(121, 213, 233, 0.2)',
                  paddingBottom: '8px'
                }}>
                  {Object.entries(order.packages).map(([key, pkg]: [string, any], index) => (
                    <button
                      key={key}
                      onClick={() => setActivePackageTab(index)}
                      style={{
                        padding: '8px 16px',
                        background: activePackageTab === index 
                          ? 'rgba(121, 213, 233, 0.2)' 
                          : 'transparent',
                        border: '1px solid',
                        borderColor: activePackageTab === index 
                          ? '#79d5e9' 
                          : 'rgba(121, 213, 233, 0.2)',
                        borderRadius: '8px',
                        color: activePackageTab === index ? '#79d5e9' : '#8b98a5',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '14px',
                        fontWeight: activePackageTab === index ? '600' : '500',
                        outline: 'none'
                      }}
                    >
                      Package {index + 1}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Active package details */}
              {(() => {
                if (!order.packages) return null;
                const packageEntries = Object.entries(order.packages);
                if (!packageEntries.length || activePackageTab >= packageEntries.length) return null;
                const [key, pkg] = packageEntries[activePackageTab] as [string, any];
                return (
                  <div key={key}>
                    {pkg.shipment_order?.carrier && (
                      <div className={styles.courierLogo}>
                        <img 
                          src={getCourierLogo(pkg.shipment_order.carrier)} 
                          alt={pkg.shipment_order.carrier} 
                          style={{ width: '60px', height: 'auto' }}
                        />
                      </div>
                    )}
                    <div className={styles.courierDetails}>
                      <div className={styles.trackingInfo}>
                        <span className={styles.label}>Package #</span>
                        <span className={styles.value}>{pkg.package_number || key}</span>
                      </div>
                      {pkg.quantity && (
                        <div className={styles.trackingInfo}>
                          <span className={styles.label}>Quantity</span>
                          <span className={styles.value}>{pkg.quantity}</span>
                        </div>
                      )}
                      {pkg.shipment_order?.shipment_number && (
                        <div className={styles.trackingInfo}>
                          <span className={styles.label}>Shipment #</span>
                          <span className={styles.value}>{pkg.shipment_order.shipment_number}</span>
                        </div>
                      )}
                      {(pkg.shipment_order?.tracking_number || order.ship_live?.shipstation_shipment_id) && (
                        <div className={styles.trackingInfo}>
                          <span className={styles.label}>Tracking #</span>
                          <span className={styles.trackingNumber}>
                            {pkg.shipment_order?.tracking_number || order.ship_live?.shipstation_shipment_id}
                          </span>
                        </div>
                      )}
                      {pkg.shipment_order?.shipment_date && (
                        <div className={styles.deliveryInfo}>
                          <span className={styles.label}>Shipment Date</span>
                          <span className={styles.deliveryDate}>{formatDate(pkg.shipment_order.shipment_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className={styles.courierDetails}>
              <p style={{ textAlign: 'center', color: '#666' }}>No package information available</p>
            </div>
          )}

          {/* Tracking Error Display */}
          {trackingError && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px', 
              padding: '12px', 
              marginTop: '12px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaExclamationTriangle style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '12px', color: '#ef4444' }}>
                  {trackingError}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Shipping Details Card */}
        <div className={styles.shippingCard}>
          <h3 className={styles.adminCardTitle}>Shipping Details</h3>
          <div className={styles.shippingContent} style={{ gridTemplateColumns: '1.5fr 1fr' }}>
            <div className={styles.addressDetails}>
              <div className={styles.addressGrid} style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                <div className={styles.addressLine} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.label}>Address</span>
                  <span className={styles.value}>
                    {order.shipping_address?.address || order.shipping_address?.street || customer?.shipping_address?.address || customer?.shipping_address?.street}
                  </span>
                </div>
                <div>
                  <span className={styles.label}>City</span>
                  <span className={styles.value}>{order.shipping_address?.city || customer?.shipping_address?.city}</span>
                </div>
                <div>
                  <span className={styles.label}>County</span>
                  <span className={styles.value}>{order.shipping_address?.state || customer?.shipping_address?.state}</span>
                </div>
                <div>
                  <span className={styles.label}>Postcode</span>
                  <span className={styles.value}>{order.shipping_address?.zip || customer?.shipping_address?.zip}</span>
                </div>
                <div>
                  <span className={styles.label}>Country</span>
                  <span className={styles.value}>
                    {order.shipping_address?.country || customer?.shipping_address?.country}
                    {order.shipping_address?.country_code && ` (${order.shipping_address.country_code})`}
                  </span>
                </div>
              </div>
              
              {order.shipping_address?.attention && (
                <div className={styles.addressLine}>
                  <span className={styles.label}>Attention</span>
                  <span className={styles.value}>{order.shipping_address.attention}</span>
                </div>
              )}
              
              {order.shipping_address?.phone && (
                <div className={styles.addressLine}>
                  <span className={styles.label}>Phone</span>
                  <span className={styles.value}>{order.shipping_address.phone}</span>
                </div>
              )}
            </div>
            <div className={styles.mapContainer} style={{ height: '250px', overflow: 'hidden', borderRadius: '16px' }}>
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

      {/* Live Tracking History Section */}
      {order.ship_live?.tracking_updates && order.ship_live.tracking_updates.length > 0 && (
        <div className={styles.orderDetailsSection} style={{ marginTop: '24px' }}>
          <div className={styles.orderItemsCard} style={{ width: '100%' }}>
            <h3 style={{ marginBottom: '20px' }}>Live Tracking History</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {order.ship_live.tracking_updates
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((update, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '16px', 
                      padding: '16px', 
                      borderBottom: index < order.ship_live.tracking_updates.length - 1 ? '1px solid rgba(121, 213, 233, 0.1)' : 'none' 
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {getTrackingStatusIcon(update.status)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {update.description}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8b98a5' }}>
                        {formatDateTime(update.timestamp)}
                        {update.location && ` • ${update.location}`}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Section */}
      <div className={styles.orderDetailsSection}>
        <div className={styles.detailsGrid} style={{ marginTop: '24px', gridTemplateColumns: '1fr' }}>
          {/* Order Items Card - Full Width */}
          <div className={styles.orderItemsCard} style={{ width: '100%', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Order Line Items</h3>
              {order.shipped_status && (
                <span className={`${styles.statusBadge} ${styles[order.shipped_status]}`}>
                  {order.shipped_status === 'partially_shipped' ? 'Partially Shipped' : 
                   order.shipped_status === 'shipped' ? 'Shipped' : 'Not Shipped'}
                </span>
              )}
            </div>
            
            {/* Tabs */}
            <div className={styles.tabsContainer}>
              <button 
                className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Items ({lineItems.length})
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'shipped' ? styles.active : ''}`}
                onClick={() => setActiveTab('shipped')}
              >
                Shipped ({lineItems.filter(item => getLineItemStatus(item) === 'shipped').length})
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'partial' ? styles.active : ''}`}
                onClick={() => setActiveTab('partial')}
              >
                Partially Shipped ({lineItems.filter(item => getLineItemStatus(item) === 'partial').length})
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'awaiting' ? styles.active : ''}`}
                onClick={() => setActiveTab('awaiting')}
              >
                Awaiting Ship ({lineItems.filter(item => getLineItemStatus(item) === 'awaiting').length})
              </button>
            </div>
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
                {filteredItems.map((item) => {
                  const status = getLineItemStatus(item);
                  return (
                  <div key={item.id} className={styles.tableRow}>
                    <div className={styles.tableCell}>
                      <div className={styles.itemInfo}>
                        <strong title={item.item_name || item.name}>{item.item_name || item.name}</strong>
                        {item.brand && <span className={styles.itemBrand}>{item.brand}</span>}
                      </div>
                    </div>
                    <div className={styles.tableCell}>{item.sku}</div>
                    <div className={styles.tableCell}>
                      {item.quantity}
                      {status === 'partial' && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {' '}({item.quantity_shipped} shipped)
                        </span>
                      )}
                    </div>
                    <div className={styles.tableCell}>{formatCurrency(item.rate)}</div>
                    <div className={styles.tableCell}>
                      <strong>{formatCurrency(item.total || item.item_total || 0)}</strong>
                      <span className={`${styles.itemStatusBadge} ${styles[status]}`}>
                        {status === 'shipped' ? 'Shipped' : 
                         status === 'partial' ? 'Partially Shipped' : 
                         'Awaiting Ship'}
                      </span>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.orderSummary}>
              <div className={styles.summaryRow}>
                <span>Subtotal (excl. discount)</span>
                <span>{formatCurrency(order.sub_total_exclusive_of_discount || order.sub_total || lineItems.reduce((sum, item) => sum + (item.total || 0), 0))}</span>
              </div>
              {(order.discount_amount !== undefined && order.discount_amount > 0) && (
                <div className={styles.summaryRow}>
                  <span>
                    Discount
                    {order.discount_percent !== undefined && ` (${order.discount_percent}%)`}
                  </span>
                  <span className={styles.discount}>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(order.sub_total || 0)}</span>
              </div>
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
            
            {/* Invoice Details Section */}
            <div className={styles.invoiceSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4>Invoice Details</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {invoices.length > 0 && invoices[0] && (
                    <span className={`${styles.statusBadge} ${styles[invoices[0].status?.toLowerCase()]}`}>
                      {invoices[0].status || 'Draft'}
                    </span>
                  )}
                </div>
              </div>
              
              {invoices.length > 0 ? (
                <>
                  <div className={styles.invoiceGrid}>
                    {invoices.map((inv, index) => (
                      <div key={inv.id || index} style={{ gridColumn: 'span 3', marginBottom: '16px', paddingBottom: '16px', borderBottom: index < invoices.length - 1 ? '1px solid rgba(121, 213, 233, 0.1)' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                          <div className={styles.invoiceInfo}>
                            <span className={styles.label}>Invoice Number</span>
                            <span className={styles.value}>#{inv.invoice_number}</span>
                          </div>
                          <div className={styles.invoiceInfo}>
                            <span className={styles.label}>Date</span>
                            <span className={styles.value}>{formatDate(inv.date)}</span>
                          </div>
                          <div className={styles.invoiceInfo}>
                            <span className={styles.label}>Due Date</span>
                            <span className={styles.value}>{formatDate(inv.due_date)}</span>
                          </div>
                          {inv.reference_number && (
                            <div className={styles.invoiceInfo}>
                              <span className={styles.label}>Reference</span>
                              <span className={styles.value}>{inv.reference_number}</span>
                            </div>
                          )}
                          <div className={styles.invoiceInfo}>
                            <span className={styles.label}>Total</span>
                            <span className={styles.value}>{formatCurrency(inv.total || 0)}</span>
                          </div>
                          <div className={styles.invoiceInfo}>
                            <span className={styles.label}>Balance</span>
                            <span className={styles.value}>{formatCurrency(inv.balance || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: '#8b98a5' }}>No invoice has been generated for this order yet.</p>
                </div>
              )}
            </div>
            
            {/* Additional Order Information */}
            {order.notes && (
              <div className={styles.notesSection} style={{ marginTop: '24px' }}>
                <h4>Order Notes</h4>
                <p>{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}