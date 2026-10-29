import { useState, useEffect } from 'react'
import { db } from '@/db/database'
import { seedInitialDataIfNeeded } from '@/db/seed'
import type {
  Product,
  Category,
  StoreSetting,
  CashierShift,
  Transaction,
  TransactionItem
} from '@/db/types'
import { useCart } from '@/core/cart/useCart'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { CashierScreen } from '@/components/CashierScreen'
import { ShiftScreen } from '@/components/ShiftScreen'
import { ProductScreen } from '@/components/ProductScreen'
import { PurchaseScreen } from '@/components/PurchaseScreen'
import { OpnameScreen } from '@/components/OpnameScreen'
import { HistoryScreen } from '@/components/HistoryScreen'
import { ExpenseScreen } from '@/components/ExpenseScreen'
import { SettingsScreen } from '@/components/SettingsScreen'
import { PaymentModal } from '@/components/PaymentModal'
import { ReceiptModal } from '@/components/ReceiptModal'
import { Menu, CircleCheck, CircleAlert, Clock as ClockIcon } from 'lucide-react'

export function App() {
  const [activeTab, setActiveTab] = useState<string>('cashier')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [store, setStore] = useState<StoreSetting | null>(null)
  const [activeShift, setActiveShift] = useState<CashierShift | null>(null)

  // Sidebar responsiveness
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false)

  // Payment & Receipt modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false)
  const [recentTransaction, setRecentTransaction] = useState<Transaction | null>(null)
  const [recentItems, setRecentItems] = useState<TransactionItem[]>([])

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('')

  const cart = useCart()

  // Initial load & seed
  useEffect(() => {
    async function init() {
      await seedInitialDataIfNeeded()
      await refreshData()
    }
    init()

    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const refreshData = async () => {
    const allProds = await db.products.toArray()
    setProducts(allProds)

    const allCats = await db.categories.toArray()
    setCategories(allCats)

    const st = await db.store_settings.get(1)
    setStore(st || null)

    const shift = await db.cashier_shifts.where('status').equals('OPEN').first()
    setActiveShift(shift || null)
  }

  const handlePaymentSuccess = async (transactionId: number) => {
    const tx = await db.transactions.get(transactionId)
    const items = await db.transaction_items
      .where('transactionId')
      .equals(transactionId)
      .toArray()

    setRecentTransaction(tx || null)
    setRecentItems(items)
    setIsReceiptOpen(true)
    cart.clearCart()
    refreshData()
  }

  const handleReprint = (tx: Transaction, items: TransactionItem[]) => {
    setRecentTransaction(tx)
    setRecentItems(items)
    setIsReceiptOpen(true)
  }

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    cashier: { title: 'Kasir POS', subtitle: 'Katalog penjualan & keranjang kasir' },
    shift: { title: 'Shift Kasir', subtitle: 'Buka / tutup shift & mutasi laci' },
    products: { title: 'Produk & Stok', subtitle: 'Katalog master & histori kartu stok' },
    purchases: { title: 'Pemasok & Pembelian', subtitle: 'Purchase order & penerimaan barang' },
    opname: { title: 'Stock Opname', subtitle: 'Audit fisik & rekonsiliasi selisih' },
    history: { title: 'Riwayat Transaksi', subtitle: 'Cetak ulang nota & retur barang' },
    expenses: { title: 'Biaya & Laba Rugi', subtitle: 'Pengeluaran toko & laporan P&L' },
    settings: { title: 'Pengaturan', subtitle: 'Printer thermal, QRIS & backup' }
  }

  const currentTabInfo = tabTitles[activeTab] || { title: 'nPOS', subtitle: 'Aplikasi Kasir' }
  const totalCartCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="h-screen w-screen flex bg-slate-100 text-slate-900 select-none overflow-hidden font-sans">
      {/* Left Sidebar (Desktop persistent, Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeShift={activeShift}
        store={store}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        cartItemCount={totalCartCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Hamburger button for mobile/tablet */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                {currentTabInfo.title}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Digital Clock */}
            <div className="hidden md:flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime}</span>
            </div>

            {/* Shift Quick Status Button */}
            <button
              onClick={() => setActiveTab('shift')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                activeShift
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              {activeShift ? (
                <>
                  <CircleCheck className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">{activeShift.cashierName}</span>
                  <span className="text-[10px] bg-emerald-200/60 px-1.5 py-0.5 rounded-md font-extrabold">
                    AKTIF
                  </span>
                </>
              ) : (
                <>
                  <CircleAlert className="w-4 h-4 text-rose-600" />
                  <span>Buka Shift</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Content Views */}
        <main className="flex-1 overflow-hidden relative flex flex-col pb-15 lg:pb-0">
          {activeTab === 'cashier' && (
            <CashierScreen
              products={products}
              categories={categories}
              cart={cart}
              store={store}
              activeShift={activeShift}
              onOpenPaymentModal={() => setIsPaymentOpen(true)}
              onOpenShiftModal={() => setActiveTab('shift')}
            />
          )}

          {activeTab === 'shift' && (
            <ShiftScreen
              activeShift={activeShift}
              onShiftUpdated={refreshData}
            />
          )}

          {activeTab === 'products' && (
            <ProductScreen
              products={products}
              categories={categories}
              onProductsUpdated={refreshData}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchaseScreen
              products={products}
              onStockUpdated={refreshData}
            />
          )}

          {activeTab === 'opname' && (
            <OpnameScreen
              products={products}
              onStockUpdated={refreshData}
            />
          )}

          {activeTab === 'history' && (
            <HistoryScreen
              store={store}
              onReprintReceipt={handleReprint}
              onStockUpdated={refreshData}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseScreen
              activeShift={activeShift}
              onExpenseAdded={refreshData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              store={store}
              onStoreUpdated={refreshData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeShift={activeShift}
        cartItemCount={totalCartCount}
        onOpenMoreMenu={() => setIsMobileSidebarOpen(true)}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        items={cart.items}
        subtotal={cart.subtotal}
        totalDiscount={cart.totalDiscount}
        totalAmount={cart.totalAmount}
        totalQuantity={cart.totalQuantity}
        store={store}
        activeShift={activeShift}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        store={store}
        transaction={recentTransaction}
        items={recentItems}
      />
    </div>
  )
}

export default App
