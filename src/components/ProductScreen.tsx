import React, { useState } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  History
} from 'lucide-react'
import type { Product, Category, StockMovement } from '@/db/types'
import { db } from '@/db/database'
import { formatRupiah, formatDateTime } from '@/core/utils/currency'

interface ProductScreenProps {
  products: Product[]
  categories: Category[]
  onProductsUpdated: () => void
}

export const ProductScreen: React.FC<ProductScreenProps> = ({
  products,
  categories,
  onProductsUpdated
}) => {
  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [filterLowStock, setFilterLowStock] = useState<boolean>(false)

  // Modals
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [isNewProduct, setIsNewProduct] = useState<boolean>(false)
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false)
  const [viewHistoryProduct, setViewHistoryProduct] = useState<Product | null>(null)
  const [productMovements, setProductMovements] = useState<StockMovement[]>([])

  // Form states
  const [formName, setFormName] = useState<string>('')
  const [formCategory, setFormCategory] = useState<string>('')
  const [formSalePrice, setFormSalePrice] = useState<number>(0)
  const [formCostPrice, setFormCostPrice] = useState<number>(0)
  const [formStock, setFormStock] = useState<number>(0)
  const [formThreshold, setFormThreshold] = useState<number>(5)
  const [formSku, setFormSku] = useState<string>('')
  const [newCategoryName, setNewCategoryName] = useState<string>('')

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    const matchLowStock = !filterLowStock || p.stock <= p.lowStockThreshold
    return matchCat && matchSearch && matchLowStock
  })

  const openAddModal = () => {
    setIsNewProduct(true)
    setFormName('')
    setFormCategory(categories[0]?.name || 'Umum')
    setFormSalePrice(0)
    setFormCostPrice(0)
    setFormStock(10)
    setFormThreshold(5)
    setFormSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`)
    setEditProduct({} as Product)
  }

  const openEditModal = (p: Product) => {
    setIsNewProduct(false)
    setEditProduct(p)
    setFormName(p.name)
    setFormCategory(p.category)
    setFormSalePrice(p.salePrice)
    setFormCostPrice(p.costPrice || 0)
    setFormStock(p.stock)
    setFormThreshold(p.lowStockThreshold)
    setFormSku(p.sku || '')
  }

  const handleSaveProduct = async () => {
    if (!formName.trim() || formSalePrice <= 0) {
      alert('Nama produk dan harga jual wajib diisi!')
      return
    }

    const now = Date.now()
    if (isNewProduct) {
      const newId = await db.products.add({
        name: formName,
        category: formCategory,
        salePrice: formSalePrice,
        costPrice: formCostPrice,
        stock: formStock,
        lowStockThreshold: formThreshold,
        sku: formSku || undefined,
        skuNormalized: formSku ? formSku.toLowerCase() : undefined,
        createdAt: now
      })

      // Add initial stock movement
      if (formStock > 0) {
        await db.stock_movements.add({
          productId: newId as number,
          timestamp: now,
          movementType: 'MANUAL_ADJUSTMENT',
          quantityDelta: formStock,
          stockBefore: 0,
          stockAfter: formStock,
          unitCostPrice: formCostPrice,
          notes: 'Stok Awal Produk Baru',
          operatorName: 'Admin'
        })
      }
    } else if (editProduct?.id) {
      const stockDiff = formStock - editProduct.stock
      await db.products.update(editProduct.id, {
        name: formName,
        category: formCategory,
        salePrice: formSalePrice,
        costPrice: formCostPrice,
        stock: formStock,
        lowStockThreshold: formThreshold,
        sku: formSku || undefined,
        skuNormalized: formSku ? formSku.toLowerCase() : undefined
      })

      // If stock was modified manually
      if (stockDiff !== 0) {
        await db.stock_movements.add({
          productId: editProduct.id,
          timestamp: now,
          movementType: 'MANUAL_ADJUSTMENT',
          quantityDelta: stockDiff,
          stockBefore: editProduct.stock,
          stockAfter: formStock,
          unitCostPrice: formCostPrice,
          notes: 'Penyesuaian Manual Edit Produk',
          operatorName: 'Admin'
        })
      }
    }

    setEditProduct(null)
    onProductsUpdated()
  }

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Yakin ingin menghapus produk ini dari katalog?')) {
      await db.products.delete(id)
      onProductsUpdated()
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    await db.categories.add({
      name: newCategoryName.trim(),
      nameNormalized: newCategoryName.trim().toLowerCase(),
      createdAt: Date.now()
    })
    setNewCategoryName('')
    setShowCategoryModal(false)
    onProductsUpdated()
  }

  const handleOpenMovements = async (p: Product) => {
    if (!p.id) return
    setViewHistoryProduct(p)
    const movs = await db.stock_movements
      .where('productId')
      .equals(p.id)
      .reverse()
      .toArray()
    setProductMovements(movs)
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-slate-100 overflow-y-auto space-y-4 sm:space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800">Manajemen Produk & Stok</h2>
          <p className="text-xs text-slate-500">
            Katalog master, barcode SKU, harga modal (HPP), dan audit pergerakan stok.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex-1 sm:flex-none py-2.5 px-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all shadow-xs min-h-[44px] flex items-center justify-center"
          >
            + Kategori
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama produk atau kode barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-700 focus:outline-hidden min-h-[44px]"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white min-h-[44px]"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center space-x-1.5 min-h-[44px] ${
              filterLowStock
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Stok Menipis</span>
          </button>
        </div>
      </div>

      {/* MOBILE VIEW (< md): Responsive Card Stack */}
      <div className="md:hidden space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
            Tidak ada produk yang cocok dengan pencarian.
          </div>
        ) : (
          filteredProducts.map(p => {
            const isOutOfStock = p.stock <= 0
            const isLowStock = p.stock <= p.lowStockThreshold && !isOutOfStock

            return (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{p.name}</h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {p.category}
                      </span>
                      {p.sku && (
                        <span className="font-mono text-slate-400">SKU: {p.sku}</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg shrink-0 ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-700'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {isOutOfStock ? 'Stok Habis' : `Stok: ${p.stock}`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Harga Jual:</span>
                    <span className="font-mono font-black text-sm text-teal-800">
                      {formatRupiah(p.salePrice)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Harga Modal (HPP):</span>
                    <span className="font-mono font-semibold text-slate-600">
                      {p.costPrice ? formatRupiah(p.costPrice) : '-'}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons (Min 44px tap area) */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenMovements(p)}
                    className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center space-x-1 min-h-[44px]"
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kartu Stok</span>
                  </button>
                  <button
                    onClick={() => openEditModal(p)}
                    className="py-2 px-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-bold text-teal-800 flex items-center justify-center space-x-1 min-h-[44px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => p.id && handleDeleteProduct(p.id)}
                    className="py-2 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-center space-x-1 min-h-[44px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* DESKTOP VIEW (>= md): Full Structured Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Barcode / SKU</th>
                <th className="py-3 px-4">Harga Modal (HPP)</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">Margin Laba</th>
                <th className="py-3 px-4">Sisa Stok</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada produk yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isOutOfStock = p.stock <= 0
                  const isLowStock = p.stock <= p.lowStockThreshold && !isOutOfStock
                  const margin = p.costPrice ? p.salePrice - p.costPrice : null
                  const marginPct = p.costPrice && p.costPrice > 0 ? Math.round(((p.salePrice - p.costPrice) / p.costPrice) * 100) : null

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{p.category}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {p.sku || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {p.costPrice ? formatRupiah(p.costPrice) : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-teal-800">
                        {formatRupiah(p.salePrice)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold font-mono text-emerald-600">
                        {margin != null ? `+${formatRupiah(margin)} (${marginPct}%)` : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {p.stock} unit
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenMovements(p)}
                            title="Riwayat Audit Stok"
                            className="p-2 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Produk"
                            className="p-2 text-slate-500 hover:text-teal-800 rounded-lg hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => p.id && handleDeleteProduct(p.id)}
                            title="Hapus Produk"
                            className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {editProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-800">
                {isNewProduct ? 'Tambah Produk Baru' : 'Edit Informasi Produk'}
              </h3>
              <button
                onClick={() => setEditProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Nama Produk:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Es Kopi Susu Aren"
                  className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Kategori:
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-slate-700 text-xs bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Barcode / SKU:
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={e => setFormSku(e.target.value)}
                    placeholder="Contoh: KOP-001"
                    className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Harga Modal / HPP (Rp):
                  </label>
                  <input
                    type="number"
                    value={formCostPrice || ''}
                    onChange={e => setFormCostPrice(Number(e.target.value) || 0)}
                    placeholder="Contoh: 10000"
                    className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Harga Jual (Rp):
                  </label>
                  <input
                    type="number"
                    value={formSalePrice || ''}
                    onChange={e => setFormSalePrice(Number(e.target.value) || 0)}
                    placeholder="Contoh: 18000"
                    className="w-full px-3 py-2 border rounded-xl font-bold text-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Stok Fisik Saat Ini:
                  </label>
                  <input
                    type="number"
                    value={formStock || ''}
                    onChange={e => setFormStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Batas Peringatan Stok Menipis:
                  </label>
                  <input
                    type="number"
                    value={formThreshold || ''}
                    onChange={e => setFormThreshold(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-3 border-t">
              <button
                onClick={() => setEditProduct(null)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20"
              >
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CATEGORY */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800">Tambah Kategori Baru</h3>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Nama Kategori:
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Contoh: Roti & Kue"
                className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                Simpan Kategori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT PERGERAKAN STOK */}
      {viewHistoryProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  Riwayat Audit Stok: {viewHistoryProduct.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Sisa Stok Sekarang: <span className="font-bold">{viewHistoryProduct.stock} unit</span>
                </p>
              </div>
              <button
                onClick={() => setViewHistoryProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productMovements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada catatan mutasi pergerakan stok untuk produk ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {productMovements.map(m => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded-md text-[10px] ${
                            m.quantityDelta > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.movementType}
                        </span>
                        <span className="text-slate-600 font-medium">{m.notes}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateTime(m.timestamp)} oleh {m.operatorName} | Sebelum: {m.stockBefore} → Sesudah: {m.stockAfter}
                      </p>
                    </div>
                    <span
                      className={`font-black text-sm ${
                        m.quantityDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
