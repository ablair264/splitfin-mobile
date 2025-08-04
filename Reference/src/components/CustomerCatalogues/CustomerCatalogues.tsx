// src/components/CustomerCatalogues/CustomerCatalogues.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaDownload, FaExpand, FaTimes, FaEye } from 'react-icons/fa';
import './CustomerCatalogues.css';

interface Catalogue {
  id: string;
  brand: string;
  year: string;
  pdf: string;
  logoUrl: string;
  color: string;
  needsInvert?: boolean;
}

const catalogues: Catalogue[] = [
  // Blomus
  { 
    id: 'blomus-autumn-winter',
    brand: 'Blomus', 
    year: 'A/W 2025', 
    pdf: '/catalogues/Blomus/autumn_winter2025.pdf',
    logoUrl: '/logos/blomus.png',
    color: '#6B8295',
    needsInvert: false
  },
  { 
    id: 'blomus-collection',
    brand: 'Blomus', 
    year: 'Collection 2025', 
    pdf: '/catalogues/Blomus/collection_2025.pdf',
    logoUrl: '/logos/blomus.png',
    color: '#5A7188',
    needsInvert: false
  },
  { 
    id: 'blomus-furniture',
    brand: 'Blomus', 
    year: 'Furniture 2025', 
    pdf: '/catalogues/Blomus/furniture_2025.pdf',
    logoUrl: '/logos/blomus.png',
    color: '#4A5F75',
    needsInvert: false
  },
  // GEFU
  { 
    id: 'gefu',
    brand: 'GEFU', 
    year: '2025', 
    pdf: '/catalogues/GEFU/gefu_2025.pdf',
    logoUrl: '/logos/gefu.png',
    color: '#D32F2F',
    needsInvert: false
  },
  // Elvang
  { 
    id: 'elvang',
    brand: 'Elvang', 
    year: '2025', 
    pdf: '/catalogues/Elvang/elvang_2025.pdf',
    logoUrl: '/logos/elvang.png',
    color: '#C4A274',
    needsInvert: false
  },
  // PPD
  { 
    id: 'ppd',
    brand: 'PPD', 
    year: '2025', 
    pdf: '/catalogues/PPD/ppd_2025.pdf',
    logoUrl: '/logos/ppd.png',
    color: '#8E24AA',
    needsInvert: false
  },
  // My Flame
  { 
    id: 'myflame-fw',
    brand: 'My Flame', 
    year: 'F/W 2025', 
    pdf: '/catalogues/My Flame/myflame_fw.pdf',
    logoUrl: '/logos/myflame.png',
    color: '#F4A460',
    needsInvert: false
  },
  { 
    id: 'myflame-ss',
    brand: 'My Flame', 
    year: 'S/S 2025', 
    pdf: '/catalogues/My Flame/myflame_ss.pdf',
    logoUrl: '/logos/myflame.png',
    color: '#FFB74D',
    needsInvert: false
  },
  // Räder
  { 
    id: 'rader-easter',
    brand: 'Räder', 
    year: 'Easter 2025', 
    pdf: '/catalogues/Rader/easter_2025.pdf',
    logoUrl: '/logos/rader.png',
    color: '#8B6DB5',
    needsInvert: false
  },
  { 
    id: 'rader-everyday',
    brand: 'Räder', 
    year: 'Everyday 2025', 
    pdf: '/catalogues/Rader/everyday_2025.pdf',
    logoUrl: '/logos/rader.png',
    color: '#9575CD',
    needsInvert: false
  },
  { 
    id: 'rader-novelties',
    brand: 'Räder', 
    year: 'Novelties 2025', 
    pdf: '/catalogues/Rader/novelties_2025.pdf',
    logoUrl: '/logos/rader.png',
    color: '#7E57C2',
    needsInvert: false
  },
  { 
    id: 'rader-trevoly',
    brand: 'Räder', 
    year: 'Trevoly 2025', 
    pdf: '/catalogues/Rader/trevoly_2025.pdf',
    logoUrl: '/logos/rader.png',
    color: '#673AB7',
    needsInvert: false
  },
  { 
    id: 'rader-xmas',
    brand: 'Räder', 
    year: 'Christmas 2025', 
    pdf: '/catalogues/Rader/xmas_2025.pdf',
    logoUrl: '/logos/rader.png',
    color: '#512DA8',
    needsInvert: false
  },
  // Relaxound
  { 
    id: 'relaxound',
    brand: 'Relaxound', 
    year: '2025', 
    pdf: '/catalogues/Relaxound/relaxound_2025.pdf',
    logoUrl: '/logos/relaxound.png',
    color: '#6FBE89',
    needsInvert: false
  },
  // Remember
  { 
    id: 'remember-main',
    brand: 'Remember', 
    year: '2025', 
    pdf: '/catalogues/Remember/remember_2025.pdf',
    logoUrl: '/logos/remember.png',
    color: '#E6A4C4',
    needsInvert: false
  },
  { 
    id: 'remember-aw',
    brand: 'Remember', 
    year: 'A/W 2025', 
    pdf: '/catalogues/Remember/remember_aw.pdf',
    logoUrl: '/logos/remember.png',
    color: '#D1879C',
    needsInvert: false
  }
];

