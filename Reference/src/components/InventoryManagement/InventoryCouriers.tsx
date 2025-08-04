import React, { useState, useEffect } from 'react';
import { 
  FaTruck, 
  FaShippingFast, 
  FaBoxOpen, 
  FaCalendarAlt, 
  FaFileInvoice, 
  FaGlobe, 
  FaCog, 
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaSearch,
  FaFilter,
  FaDownload,
  FaPhone,
  FaEnvelope,
  FaRoute
} from 'react-icons/fa';
import styles from '../ViewOrder.module.css';

interface Carrier {
  carrier_id: string;
  carrier_name: string;
  carrier_code: string;
  account_number?: string;
  is_active: boolean;
  services: CarrierService[];
  features: string[];
  logo_url?: string;
  website?: string;
  support_phone?: string;
  support_email?: string;
  pickup_options?: PickupOption[];
}

interface CarrierService {
  service_id: string;
  service_name: string;
  service_code: string;
  is_domestic: boolean;
  is_international: boolean;
  delivery_days?: string;
  supports_tracking: boolean;
  supports_insurance: boolean;
  supports_signature: boolean;
  max_weight?: number;
  base_rate?: number;
}

interface PickupOption {
  pickup_type: 'scheduled' | 'same_day' | 'next_day';
  cutoff_time: string;
  cost: number;
  available_days: string[];
}

interface RateQuote {
  service_id: string;
  service_name: string;
  carrier_name: string;
  rate: number;
  delivery_days: string;
  delivery_date: string;
  features: string[];
}

