import React, { lazy, Suspense, ComponentType } from 'react';
import { ProgressLoader } from '../components/ProgressLoader';

interface RetryState {
  hasError: boolean;
  retryCount: number;
}

class LazyBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  RetryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): RetryState {
    return { hasError: true, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
    
    // If it's a chunk loading error, try to reload
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      this.handleRetry();
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState({ hasError: false, retryCount: retryCount + 1 });
      
      // Clear module cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('vite')) {
              caches.delete(name);
            }
          });
        });
      }
    } else {
      // After 3 retries, reload the page
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h3>Loading Error</h3>
          <p>Failed to load this section. This might be due to a recent update.</p>
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Retry ({3 - this.state.retryCount} attempts left)
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={this.props.fallback || <ProgressLoader progress={50} message="Loading view..." />}>
        {this.props.children}
      </Suspense>
    );
  }
}

// Enhanced lazy loading with retry logic
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    const retry = async (retriesLeft: number): Promise<{ default: T }> => {
      try {
        return await importFunc();
      } catch (error: any) {
        if (retriesLeft > 0 && error.message.includes('Failed to fetch')) {
          console.log(`Retrying lazy import... (${retriesLeft} retries left)`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Clear any cached failed attempts
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
              if (name.includes('vite')) {
                await caches.delete(name);
              }
            }
          }
          
          return retry(retriesLeft - 1);
        }
        throw error;
      }
    };
    
    return retry(retries);
  });
}

// Export the boundary component
export { LazyBoundary };

// Helper hook to check if update is available
export function useUpdateCheck() {
  React.useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Fetch deployment info
        const response = await fetch('/deployment-info.json', {
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const info = await response.json();
          const storedTimestamp = localStorage.getItem('splitfin-deployment-timestamp');
          
          if (storedTimestamp && info.timestamp !== storedTimestamp) {
            console.log('New deployment detected:', info);
            
            // Show update notification (you can customize this)
            const updateBanner = document.createElement('div');
            updateBanner.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: #4CAF50;
              color: white;
              padding: 10px;
              text-align: center;
              z-index: 9999;
            `;
            updateBanner.innerHTML = `
              <span>A new version is available!</span>
              <button onclick="window.location.reload(true)" style="margin-left: 10px; padding: 5px 10px; cursor: pointer;">
                Update Now
              </button>
              <button onclick="this.parentElement.remove()" style="margin-left: 5px; padding: 5px 10px; cursor: pointer;">
                Dismiss
              </button>
            `;
            document.body.appendChild(updateBanner);
          }
          
          localStorage.setItem('splitfin-deployment-timestamp', info.timestamp);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };
    
    // Check on mount
    checkForUpdates();
    
    // Check periodically (every 5 minutes)
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
}