export default function CustomerCatalogues() {
  const navigate = useNavigate();
  const [selectedCatalogue, setSelectedCatalogue] = useState<Catalogue | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleViewCatalogue = (catalogue: Catalogue) => {
    setSelectedCatalogue(catalogue);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseCatalogue = () => {
    setSelectedCatalogue(null);
    setIsFullscreen(false);
    document.body.style.overflow = 'unset';
  };

  const handleDownload = (catalogue: Catalogue) => {
    const link = document.createElement('a');
    link.href = catalogue.pdf;
    link.download = `${catalogue.brand.toLowerCase().replace(' ', '-')}-catalogue-${catalogue.year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="cc-catalogues-page">
      <div className="cc-header">
        <div className="cc-title-section">
          <h1 className="cc-page-title">Brand Catalogues</h1>
          <p className="cc-page-subtitle">Explore our collection of premium brand catalogues</p>
        </div>
        <button 
          className="cc-request-btn"
          onClick={() => navigate('/customer/catalogues/request')}
        >
          Request Physical Catalogues
        </button>
      </div>

      {/* Bookcase Design */}
      <div className="cc-bookcase">
        {/* Top Shelf */}
        <div className="cc-shelf">
          <div className="cc-shelf-board" />
          <div className="cc-books-row">
            {catalogues.slice(0, 5).map((catalogue, index) => (
              <div 
                key={catalogue.id} 
                className="cc-book"
                style={{ 
                  backgroundColor: catalogue.color,
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => handleViewCatalogue(catalogue)}
              >
                <div className="cc-book-spine">
                  <img 
                    src={catalogue.logoUrl} 
                    alt={catalogue.brand}
                    className={catalogue.needsInvert ? 'cc-logo-inverted' : 'cc-logo'}
                  />
                  <span className="cc-book-year">{catalogue.year}</span>
                </div>
                <div className="cc-book-cover">
                  <div className="cc-book-actions">
                    <button 
                      className="cc-quick-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCatalogue(catalogue);
                      }}
                      title="View Catalogue"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="cc-quick-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(catalogue);
                      }}
                      title="Download PDF"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
                <div className="cc-page-turn"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Shelf */}
        <div className="cc-shelf">
          <div className="cc-shelf-board" />
          <div className="cc-books-row">
            {catalogues.slice(5, 10).map((catalogue, index) => (
              <div 
                key={catalogue.id} 
                className="cc-book"
                style={{ 
                  backgroundColor: catalogue.color,
                  animationDelay: `${(index + 5) * 0.1}s`
                }}
                onClick={() => handleViewCatalogue(catalogue)}
              >
                <div className="cc-book-spine">
                  <img 
                    src={catalogue.logoUrl} 
                    alt={catalogue.brand}
                    className={catalogue.needsInvert ? 'cc-logo-inverted' : 'cc-logo'}
                  />
                  <span className="cc-book-year">{catalogue.year}</span>
                </div>
                <div className="cc-book-cover">
                  <div className="cc-book-actions">
                    <button 
                      className="cc-quick-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCatalogue(catalogue);
                      }}
                      title="View Catalogue"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="cc-quick-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(catalogue);
                      }}
                      title="Download PDF"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
                <div className="cc-page-turn"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Shelf */}
        <div className="cc-shelf">
          <div className="cc-shelf-board" />
          <div className="cc-books-row">
            {catalogues.slice(10).map((catalogue, index) => (
              <div 
                key={catalogue.id} 
                className="cc-book"
                style={{ 
                  backgroundColor: catalogue.color,
                  animationDelay: `${(index + 10) * 0.1}s`
                }}
                onClick={() => handleViewCatalogue(catalogue)}
              >
                <div className="cc-book-spine">
                  <img 
                    src={catalogue.logoUrl} 
                    alt={catalogue.brand}
                    className={catalogue.needsInvert ? 'cc-logo-inverted' : 'cc-logo'}
                  />
                  <span className="cc-book-year">{catalogue.year}</span>
                </div>
                <div className="cc-book-cover">
                  <div className="cc-book-actions">
                    <button 
                      className="cc-quick-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCatalogue(catalogue);
                      }}
                      title="View Catalogue"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="cc-quick-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(catalogue);
                      }}
                      title="Download PDF"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
                <div className="cc-page-turn"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive PDF Viewer Modal */}
      {selectedCatalogue && (
        <>
          <div 
            className="cc-modal-overlay" 
            onClick={handleCloseCatalogue}
          />
          <div className={`cc-pdf-viewer ${isFullscreen ? 'cc-fullscreen' : ''}`}>
            <div className="cc-viewer-header" style={{ backgroundColor: selectedCatalogue.color }}>
              <div className="cc-viewer-title">
                <img 
                  src={selectedCatalogue.logoUrl} 
                  alt={selectedCatalogue.brand}
                  className={selectedCatalogue.needsInvert ? 'cc-viewer-logo-inverted' : 'cc-viewer-logo'}
                />
                <span>{selectedCatalogue.year} Catalogue</span>
              </div>
              <div className="cc-viewer-controls">
                <button 
                  className="cc-control-btn"
                  onClick={() => handleDownload(selectedCatalogue)}
                  title="Download PDF"
                >
                  <FaDownload />
                </button>
                <button 
                  className="cc-control-btn"
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen"
                >
                  <FaExpand />
                </button>
                <button 
                  className="cc-control-btn cc-close-btn"
                  onClick={handleCloseCatalogue}
                  title="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="cc-pdf-container">
              <iframe
                src={`${selectedCatalogue.pdf}#toolbar=0&navpanes=0&scrollbar=1`}
                className="cc-pdf-frame"
                title={`${selectedCatalogue.brand} Catalogue`}
              />
            </div>

            {/* Navigation Hint */}
            <div className="cc-viewer-hint">
              Use your mouse wheel or touch gestures to navigate through the catalogue
            </div>
          </div>
        </>
      )}
    </div>
  );
}