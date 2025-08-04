import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileInvoice, FaUser, FaDownload, FaEnvelope, FaSearch, FaFilter, FaExclamationTriangle } from 'react-icons/fa';
import Lottie from 'lottie-react';
import loaderAnimation from '../loader.json';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import styles from './InvoiceManagement.module.css';
import { MetricCard } from './shared';

interface Invoice {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  company_name?: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
  current_sub_status?: string;
  payment_expected_date?: string;
  last_payment_date?: string;
  reminders_sent?: number;
  salesperson_id?: string;
  salesperson_name?: string;
  salesorder_id?: string;
  salesorder_number?: string;
  email?: string;
  phone?: string;
  currency_code?: string;
  currency_symbol?: string;
  invoice_url?: string;
  is_emailed?: boolean;
  is_viewed_by_client?: boolean;
  created_time?: string;
  last_modified_time?: string;
  [key: string]: any;
}

interface InvoiceMetrics {
  totalInvoices: number;
  totalValue: number;
  outstandingValue: number;
  overdueInvoices: number;
  paidInvoices: number;
  avgInvoiceValue: number;
}

type StatusFilter = 'all' | 'paid' | 'unpaid' | 'overdue' | 'draft';
type SortBy = 'date' | 'due_date' | 'amount' | 'customer';

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceMetrics, setInvoiceMetrics] = useState<InvoiceMetrics>({
    totalInvoices: 0,
    totalValue: 0,
    outstandingValue: 0,
    overdueInvoices: 0,
    paidInvoices: 0,
    avgInvoiceValue: 0
  });

  const invoicesPerPage = 25;
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    fetchInvoices();
  }, [currentUserId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Get user details to determine role and access pattern
      const userDoc = await getDoc(doc(db, 'users', currentUserId || ''));
      const userData = userDoc.data();
      const userRole = userData?.role;
      const userZohoId = userData?.zohospID || userData?.zohoAgentID;

      let invoicesData: Invoice[] = [];

      if (userRole === 'salesAgent' && userZohoId) {
        // For sales agents, get invoices from their customers_invoices subcollection
        const agentInvoicesSnapshot = await getDocs(
          collection(db, 'sales_agents', userZohoId, 'customers_invoices')
        );
        
        // Get the invoice IDs from the agent's subcollection
        const invoiceIds = agentInvoicesSnapshot.docs.map(doc => doc.data().invoice_id);
        
        if (invoiceIds.length > 0) {
          // Fetch full invoice details from invoices collection in batches
          const chunkSize = 10; // Firestore 'in' query limit
          const invoicePromises = [];
          
          for (let i = 0; i < invoiceIds.length; i += chunkSize) {
            const chunk = invoiceIds.slice(i, i + chunkSize);
            const invoicesQuery = query(
              collection(db, 'invoices'),
              where('invoice_id', 'in', chunk),
              orderBy('date', 'desc')
            );
            invoicePromises.push(getDocs(invoicesQuery));
          }
          
          const invoiceSnapshots = await Promise.all(invoicePromises);
          
          for (const snapshot of invoiceSnapshots) {
            invoicesData.push(...snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Invoice)));
          }
        }
      } else {
        // For managers/admins, get all invoices from invoices collection
        const invoicesQuery = query(
          collection(db, 'invoices'),
          orderBy('date', 'desc')
        );
        
        const invoicesSnapshot = await getDocs(invoicesQuery);
        invoicesData = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Invoice));
      }
      
      setInvoices(invoicesData);
      calculateMetrics(invoicesData);
      
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (invoicesData: Invoice[]) => {
    const now = new Date();
    
    const totalInvoices = invoicesData.length;
    const totalValue = invoicesData.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    
    const paidInvoices = invoicesData.filter(invoice => 
      invoice.status === 'paid' || invoice.balance === 0
    ).length;
    
    const outstandingInvoices = invoicesData.filter(invoice => 
      invoice.status !== 'paid' && (invoice.balance || 0) > 0
    );
    const outstandingValue = outstandingInvoices.reduce((sum, invoice) => sum + (invoice.balance || 0), 0);
    
    const overdueInvoices = outstandingInvoices.filter(invoice => {
      if (!invoice.due_date) return false;
      const dueDate = new Date(invoice.due_date);
      return dueDate < now;
    }).length;
    
    const avgInvoiceValue = totalInvoices > 0 ? totalValue / totalInvoices : 0;

    setInvoiceMetrics({
      totalInvoices,
      totalValue,
      outstandingValue,
      overdueInvoices,
      paidInvoices,
      avgInvoiceValue
    });
  };

  const generateInvoiceChartData = () => {
    // Generate chart data for invoice trends over last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date || invoice.created_time || '');
        return invoiceDate.toDateString() === date.toDateString();
      });
      
      data.push({
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        value: dayInvoices.length,
        amount: dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
      });
    }
    return data;
  };

  const getInvoiceStatus = (invoice: Invoice) => {
    if (invoice.status === 'paid' || invoice.balance === 0) {
      return 'paid';
    } else if (invoice.status === 'draft') {
      return 'draft';
    } else if (invoice.due_date && new Date(invoice.due_date) < new Date()) {
      return 'overdue';
    } else {
      return 'unpaid';
    }
  };

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = search === '' || 
        invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.company_name?.toLowerCase().includes(search.toLowerCase());
        
      const invoiceStatus = getInvoiceStatus(invoice);
      const matchesStatus = statusFilter === 'all' || invoiceStatus === statusFilter;
        
      return matchesSearch && matchesStatus;
    });

    // Sort invoices based on selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const aDate = new Date(a.date || a.created_time || 0);
          const bDate = new Date(b.date || b.created_time || 0);
          return bDate.getTime() - aDate.getTime();
        case 'due_date':
          const aDueDate = new Date(a.due_date || 0);
          const bDueDate = new Date(b.due_date || 0);
          return aDueDate.getTime() - bDueDate.getTime();
        case 'amount':
          return (b.total || 0) - (a.total || 0);
        case 'customer':
          return (a.customer_name || '').localeCompare(b.customer_name || '');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [invoices, search, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / invoicesPerPage);
  const currentInvoices = filteredAndSortedInvoices.slice(
    (currentPage - 1) * invoicesPerPage,
    currentPage * invoicesPerPage
  );

  const handleViewInvoice = (invoice: Invoice) => {
    navigate(`/invoice/${invoice.id}`);
  };

  const handleViewCustomer = (invoice: Invoice) => {
    navigate(`/customer/${invoice.customer_id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  const isOverdue = (invoice: Invoice) => {
    if (!invoice.due_date || invoice.status === 'paid') return false;
    return new Date(invoice.due_date) < new Date();
  };

  const getDaysUntilDue = (invoice: Invoice) => {
    if (!invoice.due_date) return null;
    const dueDate = new Date(invoice.due_date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className={styles.invoicesLoading}>
        <Lottie 
          animationData={loaderAnimation}
          loop={true}
          autoplay={true}
          style={{ width: 100, height: 100 }}
        />
        <p>Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className={styles.invoiceManagementContainer}>
      <div className={styles.invoiceManagementHeader}>
        <h1>Invoice Management</h1>
      </div>
      
      {/* Updated MetricCard components */}
      <div className={styles.metricsGrid4}>
        <MetricCard
          id="total-invoices"
          title="Total Invoices"
          value={invoiceMetrics.totalInvoices}
          subtitle="All invoices"
          icon={<span>📄</span>}
          color="#448382"
          chartData={generateInvoiceChartData().map(d => ({ name: d.date, value: d.value }))}
        />
        
        <MetricCard
          id="total-invoice-value"
          title="Total Value"
          value={invoiceMetrics.totalValue}
          subtitle="Sum of all invoices"
          icon={<span>💰</span>}
          color="#6c8471"
          format="currency"
          chartData={generateInvoiceChartData().map(d => ({ name: d.date, value: d.amount }))}
        />
        
        <MetricCard
          id="outstanding-invoices"
          title="Outstanding"
          value={invoiceMetrics.outstandingValue}
          subtitle="Unpaid invoices"
          icon={<span>⏳</span>}
          color="#fbbf24"
          format="currency"
          onClick={() => setStatusFilter('unpaid')}
          trend={{
            value: invoiceMetrics.totalValue > 0 ? 
              (invoiceMetrics.outstandingValue / invoiceMetrics.totalValue * 100) : 0,
            isPositive: false
          }}
        />
        
        <MetricCard
          id="overdue-invoices"
          title="Overdue"
          value={invoiceMetrics.overdueInvoices}
          subtitle="Past due date"
          icon={<span>⚠️</span>}
          color="#ef4444"
          onClick={() => setStatusFilter('overdue')}
          trend={{
            value: invoiceMetrics.overdueInvoices,
            isPositive: invoiceMetrics.overdueInvoices === 0
          }}
        />
      </div>

      {/* Search and Filter Controls */}
      <div className={styles.invoicesControls}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search invoices by number, customer, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterControls}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={styles.statusFilter}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className={styles.sortFilter}
          >
            <option value="date">Sort by Date</option>
            <option value="due_date">Sort by Due Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="customer">Sort by Customer</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className={styles.invoicesTableContainer}>
        <div className={styles.invoicesTable}>
          <div className={styles.tableHeader}>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Invoice #</div>
              <div className={styles.tableCell}>Customer</div>
              <div className={styles.tableCell}>Date</div>
              <div className={styles.tableCell}>Due Date</div>
              <div className={styles.tableCell}>Amount</div>
              <div className={styles.tableCell}>Balance</div>
              <div className={styles.tableCell}>Status</div>
              <div className={styles.tableCell}>Actions</div>
            </div>
          </div>
          
          <div className={styles.tableBody}>
            {currentInvoices.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📄</div>
                <h3>No invoices found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              currentInvoices.map((invoice) => {
                const daysUntilDue = getDaysUntilDue(invoice);
                const invoiceStatus = getInvoiceStatus(invoice);
                
                return (
                  <div key={invoice.id} className={`${styles.tableRow} ${isOverdue(invoice) ? styles.overdueRow : ''}`}>
                    <div className={styles.tableCell}>
                      <div className={styles.invoiceNumber}>
                        <strong onClick={() => handleViewInvoice(invoice)}>{invoice.invoice_number}</strong>
                        {invoice.salesorder_number && (
                          <span className={styles.orderRef}>({invoice.salesorder_number})</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.customerInfo}>
                        <strong>{invoice.customer_name}</strong>
                        {invoice.company_name && invoice.company_name !== invoice.customer_name && (
                          <span className={styles.companyName}>{invoice.company_name}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      {formatDate(invoice.date || invoice.created_time || '')}
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.dueDate}>
                        {formatDate(invoice.due_date)}
                        {daysUntilDue !== null && (
                          <span className={`${styles.daysInfo} ${daysUntilDue < 0 ? styles.overdue : daysUntilDue <= 7 ? styles.warning : ''}`}>
                            {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : 
                             daysUntilDue === 0 ? 'Due today' :
                             `${daysUntilDue} days left`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      <strong>{formatCurrency(invoice.total || 0)}</strong>
                    </div>
                    <div className={styles.tableCell}>
                      <strong className={invoice.balance > 0 ? styles.outstanding : styles.paid}>
                        {formatCurrency(invoice.balance || 0)}
                      </strong>
                    </div>
                    <div className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${styles[`status${invoiceStatus.charAt(0).toUpperCase() + invoiceStatus.slice(1)}`]}`}>
                        {invoiceStatus === 'paid' ? 'Paid' :
                         invoiceStatus === 'overdue' ? 'Overdue' :
                         invoiceStatus === 'draft' ? 'Draft' : 'Unpaid'}
                        {isOverdue(invoice) && <FaExclamationTriangle className={styles.warningIcon} />}
                      </span>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className={`${styles.actionBtn} ${styles.viewBtn}`}
                          title="View Invoice"
                        >
                          <FaFileInvoice />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleViewCustomer(invoice)}
                          className={`${styles.actionBtn} ${styles.customerBtn}`}
                          title="View Customer"
                        >
                          <FaUser />
                          <span>Customer</span>
                        </button>
                        {invoice.invoice_url && (
                          <button
                            onClick={() => window.open(invoice.invoice_url, '_blank')}
                            className={`${styles.actionBtn} ${styles.downloadBtn}`}
                            title="Download Invoice"
                          >
                            <FaDownload />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {(currentPage - 1) * invoicesPerPage + 1} to {Math.min(currentPage * invoicesPerPage, filteredAndSortedInvoices.length)} of {filteredAndSortedInvoices.length} invoices
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={styles.paginationBtn}
            >
              Previous
            </button>
            
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={styles.paginationBtn}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}