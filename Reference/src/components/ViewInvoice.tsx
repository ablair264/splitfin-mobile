import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './ViewInvoice.module.css';

interface InvoiceData {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: 'paid' | 'pending' | 'overdue';
  line_items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  notes?: string;
}

const ViewInvoice: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError('No invoice ID provided');
        setLoading(false);
        return;
      }

      try {
        const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
        if (invoiceDoc.exists()) {
          setInvoice({ id: invoiceDoc.id, ...invoiceDoc.data() } as InvoiceData);
        } else {
          setError('Invoice not found');
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendReminder = async () => {
    if (!invoice) return;

    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      const response = await fetch(`${apiUrl}/api/invoices/remind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          customerEmail: invoice.customer_email
        })
      });

      if (response.ok) {
        alert('Reminder sent successfully');
      } else {
        alert('Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

  if (loading) {
    return (
      <div className="invoice-loading">
        <div className="spinner"></div>
        <p>Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="invoice-error">
        <h2>Error</h2>
        <p>{error || 'Invoice not found'}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const subtotal = invoice.line_items.reduce((sum, item) => sum + item.total, 0);
  const tax = 0; // Add tax calculation if needed
  const isOverdue = invoice.status !== 'paid' && new Date(invoice.due_date) < new Date();

  return (
    <div className="view-invoice-container">
      <div className="invoice-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="invoice-actions">
          <button className="action-button" onClick={handlePrint}>
            Print Invoice
          </button>
          {invoice.status !== 'paid' && (
            <button className="action-button primary" onClick={handleSendReminder}>
              Send Reminder
            </button>
          )}
        </div>
      </div>

      <div className="invoice-content">
        <div className="invoice-top">
          <div className="invoice-details">
            <h1>Invoice #{invoice.invoice_number}</h1>
            <div className="invoice-meta">
              <div>
                <span className="label">Date:</span>
                <span>{new Date(invoice.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="label">Due Date:</span>
                <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="label">Status:</span>
                <span className={`status-badge ${isOverdue ? 'overdue' : invoice.status}`}>
                  {isOverdue ? 'Overdue' : invoice.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="customer-details">
            <h3>Bill To:</h3>
            <p className="customer-name">{invoice.customer_name}</p>
            {invoice.customer_email && <p>{invoice.customer_email}</p>}
            {invoice.customer_address && (
              <p className="customer-address">{invoice.customer_address}</p>
            )}
          </div>
        </div>

        <div className="invoice-items">
          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>£{item.price.toFixed(2)}</td>
                  <td>£{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          {tax > 0 && (
            <div className="summary-row">
              <span>Tax</span>
              <span>£{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span>£{invoice.total.toFixed(2)}</span>
          </div>
          <div className="summary-row balance">
            <span>Balance Due</span>
            <span>£{invoice.balance.toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="invoice-notes">
            <h3>Notes</h3>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInvoice;
