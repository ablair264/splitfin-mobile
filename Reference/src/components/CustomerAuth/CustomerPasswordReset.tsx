// src/components/CustomerAuth/CustomerPasswordReset.tsx
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import './CustomerLogin.css';

export default function CustomerPasswordReset() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="customer-login-page">
        <div className="gradient-overlay"></div>
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
                <h1>Check Your Email</h1>
              </div>
            </div>

            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Password Reset Email Sent</h3>
              <p>We've sent a password reset link to:</p>
              <p className="email-display">{email}</p>
              <p>Please check your email and follow the instructions to reset your password.</p>
            </div>

            <div className="login-footer">
              <Link to="/customer/login" className="back-to-login">
                <FaArrowLeft /> Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-login-page">
      <div className="gradient-overlay"></div>
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
              <h1>Reset Password</h1>
            </div>
            <p className="reset-subtitle">
              Enter your email address and we'll send you a link to reset your password.
            </p>
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
                <FaEnvelope className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input with-icon"
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
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Email</span>
                  <svg className="button-arrow" viewBox="0 0 24 24" fill="white">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/customer/login" className="back-to-login">
              <FaArrowLeft /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
