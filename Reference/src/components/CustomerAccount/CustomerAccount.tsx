// src/components/CustomerAccount/CustomerAccount.tsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '../../firebase';
import '../CustomerDashboard/CustomerDashboard.css';

interface AccountInfo {
  companyName: string;
  email: string;
  contactName: string;
  phone: string;
  address: string;
}

export default function CustomerAccount() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    companyName: '',
    email: '',
    contactName: '',
    phone: '',
    address: ''
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    try {
      if (!auth.currentUser) return;
      
      // Get customer from customers collection
      const customerQuery = query(
        collection(db, 'customers'),
        where('firebase_uid', '==', auth.currentUser.uid)
      );
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerDoc = customerSnapshot.docs[0];
        const data = customerDoc.data();
        setCustomerId(customerDoc.id);
        
        setAccountInfo({
          companyName: data.company_name || '',
          email: data.auth_email || auth.currentUser.email || '',
          contactName: data.customer_name || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!customerId) return;
      
      await updateDoc(doc(db, 'customers', customerId), {
        company_name: accountInfo.companyName,
        customer_name: accountInfo.contactName,
        phone: accountInfo.phone,
        address: accountInfo.address,
        updatedAt: new Date().toISOString()
      });
      
      setEditing(false);
    } catch (error) {
      console.error('Error saving account info:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="customer-account">
      <h1>My Account</h1>
      
      <div className="account-section">
        <h2>Account Information</h2>
        
        <div className="account-form">
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={accountInfo.companyName}
              onChange={(e) => setAccountInfo({ ...accountInfo, companyName: e.target.value })}
              disabled={!editing}
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={accountInfo.email}
              disabled
            />
          </div>
          
          <div className="form-group">
            <label>Contact Name</label>
            <input
              type="text"
              value={accountInfo.contactName}
              onChange={(e) => setAccountInfo({ ...accountInfo, contactName: e.target.value })}
              disabled={!editing}
            />
          </div>
          
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={accountInfo.phone}
              onChange={(e) => setAccountInfo({ ...accountInfo, phone: e.target.value })}
              disabled={!editing}
            />
          </div>
          
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={accountInfo.address}
              onChange={(e) => setAccountInfo({ ...accountInfo, address: e.target.value })}
              disabled={!editing}
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="cancel-btn">Cancel</button>
                <button onClick={handleSave} className="save-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="edit-btn">Edit Information</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}