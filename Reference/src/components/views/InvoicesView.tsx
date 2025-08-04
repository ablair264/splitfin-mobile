import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MetricCard from '../shared/MetricCard';
import MetricIcon from '../shared/MetricIcon';

interface InvoicesViewProps {
  data: any;
  invoices: any[];
  dashboardState: any;
  chartDataCache: any;
  calculateTrendFromPrevious: (current: number, previous: number) => any;
  handleAIInsight: (title: string, type: string) => void;
  handleInvoiceReminder: (id: string, email: string) => void;
  invoiceFilters: { searchTerm: string; status?: string };
  setInvoiceFilters: (filters: any) => void;
  EmptyState: React.FC<{ message: string }>;
  getMetricCardColor: (index?: number) => string;
  navigate: (path: string) => void;
}

const InvoicesView: React.FC = () => {
  const {
    data,
    invoices,
    dashboardState,
    chartDataCache,
    calculateTrendFromPrevious,
    handleAIInsight,
    handleInvoiceReminder,
    invoiceFilters,
    setInvoiceFilters,
    EmptyState,
    getMetricCardColor,
    navigate
  } = useOutletContext<InvoicesViewProps>();
  const availableViews = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'brands', label: 'Brands', icon: '🏷️' },
    { id: 'forecasting', label: 'Forecasting', icon: '🔮' }
  ];

  // Calculate paid invoices value
  const paidInvoicesValue = React.useMemo(() => {
    const dateRangeMap = {
      '7_days': 7,
      '30_days': 30,
      '90_days': 90,
      'this_year': 365,
      'last_year': 365
    };
    
    const days = dateRangeMap[dashboardState.dateRange] || 365;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return invoices
      .filter(inv => inv.status === 'paid' && new Date(inv.date) >= cutoffDate)
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices, dashboardState.dateRange]);

  // Filter invoices
  const filteredInvoices = React.useMemo(() => {
    return invoices
      .filter(invoice => {
        // Apply search filter
        if (invoiceFilters.searchTerm) {
          const searchTerm = invoiceFilters.searchTerm.toLowerCase();
          return (
            invoice.invoice_number?.toLowerCase().includes(searchTerm) ||
            invoice.customer_name?.toLowerCase().includes(searchTerm) ||
            invoice.id.toLowerCase().includes(searchTerm)
          );
        }
        return true;
      })
      .filter(invoice => {
        // Apply status filter
        if (invoiceFilters.status) {
          if (invoiceFilters.status === 'overdue') {
            return invoice.status !== 'paid' && new Date(invoice.due_date) < new Date();
          }
          return invoice.status === invoiceFilters.status;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, invoiceFilters]);

  return (
    <div className="invoices-view">
      <div className="metrics-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          id="outstandingInvoicesCount"
          title="Outstanding Invoices"
          value={invoices.filter(inv => inv.status !== 'paid').length}
          subtitle="Pending payment"
          trend={{
            value: 12,
            isPositive: false
          }}
          format="number"
          displayMode={dashboardState.metricDisplayMode}
          design="variant1"
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="order" size={24} /> : undefined}
          cardIndex={0}
        />
        <MetricCard
          id="outstandingInvoicesValue"
          title="Outstanding Value"
          value={data?.metrics.outstandingInvoices || 0}
          subtitle="Total amount due"
          trend={calculateTrendFromPrevious(
            data?.metrics.outstandingInvoices || 0,
            (data?.metrics.outstandingInvoices || 0) * 1.1
          )}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          design="variant2"
          onOptionsClick={() => handleAIInsight('Outstanding Invoices', 'outstandingInvoices')}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="dollar-sign" size={24} /> : undefined}
          cardIndex={1}
        />
        <MetricCard
          id="invoicesPaidValue"
          title="Invoices Paid"
          value={paidInvoicesValue}
          subtitle="Within date range"
          trend={{
            value: 8,
            isPositive: true
          }}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          design="variant3"
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="check-circle" size={24} /> : undefined}
          cardIndex={2}
        />
      </div>

      {/* Search functionality */}
      <div className="invoice-filters" style={{ marginBottom: '20px', padding: '16px', background: 'var(--background-white)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <input
          type="text"
          placeholder="Search invoices..."
          value={invoiceFilters.searchTerm}
          onChange={(e) => setInvoiceFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          className="dashboard-input"
          style={{
            width: '300px',
            marginRight: '10px'
          }}
        />
        <select
          value={invoiceFilters.status || ''}
          onChange={(e) => setInvoiceFilters(prev => ({ ...prev, status: e.target.value }))}
          className="dashboard-input"
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="invoices-table-container">
        <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>All Invoices</h3>
          <button 
            onClick={() => navigate('/invoices')}
            className="view-all-button"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#1a1f2a',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(251, 191, 36, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(251, 191, 36, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(251, 191, 36, 0.2)';
            }}
          >
            View All
          </button>
        </div>
        <table className="enhanced-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className={invoice.status !== 'paid' && new Date(invoice.due_date) < new Date() ? 'overdue' : ''}>
                <td>{invoice.invoice_number || invoice.id.slice(-8)}</td>
                <td>{invoice.customer_name}</td>
                <td>{new Date(invoice.date).toLocaleDateString()}</td>
                <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</td>
                <td>£{invoice.total.toLocaleString()}</td>
                <td>£{invoice.balance.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${invoice.status}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="action-button"
                      onClick={() => navigate(`/invoice/${invoice.id}`)}
                      style={{
                        background: 'var(--hover-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      View
                    </button>
                    {invoice.status !== 'paid' && (
                      <button
                        className="action-button"
                        onClick={() => handleInvoiceReminder(invoice.id, invoice.customer_email || '')}
                        style={{
                          background: 'var(--primary-color)',
                          color: 'var(--background-light)',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Remind
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {invoices.length === 0 && (
          <EmptyState message="No invoices found for the selected period" />
        )}
      </div>
    </div>
  );
};

export default InvoicesView;