import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import './CustomerNewOrder.css';

interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  color: string;
  description: string;
  tagline?: string;
  videoUrl?: string;
  productCount: number;
}

export default function CustomerNewOrder() {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [loadedLogos, setLoadedLogos] = useState<Set<string>>(new Set());
  
  // Brand configurations matching CustomerDashboard
  const brands: Brand[] = [
    { 
      id: 'blomus', 
      name: 'blomus', 
      logoUrl: '/logos/blomus.png', 
      color: '#6B8295',
      description: 'Since our inception, we have championed clean forms, sustainable materials, and an understated elegance. Our creations eschew transient trends in favor of a philosophy: minimalism imbued with soul.',
      tagline: 'Allow yourself to be inspired and discover how blomus is redefining the very essence of interior and lifestyle.',
      videoUrl: '/videos/blomus-bg.mp4',
      productCount: 156
    },
    { 
      id: 'elvang', 
      name: 'elvang', 
      logoUrl: '/logos/elvang.png', 
      color: '#C4A274',
      description: 'Responsible since 2003. Premium textiles crafted with care for people and planet.',
      tagline: 'Scandinavian design meets sustainable luxury',
      videoUrl: '/videos/elvang-bg.mp4',
      productCount: 89
    },
    { 
      id: 'myflame', 
      name: 'MY FLAME', 
      logoUrl: '/logos/myflame.png', 
      color: '#F4A460',
      description: 'Scented candles with personality. Each flame tells a story.',
      tagline: 'Light up your world with unique fragrances',
      videoUrl: '/videos/myflame-bg.mp4',
      productCount: 234
    },
    { 
      id: 'rader', 
      name: 'räder', 
      logoUrl: '/logos/rader.png', 
      color: '#8B6DB5',
      description: 'Poetry for living. Bringing beauty to everyday moments.',
      tagline: 'Where design meets emotion',
      videoUrl: '/videos/rader-bg.mp4',
      productCount: 178
    },
    { 
      id: 'remember', 
      name: 'REMEMBER', 
      logoUrl: '/logos/remember.png', 
      color: '#E6A4C4',
      description: 'Colorful design that brings joy to every space.',
      tagline: 'Making life more colorful',
      videoUrl: '/videos/remember-bg.mp4',
      productCount: 203
    },
    { 
      id: 'relaxound', 
      name: 'RELAXOUND', 
      logoUrl: '/logos/relaxound.png', 
      color: '#6FBE89',
      description: 'Nature sounds for modern living. Bringing tranquility home.',
      tagline: 'The sound of serenity',
      videoUrl: '/videos/relaxound-bg.mp4',
      productCount: 45
    }
  ];

  const handleBrandClick = (brand: Brand) => {
    setSelectedBrand(brand);
    document.body.style.overflow = 'hidden';
  };

  const closeBrandModal = () => {
    setSelectedBrand(null);
    document.body.style.overflow = 'unset';
  };

  const handleViewCatalogue = () => {
    if (selectedBrand) {
      navigate(`/customer/catalogues?brand=${selectedBrand.id}`);
    }
  };

  const handleBrowseProducts = () => {
    if (selectedBrand) {
      navigate(`/customer/brand/${selectedBrand.id}`);
    }
  };
  
  return (
    <div className="cst-customer-new-order-page">
      <ProgressBar currentStep={1} />
      
      <div className="cst-order-header">
        <h1>Start New Order</h1>
        <p className="cst-order-subtitle">Select a brand to begin browsing products</p>
      </div>
      
      <div className="cst-brands-grid">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="cst-brand-square"
            style={{ backgroundColor: brand.color }}
            onClick={() => handleBrandClick(brand)}
          >
            {!failedLogos.has(brand.id) ? (
              <>
                {!loadedLogos.has(brand.id) && (
                  <div className="cst-logo-loading">
                    <div className="cst-logo-spinner" />
                  </div>
                )}
                <img 
                  src={brand.logoUrl} 
                  alt={brand.name}
                  className="cst-brand-logo"
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
              <div className="cst-brand-name-fallback">
                {brand.name}
              </div>
            )}
            <div className="cst-brand-overlay" />
            <div className="cst-brand-badge">{brand.productCount} products</div>
          </div>
        ))}
      </div>



      {/* Brand Modal Overlay */}
      {selectedBrand && (
        <>
          <div 
            className="cst-overlay" 
            onClick={closeBrandModal}
          />
          <div 
            className="cst-brand-modal"
            style={{ backgroundColor: selectedBrand.color }}
          >
            {/* Video Background */}
            {selectedBrand.videoUrl && (
              <div className="cst-modal-video-container">
                <video
                  className="cst-modal-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src={selectedBrand.videoUrl} type="video/mp4" />
                </video>
                <div className="cst-modal-video-overlay" />
              </div>
            )}
            
            <button className="cst-close-button" onClick={closeBrandModal}>
              <FaTimes />
            </button>
            
            <div className="cst-modal-content">
              <div className="cst-modal-header">
                <img 
                  src={selectedBrand.logoUrl} 
                  alt={selectedBrand.name} 
                  className="cst-modal-logo"
                />
              </div>
              
              <div className="cst-modal-body">
                <p className="cst-modal-description">{selectedBrand.description}</p>
                <p className="cst-product-count">{selectedBrand.productCount} products available</p>
                {selectedBrand.tagline && (
                  <p className="cst-modal-tagline">{selectedBrand.tagline}</p>
                )}
                
                <div className="cst-modal-actions">
                  <button 
                    className="cst-modal-button cst-button-primary"
                    onClick={handleViewCatalogue}
                  >
                    View Catalogue
                  </button>
                  <button 
                    className="cst-modal-button cst-button-secondary"
                    onClick={handleBrowseProducts}
                  >
                    Browse Products
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}