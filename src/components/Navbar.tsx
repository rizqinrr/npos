import React from 'react'
import {
  ShoppingBag,
  Clock,
  Package,
  Truck,
  ClipboardCheck,
  Receipt,
  TrendingDown,
  Settings,
  CircleAlert,
  CheckCircle2
} from 'lucide-react'
import type { CashierShift, StoreSetting } from '@/db/types'

interface NavbarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  activeShift: CashierShift | null
  store: StoreSetting | null
  onOpenShiftModal: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeShift,
  store,
  onOpenShiftModal
}) => {
  const tabs = [
    { id: 'cashier', label: 'Kasir', icon: ShoppingBag },
    { id: 'shift', label: 'Shift', icon: Clock },
    { id: 'products', label: 'Produk & Stok', icon: Package },
    { id: 'purchases', label: 'Pemasok & Pembelian', icon: Truck },
    { id: 'opname', label: 'Stock Opname', icon: ClipboardCheck },
    { id: 'history', label: 'Riwayat & Retur', icon: Receipt },
    { id: 'expenses', label: 'Biaya Toko', icon: TrendingDown },
    { id: 'settings', label: 'Pengaturan', icon: Settings }
  ]

  return (
    <header className="bg-teal-700 text-white shadow-md select-none sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand & Shift Pill */}
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
            <ShoppingBag className="w-6 h-6 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight">nPOS</span>
              <span className="text-xs bg-teal-800 text-teal-200 px-2 py-0.5 rounded-full font-medium border border-teal-600/50">
                v2.0
              </span>
            </div>
            <p className="text-xs text-teal-200/90 font-medium truncate max-w-[140px] sm:max-w-xs">
              {store?.storeName || 'Toko nPOS'}
            </p>
          </div>

          {/* Shift status badge */}
          <button
            onClick={onOpenShiftModal}
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeShift
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-200 border border-rose-400/30 hover:bg-rose-500/30'
            }`}
          >
            {activeShift ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shift Aktif: {activeShift.cashierName}</span>
              </>
            ) : (
              <>
                <CircleAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Shift Tutup (Ketuk Buka)</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation Tabs (Scrollable on tablet/mobile) */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-teal-100 hover:bg-teal-600/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-teal-200'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
