// src/components/CustomerDashboard/CustomerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { FaShoppingCart, FaFileInvoice, FaClock, FaTimes } from 'react-icons/fa';
import './CustomerDashboard.css';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  outstandingInvoices: number;
}

interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  color: string;
  description: string;
  tagline?: string;
  videoUrl?: string;
}

interface CustomerData {
  firebase_uid: string;
  customer_id: string;
  customer_name?: string;
  company_name?: string;
}

export default function CustomerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    outstandingInvoices: 0
  });
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [loadedLogos, setLoadedLogos] = useState<Set<string>>(new Set());

  // Brand configurations with colors from your images
  // Note: needsInvert indicates if the logo needs the CSS invert filter (dark logos that need to be made white)
  const brands: Brand[] = [
    { 
      id: 'blomus', 
      name: 'blomus', 
      logoUrl: '/logos/blomus.png', 
      color: '#6B8295',
      description: 'Since our inception, we have championed clean forms, sustainable materials, and an understated elegance. Our creations eschew transient trends in favor of a philosophy: minimalism imbued with soul. Drawing inspiration from nature and the modern way of life, we seamlessly merge superior craftsmanship with functionality—for a home that not only captivates with its beauty but also resonates with an enduring sense of grace.',
      tagline: 'Allow yourself to be inspired and discover how blomus is redefining the very essence of interior and lifestyle.',
      videoUrl: '/videos/blomus-bg.mp4'
    },
    { 
      id: 'elvang', 
      name: 'elvang', 
      logoUrl: '/logos/elvang.png', 
      color: '#C4A274',
      description: 'Responsible since 2003. Premium textiles crafted with care for people and planet.',
      tagline: 'Scandinavian design meets sustainable luxury',
      videoUrl: '/videos/elvang-bg.mp4'
    },
    { 
      id: 'myflame', 
      name: 'MY FLAME', 
      logoUrl: '/logos/myflame.png', 
      color: '#F4A460',
      description: 'Scented candles with personality. Each flame tells a story.',
      tagline: 'Light up your world with unique fragrances',
      videoUrl: '/videos/myflame-bg.mp4'
    },
    { 
      id: 'rader', 
      name: 'räder', 
      logoUrl: '/logos/rader.png', 
      color: '#8B6DB5',
      description: 'Poetry for living. Bringing beauty to everyday moments.',
      tagline: 'Where design meets emotion',
      videoUrl: '/videos/rader-bg.mp4'
    },
    { 
      id: 'remember', 
      name: 'REMEMBER', 
      logoUrl: '/logos/remember.png', 
      color: '#E6A4C4',
      description: 'Colorful design that brings joy to every space.',
      tagline: 'Making life more colorful',
      videoUrl: '/videos/remember-bg.mp4'
    },
    { 
      id: 'relaxound', 
      name: 'RELAXOUND', 
      logoUrl: '/logos/relaxound.png', 
      color: '#6FBE89',
      description: 'Nature sounds for modern living. Bringing tranquility home.',
      tagline: 'The sound of serenity',
      videoUrl: '/videos/relaxound-bg.mp4'
    }
  ];

  // Carousel images - using existing brand images temporarily
  const carouselImages = [
    '/images/banner1.jpg',
    '/images/banner2.jpg',
    '/images/banner3.jpg',
    '/images/banner4.jpg',
    '/images/banner5.jpg',
    '/images/banner6.jpg'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const fetchDashboardData = async () => {
    try {
      if (!auth.currentUser) return;

      // Get customer data using Firebase UID
      const customerDoc = await getDoc(doc(db, 'customer_data', auth.currentUser.uid));
      
      if (!customerDoc.exists()) {
        console.error('No customer data found');
        return;
      }

      const customerInfo = customerDoc.data() as CustomerData;
      setCustomerData(customerInfo);

      // Fetch orders using customer_id
      const ordersQuery = query(
        collection(db, 'salesorders'),
        where('customer_id', '==', customerInfo.customer_id)
      );
      const ordersSnap = await getDocs(ordersQuery);
      
      const pendingCount = ordersSnap.docs.filter(doc => 
        ['pending', 'draft'].includes(doc.data().status?.toLowerCase() || '')
      ).length;

      // Fetch invoices using customer_id
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('customer_id', '==', customerInfo.customer_id),
        where('status', '!=', 'paid')
      );
      const invoicesSnap = await getDocs(invoicesQuery);

      setStats({
        totalOrders: ordersSnap.size,
        pendingOrders: pendingCount,
        outstandingInvoices: invoicesSnap.size
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandClick = (brand: Brand) => {
    setSelectedBrand(brand);
    document.body.style.overflow = 'hidden';
  };

  const closeBrandModal = () => {
    setSelectedBrand(null);
    document.body.style.overflow = 'unset';
  };

  if (loading) {
    return (
      <div className="dmb-loading-container">
        <div className="dmb-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dmb-customer-dashboard">
      {/* Image Carousel */}
      <div className="dmb-carousel">
        {carouselImages.map((image, index) => (
          <div
            key={index}
            className={`dmb-carousel-slide ${index === carouselIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="dmb-carousel-indicators">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              className={`dmb-carousel-indicator ${index === carouselIndex ? 'active' : ''}`}
              onClick={() => setCarouselIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Metric Cards - Compact Design */}
      <div className="dmb-metrics">
        <Link to="/customer/orders" className="dmb-metric-card">
          <div className="dmb-metric-icon" data-icon-type="cart">
            <FaShoppingCart />
          </div>
          <div className="dmb-metric-content">
            <div className="dmb-metric-value">{stats.totalOrders}</div>
            <div className="dmb-metric-label">Total Orders</div>
          </div>
          <div className="dmb-metric-arrow">→</div>
        </Link>

        <Link to="/customer/orders?status=pending" className="dmb-metric-card dmb-metric-pending">
          <div className="dmb-metric-icon" data-icon-type="clock">
            <FaClock />
          </div>
          <div className="dmb-metric-content">
            <div className="dmb-metric-value">{stats.pendingOrders}</div>
            <div className="dmb-metric-label">Pending Orders</div>
          </div>
          <div className="dmb-metric-arrow">→</div>
        </Link>

        <Link to="/customer/invoices" className="dmb-metric-card dmb-metric-warning">
          <div className="dmb-metric-icon" data-icon-type="invoice">
            <FaFileInvoice />
          </div>
          <div className="dmb-metric-content">
            <div className="dmb-metric-value">{stats.outstandingInvoices}</div>
            <div className="dmb-metric-label">Outstanding Invoices</div>
          </div>
          <div className="dmb-metric-arrow">→</div>
        </Link>
      </div>

      {/* Brand Selection Grid */}
      <div className="dmb-brands-section">
        <h2 className="dmb-section-title">Our Brands</h2>
        <div className="dmb-brands-grid">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="dmb-brand-square"
              style={{ backgroundColor: brand.color }}
              onClick={() => handleBrandClick(brand)}
            >
              {!failedLogos.has(brand.id) ? (
                <>
                  {!loadedLogos.has(brand.id) && (
                    <div className="dmb-logo-loading">
                      <div className="dmb-logo-spinner" />
                    </div>
                  )}
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name}
                    style={{
                      opacity: loadedLogos.has(brand.id) ? 1 : 0
                    }}
                    onLoad={() => {
                      setLoadedLogos(prev => new Set(prev).add(brand.id));
                    }}
                    onError={() => {
                      console.error(`Failed to load logo for ${brand.name}: ${brand.logoUrl}`);
                      setFailedLogos(prev => new Set(prev).add(brand.id));
                    }}
                  />
                </>
              ) : (
                <div className="dmb-brand-name-fallback">
                  {brand.name}
                </div>
              )}
              <div className="dmb-brand-overlay" />
            </div>
          ))}
        </div>
      </div>



      {/* Brand Modal Overlay */}
      {selectedBrand && (
        <>
          <div 
            className="dmb-overlay" 
            onClick={closeBrandModal}
          />
          <div 
            className="dmb-brand-modal"
            style={{ backgroundColor: selectedBrand.color }}
          >
            {/* Video Background */}
            {selectedBrand.videoUrl && (
              <div className="dmb-modal-video-container">
                <video
                  className="dmb-modal-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src={selectedBrand.videoUrl} type="video/mp4" />
                </video>
                <div className="dmb-modal-video-overlay" />
              </div>
            )}
            
            <button className="dmb-close-button" onClick={closeBrandModal}>
              <FaTimes />
            </button>
            
            <div className="dmb-modal-content">
              <div className="dmb-modal-header">
                <img 
                  src={selectedBrand.logoUrl} 
                  alt={selectedBrand.name} 
                  className="dmb-modal-logo"
                />
              </div>
              
              <div className="dmb-modal-body">
                <p className="dmb-modal-description">{selectedBrand.description}</p>
                {selectedBrand.tagline && (
                  <p className="dmb-modal-tagline">{selectedBrand.tagline}</p>
                )}
                
                <div className="dmb-modal-actions">
                  <Link 
                    to={`/customer/catalogues?brand=${selectedBrand.id}`}
                    className="dmb-modal-button dmb-button-primary"
                  >
                    View Catalogue
                  </Link>
                  <Link 
                    to={`/customer/brand/${selectedBrand.id}`}
                    className="dmb-modal-button dmb-button-secondary"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
