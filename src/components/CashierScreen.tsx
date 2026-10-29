import React, { useState, useMemo } from 'react'
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Percent,
  ShoppingCart,
  X,
  CreditCard,
  PackageX,
  ChevronUp
} from 'lucide-react'
import type { Product, Category, StoreSetting, CashierShift } from '@/db/types'
import type { CartItem } from '@/core/cart/useCart'
import { formatRupiah } from '@/core/utils/currency'

interface CashierScreenProps {
  products: Product[]
  categories: Category[]
  cart: {
    items: CartItem[]
    addToCart: (product: Product) => void
    updateQuantity: (productId: number, qtyOrDelta: number, isAbsolute?: boolean) => void
    setItemDiscount: (productId: number, type: 'PERCENT' | 'AMOUNT', value: number) => void
    removeItem: (productId: number) => void
    clearCart: () => void
    subtotal: number
    totalDiscount: number
    totalAmount: number
    totalQuantity: number
  }
  store: StoreSetting | null
  activeShift: CashierShift | null
  onOpenPaymentModal: () => void
  onOpenShiftModal: () => void
}

export const CashierScreen: React.FC<CashierScreenProps> = ({
  products,
  categories,
  cart,
  store: _store,
  activeShift,
  onOpenPaymentModal,
  onOpenShiftModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [discountModalItem, setDiscountModalItem] = useState<CartItem | null>(null)
  const [discountType, setDiscountType] = useState<'PERCENT' | 'AMOUNT'>('PERCENT')
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false)

  // Filter products by category & search query
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCat && matchSearch
    })
  }, [products, selectedCategory, searchQuery])

  // Barcode quick enter handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const matched = products.find(
      p => p.sku && p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
    )
    if (matched) {
      cart.addToCart(matched)
      setSearchQuery('')
    }
  }

  const handleApplyDiscount = () => {
    if (discountModalItem) {
      cart.setItemDiscount(discountModalItem.productId, discountType, discountValue)
      setDiscountModalItem(null)
    }
  }

  // Cart Content Component (Reused in desktop sidebar and mobile bottom sheet)
  const renderCartItems = () => (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100">
      {cart.items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
          <ShoppingCart className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
          <p className="font-bold text-sm text-slate-600">Keranjang Masih Kosong</p>
          <p className="text-xs text-slate-400 max-w-[220px] text-center mt-1">
            Pilih produk dari katalog untuk memulai transaksi belanja kasir.
          </p>
        </div>
      ) : (
        cart.items.map(item => (
          <div key={item.productId} className="py-3 first:pt-0 last:pb-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                  {item.productName}
                </h4>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono mt-0.5">
                  <span>{formatRupiah(item.unitPrice)}</span>
                  {item.lineDiscount > 0 && (
                    <span className="text-rose-600 font-bold bg-rose-50 px-1 py-0.2 rounded-sm">
                      Disc: -{formatRupiah(item.lineDiscount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={() => cart.removeItem(item.productId)}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Hapus Barang"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Quantity Controller & Subtotal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => cart.updateQuantity(item.productId, -1)}
                  className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                  title="Kurang Satu"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-9 text-center text-xs font-black font-mono text-slate-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() => cart.updateQuantity(item.productId, 1)}
                  className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                  title="Tambah Satu"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {/* Discount button */}
                <button
                  onClick={() => {
                    setDiscountModalItem(item)
                    setDiscountType(item.discountType || 'PERCENT')
                    setDiscountValue(item.discountValue || 0)
                  }}
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-all min-h-[36px] flex items-center space-x-1 ${
                    item.lineDiscount > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Beri Diskon Item"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Diskon</span>
                </button>

                {/* Line Total */}
                <span className="font-black text-sm font-mono text-slate-900 min-w-[70px] text-right">
                  {formatRupiah(item.lineTotal)}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderCartSummary = () => (
    <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-600 font-medium">
          <span>Subtotal ({cart.totalQuantity} barang):</span>
          <span className="font-mono">{formatRupiah(cart.subtotal)}</span>
        </div>
        {cart.totalDiscount > 0 && (
          <div className="flex justify-between text-rose-600 font-bold">
            <span>Potongan Diskon:</span>
            <span className="font-mono">-{formatRupiah(cart.totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
          <span>Total Tagihan:</span>
          <span className="text-teal-800 font-mono text-lg">{formatRupiah(cart.totalAmount)}</span>
        </div>
      </div>

      {/* Pay Button */}
      {activeShift ? (
        <button
          disabled={cart.items.length === 0}
          onClick={() => {
            setIsMobileCartOpen(false)
            onOpenPaymentModal()
          }}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center space-x-2 transition-all min-h-[48px] ${
            cart.items.length > 0
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Bayar Transaksi ({formatRupiah(cart.totalAmount)})</span>
        </button>
      ) : (
        <button
          onClick={onOpenShiftModal}
          className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-600/20 min-h-[48px]"
        >
          <span>Shift Belum Dibuka &bull; Ketuk untuk Buka Shift</span>
        </button>
      )}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100 relative">
      {/* LEFT: Catalog & Products */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden border-r border-slate-200">
        {/* Top Controls: Search Bar & Barcode input */}
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2.5">
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk atau scan barcode / SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:outline-hidden min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            title="Scan Barcode via Kamera"
            className="p-2.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl hover:bg-teal-100 transition-all flex items-center space-x-1.5 min-h-[44px] min-w-[44px] justify-center shrink-0"
          >
            <Barcode className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-bold">Scan</span>
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-2 scrollbar-none shrink-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] ${
              selectedCategory === 'ALL'
                ? 'bg-teal-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] ${
                selectedCategory === cat.name
                  ? 'bg-teal-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-2">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <PackageX className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-600">Produk Tidak Ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba cari dengan kata kunci lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
              {filteredProducts.map(p => {
                const isOutOfStock = p.stock <= 0
                const isLowStock = p.stock > 0 && p.stock <= p.lowStockThreshold

                return (
                  <button
                    key={p.id}
                    disabled={isOutOfStock}
                    onClick={() => cart.addToCart(p)}
                    className={`relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all bg-white group min-h-[110px] ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                        : 'border-slate-200 hover:border-teal-600 hover:shadow-sm active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 font-mono truncate">
                          {p.sku || p.category}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-md font-bold">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md font-bold">
                            Sisa {p.stock}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-mono">
                            {p.stock}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-tight group-hover:text-teal-800">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-black text-sm font-mono text-teal-800">
                        {formatRupiah(p.salePrice)}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP RIGHT: Persistent Cart Sidebar */}
      <div className="hidden lg:flex flex-col w-96 border-l border-slate-200 bg-white h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-teal-800" />
            <h3 className="font-black text-sm text-slate-800">Keranjang Kasir</h3>
            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
              {cart.totalQuantity}
            </span>
          </div>
          {cart.items.length > 0 && (
            <button
              onClick={cart.clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline"
            >
              Kosongkan
            </button>
          )}
        </div>

        {renderCartItems()}
        {renderCartSummary()}
      </div>

      {/* MOBILE FLOATING BAR (< lg): Shows when cart has items */}
      {cart.items.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center relative">
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 bg-white text-slate-900 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                  {cart.totalQuantity}
                </span>
              </div>
              <div className="text-left">
                <span className="text-[11px] text-slate-400 block font-medium">Total Tagihan</span>
                <span className="font-black text-base font-mono text-emerald-400">
                  {formatRupiah(cart.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-teal-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs">
              <span>Buka Keranjang</span>
              <ChevronUp className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET MODAL (< lg) */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileCartOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Bottom Drawer */}
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden">
            {/* Drawer Header Handle */}
            <div className="pt-3 pb-2 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-teal-800" />
                <h3 className="font-black text-base text-slate-800">
                  Keranjang ({cart.totalQuantity} Item)
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                {cart.items.length > 0 && (
                  <button
                    onClick={cart.clearCart}
                    className="text-xs text-rose-600 font-bold px-2 py-1 rounded-lg hover:bg-rose-50"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Items in Bottom Sheet */}
            {renderCartItems()}

            {/* Checkout bar inside bottom sheet */}
            {renderCartSummary()}
          </div>
        </div>
      )}

      {/* Item Discount Modal */}
      {discountModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-800">
                Diskon: {discountModalItem.productName}
              </h4>
              <button
                onClick={() => setDiscountModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setDiscountType('PERCENT')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                  discountType === 'PERCENT'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Persen (%)
              </button>
              <button
                onClick={() => setDiscountType('AMOUNT')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                  discountType === 'AMOUNT'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Nominal (Rp)
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">
                Besar Diskon:
              </label>
              <input
                type="number"
                value={discountValue || ''}
                onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                placeholder={discountType === 'PERCENT' ? 'Contoh: 10' : 'Contoh: 2000'}
                className="w-full px-3 py-2.5 border rounded-xl font-bold font-mono text-slate-800 min-h-[44px] text-sm"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDiscountModalItem(null)}
                className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-slate-600 min-h-[44px]"
              >
                Batal
              </button>
              <button
                onClick={handleApplyDiscount}
                className="flex-1 py-2.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 min-h-[44px]"
              >
                Terapkan Diskon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
