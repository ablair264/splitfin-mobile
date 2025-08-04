import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { useCart } from '../../hooks/useCart';
import { FaShoppingCart, FaUser, FaTruck, FaCreditCard, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { auth, db } from '../../firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import styles from './CustomerCheckout.module.css';

interface Address {
  address1: string;
  street2: string;
  city: string;
  county: string;
  postcode: string;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: Address;
  customerId?: string;
  zohoContactId?: string;
}

export default function CustomerCheckout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [editableDetails, setEditableDetails] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, []);

  const fetchCustomerDetails = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/customer/login');
        return;
      }

      // Query customers collection by firebase_uid
      const customerDataQuery = query(
        collection(db, 'customers'),
        where('firebase_uid', '==', user.uid)
      );
      const customerDataSnapshot = await getDocs(customerDataQuery);
      
      if (!customerDataSnapshot.empty) {
        const customerDoc = customerDataSnapshot.docs[0];
        const data = customerDoc.data();
        
        // Get customer details directly from the document
        const customerName = data.customer_name || data.name || '';
        const email = data.email || data.Primary_Email || user.email || '';
        const phone = data.phone || '';
        const company = data.company_name || data.company || '';
        
        // Get address from billing_address or shipping_address
        let addressData: Address = {
          address1: '',
          street2: '',
          city: '',
          county: '',
          postcode: ''
        };
        
        if (data.billing_address) {
          addressData = {
            address1: data.billing_address.address || data.billing_address.address1 || '',
            street2: data.billing_address.street2 || '',
            city: data.billing_address.city || '',
            county: data.billing_address.county || data.billing_address.state || '',
            postcode: data.billing_address.postcode || data.billing_address.zip || ''
          };
        } else if (data.shipping_address) {
          addressData = {
            address1: data.shipping_address.address || data.shipping_address.address1 || '',
            street2: data.shipping_address.street2 || '',
            city: data.shipping_address.city || '',
            county: data.shipping_address.county || data.shipping_address.state || '',
            postcode: data.shipping_address.postcode || data.shipping_address.zip || ''
          };
        }
        
        // Get Zoho customer_id
        const zohoCustomerId = data.zoho_data?.customer_id || data.customer_id || data.zoho_customer_id;
        
        const details = {
          name: customerName,
          email: email,
          phone: phone,
          company: company,
          address: addressData,
          customerId: customerDoc.id,
          zohoContactId: zohoCustomerId
        };
        
        setCustomerDetails(details);
        setEditableDetails(details);
        
        // Check if critical fields are missing
        const isAddressIncomplete = !addressData.address1 || !addressData.city || !addressData.postcode;
        if (!customerName || isAddressIncomplete || !phone) {
          setIsEditingDetails(true);
        }
        
      } else {
        // No customer document exists - force edit mode
        const defaultDetails = {
          name: '',
          email: user.email || '',
          phone: '',
          company: '',
          address: {
            address1: '',
            street2: '',
            city: '',
            county: '',
            postcode: ''
          },
          customerId: user.uid,
          zohoContactId: undefined
        };
        setCustomerDetails(defaultDetails);
        setEditableDetails(defaultDetails);
        setIsEditingDetails(true);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      const user = auth.currentUser;
      if (user) {
        const defaultDetails = {
          name: '',
          email: user.email || '',
          phone: '',
          company: '',
          address: {
            address1: '',
            street2: '',
            city: '',
            county: '',
            postcode: ''
          },
          customerId: user.uid,
          zohoContactId: undefined
        };
        setCustomerDetails(defaultDetails);
        setEditableDetails(defaultDetails);
        setIsEditingDetails(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditingDetails) {
      // Cancel editing - reset to original
      setEditableDetails(customerDetails);
    }
    setIsEditingDetails(!isEditingDetails);
  };

  const handleSaveDetails = async () => {
    if (!editableDetails || !auth.currentUser) return;

    // Validate required address fields
    if (!editableDetails.address.address1 || !editableDetails.address.city || !editableDetails.address.postcode) {
      alert('Please fill in all required address fields (Address 1, City, and Postcode)');
      return;
    }

    setSavingDetails(true);
    try {
      // Prepare update data with structured address
      const updateData = {
        customer_name: editableDetails.name,
        Primary_Email: editableDetails.email,
        email: editableDetails.email,
        phone: editableDetails.phone,
        company_name: editableDetails.company,
        billing_address: {
          address: editableDetails.address.address1,
          address1: editableDetails.address.address1,
          street2: editableDetails.address.street2,
          city: editableDetails.address.city,
          county: editableDetails.address.county,
          state: editableDetails.address.county,
          postcode: editableDetails.address.postcode,
          zip: editableDetails.address.postcode,
          country: 'GB'
        },
        shipping_address: {
          address: editableDetails.address.address1,
          address1: editableDetails.address.address1,
          street2: editableDetails.address.street2,
          city: editableDetails.address.city,
          county: editableDetails.address.county,
          state: editableDetails.address.county,
          postcode: editableDetails.address.postcode,
          zip: editableDetails.address.postcode,
          country: 'GB'
        },
        updatedAt: new Date().toISOString()
      };

      // Update in customers collection
      const customerDataQuery = query(
        collection(db, 'customers'),
        where('firebase_uid', '==', auth.currentUser.uid)
      );
      const customerDataSnapshot = await getDocs(customerDataQuery);
      
      if (!customerDataSnapshot.empty) {
        const docId = customerDataSnapshot.docs[0].id;
        await updateDoc(doc(db, 'customers', docId), updateData);
        console.log('Updated customers document:', docId);
      } else {
        const newDoc = await addDoc(collection(db, 'customers'), {
          ...updateData,
          firebase_uid: auth.currentUser.uid,
          created_at: new Date().toISOString()
        });
        console.log('Created new customers document:', newDoc.id);
      }

      // Update Zoho if contact ID exists
      if (editableDetails.zohoContactId) {
        try {
          const zohoUpdateData = {
            contact_name: editableDetails.name,
            email: editableDetails.email,
            phone: editableDetails.phone,
            company_name: editableDetails.company,
            billing_address: {
              address: editableDetails.address.address1,
              street2: editableDetails.address.street2,
              city: editableDetails.address.city,
              state: editableDetails.address.county,
              zip: editableDetails.address.postcode,
              country: 'GB'
            },
            shipping_address: {
              address: editableDetails.address.address1,
              street2: editableDetails.address.street2,
              city: editableDetails.address.city,
              state: editableDetails.address.county,
              zip: editableDetails.address.postcode,
              country: 'GB'
            }
          };

          const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://splitfin-zoho-api.onrender.com'}/api/zoho/update-contact`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
            },
            body: JSON.stringify({
              contactId: editableDetails.zohoContactId,
              updateData: zohoUpdateData
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to update Zoho contact:', error);
          }
        } catch (zohoError) {
          console.error('Error updating Zoho:', zohoError);
        }
      }

      setCustomerDetails(editableDetails);
      setIsEditingDetails(false);
      alert('Details updated successfully!');
      
    } catch (error) {
      console.error('Error saving details:', error);
      alert('Failed to save details. Please try again.');
    } finally {
      setSavingDetails(false);
    }
  };

  const sendOrderConfirmationEmail = async (orderData: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://splitfin-zoho-api.onrender.com'}/api/emails/order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          to: orderData.customerEmail,
          customerName: orderData.customerName,
          orderNumber: orderData.orderNumber,
          items: orderData.items,
          subtotal: orderData.subtotal,
          vat: orderData.vat,
          total: orderData.total,
          shippingAddress: orderData.shippingAddress,
          purchaseOrderNumber: orderData.purchaseOrderNumber,
          deliveryNotes: orderData.deliveryNotes
        })
      });

      if (!response.ok) {
        console.error('Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerDetails || !items || items.length === 0) {
      console.log('Cannot place order:', { customerDetails, items });
      return;
    }

    // Validate customer details
    if (!customerDetails.name || customerDetails.name === customerDetails.email) {
      alert('Please update your account details with your full name before placing an order.');
      setIsEditingDetails(true);
      return;
    }

    // Validate address
    const isAddressValid = customerDetails.address.address1?.trim() && 
                          customerDetails.address.city?.trim() && 
                          customerDetails.address.postcode?.trim();

    if (!isAddressValid) {
      alert('Please provide a complete delivery address (Address 1, City, and Postcode are required).');
      setIsEditingDetails(true);
      return;
    }

    // Validate phone number
    if (!customerDetails.phone || customerDetails.phone.trim() === '') {
      alert('Please provide a phone number for delivery purposes.');
      setIsEditingDetails(true);
      return;
    }

    // Check if customer needs Zoho sync
    if (!customerDetails.zohoContactId) {
      console.log('Customer missing Zoho ID, attempting sync...');
      setSubmitting(true);
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'https://splitfin-zoho-api.onrender.com'}/api/customers/sync`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: auth.currentUser?.uid })
          }
        );
        
        const data = await response.json();
        
        if (data.success && data.zohoCustomerId) {
          console.log('✅ Customer synced successfully:', data.zohoCustomerId);
          
          // Update local customer details with the new Zoho ID
          const updatedDetails = {
            ...customerDetails,
            zohoContactId: data.zohoCustomerId
          };
          setCustomerDetails(updatedDetails);
          
          // Continue with the updated details
          await proceedWithOrder(updatedDetails);
        } else {
          alert('Unable to complete order setup. Your account needs to be linked with our order system. Please contact support at support@dmbrands.co.uk');
          setSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
        alert('Failed to setup your account for ordering. Please try again or contact support.');
        setSubmitting(false);
        return;
      }
    } else {
      // Customer already has Zoho ID, proceed normally
      setSubmitting(true);
      await proceedWithOrder(customerDetails);
    }
  };

  const proceedWithOrder = async (customerDetailsWithZohoId: CustomerDetails) => {
    try {
      const subtotal = getTotalPrice();
      const vat = subtotal * 0.2;
      const total = subtotal + vat;
      
      // Create order data with Zoho customer_id
      const pendingOrderData: any = {
        // Use Zoho customer_id as the primary identifier
        customer_id: customerDetailsWithZohoId.zohoContactId,
        customerId: auth.currentUser?.uid || '',
        
        customerName: customerDetailsWithZohoId.name || 'Customer',
        customerEmail: customerDetailsWithZohoId.email || '',
        
        // Order details
        orderNumber: `SO-${Date.now()}`,
        
        // Items
        items: items.map(item => ({
          id: item.id,
          item_id: item.item_id || item.id,
          name: item.name || '',
          sku: item.sku || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          unit: 'pcs',
          total: (item.price || 0) * (item.quantity || 1)
        })),
        
        // Pricing
        subtotal: subtotal,
        vat: vat,
        total: total,
        
        // Addresses
        shippingAddress: customerDetailsWithZohoId.address,
        billingAddress: customerDetailsWithZohoId.address,
        
        // Status
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add optional fields only if they have values
      if (customerDetailsWithZohoId.phone) {
        pendingOrderData.customerPhone = customerDetailsWithZohoId.phone;
      }
      
      if (customerDetailsWithZohoId.company) {
        pendingOrderData.customerCompany = customerDetailsWithZohoId.company;
      }
      
      pendingOrderData.zohoContactId = customerDetailsWithZohoId.zohoContactId;
      
      if (purchaseOrderNumber) {
        pendingOrderData.purchaseOrderNumber = purchaseOrderNumber;
      }
      
      if (deliveryNotes) {
        pendingOrderData.deliveryNotes = deliveryNotes;
      }
      
      // Create zohoPayload
      pendingOrderData.zohoPayload = {
        customer_id: customerDetailsWithZohoId.zohoContactId,
        date: new Date().toISOString().split('T')[0],
        line_items: items.map(item => ({
          item_id: item.item_id || item.id,
          quantity: item.quantity || 1,
          rate: item.price || 0
        })),
        billing_address: `${customerDetailsWithZohoId.address.address1}, ${customerDetailsWithZohoId.address.city} ${customerDetailsWithZohoId.address.postcode}`.substring(0, 99),
        shipping_address: `${customerDetailsWithZohoId.address.address1}, ${customerDetailsWithZohoId.address.city} ${customerDetailsWithZohoId.address.postcode}`.substring(0, 99),
        billing_street: customerDetailsWithZohoId.address.address1,
        billing_city: customerDetailsWithZohoId.address.city,
        billing_state: customerDetailsWithZohoId.address.county,
        billing_zip: customerDetailsWithZohoId.address.postcode,
        billing_country: 'GB',
        shipping_street: customerDetailsWithZohoId.address.address1,
        shipping_city: customerDetailsWithZohoId.address.city,
        shipping_state: customerDetailsWithZohoId.address.county,
        shipping_zip: customerDetailsWithZohoId.address.postcode,
        shipping_country: 'GB'
      };
      
      if (purchaseOrderNumber) {
        pendingOrderData.zohoPayload.reference_number = purchaseOrderNumber;
      }
      if (deliveryNotes) {
        pendingOrderData.zohoPayload.notes = deliveryNotes;
      }

      console.log('Creating pending order:', pendingOrderData);

      // Create pending order
      const pendingOrderRef = await addDoc(collection(db, 'pending_orders'), pendingOrderData);
      
      console.log('Order created with ID:', pendingOrderRef.id);

      // Send confirmation email
      await sendOrderConfirmationEmail(pendingOrderData);
      
      // Create notification for the customer
      await addDoc(collection(db, 'notifications'), {
        type: 'order_created',
        recipientId: auth.currentUser?.uid,
        title: 'Order Placed Successfully',
        message: `Your order #${pendingOrderData.orderNumber} has been placed and is pending approval.`,
        createdAt: new Date().toISOString(),
        read: false,
        data: {
          orderId: pendingOrderRef.id,
          orderNumber: pendingOrderData.orderNumber,
          status: 'pending_approval',
          total: total,
          itemCount: items.length
        }
      });
      
      // Find sammie@dmbrands.co.uk user
      let sammieUserId = null;
      
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', 'sammie@dmbrands.co.uk')
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        sammieUserId = usersSnapshot.docs[0].id;
      } else {
        const staffQuery = query(
          collection(db, 'staff_users'),
          where('email', '==', 'sammie@dmbrands.co.uk')
        );
        const staffSnapshot = await getDocs(staffQuery);
        if (!staffSnapshot.empty) {
          sammieUserId = staffSnapshot.docs[0].data().uid || staffSnapshot.docs[0].id;
        }
      }
      
      // Create notification for sammie@dmbrands.co.uk
      if (sammieUserId) {
        await addDoc(collection(db, 'notifications'), {
          type: 'order_approval_request',
          recipientId: sammieUserId,
          recipientEmail: 'sammie@dmbrands.co.uk',
          title: 'New Order Pending Approval',
          message: `${customerDetailsWithZohoId.name} has placed an order for £${total.toFixed(2)} requiring approval.`,
          createdAt: new Date().toISOString(),
          read: false,
          data: {
            pendingOrderId: pendingOrderRef.id,
            orderNumber: pendingOrderData.orderNumber,
            customerName: customerDetailsWithZohoId.name,
            total: total,
            itemCount: items.length
          }
        });
      }
      
      // Create general notification for all brand managers
      await addDoc(collection(db, 'notifications'), {
        type: 'order_approval_request',
        recipientRole: 'brandManager',
        title: 'New Order Pending Approval',
        message: `${customerDetailsWithZohoId.name} has placed an order requiring approval.`,
        createdAt: new Date().toISOString(),
        read: false,
        data: {
          pendingOrderId: pendingOrderRef.id,
          orderNumber: pendingOrderData.orderNumber,
          customerName: customerDetailsWithZohoId.name,
          total: total
        }
      });

      // Save order details for confirmation page
      const orderDetails = {
        orderId: pendingOrderData.orderNumber,
        pendingOrderId: pendingOrderRef.id,
        customerName: customerDetailsWithZohoId.name,
        email: customerDetailsWithZohoId.email,
        phone: customerDetailsWithZohoId.phone || '',
        address: customerDetailsWithZohoId.address,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total,
        orderDate: new Date().toISOString(),
        purchaseOrderNumber: purchaseOrderNumber || '',
        deliveryNotes: deliveryNotes || '',
        status: 'pending_approval'
      };

      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

      // Clear cart and navigate to confirmation
      clearCart();
      navigate('/customer/order-confirmation');
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.checkoutLoading}>
        <div className={styles.spinner}></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className={styles.checkoutEmpty}>
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/customer/new-order')} className={styles.continueShopping}>
          Continue Shopping
        </button>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  return (
    <div className={styles.customerCheckout}>
      <ProgressBar currentStep={4} />
      
      <div className={styles.checkoutHeader}>
        <h1>Complete Your Order</h1>
        <p>Review your order details and delivery information</p>
      </div>

      {/* Add validation warning */}
      {customerDetails && (
        (!customerDetails.name || customerDetails.name === customerDetails.email || 
         !customerDetails.address.address1 || !customerDetails.address.city || 
         !customerDetails.address.postcode || !customerDetails.phone) && (
          <div className={styles.checkoutWarning}>
            <h3>⚠️ Please complete your details before placing an order:</h3>
            <ul>
              {(!customerDetails.name || customerDetails.name === customerDetails.email) && 
                <li>Your full name is required</li>}
              {(!customerDetails.address.address1 || !customerDetails.address.city || !customerDetails.address.postcode) && 
                <li>Delivery address is required (Address 1, City, and Postcode)</li>}
              {!customerDetails.phone && 
                <li>Phone number is required for delivery</li>}
            </ul>
          </div>
        )
      )}

      <div className={styles.checkoutContent}>
        {/* Left Column - Order Summary and Items */}
        <div className={styles.checkoutMain}>
          {/* Order Summary */}
          <div className={styles.checkoutSection}>
            <div className={styles.sectionHeader}>
              <FaShoppingCart />
              <h2>Order Summary</h2>
            </div>
            
            <div className={styles.orderItems}>
              {items.map(item => (
                <div key={item.id} className={styles.checkoutItem}>
                  <div className={styles.itemInfo}>
                    <h4>{item.name}</h4>
                    <p>SKU: {item.sku}</p>
                  </div>
                  <div className={styles.itemQuantity}>×{item.quantity}</div>
                  <div className={styles.itemPrice}>£{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Information */}
          <div className={styles.checkoutSection}>
            <div className={styles.sectionHeader}>
              <FaTruck />
              <h2>Delivery Information</h2>
            </div>
            
            <div className={styles.deliveryAddress}>
              <label>Delivery Address</label>
              {isEditingDetails ? (
                <div className={styles.addressEditBox}>
                  <div className={styles.addressField}>
                    <label htmlFor="address1">Address Line 1 *</label>
                    <input
                      id="address1"
                      type="text"
                      value={editableDetails?.address.address1 || ''}
                      onChange={(e) => setEditableDetails({
                        ...editableDetails!,
                        address: { ...editableDetails!.address, address1: e.target.value }
                      })}
                      className={styles.formInput}
                      placeholder="Street address"
                      required
                    />
                  </div>
                  
                  <div className={styles.addressField}>
                    <label htmlFor="street2">Address Line 2</label>
                    <input
                      id="street2"
                      type="text"
                      value={editableDetails?.address.street2 || ''}
                      onChange={(e) => setEditableDetails({
                        ...editableDetails!,
                        address: { ...editableDetails!.address, street2: e.target.value }
                      })}
                      className={styles.formInput}
                      placeholder="Apartment, suite, unit, etc. (optional)"
                    />
                  </div>
                  
                  <div className={styles.addressField}>
                    <label htmlFor="city">City *</label>
                    <input
                      id="city"
                      type="text"
                      value={editableDetails?.address.city || ''}
                      onChange={(e) => setEditableDetails({
                        ...editableDetails!,
                        address: { ...editableDetails!.address, city: e.target.value }
                      })}
                      className={styles.formInput}
                      placeholder="City"
                      required
                    />
                  </div>
                  
                  <div className={styles.addressField}>
                    <label htmlFor="county">County</label>
                    <input
                      id="county"
                      type="text"
                      value={editableDetails?.address.county || ''}
                      onChange={(e) => setEditableDetails({
                        ...editableDetails!,
                        address: { ...editableDetails!.address, county: e.target.value }
                      })}
                      className={styles.formInput}
                      placeholder="County"
                    />
                  </div>
                  
                  <div className={styles.addressField}>
                    <label htmlFor="postcode">Postcode *</label>
                    <input
                      id="postcode"
                      type="text"
                      value={editableDetails?.address.postcode || ''}
                      onChange={(e) => setEditableDetails({
                        ...editableDetails!,
                        address: { ...editableDetails!.address, postcode: e.target.value }
                      })}
                      className={styles.formInput}
                      placeholder="Postcode"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.addressBox}>
                  {customerDetails?.address.address1 && <p>{customerDetails.address.address1}</p>}
                  {customerDetails?.address.street2 && <p>{customerDetails.address.street2}</p>}
                  {customerDetails?.address.city && <p>{customerDetails.address.city}</p>}
                  {customerDetails?.address.county && <p>{customerDetails.address.county}</p>}
                  {customerDetails?.address.postcode && <p>{customerDetails.address.postcode}</p>}
                </div>
              )}
            </div>

            <div className={styles.deliveryFields}>
              <div className={styles.formGroup}>
                <label htmlFor="po-number">Purchase Order Number (Optional)</label>
                <input
                  id="po-number"
                  type="text"
                  value={purchaseOrderNumber}
                  onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                  placeholder="Enter your PO number"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="delivery-notes">Delivery Notes (Optional)</label>
                <textarea
                  id="delivery-notes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Any special delivery instructions..."
                  rows={3}
                  className={styles.formTextarea}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer Details and Order Total */}
        <div className={styles.checkoutSidebar}>
          {/* Customer Details */}
          <div className={styles.checkoutSection}>
            <div className={styles.sectionHeader}>
              <FaUser />
              <h2>Customer Details</h2>
              <button 
                onClick={handleEditToggle} 
                className={styles.editBtn}
                disabled={savingDetails}
              >
                {isEditingDetails ? <FaTimes /> : <FaEdit />}
              </button>
            </div>
            
            <div className={styles.customerInfo}>
              <div className={styles.infoRow}>
                <label>Name</label>
                {isEditingDetails ? (
                  <input
                    type="text"
                    value={editableDetails?.name || ''}
                    onChange={(e) => setEditableDetails({...editableDetails!, name: e.target.value})}
                    className={styles.editInput}
                    placeholder="Full name"
                  />
                ) : (
                  <p>{customerDetails?.name || 'Not provided'}</p>
                )}
              </div>
              
              <div className={styles.infoRow}>
                <label>Email</label>
                {isEditingDetails ? (
                  <input
                    type="email"
                    value={editableDetails?.email || ''}
                    onChange={(e) => setEditableDetails({...editableDetails!, email: e.target.value})}
                    className={styles.editInput}
                    placeholder="Email address"
                  />
                ) : (
                  <p>{customerDetails?.email}</p>
                )}
              </div>
              
              <div className={styles.infoRow}>
                <label>Phone</label>
                {isEditingDetails ? (
                  <input
                    type="tel"
                    value={editableDetails?.phone || ''}
                    onChange={(e) => setEditableDetails({...editableDetails!, phone: e.target.value})}
                    className={styles.editInput}
                    placeholder="Phone number"
                  />
                ) : (
                  <p>{customerDetails?.phone || 'Not provided'}</p>
                )}
              </div>
              
              <div className={styles.infoRow}>
                <label>Company</label>
                {isEditingDetails ? (
                  <input
                    type="text"
                    value={editableDetails?.company || ''}
                    onChange={(e) => setEditableDetails({...editableDetails!, company: e.target.value})}
                    className={styles.editInput}
                    placeholder="Company name (optional)"
                  />
                ) : (
                  <p>{customerDetails?.company || 'Not provided'}</p>
                )}
              </div>
              
              {isEditingDetails && (
                <button 
                  onClick={handleSaveDetails} 
                  className={styles.saveBtn}
                  disabled={savingDetails}
                >
                  {savingDetails ? (
                    <>
                      <div className={styles.btnSpinner}></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Save Details</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Total */}
          <div className={styles.orderTotalCard}>
            <h3>Order Total</h3>
            
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>VAT (20%)</span>
              <span>£{vat.toFixed(2)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.totalRowTotal}`}>
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>

            <div className={styles.paymentInfo}>
              <FaCreditCard />
              <p>Payment terms: Net 30 days</p>
              <p className={styles.paymentNote}>
                Your order will be reviewed by our team before processing.
              </p>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={
                submitting || 
                !customerDetails ||
                !customerDetails.address.address1 ||
                !customerDetails.address.city ||
                !customerDetails.address.postcode ||
                !customerDetails.phone ||
                !customerDetails.name ||
                customerDetails.name === customerDetails.email
              }
              className={styles.placeOrderBtn}
            >
              {submitting ? (
                <>
                  <div className={styles.btnSpinner}></div>
                  <span>Submitting Order...</span>
                </>
              ) : (
                <span>Submit Order for Approval</span>
              )}
            </button>

            <button
              onClick={() => navigate('/customer/cart')}
              className={styles.backToCartBtn}
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
