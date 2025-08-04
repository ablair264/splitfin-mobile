import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FaArrowLeft, 
  FaPrint, 
  FaSave,
  FaPaperPlane,
  FaFileExport,
  FaPlus,
  FaMinus,
  FaCheck
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProgressLoader } from './ProgressLoader';
import styles from './NewInvoice.module.css';

interface SalesAgent {
  id: string;
  name: string;
}

const SALES_AGENTS: SalesAgent[] = [
  { id: '', name: 'N/A' },
  { id: '310656000000642003', name: 'Hannah Neale' },
  { id: '310656000000642005', name: 'Dave Roberts' },
  { id: '310656000000642007', name: 'Kate Ellis' },
  { id: '310656000000642009', name: 'Stephen Stroud' },
  { id: '310656000000642013', name: 'Gay Croker' },
  { id: '310656000002136700', name: 'Marcus Johnson' },
  { id: '310656000026622107', name: 'House Account' }
];

interface LineItem {
  id: string;
  item_id: string;
  item_name: string;
  name?: string;
  sku: string;
  quantity: number;
  quantity_packed?: number;
  quantity_invoiced?: number;
  rate: number;
  total: number;
  item_total?: number;
  brand?: string;
  included?: boolean;
  discount?: number;
  tax?: number;
}

interface InvoiceData {
  customer_name: string;
  invoice_number?: string;
  salesorder_number: string;
  date: string;
  terms: 'due_on_receipt' | 'due_in_advance';
  due_date: string;
  sales_agent_id: string;
  sales_agent_name?: string;
  line_items: LineItem[];
  sub_total: number;
  discount: number;
  discount_percentage: number;
  total: number;
  include_non_packed_items: boolean;
  salesorder_id?: string;
  customer_id?: string;
  status?: string;
}

const BANK_DETAILS = {
  account_name: 'DM BRANDS LIMITED',
  sort_code: '55-81-36',
  account_number: '98967622',
  bic: 'NWBKGB2L',
  iban: 'GB68NWBK55813698967622',
  vat_no: 'GB 851 815 128'
};

