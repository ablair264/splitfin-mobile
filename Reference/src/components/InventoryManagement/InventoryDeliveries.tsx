import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList, 
  FaFileDownload, 
  FaCalendarAlt, 
  FaTruck, 
  FaBoxOpen, 
  FaMapMarkerAlt,
  FaSearch,
  FaFilter,
  FaPlus,
  FaPrint,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSync
} from 'react-icons/fa';
import styles from '../ViewOrder.module.css';

interface Manifest {
  manifest_id: string;
  manifest_date: string;
  carrier_id: string;
  carrier_name: string;
  warehouse_id: string;
  warehouse_name: string;
  status: 'pending' | 'generated' | 'closed' | 'picked_up';
  total_shipments: number;
  total_packages: number;
  total_weight: number;
  pickup_scheduled: boolean;
  pickup_time?: string;
  pickup_confirmation?: string;
  manifest_url?: string;
  created_at: string;
  shipments: ManifestShipment[];
}

interface ManifestShipment {
  shipment_id: string;
  tracking_number: string;
  customer_name: string;
  destination_city: string;
  destination_postal_code: string;
  service_name: string;
  package_count: number;
  weight: number;
  value: number;
  status: string;
}

interface DailyManifestSummary {
  date: string;
  total_manifests: number;
  total_shipments: number;
  total_packages: number;
  carriers: Array<{
    carrier_name: string;
    shipment_count: number;
    manifest_status: string;
  }>;
}

interface GenerateManifestForm {
  carrier_id: string;
  warehouse_id: string;
  manifest_date: string;
  cutoff_time: string;
  include_pending: boolean;
  include_processed: boolean;
  manifest_type: 'explicit' | 'implicit';
  label_ids?: string[];
}

