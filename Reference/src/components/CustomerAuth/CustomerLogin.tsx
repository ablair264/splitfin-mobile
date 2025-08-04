// src/components/CustomerAuth/CustomerLogin.tsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, query, collection, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useNavigate, Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import loaderAnimation from '../../loader.json';
import './CustomerLogin.css';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      let customerData = null;
      let customerId = null;
      
      // Find customer by firebase_uid in customers collection
      const customersQuery = query(
        collection(db, 'customers'), 
        where('firebase_uid', '==', user.uid)
      );
      const customersSnapshot = await getDocs(customersQuery);
      
      if (!customersSnapshot.empty) {
        const customerDoc = customersSnapshot.docs[0];
        customerData = customerDoc.data();
        customerId = customerDoc.id;
        
        // Update last login in customers collection
        await updateDoc(customerDoc.ref, {
          lastLogin: new Date().toISOString(),
          isOnline: true,
          lastSeen: new Date().toISOString()
        });
      } else {
        // If not found by firebase_uid, try finding by email
        const emailQuery = query(
          collection(db, 'customers'), 
          where('auth_email', '==', user.email)
        );
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          const customerDoc = emailSnapshot.docs[0];
          customerData = customerDoc.data();
          customerId = customerDoc.id;
          
          // Update the firebase_uid if it was missing
          await updateDoc(customerDoc.ref, {
            firebase_uid: user.uid,
            lastLogin: new Date().toISOString(),
            isOnline: true,
            lastSeen: new Date().toISOString()
          });
        }
      }
      
      if (!customerData || !customerId) {
        throw new Error('Customer account not found. Please contact support.');
      }
      
      // Create or update user record for messaging/UI purposes in users collection
      const userDocRef = doc(db, 'users', customerId);
      const userDocSnap = await getDoc(userDocRef);
      
      const userData = {
        uid: user.uid,
        customer_id: customerId,
        email: user.email,
        customer_name: customerData.customer_name || 'Customer',
        company_name: customerData.company_name || '',
        firebase_uid: user.uid,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        role: 'customer'
      };
      
      if (!userDocSnap.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          ...userData,
          created_at: new Date().toISOString()
        });
      } else {
        // Update existing user document
        await updateDoc(userDocRef, {
          firebase_uid: user.uid,
          isOnline: true,
          lastSeen: new Date().toISOString()
        });
      }
      
      // Store customer info in session/local storage if needed
      sessionStorage.setItem('customerId', customerId);
      sessionStorage.setItem('customerName', customerData.customer_name || '');
      
      navigate('/customer/dashboard');
      
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="customer-login-page">
      {/* Gradient overlay for animated background */}
      <div className="gradient-overlay"></div>
      
      {/* Single optimized floating accent element */}
      <div className="floating-accent"></div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <img 
                src="/logos/dmb-logo.png" 
                alt="DM Brands" 
                className="logo-image"
              />
            </div>
            <div className="auth-hero">
              <h1>DM Brands</h1>
            </div>
            <h2 className="login-subtitle">Customer Portal</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <span>{error}</span>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-container">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-container">
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="button-loader">
                    <Lottie 
                      animationData={loaderAnimation}
                      loop={true}
                      autoplay={true}
                      style={{ 
                        width: '24px', 
                        height: '24px',
                        filter: 'brightness(0) invert(1)'
                      }}
                    />
                  </div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="button-arrow" viewBox="0 0 24 24" fill="white">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="help-text">
              <p>First time accessing the portal? Check your email for login instructions.</p>
              <p>Forgot your password? <Link to="/customer/reset-password">Reset Password</Link></p>
              <p>Need help? Contact your sales representative.</p>
            </div>
            
            <div className="admin-portal-section">
              <p className="divider-text">Are you staff?</p>
              <Link to="/login" className="admin-portal-link">
                Go to Staff Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
