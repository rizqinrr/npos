import Dexie, { type Table } from 'dexie'
import type {
  Product,
  Category,
  Transaction,
  TransactionItem,
  TransactionPayment,
  MerchantQrisConfig,
  PendingQrisOrder,
  CashierShift,
  DrawerMovement,
  TransactionReturn,
  TransactionReturnItem,
  StockMovement,
  StockOpname,
  StockOpnameItem,
  Supplier,
  Purchase,
  PurchaseItem,
  GoodsReceipt,
  GoodsReceiptItem,
  Expense,
  StoreSetting
} from './types'

export class NPosDatabase extends Dexie {
  products!: Table<Product, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>
  transaction_items!: Table<TransactionItem, number>
  transaction_payments!: Table<TransactionPayment, number>
  merchant_qris_configs!: Table<MerchantQrisConfig, number>
  pending_qris_orders!: Table<PendingQrisOrder, number>
  cashier_shifts!: Table<CashierShift, number>
  drawer_movements!: Table<DrawerMovement, number>
  transaction_returns!: Table<TransactionReturn, number>
  transaction_return_items!: Table<TransactionReturnItem, number>
  stock_movements!: Table<StockMovement, number>
  stock_opnames!: Table<StockOpname, number>
  stock_opname_items!: Table<StockOpnameItem, number>
  suppliers!: Table<Supplier, number>
  purchases!: Table<Purchase, number>
  purchase_items!: Table<PurchaseItem, number>
  goods_receipts!: Table<GoodsReceipt, number>
  goods_receipt_items!: Table<GoodsReceiptItem, number>
  expenses!: Table<Expense, number>
  store_settings!: Table<StoreSetting, number>

  constructor() {
    super('npos_db')
    this.version(1).stores({
      products: '++id, name, category, sku, skuNormalized, createdAt',
      categories: '++id, name, nameNormalized, createdAt',
      transactions: '++id, receiptNumber, createdAt, paymentMethod, status, shiftId',
      transaction_items: '++id, transactionId, productId, productName',
      transaction_payments: '++id, transactionId, paymentMethod, status, createdAt',
      merchant_qris_configs: 'id, merchantName, updatedAt',
      pending_qris_orders: '++id, orderId, status, createdAt',
      cashier_shifts: '++id, cashierName, openedAt, closedAt, status',
      drawer_movements: '++id, shiftId, timestamp, movementType',
      transaction_returns: '++id, originalTransactionId, returnReceiptNumber, createdAt, shiftId',
      transaction_return_items: '++id, returnId, originalItemId, productId',
      stock_movements: '++id, productId, timestamp, movementType, referenceId',
      stock_opnames: '++id, opnameNumber, startedAt, status',
      stock_opname_items: '++id, opnameId, productId',
      suppliers: '++id, name, createdAt',
      purchases: '++id, purchaseNumber, supplierId, orderDate, status, paymentStatus',
      purchase_items: '++id, purchaseId, productId',
      goods_receipts: '++id, purchaseId, receiptNumber, receivedAt',
      goods_receipt_items: '++id, goodsReceiptId, purchaseItemId, productId',
      expenses: '++id, expenseDate, category, paymentSource, shiftId, createdAt',
      store_settings: 'id'
    })
  }
}

export const db = new NPosDatabase()
