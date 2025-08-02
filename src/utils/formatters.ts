// src/utils/formatters.ts

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-GB').format(num || 0);
};

export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Format as UK phone number
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const getInitials = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getStockStatusColor = (stock: number, reorderLevel?: number): string => {
  if (stock <= 0) return '#FF3B30'; // Red
  if (reorderLevel && stock <= reorderLevel) return '#FF9500'; // Orange
  return '#34C759'; // Green
};

export const getOrderStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#FF9500'; // Orange
    case 'processing':
      return '#007AFF'; // Blue
    case 'completed':
      return '#34C759'; // Green
    case 'cancelled':
      return '#FF3B30'; // Red
    default:
      return '#8E8E93'; // Gray
  }
};

export const getInvoiceStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'draft':
      return '#8E8E93'; // Gray
    case 'sent':
      return '#007AFF'; // Blue
    case 'paid':
      return '#34C759'; // Green
    case 'overdue':
      return '#FF3B30'; // Red
    case 'cancelled':
      return '#FF9500'; // Orange
    default:
      return '#8E8E93'; // Gray
  }
};
