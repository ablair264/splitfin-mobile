import React from 'react';
import styles from './ViewOrders.module.css';

// Quick test component to verify CSS fixes
export const ViewOrdersTest = () => {
  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '20px' }}>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>ViewOrders CSS Test</h2>
      
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: '#79d5e9', marginBottom: '10px' }}>1. Status Badges (All should have borders):</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span className={`${styles.statusBadge} ${styles.statusClosed}`}>
            <span className={styles.statusIcon}>✅</span>
            Closed
          </span>
          <span className={`${styles.statusBadge} ${styles.statusDraft}`}>
            <span className={styles.statusIcon}>📝</span>
            Draft
          </span>
          <span className={`${styles.statusBadge} ${styles.statusOpen}`}>
            <span className={styles.statusIcon}>🔄</span>
            Open
          </span>
          <span className={`${styles.statusBadge} ${styles.statusSent}`}>
            <span className={styles.statusIcon}>📤</span>
            Sent
          </span>
          <span className={`${styles.statusBadge} ${styles.statusShipped}`}>
            <span className={styles.statusIcon}>🚚</span>
            Shipped
          </span>
          <span className={`${styles.statusBadge} ${styles.statusFulfilled}`}>
            <span className={styles.statusIcon}>✓</span>
            Fulfilled
          </span>
        </div>
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: '#79d5e9', marginBottom: '10px' }}>2. Action Buttons (Should show text):</h3>
        <div className={styles.actionButtons}>
          <button className={`${styles.actionBtn} ${styles.viewBtn}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5c-7.633 0-11.917 6.495-11.998 6.69l-.002.01.002.01C.083 11.905 4.367 18.4 12 18.4s11.917-6.495 11.998-6.69l.002-.01-.002-.01C23.917 11.505 19.633 5 12 5zm0 11c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <span>View</span>
          </button>
          <button className={`${styles.actionBtn} ${styles.invoiceBtn}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 16H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V9h10v2z"/>
            </svg>
            <span>Invoice</span>
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: '#79d5e9', marginBottom: '10px' }}>3. Table Layout (Should be centered):</h3>
        <div className={styles.ordersContainer} style={{ padding: '0' }}>
          <div className={styles.ordersTableContainer}>
            <div className={styles.ordersTable}>
              <div className={styles.tableHeader}>
                <div className={styles.tableRow}>
                  <div className={styles.tableCell}>Order #</div>
                  <div className={styles.tableCell}>Customer</div>
                  <div className={styles.tableCell}>Date</div>
                  <div className={styles.tableCell}>Total</div>
                  <div className={styles.tableCell}>Status</div>
                  <div className={styles.tableCell}>Items</div>
                  <div className={styles.tableCell}>Actions</div>
                </div>
              </div>
              <div className={styles.tableBody}>
                <div className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    <strong className={styles.orderNumber}>SO-03268</strong>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.customerInfo}>
                      <div className={styles.customerAvatar}>AU</div>
                      <div className={styles.customerDetails}>
                        <strong>Amazon UK - Customer</strong>
                      </div>
                    </div>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.dateCell}>
                      <span className={styles.dateMain}>18/07/2025</span>
                      <span className={styles.dateTime}>01:00</span>
                    </div>
                  </div>
                  <div className={styles.tableCell}>
                    <strong className={styles.totalAmount}>£29.90</strong>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${styles.statusClosed}`}>
                      <span className={styles.statusIcon}>✅</span>
                      Closed
                    </span>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.itemsCount}>
                      <span className={styles.itemsIcon}>📦</span>
                      0
                    </div>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.actionButtons}>
                      <button className={`${styles.actionBtn} ${styles.viewBtn}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 5c-7.633 0-11.917 6.495-11.998 6.69l-.002.01.002.01C.083 11.905 4.367 18.4 12 18.4s11.917-6.495 11.998-6.69l.002-.01-.002-.01C23.917 11.505 19.633 5 12 5zm0 11c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/>
                          <circle cx="12" cy="12" r="2"/>
                        </svg>
                        <span>View</span>
                      </button>
                      <button className={`${styles.actionBtn} ${styles.invoiceBtn}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 16H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V9h10v2z"/>
                        </svg>
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};