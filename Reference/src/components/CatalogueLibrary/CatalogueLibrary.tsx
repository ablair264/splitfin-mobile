// src/components/CatalogueLibrary/CatalogueLibrary.tsx
import React, { useState } from 'react';
import { FaBook, FaDownload, FaExpand, FaTimes, FaEye } from 'react-icons/fa';
import styles from './CatalogueLibrary.module.css';

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

export default function CatalogueLibrary() {
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
    <div className={styles.cataloguesPage}>
      <div className={styles.gradientOverlay} />
      <div className={styles.floatingAccent} />
      
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Catalogue Library</h1>
          <p className={styles.pageSubtitle}>Access and manage all brand catalogues</p>
        </div>
      </div>

      {/* Bookcase Design */}
      <div className={styles.bookcase}>
        {/* Top Shelf */}
        <div className={styles.shelf}>
          <div className={styles.shelfBoard} />
          <div className={styles.booksRow}>
            {catalogues.slice(0, 5).map((catalogue, index) => (
              <div 
                key={catalogue.id} 
                className={styles.book}
                style={{ 
                  backgroundColor: catalogue.color,
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => handleViewCatalogue(catalogue)}
              >
                <div className={styles.bookSpine}>
                  <img 
                    src={catalogue.logoUrl} 
                    alt={catalogue.brand}
                    className={catalogue.needsInvert ? styles.logoInverted : styles.logo}
                  />
                  <span className={styles.bookYear}>{catalogue.year}</span>
                </div>
                <div className={styles.bookCover}>
                  <div className={styles.bookActions}>
                    <button 
                      className={styles.quickAction}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCatalogue(catalogue);
                      }}
                      title="View Catalogue"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className={styles.quickAction}
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
                <div className={styles.pageTurn}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Shelf */}
        <div className={styles.shelf}>
          <div className={styles.shelfBoard} />
          <div className={styles.booksRow}>
            {catalogues.slice(5, 10).map((catalogue, index) => (
              <div 
                key={catalogue.id} 
                className={styles.book}
                style={{ 
                  backgroundColor: catalogue.color,
                  animationDelay: `${(index + 5) * 0.1}s`
                }}
                onClick={() => handleViewCatalogue(catalogue)}
              >
                <div className={styles.bookSpine}>
                  <img 
                    src={catalogue.logoUrl} 
                    alt={catalogue.brand}
                    className={catalogue.needsInvert ? styles.logoInverted : styles.logo}
                  />
                  <span className={styles.bookYear}>{catalogue.year}</span>
                </div>
                <div className={styles.bookCover}>
                  <div className={styles.bookActions}>
                    <button 
                      className={styles.quickAction}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCatalogue(catalogue);
                      }}
                      title="View Catalogue"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className={styles.quickAction}
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
                <div className={styles.pageTurn}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Shelf */}
        <div className={styles.shelf}>
          <div className={styles.shelfBoard} />
          <div className={styles.booksRow}>
            {catalogues.slice(10).map((catalogue, index) => (
              <div 
                key={catalogue.id} 
                className={styles.book}
                style={{ 
                  backgroundColor: catalogue.color,
                  animationDelay: `${(index + 10) * 0.1}s`
                }}
                onClick={() => handleViewCatalogue(catalogue)}
              >
                <div className={styles.bookSpine}>
                  <img 
                    src={catalogue.logoUrl} 
                    alt={catalogue.brand}
                    className={catalogue.needsInvert ? styles.logoInverted : styles.logo}
                  />
                  <span className={styles.bookYear}>{catalogue.year}</span>
                </div>
                <div className={styles.bookCover}>
                  <div className={styles.bookActions}>
                    <button 
                      className={styles.quickAction}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCatalogue(catalogue);
                      }}
                      title="View Catalogue"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className={styles.quickAction}
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
                <div className={styles.pageTurn}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive PDF Viewer Modal */}
      {selectedCatalogue && (
        <>
          <div 
            className={styles.modalOverlay} 
            onClick={handleCloseCatalogue}
          />
          <div className={`${styles.pdfViewer} ${isFullscreen ? styles.fullscreen : ''}`}>
            <div className={styles.viewerHeader} style={{ backgroundColor: selectedCatalogue.color }}>
              <div className={styles.viewerTitle}>
                <img 
                  src={selectedCatalogue.logoUrl} 
                  alt={selectedCatalogue.brand}
                  className={selectedCatalogue.needsInvert ? styles.viewerLogoInverted : styles.viewerLogo}
                />
                <span>{selectedCatalogue.year} Catalogue</span>
              </div>
              <div className={styles.viewerControls}>
                <button 
                  className={styles.controlBtn}
                  onClick={() => handleDownload(selectedCatalogue)}
                  title="Download PDF"
                >
                  <FaDownload />
                </button>
                <button 
                  className={styles.controlBtn}
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen"
                >
                  <FaExpand />
                </button>
                <button 
                  className={`${styles.controlBtn} ${styles.closeBtn}`}
                  onClick={handleCloseCatalogue}
                  title="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className={styles.pdfContainer}>
              <iframe
                src={`${selectedCatalogue.pdf}#toolbar=0&navpanes=0&scrollbar=1`}
                className={styles.pdfFrame}
                title={`${selectedCatalogue.brand} Catalogue`}
              />
            </div>

            {/* Navigation Hint */}
            <div className={styles.viewerHint}>
              Use your mouse wheel or touch gestures to navigate through the catalogue
            </div>
          </div>
        </>
      )}
    </div>
  );
}