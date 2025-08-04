import React from 'react';
import styles from './OrderStatusProgressBar.module.css';
import { FaFileAlt, FaCheckCircle, FaBox, FaTruck, FaHome } from 'react-icons/fa';

interface OrderStatusProgressBarProps {
  currentStatus: 'placed' | 'confirmed' | 'packed' | 'shipped' | 'delivered';
  orderDate?: string;
  confirmedDate?: string;
  packedDate?: string;
  shippedDate?: string;
  deliveredDate?: string;
}

export const OrderStatusProgressBar: React.FC<OrderStatusProgressBarProps> = ({
  currentStatus,
  orderDate,
  confirmedDate,
  packedDate,
  shippedDate,
  deliveredDate
}) => {
  const steps = [
    { 
      id: 1, 
      status: 'placed', 
      label: 'Order Placed', 
      icon: FaFileAlt,
      date: orderDate 
    },
    { 
      id: 2, 
      status: 'confirmed', 
      label: 'Order Confirmed', 
      icon: FaCheckCircle,
      date: confirmedDate 
    },
    { 
      id: 3, 
      status: 'packed', 
      label: 'Packed & Ready', 
      icon: FaBox,
      date: packedDate 
    },
    { 
      id: 4, 
      status: 'shipped', 
      label: 'Shipped', 
      icon: FaTruck,
      date: shippedDate 
    },
    { 
      id: 5, 
      status: 'delivered', 
      label: 'Delivered', 
      icon: FaHome,
      date: deliveredDate 
    },
  ];

  const getStepStatus = (stepStatus: string): 'completed' | 'active' | 'pending' => {
    const statusOrder = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className={styles.progressBarWrapper}>
      <div className={styles.progressBar}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.status);
          const Icon = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <div className={`${styles.progressStep} ${styles[status]} ${styles[`step${step.id}`]}`}>
                <div className={styles.stepIndicator}>
                  <Icon className={styles.stepIcon} />
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {step.date && <span className={styles.stepDate}>{step.date}</span>}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`${styles.progressConnector} ${
                  getStepStatus(steps[index + 1].status) !== 'pending' ? styles.completed : ''
                } ${index === steps.length - 2 ? styles.lastConnector : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
