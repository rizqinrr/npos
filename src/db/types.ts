export interface Product {
  id?: number
  name: string
  category: string
  salePrice: number
  costPrice?: number
  stock: number
  lowStockThreshold: number
  sku?: string
  skuNormalized?: string
  imageUri?: string
  createdAt: number
}

export interface Category {
  id?: number
  name: string
  nameNormalized: string
  createdAt: number
}

export interface Transaction {
  id?: number
  receiptNumber: string
  createdAt: number
  paymentMethod: 'CASH' | 'QRIS' | 'SPLIT'
  totalAmount: number
  tenderAmount: number
  changeAmount: number
  totalQuantity: number
  subtotal: number
  totalDiscount: number
  status: 'COMPLETED' | 'VOID' | 'RETURNED'
  shiftId?: number
}

export interface TransactionItem {
  id?: number
  transactionId: number
  productId?: number
  productName: string
  productSku?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  notes: string
  discountType?: 'PERCENT' | 'AMOUNT'
  discountValue: number
  discountPerUnit: number
  lineDiscount: number
  costPrice?: number
}

export interface TransactionPayment {
  id?: number
  transactionId: number
  paymentMethod: 'CASH' | 'QRIS'
  amountDue: number
  tenderAmount: number
  changeAmount: number
  referenceNumber?: string
  status: 'COMPLETED'
  createdAt: number
}

export interface MerchantQrisConfig {
  id: number
  rawPayload: string
  merchantName: string
  merchantCity: string
  nationalMerchantId?: string
  postalCode?: string
  mcc?: string
  updatedAt: number
}

export interface PendingQrisOrder {
  id?: number
  orderId: string
  amount: number
  qrisPayload: string
  merchantName: string
  merchantCity: string
  createdAt: number
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'
  itemsJson: string
}

export interface CashierShift {
  id?: number
  cashierName: string
  openedAt: number
  closedAt?: number
  startingCash: number
  expectedCash: number
  actualCash?: number
  cashVariance?: number
  status: 'OPEN' | 'CLOSED'
  closingNotes?: string
}

export interface DrawerMovement {
  id?: number
  shiftId: number
  timestamp: number
  movementType: 'CASH_IN' | 'CASH_OUT'
  amount: number
  reason: string
  authorizedBy?: string
}

export interface TransactionReturn {
  id?: number
  originalTransactionId: number
  returnReceiptNumber: string
  createdAt: number
  reason: string
  totalRefundAmount: number
  refundMethod: 'CASH' | 'QRIS'
  status: 'REFUND_SETTLED'
  shiftId?: number
}

export interface TransactionReturnItem {
  id?: number
  returnId: number
  originalItemId: number
  productId?: number
  productName: string
  quantity: number
  unitPrice: number
  unitDiscount: number
  refundLineTotal: number
  disposition: 'RESTOCK' | 'SCRAP'
}

export interface StockMovement {
  id?: number
  productId: number
  timestamp: number
  movementType: 'SALE' | 'RETURN_RESTOCK' | 'PURCHASE_RECEIPT' | 'OPNAME_ADJUSTMENT' | 'MANUAL_ADJUSTMENT'
  quantityDelta: number
  stockBefore: number
  stockAfter: number
  unitCostPrice?: number
  referenceType?: string
  referenceId?: number
  notes?: string
  operatorName?: string
}

export interface StockOpname {
  id?: number
  opnameNumber: string
  startedAt: number
  completedAt?: number
  status: 'IN_PROGRESS' | 'COMPLETED'
  totalItemsCounted: number
  totalDiscrepancyQty: number
  totalDiscrepancyValue: number
  conductedBy: string
  notes?: string
}

export interface StockOpnameItem {
  id?: number
  opnameId: number
  productId: number
  productName: string
  systemStockSnapshot: number
  physicalCount: number
  varianceQuantity: number
  unitCostPrice?: number
  varianceValue: number
}

export interface Supplier {
  id?: number
  name: string
  phone?: string
  address?: string
  notes?: string
  createdAt: number
}

export interface Purchase {
  id?: number
  purchaseNumber: string
  supplierId?: number
  supplierName: string
  orderDate: number
  status: 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  totalAmount: number
  paidAmount: number
  paymentStatus: 'UNPAID' | 'PAID'
  notes?: string
}

export interface PurchaseItem {
  id?: number
  purchaseId: number
  productId: number
  productName: string
  quantityOrdered: number
  quantityReceived: number
  unitCostPrice: number
  lineTotal: number
}

export interface GoodsReceipt {
  id?: number
  purchaseId: number
  receiptNumber: string
  receivedAt: number
  receivedBy: string
  notes?: string
}

export interface GoodsReceiptItem {
  id?: number
  goodsReceiptId: number
  purchaseItemId: number
  productId: number
  quantityReceived: number
}

export interface Expense {
  id?: number
  expenseDate: number
  category: string
  amount: number
  description: string
  paymentSource: 'DRAWER_CASH' | 'BANK_ACCOUNT'
  shiftId?: number
  receiptImageUri?: string
  createdAt: number
}

export interface StoreSetting {
  id: number
  storeName: string
  storeAddress: string
  storePhone: string
  receiptFooter: string
  printerType: 'WEB_BLUETOOTH' | 'USB' | 'NONE'
  printerPaperWidth: 58 | 80
  updatedAt: number
}
