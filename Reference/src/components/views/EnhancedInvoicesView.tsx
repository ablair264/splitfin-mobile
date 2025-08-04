import React, { useMemo, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useInvoicesData } from '../../hooks/useViewData';
import { ProgressLoader } from '../ProgressLoader';
import MetricCard from '../shared/MetricCard';
import CardChart from '../shared/CardChart';
import CardTable from '../shared/CardTable';
import SegmentedButtonGroup from '../shared/SegmentedButtonGroup';
import MetricIcon from '../shared/MetricIcon';

interface DashboardContext {
  userId: string;
  dashboardState: any;
  updateDashboardState: (updates: any) => void;
  navigate: (path: string) => void;
}

interface InvoiceFilters {
  status: string;
  searchTerm: string;
  page: number;
  pageSize: number;
}

const EnhancedInvoicesView: React.FC = () => {
  const context = useOutletContext<DashboardContext>();
  const { userId, dashboardState, navigate } = context;
  
  // Local state for invoice filters
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: '',
    searchTerm: '',
    page: 1,
    pageSize: 50
  });

  // Load invoices data
  const { 
    data, 
    loading, 
    error, 
    refresh, 
    isStale, 
    isCached 
  } = useInvoicesData({
    userId,
    dateRange: dashboardState.dateRange,
    useCache: true,
    staleWhileRevalidate: true
  });

  // Process data for display
  const processedData = useMemo(() => {
    if (!data) return null;

    const { invoices = [], metrics = {} } = data;

    // Normalize invoice data
    let allInvoices = [];
    if (Array.isArray(invoices)) {
      allInvoices = invoices;
    } else if (invoices.all) {
      allInvoices = invoices.all;
    } else {
      // Combine different invoice arrays if they exist
      allInvoices = [
        ...(invoices.outstanding || []),
        ...(invoices.paid || []),
        ...(invoices.overdue || [])
      ];
    }

    // Remove duplicates
    const invoiceMap = new Map();
    allInvoices.forEach(inv => {
      const id = inv.invoice_id || inv.id;
      if (id && !invoiceMap.has(id)) {
        invoiceMap.set(id, inv);
      }
    });
    allInvoices = Array.from(invoiceMap.values());

    // Apply filters
    let filteredInvoices = [...allInvoices];
    
    if (filters.status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === filters.status);
    }
    
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filteredInvoices = filteredInvoices.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(search) ||
        inv.customer_name?.toLowerCase().includes(search)
      );
    }

    // Sort by date (newest first)
    filteredInvoices.sort((a, b) => 
      new Date(b.date || b.invoice_date).getTime() - 
      new Date(a.date || a.invoice_date).getTime()
    );

    // Paginate
    const totalInvoices = filteredInvoices.length;
    const totalPages = Math.ceil(totalInvoices / filters.pageSize);
    const startIndex = (filters.page - 1) * filters.pageSize;
    const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + filters.pageSize);

    // Calculate summary metrics
    const summary = calculateInvoiceSummary(allInvoices);
    const agingData = calculateAgingData(allInvoices);
    const statusDistribution = calculateStatusDistribution(allInvoices);

    return {
      invoices: paginatedInvoices,
      totalInvoices,
      totalPages,
      metrics: { ...metrics, ...summary },
      agingData,
      statusDistribution
    };
  }, [data, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: keyof InvoiceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
      page: filterType !== 'page' ? 1 : prev.page
    }));
  }, []);

  // Handle invoice reminder
  const handleSendReminder = useCallback(async (invoiceId: string, customerEmail: string) => {
    // Implement reminder logic here
    console.log('Send reminder for invoice:', invoiceId, 'to:', customerEmail);
  }, []);

  // Refresh handler
  React.useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [refresh]);

  if (loading && !isStale) {
    return <ProgressLoader progress={50} message="Loading invoices data..." />;
  }

  if (error && !processedData) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Unable to load invoices</h3>
        <p>{error}</p>
        <button onClick={refresh} className="retry-button">Try Again</button>
      </div>
    );
  }

  if (!processedData) {
    return <ProgressLoader progress={30} message="Processing invoice data..." />;
  }

  const { 
    invoices, 
    totalInvoices, 
    totalPages, 
    metrics, 
    agingData, 
    statusDistribution 
  } = processedData;

  return (
    <div className="invoices-view-container" style={{ position: 'relative' }}>
      {/* Status indicators */}
      {isStale && (
        <div style={{
          position: 'absolute',
          top: -40,
          right: 0,
          background: '#fbbf24',
          color: '#000',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Refreshing...
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          id="total-outstanding"
          title="Total Outstanding"
          value={metrics.totalOutstanding || 0}
          subtitle="Awaiting payment"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          color="#ef4444"
        />
        <MetricCard
          id="total-overdue"
          title="Overdue Amount"
          value={metrics.totalOverdue || 0}
          subtitle="Past due date"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          color="#f59e0b"
        />
        <MetricCard
          id="due-today"
          title="Due Today"
          value={metrics.totalDueToday || 0}
          subtitle="Payment expected"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          color="#3b82f6"
        />
        <MetricCard
          id="due-30-days"
          title="Due in 30 Days"
          value={metrics.totalDueIn30Days || 0}
          subtitle="Upcoming"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          color="#10b981"
        />
        <MetricCard
          id="total-paid"
          title="Total Paid"
          value={metrics.totalPaid || 0}
          subtitle="This period"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          color="#22c55e"
        />
      </div>

      {/* Filters Row */}
      <div className="filters-row" style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search by invoice # or customer..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: '#fff',
            minWidth: '300px',
            flex: '1'
          }}
        />
        
        <SegmentedButtonGroup
          options={[
            { label: 'All', value: '' },
            { label: 'Outstanding', value: 'sent' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Paid', value: 'paid' }
          ]}
          value={filters.status}
          onChange={(value) => handleFilterChange('status', value)}
          size="small"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <CardChart
          id="aging-analysis"
          title="Invoice Aging"
          subtitle="Days outstanding"
          data={agingData}
          type="bar"
          dataKey="amount"
          height={300}
          colors={['#ef4444', '#f59e0b', '#3b82f6', '#10b981']}
        />
        
        <CardChart
          id="status-distribution"
          title="Invoice Status"
          subtitle="Current breakdown"
          data={statusDistribution}
          type="pie"
          dataKey="value"
          showLegend={true}
          height={300}
          colors={['#f59e0b', '#ef4444', '#22c55e', '#6b7280']}
        />
      </div>

      {/* Invoices Table */}
      <CardTable
        id="invoices-table"
        title={`Invoices (${totalInvoices} total)`}
        subtitle={`Page ${filters.page} of ${totalPages}`}
        columns={[
          { key: 'invoice_number', label: 'Invoice #', width: '15%' },
          { key: 'customer_name', label: 'Customer', width: '25%' },
          { 
            key: 'date', 
            label: 'Date',
            width: '15%',
            format: (value) => new Date(value).toLocaleDateString()
          },
          { 
            key: 'due_date', 
            label: 'Due Date',
            width: '15%',
            format: (value) => new Date(value).toLocaleDateString()
          },
          { 
            key: 'statusFormatted', 
            label: 'Status', 
            width: '12%'
          },
          { 
            key: 'balance', 
            label: 'Balance', 
            align: 'right',
            format: (value) => `£${(value || 0).toLocaleString()}`
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'center',
            width: '12%'
          }
        ]}
        data={invoices.map(inv => ({
          ...inv,
          date: inv.date || inv.invoice_date,
          balance: inv.balance || inv.amount_due || inv.total,
          statusFormatted: formatStatus(inv.status)
        }))}
        onRowClick={(row) => navigate(`/invoice/${row.invoice_id || row.id}`)}
        maxRows={filters.pageSize}
        highlightRows={true}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px'
        }}>
          <button 
            onClick={() => handleFilterChange('page', filters.page - 1)}
            disabled={filters.page === 1}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: filters.page === 1 ? '#f3f4f6' : '#fff',
              cursor: filters.page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
            Page {filters.page} of {totalPages}
          </span>
          
          <button 
            onClick={() => handleFilterChange('page', filters.page + 1)}
            disabled={filters.page === totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: filters.page === totalPages ? '#f3f4f6' : '#fff',
              cursor: filters.page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Helper functions
function formatStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    overdue: '⚠️ Overdue',
    paid: '✓ Paid', 
    sent: '⏳ Outstanding',
    draft: '📝 Draft'
  };
  return statusLabels[status] || status;
}

function getStatusDisplay(status: string) {
  const statusConfig: Record<string, { icon: string; label: string; color: string }> = {
    overdue: { icon: 'alert-circle', label: 'Overdue', color: '#dc2626' },
    paid: { icon: 'check-circle', label: 'Paid', color: '#059669' },
    sent: { icon: 'clock', label: 'Outstanding', color: '#2563eb' },
    draft: { icon: 'edit', label: 'Draft', color: '#6b7280' }
  };
  
  const config = statusConfig[status] || { icon: 'info', label: status, color: '#6b7280' };
  
  return React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: config.color,
      fontWeight: '500'
    }
  }, [
    React.createElement(MetricIcon, {
      key: 'icon',
      name: config.icon as any,
      size: 16,
      color: config.color
    }),
    React.createElement('span', { key: 'label' }, config.label)
  ]);
}

