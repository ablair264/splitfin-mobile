// src/components/CustomerRequestCatalogue/CustomerRequestCatalogue.tsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { FaBook, FaCheckCircle, FaUser, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';
import './CustomerRequestCatalogue.css';

interface CustomerData {
  company_name?: string;
  customer_name?: string;
  email?: string;
  phone?: string;
  shipping_address?: {
    address?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    country?: string;
  };
}

const catalogueOptions = [
  'Blomus',
  'Elvang',
  'GEFU',
  'My Flame Lifestyle',
  'PPD',
  'Räder',
  'Relaxound',
  'Remember'
];

export default function CustomerRequestCatalogue() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: '',
    catalogues: [] as string[],
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      if (!auth.currentUser) return;

      const customerDoc = await getDoc(doc(db, 'customer_data', auth.currentUser.uid));
      if (customerDoc.exists()) {
        const data = customerDoc.data() as CustomerData;
        setFormData(prev => ({
          ...prev,
          name: data.customer_name || '',
          company: data.company_name || '',
          email: data.email || auth.currentUser?.email || '',
          phone: data.phone || '',
          address: data.shipping_address?.address || '',
          city: data.shipping_address?.city || '',
          postcode: data.shipping_address?.zipcode || '',
          country: data.shipping_address?.country || 'United Kingdom'
        }));
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCatalogueToggle = (catalogue: string) => {
    setFormData(prev => ({
      ...prev,
      catalogues: prev.catalogues.includes(catalogue)
        ? prev.catalogues.filter(c => c !== catalogue)
        : [...prev.catalogues, catalogue]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Send email via API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://splitfin-zoho-api.onrender.com'}/api/email/catalogue-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            submittedAt: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send catalogue request');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="request-loading">
        <div className="loading-spinner"></div>
        <p>Loading your information...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="request-success">
        <FaCheckCircle className="success-icon" />
        <h2>Request Submitted Successfully!</h2>
        <p>Thank you for your catalogue request. We'll process it shortly and send the catalogues to your address.</p>
        <button 
          className="new-request-btn"
          onClick={() => {
            setSubmitted(false);
            setFormData(prev => ({ ...prev, catalogues: [], message: '' }));
          }}
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="customer-request-catalogue">
      <div className="request-header">
        <FaBook className="header-icon" />
        <h1>Request Catalogues</h1>
        <p>Select the catalogues you'd like to receive and confirm your shipping details</p>
      </div>

      <form onSubmit={handleSubmit} className="request-form">
        {/* Catalogue Selection */}
        <div className="form-section">
          <h3>
            <FaBook style={{ color: '#c58390' }} />
            Select Catalogues
          </h3>
          <div className="catalogues-grid">
            {catalogueOptions.map(catalogue => (
              <label key={catalogue} className="catalogue-option">
                <input
                  type="checkbox"
                  checked={formData.catalogues.includes(catalogue)}
                  onChange={() => handleCatalogueToggle(catalogue)}
                />
                <span className="catalogue-name">{catalogue}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>
            <FaUser style={{ color: '#c58390' }} />
            Contact Information
          </h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">
                Contact Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="company">
                Company <span className="required">*</span>
              </label>
              <input
                type="text"
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="email">
                <FaEnvelope style={{ fontSize: '0.75rem', color: '#8a7a7f' }} />
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="phone">
                <FaPhone style={{ fontSize: '0.75rem', color: '#8a7a7f' }} />
                Phone <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="form-section">
          <h3>
            <FaMapMarkerAlt style={{ color: '#c58390' }} />
            Shipping Address
          </h3>
          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="address">
                Address <span className="required">*</span>
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="city">
                City <span className="required">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="postcode">
                Postcode <span className="required">*</span>
              </label>
              <input
                type="text"
                id="postcode"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="country">
                Country <span className="required">*</span>
              </label>
              <input
                type="text"
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Message */}
        <div className="form-section">
          <h3>Additional Information (Optional)</h3>
          <div className="form-field full-width">
            <textarea
              placeholder="Any special requests or additional information..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={submitting || formData.catalogues.length === 0}
        >
          <span>{submitting ? 'Submitting Request...' : 'Submit Catalogue Request'}</span>
        </button>
      </form>
    </div>
  );
}