const InventoryDeliveries: React.FC = () => {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyManifestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'generated' | 'closed' | 'picked_up'>('all');
  const [selectedManifest, setSelectedManifest] = useState<Manifest | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [generateForm, setGenerateForm] = useState<GenerateManifestForm>({
    carrier_id: '',
    warehouse_id: '',
    manifest_date: new Date().toISOString().split('T')[0],
    cutoff_time: '17:00',
    include_pending: true,
    include_processed: false,
    manifest_type: 'implicit'
  });

  // Available carriers and warehouses (would be loaded from API)
  const [carriers] = useState([
    { id: 'ups', name: 'UPS', logo: '/ups.png' },
    { id: 'royal_mail', name: 'Royal Mail', logo: '/royalmail.png' },
    { id: 'dpd', name: 'DPD', logo: '/dpd.png' }
  ]);

  const [warehouses] = useState([
    { id: 'main', name: 'Main Warehouse', address: 'London, UK' },
    { id: 'north', name: 'North Distribution', address: 'Manchester, UK' },
    { id: 'south', name: 'South Distribution', address: 'Brighton, UK' }
  ]);

  useEffect(() => {
    loadManifests();
    loadDailySummary();
  }, [selectedDate]);

  const loadManifests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/manifests?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load manifests');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setManifests(result.data.manifests || []);
      } else {
        throw new Error(result.error || 'Failed to load manifests');
      }
    } catch (err) {
      console.error('Error loading manifests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load manifests');
      
      // Mock data for development
      setManifests([
        {
          manifest_id: 'MAN-001',
          manifest_date: selectedDate,
          carrier_id: 'ups',
          carrier_name: 'UPS',
          warehouse_id: 'main',
          warehouse_name: 'Main Warehouse',
          status: 'generated',
          total_shipments: 15,
          total_packages: 23,
          total_weight: 45.5,
          pickup_scheduled: true,
          pickup_time: '16:00',
          pickup_confirmation: 'UPS123456',
          manifest_url: '/manifests/MAN-001.pdf',
          created_at: new Date().toISOString(),
          shipments: [
            {
              shipment_id: 'SHIP-001',
              tracking_number: '1Z12345E1234567890',
              customer_name: 'John Smith',
              destination_city: 'Birmingham',
              destination_postal_code: 'B1 1AA',
              service_name: 'UPS Ground',
              package_count: 1,
              weight: 2.5,
              value: 150.00,
              status: 'ready'
            },
            {
              shipment_id: 'SHIP-002',
              tracking_number: '1Z12345E1234567891',
              customer_name: 'Jane Doe',
              destination_city: 'Leeds',
              destination_postal_code: 'LS1 1AA',
              service_name: 'UPS Next Day',
              package_count: 2,
              weight: 3.2,
              value: 275.50,
              status: 'ready'
            }
          ]
        },
        {
          manifest_id: 'MAN-002',
          manifest_date: selectedDate,
          carrier_id: 'royal_mail',
          carrier_name: 'Royal Mail',
          warehouse_id: 'main',
          warehouse_name: 'Main Warehouse',
          status: 'pending',
          total_shipments: 8,
          total_packages: 8,
          total_weight: 12.3,
          pickup_scheduled: false,
          created_at: new Date().toISOString(),
          shipments: [
            {
              shipment_id: 'SHIP-003',
              tracking_number: 'RM123456789GB',
              customer_name: 'Bob Wilson',
              destination_city: 'Glasgow',
              destination_postal_code: 'G1 1AA',
              service_name: 'Tracked 24',
              package_count: 1,
              weight: 1.8,
              value: 89.99,
              status: 'ready'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadDailySummary = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/manifests/summary?days=7`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDailySummary(result.data.summary || []);
        }
      }
    } catch (err) {
      console.error('Error loading daily summary:', err);
      
      // Mock summary data
      const mockSummary = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockSummary.push({
          date: date.toISOString().split('T')[0],
          total_manifests: Math.floor(Math.random() * 5) + 1,
          total_shipments: Math.floor(Math.random() * 50) + 10,
          total_packages: Math.floor(Math.random() * 75) + 15,
          carriers: [
            { carrier_name: 'UPS', shipment_count: Math.floor(Math.random() * 20) + 5, manifest_status: 'generated' },
            { carrier_name: 'Royal Mail', shipment_count: Math.floor(Math.random() * 15) + 3, manifest_status: 'generated' },
            { carrier_name: 'DPD', shipment_count: Math.floor(Math.random() * 10) + 2, manifest_status: 'pending' }
          ]
        });
      }
      setDailySummary(mockSummary);
    }
  };

  const generateManifest = async () => {
    try {
      setGenerating(true);
      
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/manifests/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(generateForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate manifest');
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert('Manifest generated successfully!');
        setShowGenerateForm(false);
        loadManifests(); // Reload manifests
        
        // Reset form
        setGenerateForm({
          carrier_id: '',
          warehouse_id: '',
          manifest_date: new Date().toISOString().split('T')[0],
          cutoff_time: '17:00',
          include_pending: true,
          include_processed: false,
          manifest_type: 'implicit'
        });
      } else {
        throw new Error(result.error || 'Failed to generate manifest');
      }
    } catch (err) {
      console.error('Error generating manifest:', err);
      alert('Error generating manifest: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const downloadManifest = async (manifestId: string, manifestUrl?: string) => {
    try {
      if (manifestUrl) {
        // Download existing manifest
        const link = document.createElement('a');
        link.href = manifestUrl;
        link.download = `manifest-${manifestId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generate and download new manifest
        const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
        
        const response = await fetch(`${apiUrl}/api/shipstation/manifests/${manifestId}/download`, {
          method: 'GET'
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `manifest-${manifestId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error('Error downloading manifest:', err);
      alert('Error downloading manifest');
    }
  };

  const closeManifest = async (manifestId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/shipstation/manifests/${manifestId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Manifest closed successfully!');
          loadManifests(); // Reload manifests
        }
      }
    } catch (err) {
      console.error('Error closing manifest:', err);
      alert('Error closing manifest');
    }
  };

  const filteredManifests = manifests.filter(manifest => {
    const matchesSearch = manifest.manifest_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manifest.carrier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manifest.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || manifest.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock style={{ color: '#fbbf24' }} />;
      case 'generated':
        return <FaCheckCircle style={{ color: '#22c55e' }} />;
      case 'closed':
        return <FaCheckCircle style={{ color: '#4daeac' }} />;
      case 'picked_up':
        return <FaTruck style={{ color: '#79d5e9' }} />;
      default:
        return <FaExclamationTriangle style={{ color: '#ef4444' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
      case 'generated':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'closed':
        return { bg: 'rgba(77, 174, 172, 0.2)', color: '#4daeac', border: 'rgba(77, 174, 172, 0.3)' };
      case 'picked_up':
        return { bg: 'rgba(121, 213, 233, 0.2)', color: '#79d5e9', border: 'rgba(121, 213, 233, 0.3)' };
      default:
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <FaClipboardList style={{ fontSize: '48px', color: '#79d5e9', marginBottom: '16px' }} />
          <p>Loading delivery manifests...</p>
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
            Delivery Manifests
          </h1>
          <p style={{ color: '#8b98a5', fontSize: '14px', margin: 0 }}>
            Generate and manage daily shipping manifests for carrier pickups
          </p>
        </div>

        {/* Daily Summary Cards */}
        {dailySummary.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px' }}>7-Day Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {dailySummary.map((summary, index) => (
                <div
                  key={summary.date}
                  style={{
                    background: 'rgba(26, 31, 42, 0.95)',
                    border: summary.date === selectedDate ? '1px solid rgba(121, 213, 233, 0.4)' : '1px solid rgba(121, 213, 233, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setSelectedDate(summary.date)}
                  onMouseEnter={(e) => {
                    if (summary.date !== selectedDate) {
                      e.currentTarget.style.borderColor = 'rgba(121, 213, 233, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (summary.date !== selectedDate) {
                      e.currentTarget.style.borderColor = 'rgba(121, 213, 233, 0.2)';
                    }
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#8b98a5', marginBottom: '4px' }}>
                    {formatDate(summary.date)}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#79d5e9', marginBottom: '8px' }}>
                    {summary.total_shipments}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8b98a5' }}>
                    {summary.total_manifests} manifests
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowGenerateForm(true)}
            className={styles.generateInvoiceButton}
          >
            <FaPlus /> Generate Manifest
          </button>
          <button
            onClick={loadManifests}
            className={styles.actionButtonSecondary}
          >
            <FaSync /> Refresh
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '12px',
              background: 'rgba(26, 31, 42, 0.95)',
              border: '1px solid rgba(121, 213, 233, 0.2)',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '14px'
            }}
          />
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <FaSearch style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#8b98a5' 
            }} />
            <input
              type="text"
              placeholder="Search manifests..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '12px 16px',
              background: 'rgba(26, 31, 42, 0.95)',
              border: '1px solid rgba(121, 213, 233, 0.2)',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '14px'
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="generated">Generated</option>
            <option value="closed">Closed</option>
            <option value="picked_up">Picked Up</option>
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

        {/* Manifests Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {filteredManifests.map((manifest) => {
            const statusStyle = getStatusColor(manifest.status);
            
            return (
              <div
                key={manifest.manifest_id}
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
                onClick={() => setSelectedManifest(manifest)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(121, 213, 233, 0.4)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(121, 213, 233, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(121, 213, 233, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Manifest Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>
                      {manifest.manifest_id}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#8b98a5' }}>
                        {manifest.carrier_name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8b98a5' }}>•</span>
                      <span style={{ fontSize: '14px', color: '#8b98a5' }}>
                        {manifest.warehouse_name}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8b98a5' }}>
                      Created: {formatDate(manifest.created_at)}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                    borderRadius: '8px'
                  }}>
                    {getStatusIcon(manifest.status)}
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: statusStyle.color,
                      textTransform: 'capitalize'
                    }}>
                      {manifest.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Manifest Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#79d5e9' }}>
                      {manifest.total_shipments}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8b98a5' }}>Shipments</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#4daeac' }}>
                      {manifest.total_packages}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8b98a5' }}>Packages</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#61bc8e' }}>
                      {manifest.total_weight.toFixed(1)}kg
                    </div>
                    <div style={{ fontSize: '12px', color: '#8b98a5' }}>Weight</div>
                  </div>
                </div>

                {/* Pickup Information */}
                {manifest.pickup_scheduled && (
                  <div style={{
                    background: 'rgba(121, 213, 233, 0.1)',
                    border: '1px solid rgba(121, 213, 233, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FaTruck style={{ color: '#79d5e9' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                        Pickup Scheduled
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8b98a5' }}>
                      {manifest.pickup_time && `Time: ${formatTime(manifest.pickup_time)}`}
                      {manifest.pickup_confirmation && ` • Confirmation: ${manifest.pickup_confirmation}`}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {manifest.status === 'generated' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadManifest(manifest.manifest_id, manifest.manifest_url);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '6px',
                        color: '#22c55e',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FaFileDownload /> Download
                    </button>
                  )}
                  
                  {manifest.status === 'generated' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeManifest(manifest.manifest_id);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(77, 174, 172, 0.2)',
                        border: '1px solid rgba(77, 174, 172, 0.3)',
                        borderRadius: '6px',
                        color: '#4daeac',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FaCheckCircle /> Close
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedManifest(manifest);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(121, 213, 233, 0.2)',
                      border: '1px solid rgba(121, 213, 233, 0.3)',
                      borderRadius: '6px',
                      color: '#79d5e9',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FaEye /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredManifests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8b98a5' }}>
            <FaClipboardList style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ color: '#ffffff', marginBottom: '8px' }}>No manifests found</h3>
            <p>No manifests found for the selected date and filters.</p>
            <button
              onClick={() => setShowGenerateForm(true)}
              className={styles.generateInvoiceButton}
              style={{ marginTop: '16px' }}
            >
              <FaPlus /> Generate New Manifest
            </button>
          </div>
        )}
      </div>

      {/* Generate Manifest Modal */}
      {showGenerateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(26, 31, 42, 0.98)',
            border: '1px solid rgba(121, 213, 233, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#ffffff', margin: 0 }}>Generate Manifest</h2>
              <button
                onClick={() => setShowGenerateForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b98a5',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#8b98a5', fontSize: '12px', marginBottom: '4px' }}>
                    Carrier
                  </label>
                  <select
                    value={generateForm.carrier_id}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, carrier_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 20, 25, 0.8)',
                      border: '1px solid rgba(121, 213, 233, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  >
                    <option value="">Select carrier</option>
                    {carriers.map(carrier => (
                      <option key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8b98a5', fontSize: '12px', marginBottom: '4px' }}>
                    Warehouse
                  </label>
                  <select
                    value={generateForm.warehouse_id}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, warehouse_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 20, 25, 0.8)',
                      border: '1px solid rgba(121, 213, 233, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#8b98a5', fontSize: '12px', marginBottom: '4px' }}>
                    Manifest Date
                  </label>
                  <input
                    type="date"
                    value={generateForm.manifest_date}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, manifest_date: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 20, 25, 0.8)',
                      border: '1px solid rgba(121, 213, 233, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8b98a5', fontSize: '12px', marginBottom: '4px' }}>
                    Cutoff Time
                  </label>
                  <input
                    type="time"
                    value={generateForm.cutoff_time}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, cutoff_time: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 20, 25, 0.8)',
                      border: '1px solid rgba(121, 213, 233, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#8b98a5', fontSize: '12px', marginBottom: '8px' }}>
                  Manifest Type
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                    <input
                      type="radio"
                      value="implicit"
                      checked={generateForm.manifest_type === 'implicit'}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, manifest_type: e.target.value as 'implicit' }))}
                    />
                    <span style={{ fontSize: '14px' }}>Implicit (by criteria)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                    <input
                      type="radio"
                      value="explicit"
                      checked={generateForm.manifest_type === 'explicit'}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, manifest_type: e.target.value as 'explicit' }))}
                    />
                    <span style={{ fontSize: '14px' }}>Explicit (specific labels)</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#8b98a5', fontSize: '12px', marginBottom: '8px' }}>
                  Include Shipments
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                    <input
                      type="checkbox"
                      checked={generateForm.include_pending}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, include_pending: e.target.checked }))}
                    />
                    <span style={{ fontSize: '14px' }}>Include pending shipments</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                    <input
                      type="checkbox"
                      checked={generateForm.include_processed}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, include_processed: e.target.checked }))}
                    />
                    <span style={{ fontSize: '14px' }}>Include processed shipments</span>
                  </label>
                </div>
              </div>

              <button
                onClick={generateManifest}
                disabled={generating || !generateForm.carrier_id || !generateForm.warehouse_id}
                className={styles.generateInvoiceButton}
                style={{ 
                  width: '100%', 
                  marginTop: '16px',
                  opacity: generating || !generateForm.carrier_id || !generateForm.warehouse_id ? 0.5 : 1
                }}
              >
                {generating ? <FaClock /> : <FaPlus />} 
                {generating ? 'Generating...' : 'Generate Manifest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Details Modal */}
      {selectedManifest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(26, 31, 42, 0.98)',
            border: '1px solid rgba(121, 213, 233, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#ffffff', margin: 0 }}>
                Manifest Details - {selectedManifest.manifest_id}
              </h2>
              <button
                onClick={() => setSelectedManifest(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b98a5',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Manifest Summary */}
            <div style={{
              background: 'rgba(121, 213, 233, 0.05)',
              border: '1px solid rgba(121, 213, 233, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#8b98a5', marginBottom: '4px' }}>Carrier</div>
                  <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>
                    {selectedManifest.carrier_name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8b98a5', marginBottom: '4px' }}>Warehouse</div>
                  <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>
                    {selectedManifest.warehouse_name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8b98a5', marginBottom: '4px' }}>Total Weight</div>
                  <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>
                    {selectedManifest.total_weight.toFixed(1)}kg
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8b98a5', marginBottom: '4px' }}>Status</div>
                  <div style={{
                    ...getStatusColor(selectedManifest.status),
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    display: 'inline-block'
                  }}>
                    {selectedManifest.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipments Table */}
            <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>
              Shipments ({selectedManifest.shipments.length})
            </h3>
            <div style={{
              background: 'rgba(15, 20, 25, 0.8)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 180px 120px 120px 80px 80px 100px',
                gap: '16px',
                padding: '16px',
                background: 'rgba(121, 213, 233, 0.1)',
                fontSize: '12px',
                fontWeight: '600',
                color: '#8b98a5',
                textTransform: 'uppercase'
              }}>
                <div>Tracking #</div>
                <div>Customer</div>
                <div>Destination</div>
                <div>Service</div>
                <div>Packages</div>
                <div>Weight</div>
                <div>Value</div>
              </div>
              
              {/* Table Body */}
              {selectedManifest.shipments.map((shipment, index) => (
                <div
                  key={shipment.shipment_id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 180px 120px 120px 80px 80px 100px',
                    gap: '16px',
                    padding: '16px',
                    borderBottom: index < selectedManifest.shipments.length - 1 ? '1px solid rgba(121, 213, 233, 0.1)' : 'none',
                    fontSize: '14px',
                    color: '#ffffff'
                  }}
                >
                  <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {shipment.tracking_number}
                  </div>
                  <div>{shipment.customer_name}</div>
                  <div>
                    {shipment.destination_city}
                    <div style={{ fontSize: '12px', color: '#8b98a5' }}>
                      {shipment.destination_postal_code}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px' }}>{shipment.service_name}</div>
                  <div style={{ textAlign: 'center' }}>{shipment.package_count}</div>
                  <div style={{ textAlign: 'center' }}>{shipment.weight.toFixed(1)}kg</div>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(shipment.value)}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              {selectedManifest.status === 'generated' && (
                <>
                  <button
                    onClick={() => downloadManifest(selectedManifest.manifest_id, selectedManifest.manifest_url)}
                    className={styles.actionButtonPrimary}
                  >
                    <FaFileDownload /> Download Manifest
                  </button>
                  <button
                    onClick={() => closeManifest(selectedManifest.manifest_id)}
                    className={styles.actionButtonSecondary}
                  >
                    <FaCheckCircle /> Close Manifest
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

export default InventoryDeliveries;