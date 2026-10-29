import React from 'react'
import { ShoppingBag, Clock, Receipt, MoreHorizontal } from 'lucide-react'
import type { CashierShift } from '@/db/types'

interface BottomNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  activeShift: CashierShift | null
  cartItemCount: number
  onOpenMoreMenu: () => void
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  activeShift,
  cartItemCount,
  onOpenMoreMenu
}) => {
  const items = [
    {
      id: 'cashier',
      label: 'Kasir',
      icon: ShoppingBag,
      badge: cartItemCount > 0 ? cartItemCount : null
    },
    {
      id: 'shift',
      label: 'Shift',
      icon: Clock,
      dot: activeShift ? 'bg-emerald-500' : 'bg-rose-500'
    },
    {
      id: 'history',
      label: 'Riwayat',
      icon: Receipt
    }
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg px-2 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-15">
        {items.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] relative transition-colors ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2 bg-teal-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {item.dot && (
                  <span
                    className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full ring-2 ring-white ${item.dot}`}
                  />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </button>
          )
        })}

        {/* More Menu Button */}
        <button
          onClick={onOpenMoreMenu}
          className="flex-1 flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 stroke-2" />
          <span className="text-[11px] mt-1 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  )
}