const InventoryCouriers: React.FC = () => {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [showRateQuote, setShowRateQuote] = useState(false);
  const [showPickupScheduler, setShowPickupScheduler] = useState(false);
  const [showCustomsGenerator, setShowCustomsGenerator] = useState(false);
  
  // Rate quote form data
  const [quoteForm, setQuoteForm] = useState({
    from_address: {
      city: 'London',
      state: 'England',
      postal_code: 'SW1A 1AA',
      country: 'GB'
    },
    to_address: {
      city: '',
      state: '',
      postal_code: '',
      country: 'GB'
    },
    package: {
      weight: 1,
      length: 10,
      width: 10,
      height: 10,
      weight_unit: 'kg' as 'kg' | 'lb',
      dimension_unit: 'cm' as 'cm' | 'in'
    }
  });
  
  const [rates, setRates] = useState<RateQuote[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);

  // Pickup scheduler form data
  const [pickupForm, setPickupForm] = useState({
    carrier_id: '',
    pickup_date: '',
    pickup_time: '09:00',
    ready_time: '09:00',
    close_time: '17:00',
    location: 'front_door',
    special_instructions: '',
    contact_name: '',
    contact_phone: ''
  });

  // Customs form data
  const [customsForm, setCustomsForm] = useState({
    destination_country: '',
    contents_type: 'merchandise' as 'merchandise' | 'documents' | 'gift' | 'sample',
    contents_description: '',
    currency: 'GBP',
    items: [
      {
        description: '',
        quantity: 1,
        value: 0,
        weight: 0,
        origin_country: 'GB',
        hs_tariff_number: ''
      }
    ]
  });

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/carriers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load carriers');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCarriers(result.data.carriers || []);
      } else {
        throw new Error(result.error || 'Failed to load carriers');
      }
    } catch (err) {
      console.error('Error loading carriers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load carriers');
      
      // Mock data for development
      setCarriers([
        {
          carrier_id: 'ups',
          carrier_name: 'UPS',
          carrier_code: 'ups',
          account_number: '12345678',
          is_active: true,
          logo_url: '/ups.png',
          website: 'https://www.ups.com',
          support_phone: '+44 20 7123 4567',
          support_email: 'support@ups.com',
          services: [
            {
              service_id: 'ups_ground',
              service_name: 'UPS Ground',
              service_code: 'ups_ground',
              is_domestic: true,
              is_international: false,
              delivery_days: '1-3 business days',
              supports_tracking: true,
              supports_insurance: true,
              supports_signature: true,
              max_weight: 70,
              base_rate: 12.50
            },
            {
              service_id: 'ups_next_day',
              service_name: 'UPS Next Day Air',
              service_code: 'ups_next_day_air',
              is_domestic: true,
              is_international: false,
              delivery_days: 'Next business day',
              supports_tracking: true,
              supports_insurance: true,
              supports_signature: true,
              max_weight: 70,
              base_rate: 45.00
            }
          ],
          features: ['Tracking', 'Insurance', 'Signature Confirmation', 'Pickup Services'],
          pickup_options: [
            {
              pickup_type: 'scheduled',
              cutoff_time: '15:00',
              cost: 8.50,
              available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            }
          ]
        },
        {
          carrier_id: 'royal_mail',
          carrier_name: 'Royal Mail',
          carrier_code: 'royal_mail',
          is_active: true,
          logo_url: '/royalmail.png',
          website: 'https://www.royalmail.com',
          support_phone: '+44 345 7740 740',
          support_email: 'customer.services@royalmail.com',
          services: [
            {
              service_id: 'royal_mail_1st_class',
              service_name: 'First Class',
              service_code: 'royal_mail_1st_class',
              is_domestic: true,
              is_international: false,
              delivery_days: '1-2 business days',
              supports_tracking: false,
              supports_insurance: false,
              supports_signature: false,
              max_weight: 2,
              base_rate: 1.10
            }
          ],
          features: ['Tracking', 'Next Day Delivery', 'International Shipping'],
          pickup_options: [
            {
              pickup_type: 'scheduled',
              cutoff_time: '16:00',
              cost: 0,
              available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRateQuotes = async () => {
    setRatesLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to get rate quotes');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setRates(result.data.rates || []);
      } else {
        throw new Error(result.error || 'Failed to get rate quotes');
      }
    } catch (err) {
      console.error('Error getting rate quotes:', err);
      // Mock rates for demo
      setRates([
        {
          service_id: 'ups_ground',
          service_name: 'UPS Ground',
          carrier_name: 'UPS',
          rate: 12.50,
          delivery_days: '1-3 business days',
          delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          features: ['Tracking', 'Insurance']
        },
        {
          service_id: 'royal_mail_tracked_24',
          service_name: 'Tracked 24',
          carrier_name: 'Royal Mail',
          rate: 6.95,
          delivery_days: 'Next working day',
          delivery_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          features: ['Tracking', 'Signature']
        }
      ]);
    } finally {
      setRatesLoading(false);
    }
  };

  const schedulePickup = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/pickup/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pickupForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule pickup');
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert('Pickup scheduled successfully!');
        setShowPickupScheduler(false);
      } else {
        throw new Error(result.error || 'Failed to schedule pickup');
      }
    } catch (err) {
      console.error('Error scheduling pickup:', err);
      alert('Error scheduling pickup: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const generateCustomsDocuments = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/customs/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customsForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate customs documents');
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert('Customs documents generated successfully!');
        setShowCustomsGenerator(false);
      } else {
        throw new Error(result.error || 'Failed to generate customs documents');
      }
    } catch (err) {
      console.error('Error generating customs documents:', err);
      alert('Error generating customs documents: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = carrier.carrier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.carrier_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && carrier.is_active) ||
                         (filterActive === 'inactive' && !carrier.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <FaTruck style={{ fontSize: '48px', color: '#79d5e9', marginBottom: '16px' }} />
          <p>Loading courier information...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2a 50%, #2c3e50 100%)', padding: '24px', position: 'relative' }}>
      {/* Animated background overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, rgba(15, 20, 25, 0.9) 0%, rgba(121, 213, 233, 0.05) 20%, rgba(26, 31, 42, 0.95) 40%, rgba(77, 174, 172, 0.05) 60%, rgba(44, 62, 80, 0.9) 80%, rgba(121, 213, 233, 0.05) 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradientShift 15s ease infinite',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>
            Courier Management
          </h1>
          <p style={{ color: '#8b98a5', fontSize: '14px', margin: 0 }}>
            Manage shipping carriers, get rate quotes, schedule pickups, and generate customs documents
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowRateQuote(true)}
            className={styles.actionButtonPrimary}
          >
            <FaMoneyBillWave /> Get Rate Quotes
          </button>
          <button
            onClick={() => setShowPickupScheduler(true)}
            className={styles.actionButtonSecondary}
          >
            <FaCalendarAlt /> Schedule Pickup
          </button>
          <button
            onClick={() => setShowCustomsGenerator(true)}
            className={styles.generateInvoiceButton}
          >
            <FaFileInvoice /> Generate Customs Documents
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <FaSearch style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#8b98a5' 
            }} />
            <input
              type="text"
              placeholder="Search carriers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                background: 'rgba(26, 31, 42, 0.95)',
                border: '1px solid rgba(121, 213, 233, 0.2)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14px'
              }}
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
            style={{
              padding: '12px 16px',
              background: 'rgba(26, 31, 42, 0.95)',
              border: '1px solid rgba(121, 213, 233, 0.2)',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '14px'
            }}
          >
            <option value="all">All Carriers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        {/* Carriers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {filteredCarriers.map((carrier) => (
            <div
              key={carrier.carrier_id}
              style={{
                background: 'rgba(26, 31, 42, 0.95)',
                border: '1px solid rgba(121, 213, 233, 0.2)',
                borderRadius: '20px',
                padding: '24px',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedCarrier(carrier)}
            >
              {/* Carrier Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: carrier.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: carrier.is_active ? '#22c55e' : '#9ca3af'
                }}>
                  {carrier.logo_url ? (
                    <img src={carrier.logo_url} alt={carrier.carrier_name} style={{ width: '40px', height: 'auto' }} />
                  ) : (
                    <FaTruck />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
                    {carrier.carrier_name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: carrier.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                      color: carrier.is_active ? '#22c55e' : '#9ca3af'
                    }}>
                      {carrier.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {carrier.account_number && (
                      <span style={{ fontSize: '12px', color: '#8b98a5' }}>
                        Account: {carrier.account_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Services Summary */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#8b98a5', marginBottom: '8px' }}>
                  Services ({carrier.services.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {carrier.services.slice(0, 3).map((service) => (
                    <span
                      key={service.service_id}
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: 'rgba(121, 213, 233, 0.1)',
                        color: '#79d5e9',
                        borderRadius: '6px'
                      }}
                    >
                      {service.service_name}
                    </span>
                  ))}
                  {carrier.services.length > 3 && (
                    <span style={{ fontSize: '11px', color: '#8b98a5' }}>
                      +{carrier.services.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#8b98a5', marginBottom: '8px' }}>
                  Features
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {carrier.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: 'rgba(77, 174, 172, 0.1)',
                        color: '#4daeac',
                        borderRadius: '6px'
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                  {carrier.features.length > 3 && (
                    <span style={{ fontSize: '11px', color: '#8b98a5' }}>
                      +{carrier.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {(carrier.support_phone || carrier.support_email) && (
                <div style={{ fontSize: '12px', color: '#8b98a5' }}>
                  {carrier.support_phone && (
                    <div>📞 {carrier.support_phone}</div>
                  )}
                  {carrier.support_email && (
                    <div>✉️ {carrier.support_email}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredCarriers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8b98a5' }}>
            <FaTruck style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ color: '#ffffff', marginBottom: '8px' }}>No carriers found</h3>
            <p>Try adjusting your search criteria or contact support to add new carriers.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default InventoryCouriers;