// Inventory Types matching your existing items_data structure
import { Timestamp } from 'firebase/firestore';

export interface ItemData {
  // Document fields
  id?: string; // Firestore document ID
  "Document ID"?: number;
  
  // Sync metadata
  _lastSynced?: string;
  _syncSource?: string;
  
  // Core item fields
  item_id: string;
  item_name: string;
  description?: string;
  sku: string;
  ean?: string;
  
  // Brand/Manufacturer
  brand?: string;
  brand_normalized?: string;
  manufacturer?: string;
  
  // Stock levels
  stock_on_hand: number;
  actual_available_stock: number;
  available_stock: number;
  cf_actual_available_in_stock?: string;
  cf_actual_available_in_stock_unformatted?: string;
  cf_committed_stock?: string;
  cf_committed_stock_unformatted?: string;
  
  // Pricing
  purchase_rate: number;
  rate: number; // selling price
  
  // Status and settings
  status: 'active' | 'inactive';
  can_be_purchased?: boolean;
  can_be_sold?: boolean;
  track_inventory?: boolean;
  is_returnable?: boolean;
  
  // Reorder
  reorder_level?: number | string;
  
  // Tax
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  tax_exemption_code?: string;
  tax_exemption_id?: string;
  is_taxable?: boolean;
  
  // Dimensions
  dimension_unit?: string;
  height?: string;
  width?: string;
  length?: string;
  weight?: string;
  weight_unit?: string;
  
  // Images
  has_attachment?: boolean;
  image_document_id?: string;
  image_name?: string;
  image_type?: string;
  
  // Categories/Groups
  group_id?: number | string;
  group_name?: number | string;
  category_name?: string;
  
  // Product type
  product_type?: string;
  item_type?: string;
  
  // Accounts
  account_id?: string;
  account_name?: string;
  purchase_account_id?: string;
  purchase_account_name?: string;
  
  // Attributes (variants)
  attribute_id1?: number | string;
  attribute_name1?: number | string;
  attribute_option_id1?: number | string;
  attribute_option_name1?: number | string;
  attribute_type1?: number | string;
  // ... similar for attribute 2 and 3
  
  // Other fields
  unit?: string;
  part_number?: string;
  source?: string;
  created_time?: string;
  last_modified_time?: string;
  created_at?: string;
  updated_at?: string;
  show_in_storefront?: boolean;
  is_combo_product?: boolean;
  is_linked_with_zohocrm?: boolean;
  zcrm_product_id?: string;
  
  // Tags
  tags?: string[];
}

// Vendor type (if you have vendors collection)
export interface Vendor {
  id?: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_status?: 'active' | 'inactive';
  vendor_location?: string;
  // Add more vendor fields as needed
}

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount || 0);
}

export function getStockStatus(item: ItemData): {
  status: string;
  color: string;
  isLow: boolean;
  isOut: boolean;
} {
  const stock = item.available_stock || item.stock_on_hand || 0;
  const reorderLevel = typeof item.reorder_level === 'string' 
    ? parseInt(item.reorder_level) || 0 
    : item.reorder_level || 0;
    
  if (stock <= 0) {
    return { status: 'Out of Stock', color: 'danger', isLow: false, isOut: true };
  }
  if (stock <= reorderLevel) {
    return { status: 'Low Stock', color: 'warning', isLow: true, isOut: false };
  }
  return { status: 'In Stock', color: 'success', isLow: false, isOut: false };
}
