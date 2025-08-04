// src/components/OrderConfirmation.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProgressBar } from './ProgressBar';
import { 
  FaCheckCircle, 
  FaEnvelope, 
  FaClock,
  FaArrowRight,
  FaHome
} from 'react-icons/fa';
import styles from './OrderConfirmation.module.css';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (location.state) {
      setOrderDetails(location.state);
    } else {
      navigate('/');
    }
  }, []);

  if (!orderDetails) {
    return null;
  }

  return (
    <div className={styles.orderConfirmationPage}>
      {/* Progress Bar */}
      <div className={styles.progressBarContainer}>
        <ProgressBar currentStep={5} theme="dark" />
      </div>
      
      <div className={styles.confirmationContainer}>
        <div className={styles.confirmationHero}>
          <div className={styles.successAnimation}>
            <div className={styles.successCircle}>
              <FaCheckCircle className={styles.checkIcon} />
            </div>
          </div>
          
          <h1>Order Successfully Placed!</h1>
          <p className={styles.heroSubtitle}>
            Thank you for your order. We've sent a confirmation email to {orderDetails.customer.email}
          </p>
          
          <div className={styles.orderReference}>
            <span className={styles.orderLabel}>Order Number</span>
            <span className={styles.orderNumber}>{orderDetails.orderNumber}</span>
          </div>
        </div>

        <div className={styles.confirmationDetails}>
          <div className={styles.detailCard}>
            <h2>What Happens Next?</h2>
            <div className={styles.timeline}>
              <div className={`${styles.timelineItem} ${styles.active}`}>
                <FaCheckCircle />
                <div>
                  <h3>Order Received</h3>
                  <p>We've received your order and sent you a confirmation email</p>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <FaClock />
                <div>
                  <h3>Processing</h3>
                  <p>We're preparing your order for shipment</p>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <FaEnvelope />
                <div>
                  <h3>Customer Account</h3>
                  <p>Check your email for login details to track your order</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button onClick={() => navigate('/')} className={styles.btnSecondary}>
              <FaHome />
              Back to Dashboard
            </button>
            <button onClick={() => navigate(`/select-brand/${orderDetails.customer.id}`)} className={styles.btnPrimary}>
              Start New Order
              <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}