function calculateInvoiceSummary(invoices: any[]) {
  return {
    totalOutstanding: invoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.balance || inv.amount_due || 0), 0),
    totalOverdue: invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.balance || inv.amount_due || 0), 0),
    totalDueToday: invoices
      .filter(inv => {
        const dueDate = new Date(inv.due_date);
        const today = new Date();
        return dueDate.toDateString() === today.toDateString() && inv.status !== 'paid';
      })
      .reduce((sum, inv) => sum + (inv.balance || inv.amount_due || 0), 0),
    totalDueIn30Days: invoices
      .filter(inv => {
        const dueDate = new Date(inv.due_date);
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        return dueDate >= today && dueDate <= thirtyDaysFromNow && inv.status !== 'paid';
      })
      .reduce((sum, inv) => sum + (inv.balance || inv.amount_due || 0), 0),
    totalPaid: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0)
  };
}

function calculateAgingData(invoices: any[]) {
  const aging = {
    '0-30 days': 0,
    '31-60 days': 0,
    '61-90 days': 0,
    '90+ days': 0
  };

  const today = new Date();
  
  invoices
    .filter(inv => inv.status !== 'paid')
    .forEach(inv => {
      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = inv.balance || inv.amount_due || 0;
      
      if (daysOverdue <= 30) {
        aging['0-30 days'] += amount;
      } else if (daysOverdue <= 60) {
        aging['31-60 days'] += amount;
      } else if (daysOverdue <= 90) {
        aging['61-90 days'] += amount;
      } else {
        aging['90+ days'] += amount;
      }
    });

  return Object.entries(aging).map(([name, amount]) => ({ name, amount }));
}

function calculateStatusDistribution(invoices: any[]) {
  const statusCounts = invoices.reduce((acc, inv) => {
    const status = inv.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusLabels: Record<string, string> = {
    sent: 'Outstanding',
    overdue: 'Overdue',
    paid: 'Paid',
    draft: 'Draft'
  };

  return Object.entries(statusCounts).map(([status, value]) => ({
    name: statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1),
    value
  }));
}

export default EnhancedInvoicesView;