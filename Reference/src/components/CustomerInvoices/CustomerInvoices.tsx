// src/components/CustomerInvoices/CustomerInvoices.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { FaFileInvoice, FaDownload, FaEye, FaSync } from 'react-icons/fa';
import './CustomerInvoices.css';

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
  currency_symbol: string;
  invoice_url?: string;
  days_overdue?: number;
  last_modified_time?: string;
  customer_id: string;
  customer_name?: string;
}

interface CustomerData {
  firebase_uid: string;
  customer_id: string;
  customer_name?: string;
  company_name?: string;
  email?: string;
}

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, paid, unpaid, overdue
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerAndInvoices();
  }, []);

  const fetchCustomerAndInvoices = async () => {
    try {
      setError(null);
      if (!auth.currentUser) {
        setError('Please log in to view invoices');
        return;
      }

      // Fetch customer data from customers collection using Firebase UID
      const customerQuery = query(
        collection(db, 'customers'),
        where('firebase_uid', '==', auth.currentUser.uid)
      );
      const customerSnapshot = await getDocs(customerQuery);
      
      if (customerSnapshot.empty) {
        setError('Customer profile not found. Please contact support.');
        return;
      }

      const customerDoc = customerSnapshot.docs[0];
      const customerInfo = {
        firebase_uid: auth.currentUser.uid,
        customer_id: customerDoc.id,
        ...customerDoc.data()
      } as CustomerData;
      
      setCustomerData(customerInfo);

      // Try to fetch invoices from both locations
      const invoicesList: Invoice[] = [];

      // 1. First, try the new subcollection structure
      try {
        const subcollectionRef = collection(db, 'customers', customerInfo.customer_id, 'customers_invoices');
        const subcollectionQuery = query(subcollectionRef, orderBy('date', 'desc'));
        const subcollectionSnapshot = await getDocs(subcollectionQuery);
        
        subcollectionSnapshot.docs.forEach(doc => {
          invoicesList.push({
            ...doc.data() as Invoice,
            invoice_id: doc.id // Ensure we have the ID
          });
        });
        
        console.log(`Found ${subcollectionSnapshot.size} invoices in subcollection`);
      } catch (subError) {
        console.log('No invoices found in subcollection or error accessing it:', subError);
      }

      // 2. Also check the top-level collection for backwards compatibility
      try {
        const topLevelQuery = query(
          collection(db, 'invoices'),
          where('customer_id', '==', customerInfo.customer_id),
          where('migrated', '!=', true) // Only get non-migrated invoices
        );
        const topLevelSnapshot = await getDocs(topLevelQuery);
        
        topLevelSnapshot.docs.forEach(doc => {
          // Check if this invoice isn't already in our list (avoid duplicates)
          const invoiceData = doc.data() as Invoice;
          if (!invoicesList.find(inv => inv.invoice_id === doc.id)) {
            invoicesList.push({
              ...invoiceData,
              invoice_id: doc.id
            });
          }
        });
        
        console.log(`Found ${topLevelSnapshot.size} invoices in top-level collection`);
      } catch (topError) {
        console.log('Error accessing top-level invoices:', topError);
      }

      // Sort all invoices by date (newest first)
      invoicesList.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setInvoices(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerAndInvoices();
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'paid') return invoice.status === 'paid' || invoice.balance === 0;
    if (filter === 'unpaid') return invoice.status !== 'paid' && invoice.balance > 0;
    if (filter === 'overdue') return invoice.balance > 0 && invoice.days_overdue && invoice.days_overdue > 0;
    return true;
  });

  const getStatusClass = (invoice: Invoice) => {
    if (invoice.status === 'paid' || invoice.balance === 0) return 'paid';
    if (invoice.days_overdue && invoice.days_overdue > 0) return 'overdue';
    return 'unpaid';
  };

  const getStatusText = (invoice: Invoice) => {
    if (invoice.status === 'paid' || invoice.balance === 0) return 'Paid';
    if (invoice.days_overdue && invoice.days_overdue > 0) return `Overdue (${invoice.days_overdue} days)`;
    return 'Unpaid';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, symbol: string = '£') => {
    return `${symbol}${amount?.toFixed(2) || '0.00'}`;
  };

  if (loading) {
    return (
      <div className="invoices-loading">
        <div className="loading-spinner"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoices-error">
        <FaFileInvoice className="error-icon" />
        <h3>Unable to Load Invoices</h3>
        <p>{error}</p>
        <button onClick={fetchCustomerAndInvoices} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="customer-invoices">
      <div className="invoices-header">
        <div className="header-content">
          <h1>My Invoices</h1>
          {customerData && (
            <p className="customer-info">
              {customerData.company_name || customerData.customer_name || 'Customer'}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
          </button>
          <div className="invoice-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({invoices.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
              onClick={() => setFilter('paid')}
            >
              Paid ({invoices.filter(i => i.status === 'paid' || i.balance === 0).length})
            </button>
            <button 
              className={`filter-btn ${filter === 'unpaid' ? 'active' : ''}`}
              onClick={() => setFilter('unpaid')}
            >
              Unpaid ({invoices.filter(i => i.status !== 'paid' && i.balance > 0).length})
            </button>
            <button 
              className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
              onClick={() => setFilter('overdue')}
            >
              Overdue ({invoices.filter(i => i.balance > 0 && i.days_overdue && i.days_overdue > 0).length})
            </button>
          </div>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="empty-invoices">
          <FaFileInvoice className="empty-icon" />
          <h3>No {filter !== 'all' ? filter : ''} invoices found</h3>
          <p>
            {filter === 'all' 
              ? "You don't have any invoices yet." 
              : `You don't have any ${filter} invoices.`}
          </p>
        </div>
      ) : (
        <>
          <div className="invoices-summary">
            <div className="summary-card">
              <h4>Total Outstanding</h4>
              <p className="summary-amount">
                {formatCurrency(
                  filteredInvoices
                    .filter(i => i.balance > 0)
                    .reduce((sum, inv) => sum + inv.balance, 0)
                )}
              </p>
            </div>
            <div className="summary-card">
              <h4>Total Invoiced</h4>
              <p className="summary-amount">
                {formatCurrency(
                  filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
                )}
              </p>
            </div>
          </div>

          <div className="invoices-grid">
            {filteredInvoices.map(invoice => (
              <div key={invoice.invoice_id} className="invoice-card">
                <div className="invoice-card-header">
                  <h3>{invoice.invoice_number}</h3>
                  <span className={`invoice-status ${getStatusClass(invoice)}`}>
                    {getStatusText(invoice)}
                  </span>
                </div>
                
                <div className="invoice-details">
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(invoice.date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Due Date:</span>
                    <span className="detail-value">{formatDate(invoice.due_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total:</span>
                    <span className="detail-value">
                      {formatCurrency(invoice.total, invoice.currency_symbol)}
                    </span>
                  </div>
                  {invoice.balance > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Balance:</span>
                      <span className="detail-value balance">
                        {formatCurrency(invoice.balance, invoice.currency_symbol)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="invoice-actions">
                  {invoice.invoice_url && (
                    <a 
                      href={invoice.invoice_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="invoice-action-btn view-btn"
                    >
                      <FaEye /> View
                    </a>
                  )}
                  <button className="invoice-action-btn download-btn">
                    <FaDownload /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}