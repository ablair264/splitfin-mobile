// src/components/OrderApproval/OrderApproval.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { createSalesOrder } from '../../api/zoho';
import { useNavigate } from 'react-router-dom';
import './OrderApproval.css';

interface Address {
  address1: string;
  street2: string;
  city: string;
  county: string;
  postcode: string;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerId?: string; // Firebase UID
  customer_id?: string; // Zoho customer_id
  zohoContactId?: string;
  items: Array<{
    id: string;
    item_id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    unit?: string;
  }>;
  subtotal: number;
  vat: number;
  total: number;
  purchaseOrderNumber?: string;
  deliveryNotes?: string;
  shippingAddress: Address;
  billingAddress: Address;
  status: string;
  createdAt: string;
  zohoPayload: any;
}

export default function OrderApproval() {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | 'preview' | null;
    message: string;
  }>({
    isOpen: false,
    action: null,
    message: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const q = query(
        collection(db, 'pending_orders'),
        where('status', '==', 'pending_approval')
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PendingOrder));
      
      setPendingOrders(orders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (order: PendingOrder, action: 'approve' | 'reject' | 'preview') => {
    setSelectedOrder(order);
    setActionModal({
      isOpen: true,
      action,
      message: ''
    });
  };

  const formatAddress = (address: Address): string => {
    const parts = [
      address.address1,
      address.street2,
      address.city,
      address.county,
      address.postcode
    ].filter(part => part && part.trim() !== '');
    return parts.join(', ');
  };

  // Function to normalize country code/name for Zoho
  const normalizeCountryForZoho = (countryInput: string): string => {
    if (!countryInput || typeof countryInput !== 'string') return 'United Kingdom';
    
    const countryInputLower = countryInput.toLowerCase().trim();
    
    const countryMap: { [key: string]: string } = {
      'gb': 'United Kingdom',
      'uk': 'United Kingdom',
      'united kingdom': 'United Kingdom',
      'britain': 'United Kingdom',
      'great britain': 'United Kingdom',
      'england': 'United Kingdom',
      'scotland': 'United Kingdom',
      'wales': 'United Kingdom',
      'northern ireland': 'United Kingdom',
      'us': 'United States',
      'usa': 'United States',
      'united states': 'United States',
      'united states of america': 'United States',
      'ca': 'Canada',
      'canada': 'Canada',
      'au': 'Australia',
      'australia': 'Australia',
      'de': 'Germany',
      'germany': 'Germany',
      'fr': 'France',
      'france': 'France',
      'it': 'Italy',
      'italy': 'Italy',
      'es': 'Spain',
      'spain': 'Spain',
      'nl': 'Netherlands',
      'netherlands': 'Netherlands',
      'be': 'Belgium',
      'belgium': 'Belgium',
      'se': 'Sweden',
      'sweden': 'Sweden',
      'no': 'Norway',
      'norway': 'Norway',
      'dk': 'Denmark',
      'denmark': 'Denmark',
      'fi': 'Finland',
      'finland': 'Finland',
      'ie': 'Ireland',
      'ireland': 'Ireland',
      'pl': 'Poland',
      'poland': 'Poland',
      'cz': 'Czech Republic',
      'czech republic': 'Czech Republic',
      'at': 'Austria',
      'austria': 'Austria',
      'ch': 'Switzerland',
      'switzerland': 'Switzerland',
      'pt': 'Portugal',
      'portugal': 'Portugal',
      'gr': 'Greece',
      'greece': 'Greece',
      'hu': 'Hungary',
      'hungary': 'Hungary',
      'ro': 'Romania',
      'romania': 'Romania',
      'bg': 'Bulgaria',
      'bulgaria': 'Bulgaria',
      'hr': 'Croatia',
      'croatia': 'Croatia',
      'si': 'Slovenia',
      'slovenia': 'Slovenia',
      'sk': 'Slovakia',
      'slovakia': 'Slovakia',
      'lt': 'Lithuania',
      'lithuania': 'Lithuania',
      'lv': 'Latvia',
      'latvia': 'Latvia',
      'ee': 'Estonia',
      'estonia': 'Estonia',
      'lu': 'Luxembourg',
      'luxembourg': 'Luxembourg',
      'mt': 'Malta',
      'malta': 'Malta',
      'cy': 'Cyprus',
      'cyprus': 'Cyprus'
    };
    
    const normalized = countryMap[countryInputLower];
    if (normalized) {
      console.log(`Country normalized: "${countryInput}" -> "${normalized}"`);
      return normalized;
    }
    
    // If not found in map, check if it's already a full country name
    if (countryInput.length > 2) {
      console.log(`Country passed through: "${countryInput}"`);
      return countryInput; // Assume it's already a full country name
    }
    
    // Default fallback
    console.warn(`Unknown country code/name: "${countryInput}", defaulting to United Kingdom`);
    return 'United Kingdom';
  };

  const sendApprovalEmail = async (order: PendingOrder, zohoOrderNumber: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://splitfin-zoho-api.onrender.com';
      await fetch(`${apiUrl}/api/emails/order-approved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: order.customerEmail,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          zohoOrderNumber: zohoOrderNumber,
          items: order.items,
          subtotal: order.subtotal,
          vat: order.vat,
          total: order.total,
          shippingAddress: order.shippingAddress,
          purchaseOrderNumber: order.purchaseOrderNumber,
          deliveryNotes: order.deliveryNotes
        })
      });
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }
  };

  const processAction = async () => {
    if (!selectedOrder || !actionModal.action) return;
    
    if (actionModal.action === 'preview') {
      // Don't close modal for preview
      return;
    }
    
    console.log('=== ORDER APPROVAL DEBUG ===');
    console.log('Selected Order:', selectedOrder);
    console.log('Has zohoPayload?', !!selectedOrder.zohoPayload);
    console.log('zohoPayload:', selectedOrder.zohoPayload);
    
    if (!selectedOrder.zohoPayload) {
      alert('Error: Order is missing Zoho payload data. Check console for details.');
      console.error('Order missing zohoPayload:', selectedOrder);
      return;
    }
    
    setProcessing(true);
    
    try {
      if (actionModal.action === 'approve') {
        // Deep clone and clean the zoho payload to ensure no country code issues
        const cleanZohoPayload = JSON.parse(JSON.stringify(selectedOrder.zohoPayload));
        
        // Function to recursively find and replace country codes in the payload
        const replaceCountryCodes = (obj: any): any => {
          if (obj === null || typeof obj !== 'object') return obj;
          
          if (Array.isArray(obj)) {
            return obj.map(item => replaceCountryCodes(item));
          }
          
          const newObj: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (typeof key === 'string' && key.toLowerCase().includes('country')) {
              // Replace any country code with full country name
              if (typeof value === 'string') {
                newObj[key] = normalizeCountryForZoho(value);
              } else {
                newObj[key] = value;
              }
            } else {
              newObj[key] = replaceCountryCodes(value);
            }
          }
          return newObj;
        };
        
        // Clean the payload first
        const cleanedPayload = replaceCountryCodes(cleanZohoPayload);
        
        // Format the Zoho payload with proper address format and country normalization
        const formattedZohoPayload = {
          ...cleanedPayload,
          // Use the Zoho customer_id from the order
          customer_id: selectedOrder.customer_id || selectedOrder.zohoContactId,
          // Ensure addresses are strings for Zoho
          billing_address: formatAddress(selectedOrder.billingAddress || selectedOrder.shippingAddress).substring(0, 99),
          shipping_address: formatAddress(selectedOrder.shippingAddress).substring(0, 99),
          // Include individual fields with normalized country
          billing_street: selectedOrder.billingAddress?.address1 || selectedOrder.shippingAddress.address1,
          billing_city: selectedOrder.billingAddress?.city || selectedOrder.shippingAddress.city,
          billing_state: selectedOrder.billingAddress?.county || selectedOrder.shippingAddress.county,
          billing_zip: selectedOrder.billingAddress?.postcode || selectedOrder.shippingAddress.postcode,
          billing_country: normalizeCountryForZoho('GB'), // Always normalize country
          shipping_street: selectedOrder.shippingAddress.address1,
          shipping_city: selectedOrder.shippingAddress.city,
          shipping_state: selectedOrder.shippingAddress.county,
          shipping_zip: selectedOrder.shippingAddress.postcode,
          shipping_country: normalizeCountryForZoho('GB'), // Always normalize country
          // Set status to confirmed
          salesorder_status: 'confirmed'
        };

        console.log('=== FORMATTED ZOHO PAYLOAD ===');
        console.log('Original payload:', selectedOrder.zohoPayload);
        console.log('Cleaned payload:', cleanedPayload);
        console.log('Billing Country:', formattedZohoPayload.billing_country);
        console.log('Shipping Country:', formattedZohoPayload.shipping_country);
        
        // Check for any remaining country codes in the payload
        const payloadString = JSON.stringify(formattedZohoPayload);
        if (payloadString.includes('"GB"') || payloadString.includes('"gb"')) {
          console.warn('WARNING: Found GB country code in payload:', payloadString.match(/"[^"]*GB[^"]*"/gi));
        }
        
        // Final validation: ensure no country codes remain
        const validateAndCleanPayload = (payload: any): any => {
          const finalPayload = { ...payload };
          
          // List of all possible country field names based on Zoho API documentation
          const countryFields = [
            'billing_country',
            'shipping_country',
            'country',
            'billing_address_country',
            'shipping_address_country'
          ];
          
          countryFields.forEach(field => {
            if (finalPayload[field] && typeof finalPayload[field] === 'string') {
              finalPayload[field] = normalizeCountryForZoho(finalPayload[field]);
            }
          });
          
          // Check nested objects for country fields
          if (finalPayload.billing_address && typeof finalPayload.billing_address === 'object') {
            if (finalPayload.billing_address.country) {
              finalPayload.billing_address.country = normalizeCountryForZoho(finalPayload.billing_address.country);
            }
          }
          
          if (finalPayload.shipping_address && typeof finalPayload.shipping_address === 'object') {
            if (finalPayload.shipping_address.country) {
              finalPayload.shipping_address.country = normalizeCountryForZoho(finalPayload.shipping_address.country);
            }
          }
          
          return finalPayload;
        };
        
        const finalPayload = validateAndCleanPayload(formattedZohoPayload);
        
        // Final debug check
        const finalPayloadString = JSON.stringify(finalPayload);
        if (finalPayloadString.includes('"GB"') || finalPayloadString.includes('"gb"')) {
          console.error('CRITICAL: Still found GB in final payload!', finalPayloadString.match(/"[^"]*[Gg][Bb][^"]*"/gi));
        }
        
        console.log('=== FINAL PAYLOAD TO ZOHO ===');
        console.log(finalPayload);

        // Create sales order in Zoho with formatted payload
        const zohoResponse = await createSalesOrder(finalPayload);
        
        // Create the sales order in Firebase
        await addDoc(collection(db, 'sales_orders'), {
          ...selectedOrder,
          salesorder_id: zohoResponse.salesorder_id,
          salesorder_number: zohoResponse.salesorder_number,
          customer_id: selectedOrder.customer_id || selectedOrder.zohoContactId,
          customer_name: selectedOrder.customerName,
          company_name: selectedOrder.customerCompany || '',
          date: new Date().toISOString().split('T')[0],
          created_time: new Date().toISOString(),
          total: selectedOrder.total,
          sub_total: selectedOrder.subtotal,
          tax_total: selectedOrder.vat,
          status: 'confirmed',
          current_sub_status: 'confirmed',
          line_items: selectedOrder.items.map(item => ({
            item_id: item.item_id,
            item_name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            rate: item.price,
            total: item.total
          })),
          shipping_address: {
            address: selectedOrder.shippingAddress.address1,
            street: selectedOrder.shippingAddress.address1,
            street2: selectedOrder.shippingAddress.street2,
            city: selectedOrder.shippingAddress.city,
            state: selectedOrder.shippingAddress.county,
            zip: selectedOrder.shippingAddress.postcode,
            country: 'United Kingdom', // Use full country name
            country_code: 'GB'
          },
          billing_address: {
            address: selectedOrder.billingAddress?.address1 || selectedOrder.shippingAddress.address1,
            street: selectedOrder.billingAddress?.address1 || selectedOrder.shippingAddress.address1,
            street2: selectedOrder.billingAddress?.street2 || selectedOrder.shippingAddress.street2,
            city: selectedOrder.billingAddress?.city || selectedOrder.shippingAddress.city,
            state: selectedOrder.billingAddress?.county || selectedOrder.shippingAddress.county,
            zip: selectedOrder.billingAddress?.postcode || selectedOrder.shippingAddress.postcode,
            country: 'United Kingdom', // Use full country name
            country_code: 'GB'
          },
          notes: selectedOrder.deliveryNotes || '',
          reference_number: selectedOrder.purchaseOrderNumber || '',
          approvedBy: auth.currentUser?.uid,
          approvedAt: new Date().toISOString()
        });
        
        // Update pending order status
        await updateDoc(doc(db, 'pending_orders', selectedOrder.id), {
          status: 'approved',
          approvedBy: auth.currentUser?.uid,
          approvedAt: new Date().toISOString(),
          zohoOrderId: zohoResponse.salesorder_id,
          zohoOrderNumber: zohoResponse.salesorder_number,
          updatedAt: new Date().toISOString()
        });
        
        // Send approval email
        await sendApprovalEmail(selectedOrder, zohoResponse.salesorder_number);
        
        // Create notification for customer
        if (selectedOrder.customerId) {
          await addDoc(collection(db, 'notifications'), {
            type: 'order_approved',
            recipientId: selectedOrder.customerId,
            title: 'Order Approved',
            message: `Your order ${selectedOrder.orderNumber} has been approved and is being processed.`,
            createdAt: new Date().toISOString(),
            read: false,
            data: {
              orderId: selectedOrder.id,
              orderNumber: selectedOrder.orderNumber,
              zohoOrderId: zohoResponse.salesorder_id,
              zohoOrderNumber: zohoResponse.salesorder_number
            }
          });
        }
        
        // Navigate to the order view
        navigate(`/orders/${zohoResponse.salesorder_id}`);
        
      } else {
        // Reject order
        await updateDoc(doc(db, 'pending_orders', selectedOrder.id), {
          status: 'rejected',
          rejectedBy: auth.currentUser?.uid,
          rejectedAt: new Date().toISOString(),
          rejectionReason: actionModal.message,
          updatedAt: new Date().toISOString()
        });
        
        // Create notification for customer
        if (selectedOrder.customerId) {
          await addDoc(collection(db, 'notifications'), {
            type: 'order_rejected',
            recipientId: selectedOrder.customerId,
            title: 'Order Update',
            message: `Your order ${selectedOrder.orderNumber} requires attention. Please check your messages.`,
            createdAt: new Date().toISOString(),
            read: false,
            data: {
              orderId: selectedOrder.id,
              orderNumber: selectedOrder.orderNumber,
              reason: actionModal.message
            }
          });
        }
        
        // Refresh the list
        await fetchPendingOrders();
        
        // Close modal
        setActionModal({ isOpen: false, action: null, message: '' });
        setSelectedOrder(null);
      }
      
    } catch (error) {
      console.error('Error processing order:', error);
      alert(`Failed to process order: ${error.message || 'Please try again.'}`);
      setProcessing(false);
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

  if (loading) {
    return <div className="loading">Loading pending orders...</div>;
  }

  return (
    <div className="order-approval-container">
      <header className="approval-header">
        <h1>Pending Order Approvals</h1>
        <p>Review and approve customer orders</p>
      </header>

      {pendingOrders.length === 0 ? (
        <div className="no-orders">
          <p>No pending orders to approve</p>
        </div>
      ) : (
        <div className="orders-grid">
          {pendingOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.orderNumber}</h3>
                <span className="order-date">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="split-order-customer">
                <h4>{order.customerName}</h4>
                {order.customerCompany && <p>{order.customerCompany}</p>}
                <p>{order.customerEmail}</p>
                {order.customerPhone && <p>{order.customerPhone}</p>}
              </div>
              
              <div className="order-shipping">
                <h4>Delivery Address</h4>
                <p>{order.shippingAddress?.address1 || 'Not provided'}</p>
                {order.shippingAddress?.street2 && <p>{order.shippingAddress.street2}</p>}
                <p>
                  {order.shippingAddress?.city && `${order.shippingAddress.city}, `}
                  {order.shippingAddress?.county && `${order.shippingAddress.county}, `}
                  {order.shippingAddress?.postcode}
                </p>
              </div>
              
              <div className="order-items-summary">
                <h4>Items ({order.items.length})</h4>
                {order.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="item-line">
                    <span>{item.name}</span>
                    <span>×{item.quantity}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="more-items">+{order.items.length - 3} more items</p>
                )}
              </div>
              
              {order.purchaseOrderNumber && (
                <div className="po-number">
                  <strong>PO:</strong> {order.purchaseOrderNumber}
                </div>
              )}
              
              {order.deliveryNotes && (
                <div className="delivery-notes">
                  <strong>Notes:</strong> {order.deliveryNotes}
                </div>
              )}
              
              <div className="order-total-section">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>£{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>VAT:</span>
                  <span>£{order.vat.toFixed(2)}</span>
                </div>
                <div className="total-line total">
                  <span>Total:</span>
                  <span>£{order.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="action-buttons">
                <button
                  className="approve-btn"
                  onClick={() => handleAction(order, 'preview')}
                  style={{ flex: '0 0 auto', padding: '8px 12px', fontSize: '13px' }}
                >
                  Preview
                </button>
                <button
                  className="approve-btn"
                  onClick={() => handleAction(order, 'approve')}
                >
                  Approve Order
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleAction(order, 'reject')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setActionModal({ isOpen: false, action: null, message: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            ...(actionModal.action === 'preview' && { maxWidth: '90vw', width: '1200px', maxHeight: '90vh' })
          }}>
            {actionModal.action === 'preview' ? (
              <>
                <h2>Order Preview - #{selectedOrder.orderNumber}</h2>
                <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                  <OrderPreview order={selectedOrder} />
                </div>
                <div className="modal-actions">
                  <button
                    onClick={() => handleAction(selectedOrder, 'approve')}
                    className="approve-btn"
                  >
                    Approve Order
                  </button>
                  <button
                    onClick={() => handleAction(selectedOrder, 'reject')}
                    className="reject-btn"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => setActionModal({ isOpen: false, action: null, message: '' })}
                    className="cancel-btn"
                  >
                    Close Preview
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>
                  {actionModal.action === 'approve' ? 'Approve Order' : 'Reject Order'}
                </h2>
                
                <div className="modal-order-details">
                  <p><strong>Order:</strong> #{selectedOrder.orderNumber}</p>
                  <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Total:</strong> £{selectedOrder.total.toFixed(2)}</p>
                </div>
                
                {actionModal.action === 'approve' ? (
                  <div className="approval-notice">
                    <p>Approving this order will:</p>
                    <ul>
                      <li>Create the sales order in Zoho</li>
                      <li>Send a confirmation email to the customer</li>
                      <li>Begin the fulfillment process</li>
                    </ul>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Reason for Rejection (Required)</label>
                    <textarea
                      value={actionModal.message}
                      onChange={(e) => setActionModal({ ...actionModal, message: e.target.value })}
                      placeholder="Please provide a reason for rejecting this order..."
                      rows={4}
                      required
                    />
                  </div>
                )}
                
                <div className="modal-actions">
                  <button
                    onClick={processAction}
                    disabled={processing || (actionModal.action === 'reject' && !actionModal.message)}
                    className={`${actionModal.action}-btn`}
                  >
                    {processing ? 'Processing...' : `Confirm ${actionModal.action}`}
                  </button>
                  <button
                    onClick={() => setActionModal({ isOpen: false, action: null, message: '' })}
                    disabled={processing}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Order Preview Component
function OrderPreview({ order }: { order: PendingOrder }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatAddress = (address: Address): string => {
    const parts = [
      address.address1,
      address.street2,
      address.city,
      address.county,
      address.postcode
    ].filter(part => part && part.trim() !== '');
    return parts.join(', ');
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '24px', 
      color: 'var(--text-primary)',
      fontSize: '14px'
    }}>
      {/* Left Column */}
      <div>
        {/* Customer Information */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary-color)' }}>Customer Information</h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div><strong>Name:</strong> {order.customerName}</div>
            {order.customerCompany && <div><strong>Company:</strong> {order.customerCompany}</div>}
            <div><strong>Email:</strong> {order.customerEmail}</div>
            {order.customerPhone && <div><strong>Phone:</strong> {order.customerPhone}</div>}
          </div>
        </div>

        {/* Shipping Address */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary-color)' }}>Shipping Address</h4>
          <div style={{ lineHeight: '1.5' }}>
            {formatAddress(order.shippingAddress)}
          </div>
        </div>

        {/* Order Details */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary-color)' }}>Order Details</h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div><strong>Order Number:</strong> #{order.orderNumber}</div>
            <div><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
            {order.purchaseOrderNumber && (
              <div><strong>PO Number:</strong> {order.purchaseOrderNumber}</div>
            )}
            {order.deliveryNotes && (
              <div><strong>Delivery Notes:</strong> {order.deliveryNotes}</div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div>
        {/* Order Items */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary-color)' }}>Order Items</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {order.items.map((item, index) => (
              <div key={index} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto auto', 
                gap: '12px', 
                alignItems: 'center',
                padding: '12px',
                background: 'var(--background-white)',
                borderRadius: '6px'
              }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SKU: {item.sku}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatCurrency(item.price)} × {item.quantity}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Qty</div>
                  <div style={{ fontWeight: '600' }}>{item.quantity}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total</div>
                  <div style={{ fontWeight: '600' }}>{formatCurrency(item.total)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary-color)' }}>Order Summary</h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VAT:</span>
              <span>{formatCurrency(order.vat)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              paddingTop: '8px', 
              borderTop: '1px solid var(--border-color)',
              fontWeight: '600',
              fontSize: '16px',
              color: 'var(--primary-color)'
            }}>
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}