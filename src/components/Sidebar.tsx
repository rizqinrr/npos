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
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleAlert,
  Store,
  WifiOff,
  X
} from 'lucide-react'
import type { CashierShift, StoreSetting } from '@/db/types'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  activeShift: CashierShift | null
  store: StoreSetting | null
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  cartItemCount?: number
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeShift,
  store,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  cartItemCount = 0
}) => {
  const menuItems = [
    {
      id: 'cashier',
      label: 'Kasir POS',
      sublabel: 'Penjualan & Kasir',
      icon: ShoppingBag,
      badge: cartItemCount > 0 ? cartItemCount : null
    },
    {
      id: 'shift',
      label: 'Shift Kasir',
      sublabel: 'Buka / Tutup & Kas',
      icon: Clock,
      alert: !activeShift
    },
    {
      id: 'products',
      label: 'Produk & Stok',
      sublabel: 'Katalog & Audit HPP',
      icon: Package
    },
    {
      id: 'purchases',
      label: 'Pemasok & PO',
      sublabel: 'Pembelian & Terima Barang',
      icon: Truck
    },
    {
      id: 'opname',
      label: 'Stock Opname',
      sublabel: 'Audit Selisih Fisik',
      icon: ClipboardCheck
    },
    {
      id: 'history',
      label: 'Riwayat & Retur',
      sublabel: 'Nota & Pengembalian',
      icon: Receipt
    },
    {
      id: 'expenses',
      label: 'Biaya & Laba Rugi',
      sublabel: 'Operasional & P&L',
      icon: TrendingDown
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      sublabel: 'Printer, QRIS & Backup',
      icon: Settings
    }
  ]

  const handleSelectTab = (id: string) => {
    setActiveTab(id)
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 transition-all duration-200 ease-in-out border-r border-slate-800 shadow-2xl lg:shadow-none ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand & Store Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800/80 justify-between shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-lg tracking-tight text-white">nPOS</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-1.5 py-0.5 rounded-sm border border-teal-500/30">
                    v2.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
                  {store?.storeName || 'Toko nPOS'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Shift Status Widget */}
        <div className="p-3 border-b border-slate-800/60 shrink-0">
          {isCollapsed ? (
            <button
              onClick={() => handleSelectTab('shift')}
              className={`w-full py-2.5 flex items-center justify-center rounded-xl transition-all min-h-[44px] ${
                activeShift
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40'
                  : 'bg-rose-950/50 text-rose-400 border border-rose-500/30 hover:bg-rose-900/40'
              }`}
              title={
                activeShift
                  ? `Shift Aktif: ${activeShift.cashierName}`
                  : 'Shift Kasir Ditutup (Klik untuk Buka)'
              }
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  activeShift ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </button>
          ) : (
            <button
              onClick={() => handleSelectTab('shift')}
              className={`w-full p-2.5 rounded-xl border text-left transition-all group flex items-start space-x-2.5 min-h-[44px] ${
                activeShift
                  ? 'bg-emerald-950/30 border-emerald-600/30 hover:bg-emerald-950/50'
                  : 'bg-rose-950/30 border-rose-600/30 hover:bg-rose-950/50'
              }`}
            >
              {activeShift ? (
                <>
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                    <CircleCheck className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Shift Aktif
                      </span>
                      <span className="text-[10px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-mono">
                        OPEN
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {activeShift.cashierName}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5 shrink-0">
                    <CircleAlert className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                        Shift Tutup
                      </span>
                      <span className="text-[10px] text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded-md font-bold">
                        Buka
                      </span>
                    </div>
                    <p className="text-xs text-rose-300 font-medium">Buka shift untuk transaksi</p>
                  </div>
                </>
              )}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl font-medium transition-all group relative min-h-[44px] ${
                  isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3'
                } ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <Icon
                  className={`shrink-0 ${
                    isCollapsed ? 'w-5 h-5' : 'w-5 h-5'
                  } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                />

                {!isCollapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="text-sm font-semibold leading-tight truncate">
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] leading-tight truncate ${
                        isActive ? 'text-teal-100' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                )}

                {/* Badge if any */}
                {item.badge && (
                  <span
                    className={`text-[10px] font-black rounded-full px-1.5 py-0.5 shrink-0 ${
                      isActive
                        ? 'bg-white text-teal-800'
                        : 'bg-teal-600 text-white'
                    } ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Alert dot if shift closed */}
                {item.alert && (
                  <span
                    className={`w-2 h-2 rounded-full bg-rose-500 shrink-0 ${
                      isCollapsed ? 'absolute top-2 right-2' : ''
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium text-slate-400">Mode Offline (IndexedDB)</span>
              </div>
              <div className="text-[10px] text-slate-400">
                nPOS v2.0 &bull; POS Retail & F&B
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="Mode Offline">
              <Store className="w-5 h-5 text-slate-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
