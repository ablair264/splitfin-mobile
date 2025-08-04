import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, FileText, Check, X, ArrowLeft } from 'lucide-react'
import { ProgressLoader } from './ProgressLoader'
import styles from './CatalogueBuilder.module.css'

interface Product {
  id: string
  name: string
  sku: string
  description: string
  selling_price: number
  brand?: string
  brand_normalized?: string
  selected: boolean
  imageUrl?: string
}

// Image cache to prevent re-fetching (same as ProductCard)
const imageUrlCache = new Map<string, string | null>();

// ImageKit base URL - replace with your actual ImageKit URL
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/a7kelms9a';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Generate ImageKit optimized URL (same as ProductCard)
const getOptimizedImageUrl = (baseUrl: string, transformation: 'thumbnail' | 'medium' | 'preview') => {
  const transformations = {
    thumbnail: 'tr:w-200,h-200,c-maintain_ratio,q-80,f-auto',
    medium: 'tr:w-400,h-400,c-maintain_ratio,q-85,f-auto',
    preview: 'tr:w-100,h-100,c-maintain_ratio,q-60,f-auto,bl-10'
  };
  
  return `${baseUrl}/${transformations[transformation]}`;
};

// Build image URL from product data (same as ProductCard)
const buildImageUrl = (sku: string, brand: string) => {
  // Map brand names to their exact folder names
  const brandFolderMap: { [key: string]: string } = {
    'blomus': 'blomus',
    'elvang': 'elvang', 
    'gefu': 'gefu',
    'räder': 'rader',
    'rader': 'rader',
    'myflame': 'myflame',
    'my flame': 'myflame',
    'my-flame-lifestyle': 'myflame',
    'relaxound': 'relaxound',
    'remember': 'remember'
  };
  
  const brandKey = brand.toLowerCase();
  const folderName = brandFolderMap[brandKey] || brand.toLowerCase().replace(/\s+/g, '-');
  
  // Convert SKU to uppercase to match ImageKit storage
const lowercaseSku = sku.toLowerCase();
  
  return `${IMAGEKIT_BASE_URL}/brand-images/${folderName}/${lowercaseSku}_1_400x400.webp`;
};

// Load image for a product (same logic as ProductCard)
const loadProductImage = async (product: Product): Promise<string | null> => {
  const cacheKey = `${product.brand}-${product.sku}`;
  
  // Check cache first
  const cachedUrl = imageUrlCache.get(cacheKey);
  if (cachedUrl !== undefined) {
    return cachedUrl;
  }

  console.log(`🔍 Loading image for SKU: ${product.sku}, Brand: ${product.brand}`);

  try {
    // Build the ImageKit URL
    const baseImageUrl = buildImageUrl(product.sku, product.brand || '');
    console.log(`  Trying: ${baseImageUrl}`);
    
    // Test if image exists by trying to load it
    const testImage = new Image();
    
    const imageLoaded = await new Promise<boolean>((resolve) => {
      testImage.onload = () => {
        console.log(`  ✅ Found: ${baseImageUrl}`);
        resolve(true);
      };
      
      testImage.onerror = () => {
        console.log(`  ❌ No image found for ${product.sku}`);
        resolve(false);
      };
      
      testImage.src = baseImageUrl;
    });
    
    if (imageLoaded) {
      const optimizedUrl = getOptimizedImageUrl(baseImageUrl, 'medium');
      imageUrlCache.set(cacheKey, optimizedUrl);
      return optimizedUrl;
    } else {
      imageUrlCache.set(cacheKey, null);
      return null;
    }
    
  } catch (error) {
    console.error('Error loading image:', error);
    imageUrlCache.set(cacheKey, null);
    return null;
  }
};