export default function NewInvoice() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { orderId, orderData, isAdditional } = location.state || {};
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    customer_name: '',
    salesorder_number: '',
    date: new Date().toISOString().split('T')[0],
    terms: 'due_on_receipt',
    due_date: new Date().toISOString().split('T')[0],
    sales_agent_id: '',
    line_items: [],
    sub_total: 0,
    discount: 0,
    discount_percentage: 0,
    total: 0,
    include_non_packed_items: false
  });
  
  const [allLineItems, setAllLineItems] = useState<LineItem[]>([]);
  const [invoicePreviewRef, setInvoicePreviewRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!orderData && orderId) {
      loadOrderData();
    } else if (orderData) {
      populateFromOrder(orderData);
    }
  }, [orderId, orderData]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      if (!orderId) {
        navigate('/orders');
        return;
      }

      const orderDoc = await getDoc(doc(db, 'sales_orders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const order = { id: orderDoc.id, ...orderDoc.data() };
      populateFromOrder(order);
    } catch (error) {
      console.error('Error loading order:', error);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const populateFromOrder = (order: any) => {
    // Generate invoice number from sales order number
    const invoiceNumber = generateInvoiceNumber(order.salesorder_number);

    // Prepare line items
    let lineItems: LineItem[] = [];
    if (order.line_items && Array.isArray(order.line_items)) {
      lineItems = order.line_items.map((item: any, index: number) => ({
        id: item.line_item_id || `item-${index}`,
        item_id: item.item_id,
        item_name: item.item_name || item.name,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        quantity_packed: item.quantity_packed || 0,
        quantity_invoiced: item.quantity_invoiced || 0,
        rate: item.rate,
        total: item.total || item.item_total,
        item_total: item.item_total,
        brand: item.brand,
        included: true,
        discount: item.discount,
        tax: item.tax_percentage
      }));

      // If this is an additional invoice, only show items not yet invoiced
      if (isAdditional || order.invoice_split) {
        lineItems = lineItems.filter(item => (item.quantity_invoiced || 0) === 0);
      }
    }

    setAllLineItems(lineItems);

    // Calculate initial totals
    const includedItems = lineItems.filter(item => item.included);
    const subTotal = calculateSubTotal(includedItems);
    const discount = order.discount_amount || 0;
    const discountPercentage = order.discount_percent || 0;
    const total = subTotal - discount;

    setInvoiceData({
      customer_name: order.customer_name || '',
      invoice_number: invoiceNumber,
      salesorder_number: order.salesorder_number || '',
      date: new Date().toISOString().split('T')[0],
      terms: 'due_on_receipt',
      due_date: new Date().toISOString().split('T')[0],
      sales_agent_id: order.salesperson_id || '',
      sales_agent_name: order.salesperson_name || '',
      line_items: includedItems,
      sub_total: subTotal,
      discount: discount,
      discount_percentage: discountPercentage,
      total: total,
      include_non_packed_items: false,
      salesorder_id: order.salesorder_id,
      customer_id: order.customer_id,
      status: 'draft'
    });
  };

  const generateInvoiceNumber = (salesOrderNumber: string) => {
    // Convert sales order number to invoice number
    if (salesOrderNumber && salesOrderNumber.startsWith('SO-')) {
      return salesOrderNumber.replace('SO-', 'INV-');
    }
    // Fallback if no sales order number
    return `INV-${Date.now()}`;
  };

  const calculateSubTotal = (items: LineItem[]) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleTermsChange = (terms: 'due_on_receipt' | 'due_in_advance') => {
    setInvoiceData(prev => {
      const newDueDate = terms === 'due_in_advance' 
        ? prev.date  // Same as invoice date
        : new Date(new Date(prev.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days later
      
      return {
        ...prev,
        terms,
        due_date: newDueDate
      };
    });
  };

  const handleItemToggle = (itemId: string) => {
    const updatedItems = allLineItems.map(item => 
      item.id === itemId ? { ...item, included: !item.included } : item
    );
    setAllLineItems(updatedItems);

    const includedItems = updatedItems.filter(item => item.included);
    const subTotal = calculateSubTotal(includedItems);
    const total = subTotal - invoiceData.discount;

    setInvoiceData(prev => ({
      ...prev,
      line_items: includedItems,
      sub_total: subTotal,
      total: total
    }));
  };

  const handleIncludeNonPackedToggle = () => {
    const include = !invoiceData.include_non_packed_items;
    
    const updatedItems = allLineItems.map(item => ({
      ...item,
      included: include || (item.quantity_packed || 0) > 0
    }));
    setAllLineItems(updatedItems);

    const includedItems = updatedItems.filter(item => item.included);
    const subTotal = calculateSubTotal(includedItems);
    const total = subTotal - invoiceData.discount;

    setInvoiceData(prev => ({
      ...prev,
      include_non_packed_items: include,
      line_items: includedItems,
      sub_total: subTotal,
      total: total
    }));
  };

  const handleDiscountChange = (value: number, isPercentage = false) => {
    let discount = value;
    let percentage = invoiceData.discount_percentage;

    if (isPercentage) {
      percentage = value;
      discount = (invoiceData.sub_total * value) / 100;
    } else {
      percentage = invoiceData.sub_total > 0 ? (value / invoiceData.sub_total) * 100 : 0;
    }

    const total = invoiceData.sub_total - discount;

    setInvoiceData(prev => ({
      ...prev,
      discount,
      discount_percentage: percentage,
      total
    }));
  };

  const handleSaveInvoice = async () => {
    try {
      setSaving(true);

      // Prepare invoice document
      const invoiceDoc = {
        ...invoiceData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        created_by: 'system', // Should be current user ID
        balance: invoiceData.total, // Initially, balance equals total
      };

      // Save invoice to Firestore
      const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceDoc);

      // Update sales order
      if (orderId) {
        const updateData: any = {
          invoice_generated: true,
          last_invoice_date: new Date().toISOString()
        };

        // Check if we need to set invoice_split
        const hasUninvoicedItems = allLineItems.some(item => !item.included);
        if (hasUninvoicedItems) {
          updateData.invoice_split = true;
        }

        // Update line items with invoiced quantities
        const updatedLineItems = orderData.line_items.map((item: any) => {
          const invoicedItem = invoiceData.line_items.find(i => i.id === item.line_item_id);
          if (invoicedItem) {
            return {
              ...item,
              quantity_invoiced: invoicedItem.quantity
            };
          }
          return item;
        });

        updateData.line_items = updatedLineItems;

        // Add invoice to order's invoices array
        if (!orderData.invoices) {
          updateData.invoices = [];
        }
        updateData.invoices = [...(orderData.invoices || []), {
          invoice_id: invoiceRef.id,
          invoice_number: invoiceData.invoice_number,
          date: invoiceData.date,
          due_date: invoiceData.due_date,
          total: invoiceData.total,
          balance: invoiceData.total,
          status: 'draft',
          reference_number: orderData.reference_number
        }];

        await updateDoc(doc(db, 'sales_orders', orderId), updateData);
      }

      // Navigate to the new invoice
      navigate(`/invoice/${invoiceRef.id}`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvoice = async () => {
    // First save the invoice
    await handleSaveInvoice();
    // Then implement email sending logic
    // This would typically involve calling a backend API to send the email
  };

  const exportToPDF = async () => {
    if (!invoicePreviewRef) return;

    try {
      const canvas = await html2canvas(invoicePreviewRef, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${invoiceData.invoice_number}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
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
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <ProgressLoader
          progress={50}
          messages={[
            'Loading order details...',
            'Preparing invoice...'
          ]}
        />
      </div>
    );
  }

  return (
    <div className={styles.invoiceContainer}>
      {/* Header */}
      <div className={styles.invoiceHeader}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FaArrowLeft />
        </button>
        <h1>New Invoice</h1>
        <div className={styles.headerActions}>
          <button onClick={exportToPDF} className={styles.actionButton} title="Export PDF">
            <FaFileExport />
          </button>
          <button onClick={handleSaveInvoice} className={styles.saveButton} disabled={saving}>
            <FaSave /> Save Invoice
          </button>
          <button onClick={handleSendInvoice} className={styles.sendButton} disabled={saving}>
            <FaPaperPlane /> Send Invoice
          </button>
        </div>
      </div>

      <div className={styles.invoiceContent}>
        {/* Invoice Form */}
        <div className={styles.invoiceForm}>
          {/* Basic Information */}
          <div className={styles.formSection}>
            <h3>Invoice Information</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Customer Name</label>
                <input 
                  type="text" 
                  value={invoiceData.customer_name}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Invoice Number</label>
                <input 
                  type="text" 
                  value={invoiceData.invoice_number}
                  readOnly
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Sales Order Number</label>
                <input 
                  type="text" 
                  value={invoiceData.salesorder_number}
                  readOnly
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Invoice Date</label>
                <input 
                  type="date" 
                  value={invoiceData.date}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Terms</label>
                <select 
                  value={invoiceData.terms}
                  onChange={(e) => handleTermsChange(e.target.value as 'due_on_receipt' | 'due_in_advance')}
                  className={styles.formSelect}
                >
                  <option value="due_on_receipt">Due on Receipt</option>
                  <option value="due_in_advance">Due in Advance</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Due Date</label>
                <input 
                  type="date" 
                  value={invoiceData.due_date}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Sales Agent</label>
                <select 
                  value={invoiceData.sales_agent_id}
                  onChange={(e) => {
                    const agent = SALES_AGENTS.find(a => a.id === e.target.value);
                    setInvoiceData(prev => ({ 
                      ...prev, 
                      sales_agent_id: e.target.value,
                      sales_agent_name: agent?.name || ''
                    }));
                  }}
                  className={styles.formSelect}
                >
                  {SALES_AGENTS.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h3>Order Items</h3>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox"
                  checked={invoiceData.include_non_packed_items}
                  onChange={handleIncludeNonPackedToggle}
                />
                Include Non-Packed Items
              </label>
            </div>
            
            <div className={styles.lineItemsContainer}>
              <div className={styles.lineItemsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableRow}>
                    <div className={styles.tableCell} style={{ width: '40px' }}>
                      <FaCheck />
                    </div>
                    <div className={styles.tableCell}>Item</div>
                    <div className={styles.tableCell}>SKU</div>
                    <div className={styles.tableCell}>Qty</div>
                    <div className={styles.tableCell}>Packed</div>
                    <div className={styles.tableCell}>Rate</div>
                    <div className={styles.tableCell}>Total</div>
                  </div>
                </div>
                <div className={styles.tableBody}>
                  {allLineItems.map((item) => (
                    <div key={item.id} className={`${styles.tableRow} ${!item.included ? styles.excluded : ''}`}>
                      <div className={styles.tableCell} style={{ width: '40px' }}>
                        <input 
                          type="checkbox"
                          checked={item.included}
                          onChange={() => handleItemToggle(item.id)}
                        />
                      </div>
                      <div className={styles.tableCell}>
                        <strong>{item.item_name || item.name}</strong>
                        {item.brand && <span className={styles.itemBrand}>{item.brand}</span>}
                      </div>
                      <div className={styles.tableCell}>{item.sku}</div>
                      <div className={styles.tableCell}>{item.quantity}</div>
                      <div className={styles.tableCell}>
                        {item.quantity_packed || 0}
                        {(item.quantity_packed || 0) === 0 && (
                          <span className={styles.notPacked}>Not Packed</span>
                        )}
                      </div>
                      <div className={styles.tableCell}>{formatCurrency(item.rate)}</div>
                      <div className={styles.tableCell}>
                        <strong>{formatCurrency(item.total || 0)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className={styles.formSection}>
            <h3>Invoice Totals</h3>
            <div className={styles.totalsGrid}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(invoiceData.sub_total)}</span>
              </div>
              <div className={styles.totalRow}>
                <div className={styles.discountInputs}>
                  <label>Discount</label>
                  <input 
                    type="number"
                    value={invoiceData.discount.toFixed(2)}
                    onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                    className={styles.discountInput}
                    step="0.01"
                  />
                  <input 
                    type="number"
                    value={invoiceData.discount_percentage.toFixed(2)}
                    onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0, true)}
                    className={styles.discountInput}
                    step="0.01"
                    placeholder="%"
                  />
                  <span>%</span>
                </div>
                <span className={styles.discount}>-{formatCurrency(invoiceData.discount)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>{formatCurrency(invoiceData.total)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className={styles.formSection}>
            <h3>Bank Details</h3>
            <div className={styles.bankDetails}>
              <div className={styles.bankInfo}>
                <span className={styles.label}>Account Name:</span>
                <span className={styles.value}>{BANK_DETAILS.account_name}</span>
              </div>
              <div className={styles.bankInfo}>
                <span className={styles.label}>Sort Code:</span>
                <span className={styles.value}>{BANK_DETAILS.sort_code}</span>
              </div>
              <div className={styles.bankInfo}>
                <span className={styles.label}>Account Number:</span>
                <span className={styles.value}>{BANK_DETAILS.account_number}</span>
              </div>
              <div className={styles.bankInfo}>
                <span className={styles.label}>BIC:</span>
                <span className={styles.value}>{BANK_DETAILS.bic}</span>
              </div>
              <div className={styles.bankInfo}>
                <span className={styles.label}>IBAN:</span>
                <span className={styles.value}>{BANK_DETAILS.iban}</span>
              </div>
              <div className={styles.bankInfo}>
                <span className={styles.label}>VAT No:</span>
                <span className={styles.value}>{BANK_DETAILS.vat_no}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className={styles.invoicePreview}>
          <h3>Invoice Preview</h3>
          <div className={styles.previewContainer} ref={setInvoicePreviewRef}>
            <div className={styles.previewHeader}>
              <div className={styles.companyInfo}>
                <h2>DM BRANDS LIMITED</h2>
                <p>Your Company Address</p>
                <p>Phone: +44 123 456 7890</p>
                <p>Email: info@dmbrands.com</p>
              </div>
              <div className={styles.invoiceTitle}>
                <h1>INVOICE</h1>
                <p>#{invoiceData.invoice_number}</p>
              </div>
            </div>

            <div className={styles.previewDetails}>
              <div className={styles.billTo}>
                <h4>Bill To:</h4>
                <p><strong>{invoiceData.customer_name}</strong></p>
                <p>Customer Address</p>
              </div>
              <div className={styles.invoiceMeta}>
                <div className={styles.metaRow}>
                  <span>Date:</span>
                  <span>{formatDate(invoiceData.date)}</span>
                </div>
                <div className={styles.metaRow}>
                  <span>Due Date:</span>
                  <span>{formatDate(invoiceData.due_date)}</span>
                </div>
                <div className={styles.metaRow}>
                  <span>SO Number:</span>
                  <span>{invoiceData.salesorder_number}</span>
                </div>
              </div>
            </div>

            <div className={styles.previewItems}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.line_items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.item_name || item.name}</td>
                      <td>{item.sku}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.rate)}</td>
                      <td>{formatCurrency(item.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.previewTotals}>
              <div className={styles.totalLine}>
                <span>Subtotal:</span>
                <span>{formatCurrency(invoiceData.sub_total)}</span>
              </div>
              {invoiceData.discount > 0 && (
                <div className={styles.totalLine}>
                  <span>Discount ({invoiceData.discount_percentage.toFixed(2)}%):</span>
                  <span>-{formatCurrency(invoiceData.discount)}</span>
                </div>
              )}
              <div className={`${styles.totalLine} ${styles.grandTotalLine}`}>
                <span>Total:</span>
                <span>{formatCurrency(invoiceData.total)}</span>
              </div>
            </div>

            <div className={styles.previewBankDetails}>
              <h4>Bank Details</h4>
              <p>Account Name: {BANK_DETAILS.account_name}</p>
              <p>Sort Code: {BANK_DETAILS.sort_code} | Account Number: {BANK_DETAILS.account_number}</p>
              <p>IBAN: {BANK_DETAILS.iban}</p>
              <p>VAT No: {BANK_DETAILS.vat_no}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}