export default function CatalogueBuilder() {
  const { brandName } = useParams<{ brandName?: string }>()
  const navigate = useNavigate()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(false)
  const [catalogueName, setCatalogueName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)

  // Load products
  useEffect(() => {
    if (!brandName) return
    
    setLoading(true)
    ;(async () => {
      try {
        let snap = await getDocs(
          query(collection(db, 'items_data'), where('Manufacturer', '==', brandName))
        )
        
        if (snap.empty) {
          const variations = [
            brandName.toLowerCase(),
            brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase(),
            brandName.toUpperCase()
          ]
          
          for (const variation of variations) {
            snap = await getDocs(
              query(collection(db, 'items_data'), where('Manufacturer', '==', variation))
            )
            if (!snap.empty) break
          }
        }

        if (snap.empty) {
          snap = await getDocs(
            query(collection(db, 'items_data'), where('brand_normalized', '==', brandName.toLowerCase()))
          )
        }

        const items: Product[] = []

        snap.docs.forEach((d) => {
          const data = d.data()
          
          if (data.status === 'inactive') return
          
          const manufacturer = data.Manufacturer || data.manufacturer || ''
          const brandNormalized = manufacturer.toLowerCase().replace(/\s+/g, '-')
          
          const product: Product = {
            id: d.id,
            name: data.item_name || data.name || '',
            sku: data.sku || data.item_id || '',
            description: data.description || data.item_description || '',
            selling_price: data.selling_price || data.rate || 0,
            brand: manufacturer,
            brand_normalized: brandNormalized,
            selected: false
          }
          
          if (product.sku.toLowerCase().startsWith('xx')) return
          if (product.selling_price === 0) return
          
          items.push(product)
        })

        console.log(`Found ${items.length} items for brand ${brandName}`)
        
        setProducts(items)
        
        // Load images for all products after setting products
        setLoadingImages(true)
        const productsWithImages = await Promise.all(
          items.map(async (product) => {
            const imageUrl = await loadProductImage(product);
            return { ...product, imageUrl: imageUrl || undefined };
          })
        );
        
        setProducts(productsWithImages);
        setLoadingImages(false);
        
      } catch (err) {
        console.error('Error loading products:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [brandName])

  // Remove the old ImageKit useEffect since we're now loading images directly

  const toggleSelection = useCallback((id: string) => {
    console.log('Toggling selection for product:', id)
    setProducts(prev => {
      const updated = prev.map(p => 
        p.id === id ? { ...p, selected: !p.selected } : p
      )
      console.log('Updated products:', updated.filter(p => p.selected).length, 'selected')
      return updated
    })
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const selectedProducts = useMemo(() => {
    return products.filter(p => p.selected)
  }, [products])

  const selectAll = () => {
    setProducts(prev => prev.map(p => ({ ...p, selected: true })))
  }

  const deselectAll = () => {
    setProducts(prev => prev.map(p => ({ ...p, selected: false })))
  }

  const generateCatalogue = async () => {
    console.log('Generate catalogue clicked, selected products:', selectedProducts.length)
    
    if (selectedProducts.length < 10) {
      alert('Please select at least 10 products to generate a catalogue')
      return
    }

    console.log('Setting showNamePrompt to true')
    setShowNamePrompt(true)
  }

  const confirmGenerate = async () => {
    console.log('Confirm generate clicked with name:', catalogueName)
    
    if (!catalogueName.trim()) {
      alert('Please enter a catalogue name')
      return
    }

    setShowNamePrompt(false)
    setGenerating(true)

    try {
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Add front page
      const brandNameForFile = brandName?.toLowerCase().replace(/\s+/g, '-') || 'default'
      const frontPagePaths = [
        `/catalogue-fp/${brandNameForFile}.png`,
        `/catalogue-fp/${brandName?.toLowerCase()}.png`,
        `/catalogue-fp/default.png`
      ]
      
      let frontPageAdded = false
      
      for (const frontPagePath of frontPagePaths) {
        console.log('Trying front page from:', frontPagePath)
        
        try {
          const frontPageResponse = await fetch(frontPagePath)
          console.log('Front page response:', frontPageResponse.status)
          
          if (frontPageResponse.ok) {
            const blob = await frontPageResponse.blob()
            const reader = new FileReader()
            const base64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            
            // Add front page as full page
            pdf.addImage(base64, 'PNG', 0, 0, 210, 297)
            pdf.addPage()
            console.log('Front page added successfully from:', frontPagePath)
            frontPageAdded = true
            break
          }
        } catch (err) {
          console.log('Failed to load from:', frontPagePath)
        }
      }
      
      if (!frontPageAdded) {
        console.log('No front page found, creating default front page')
        // Create a default front page
        const defaultFrontPageHtml = `
          <div style="width: 794px; height: 1123px; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
            <h1 style="font-size: 48px; color: #1a1a1a; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 4px;">${brandName || 'Product'}</h1>
            <h2 style="font-size: 32px; color: #666; margin: 0; font-weight: 300;">Highlights Catalogue</h2>
            <div style="margin-top: 60px; font-size: 18px; color: #999;">${new Date().getFullYear()}</div>
          </div>
        `
        
        const tempFrontDiv = document.createElement('div')
        tempFrontDiv.style.position = 'absolute'
        tempFrontDiv.style.left = '-9999px'
        tempFrontDiv.style.top = '0'
        tempFrontDiv.innerHTML = defaultFrontPageHtml
        document.body.appendChild(tempFrontDiv)
        
        await new Promise((r) => setTimeout(r, 100))
        
        const frontCanvas = await html2canvas(tempFrontDiv.firstElementChild as HTMLElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 794,
          height: 1123
        })
        
        const frontImgData = frontCanvas.toDataURL('image/png')
        pdf.addImage(frontImgData, 'PNG', 0, 0, 210, 297)
        pdf.addPage()
        
        document.body.removeChild(tempFrontDiv)
      }

      // Generate product pages (3 products per page)
      const productsPerPage = 3
      const totalPages = Math.ceil(selectedProducts.length / productsPerPage)

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage()

        const pageProducts = selectedProducts.slice(
          page * productsPerPage,
          (page + 1) * productsPerPage
        )

        // Create HTML for this page with better spacing
        const pageHtml = `
          <div style="width: 794px; padding: 40px; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
            <div style="display: flex; flex-direction: column; height: 1000px; justify-content: space-between;">
              ${pageProducts.map((product, index) => `
                <div style="display: flex; margin-bottom: ${index < pageProducts.length - 1 ? '40px' : '0'}; align-items: flex-start; flex: 1; max-height: 300px;">
                  <div style="flex: 0 0 250px; margin-right: 30px;">
                    <img src="${product.imageUrl || '/fallback.png'}" 
                         style="width: 250px; height: 250px; object-fit: contain; border: 1px solid #e5e5e5; border-radius: 8px; background: #fafafa;" 
                         alt="${product.sku}" 
                         crossorigin="anonymous" />
                  </div>
                  <div style="flex: 1; padding-top: 10px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #1a1a1a; font-weight: 600; line-height: 1.3;">${product.name}</h3>
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #666; font-family: 'Courier New', monospace;">SKU: ${product.sku}</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #444; line-height: 1.6; max-height: 80px; overflow: hidden;">${product.description || 'No description available'}</p>
                    <p style="margin: 0; font-size: 22px; font-weight: 700; color: #000;">£${product.selling_price.toFixed(2)}</p>
                  </div>
                </div>
              `).join('')}
              ${pageProducts.length < 3 ? '<div style="flex: 1;"></div>'.repeat(3 - pageProducts.length) : ''}
            </div>
          </div>
        `

        // Create temporary div for rendering
        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'absolute'
        tempDiv.style.left = '-9999px'
        tempDiv.style.top = '0'
        tempDiv.innerHTML = pageHtml
        document.body.appendChild(tempDiv)

        // Wait for images to load
        const images = tempDiv.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map(img => 
            new Promise((resolve) => {
              if (img.complete) {
                resolve(null)
              } else {
                img.onload = () => resolve(null)
                img.onerror = () => {
                  console.error('Image failed to load:', img.src)
                  resolve(null)
                }
              }
            })
          )
        )

        // Additional wait for rendering
        await new Promise((r) => setTimeout(r, 200))

        // Convert to canvas
        const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        })

        // Add to PDF
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)

        // Clean up
        document.body.removeChild(tempDiv)
      }

      // Save PDF
      pdf.save(`${catalogueName.replace(/[^a-z0-9]/gi, '_')}_catalogue.pdf`)
      console.log('PDF saved successfully')

    } catch (err) {
      console.error('Error generating catalogue:', err)
      alert('Failed to generate catalogue. Please try again.')
    } finally {
      setGenerating(false)
      setCatalogueName('')
    }
  }

  if (loading || loadingImages) {
    return (
      <div className="dashboard-loading-container">
        <ProgressLoader
          progress={loading ? 50 : 75}
          messages={loading ? [
            'Loading products...',
            'Fetching product data...',
            'Preparing catalogue builder...'
          ] : [
            'Loading product images...',
            'Optimizing image quality...',
            'Finalizing catalogue builder...'
          ]}
        />
      </div>
    )
  }

  console.log('Render - showNamePrompt:', showNamePrompt, 'selectedProducts:', selectedProducts.length)

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div className={styles.headerContent}>
          <h1>Catalogue Builder</h1>
          <p>Select products to create a custom catalogue</p>
        </div>
        <button 
          className={styles.generateButton}
          onClick={generateCatalogue}
          disabled={selectedProducts.length < 10}
        >
          <FileText size={20} />
          Generate Catalogue ({selectedProducts.length} selected)
        </button>
      </div>

      {/* Brand Banner */}
      {brandName && (
        <div className={styles.brandBanner}>
          <img
            src={`/logos/${normalize(brandName)}.png`}
            alt={`${brandName} logo`}
            className={styles.brandLogo}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <h2>{brandName} Products</h2>
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.selectionControls}>
          <span className={styles.selectionInfo}>
            {selectedProducts.length < 10 ? (
              <span className={styles.warning}>
                Select at least {10 - selectedProducts.length} more products
              </span>
            ) : (
              <span className={styles.success}>
                <Check size={16} /> {selectedProducts.length} products selected
              </span>
            )}
          </span>
          <button 
            className={styles.selectAllBtn}
            onClick={selectedProducts.length === filteredProducts.length ? deselectAll : selectAll}
          >
            {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className={styles.productsGrid}>
        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No products found</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className={`${styles.productCard} ${product.selected ? styles.selected : ''}`}
              onClick={() => toggleSelection(product.id)}
            >
              <div className={styles.productImageContainer}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.sku}
                    className={styles.productImage}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      // Try to find the placeholder div and show it
                      const container = img.parentElement;
                      if (container) {
                        const placeholder = container.querySelector('.image-placeholder-fallback');
                        if (!placeholder) {
                          const fallbackDiv = document.createElement('div');
                          fallbackDiv.className = 'image-placeholder-fallback';
                          fallbackDiv.style.cssText = `
                            width: 100%; height: 100%; display: flex; align-items: center; 
                            justify-content: center; color: rgba(255, 255, 255, 0.3); 
                            font-size: 14px; background: rgba(255, 255, 255, 0.05); 
                            border-radius: 12px;
                          `;
                          fallbackDiv.textContent = 'No Image';
                          container.appendChild(fallbackDiv);
                        }
                      }
                    }}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>No Image</span>
                  </div>
                )}
                <div className={styles.selectionOverlay}>
                  {product.selected ? <Check size={32} /> : null}
                </div>
              </div>
              
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productSku}>SKU: {product.sku}</p>
                <p className={styles.productDescription}>
                  {product.description || 'No description available'}
                </p>
                <p className={styles.productPrice}>{product.selling_price.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Name Prompt Modal */}
      {showNamePrompt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Name Your Catalogue</h3>
            <input
              type="text"
              placeholder="Enter catalogue name..."
              value={catalogueName}
              onChange={(e) => setCatalogueName(e.target.value)}
              className={styles.modalInput}
              autoFocus
            />
            <div className={styles.modalButtons}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowNamePrompt(false)
                  setCatalogueName('')
                }}
              >
                <X size={16} /> Cancel
              </button>
              <button 
                className={styles.confirmButton}
                onClick={confirmGenerate}
              >
                <FileText size={16} /> Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {generating && (
        <div className="dashboard-loading-container">
          <ProgressLoader
            progress={75}
            messages={[
              'Preparing catalogue...',
              'Loading product images...',
              'Generating PDF...'
            ]}
          />
        </div>
      )}
    </div>
  )
}