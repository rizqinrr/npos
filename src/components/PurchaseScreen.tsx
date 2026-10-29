import React, { useState, useEffect } from 'react'
import {
  Truck,
  Plus,
  PackageCheck,
  CheckCircle,
  Building2,
  X
} from 'lucide-react'
import type { Supplier, Purchase, Product } from '@/db/types'
import { db } from '@/db/database'
import { formatRupiah, formatDateTime } from '@/core/utils/currency'

interface PurchaseScreenProps {
  products: Product[]
  onStockUpdated: () => void
}

export const PurchaseScreen: React.FC<PurchaseScreenProps> = ({
  products,
  onStockUpdated
}) => {
  const [subTab, setSubTab] = useState<'PURCHASES' | 'SUPPLIERS'>('PURCHASES')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])

  // Modals
  const [showAddSupplierModal, setShowAddSupplierModal] = useState<boolean>(false)
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState<boolean>(false)
  const [receivePurchaseTarget, setReceivePurchaseTarget] = useState<Purchase | null>(null)

  // Supplier form
  const [suppName, setSuppName] = useState<string>('')
  const [suppPhone, setSuppPhone] = useState<string>('')
  const [suppAddress, setSuppAddress] = useState<string>('')

  // Purchase Order form
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0)
  const [orderItems, setOrderItems] = useState<{ productId: number; qty: number; unitCost: number }[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const allSupps = await db.suppliers.orderBy('createdAt').reverse().toArray()
    setSuppliers(allSupps)

    const allPurchases = await db.purchases.orderBy('orderDate').reverse().toArray()
    setPurchases(allPurchases)
  }

  const handleSaveSupplier = async () => {
    if (!suppName.trim()) return
    await db.suppliers.add({
      name: suppName.trim(),
      phone: suppPhone.trim() || undefined,
      address: suppAddress.trim() || undefined,
      createdAt: Date.now()
    })
    setSuppName('')
    setSuppPhone('')
    setSuppAddress('')
    setShowAddSupplierModal(false)
    loadData()
  }

  const handleAddOrderItem = () => {
    if (products.length === 0) return
    const first = products[0]
    setOrderItems([...orderItems, { productId: first.id || 0, qty: 10, unitCost: first.costPrice || 0 }])
  }

  const handleCreatePurchase = async () => {
    if (selectedSupplierId === 0 || orderItems.length === 0) {
      alert('Pilih pemasok dan minimal 1 produk pesanan!')
      return
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId)
    const now = Date.now()
    const purchaseNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
    const totalAmount = orderItems.reduce((acc, i) => acc + (i.qty * i.unitCost), 0)

    const purchaseId = await db.purchases.add({
      purchaseNumber,
      supplierId: selectedSupplierId,
      supplierName: supplier?.name || 'Supplier',
      orderDate: now,
      status: 'ORDERED',
      totalAmount,
      paidAmount: totalAmount,
      paymentStatus: 'PAID'
    })

    for (const item of orderItems) {
      const prod = products.find(p => p.id === item.productId)
      await db.purchase_items.add({
        purchaseId: purchaseId as number,
        productId: item.productId,
        productName: prod?.name || 'Produk',
        quantityOrdered: item.qty,
        quantityReceived: 0,
        unitCostPrice: item.unitCost,
        lineTotal: item.qty * item.unitCost
      })
    }

    setShowNewPurchaseModal(false)
    setOrderItems([])
    loadData()
  }

  // Receive goods (Penerimaan Barang yang menambah stok fisik!)
  const handleConfirmReceive = async () => {
    if (!receivePurchaseTarget?.id) return

    const purchaseItems = await db.purchase_items
      .where('purchaseId')
      .equals(receivePurchaseTarget.id)
      .toArray()

    const now = Date.now()
    const receiptNumber = `GR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

    const grId = await db.goods_receipts.add({
      purchaseId: receivePurchaseTarget.id,
      receiptNumber,
      receivedAt: now,
      receivedBy: 'Gudang / Kasir',
      notes: `Penerimaan penuh dari PO ${receivePurchaseTarget.purchaseNumber}`
    })

    // Increment each product's stock & record stock movement
    for (const pi of purchaseItems) {
      await db.goods_receipt_items.add({
        goodsReceiptId: grId as number,
        purchaseItemId: pi.id as number,
        productId: pi.productId,
        quantityReceived: pi.quantityOrdered
      })

      const prod = await db.products.get(pi.productId)
      if (prod) {
        const newStock = prod.stock + pi.quantityOrdered
        await db.products.update(pi.productId, {
          stock: newStock,
          costPrice: pi.unitCostPrice // update HPP modal
        })

        await db.stock_movements.add({
          productId: pi.productId,
          timestamp: now,
          movementType: 'PURCHASE_RECEIPT',
          quantityDelta: pi.quantityOrdered,
          stockBefore: prod.stock,
          stockAfter: newStock,
          unitCostPrice: pi.unitCostPrice,
          referenceType: 'GOODS_RECEIPT',
          referenceId: grId as number,
          notes: `Penerimaan Barang ${receiptNumber}`,
          operatorName: 'Kasir'
        })
      }
    }

    // Update Purchase status to RECEIVED
    await db.purchases.update(receivePurchaseTarget.id, {
      status: 'RECEIVED'
    })

    setReceivePurchaseTarget(null)
    loadData()
    onStockUpdated()
    alert('Barang berhasil diterima! Stok fisik produk telah bertambah otomatis.')
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-slate-100 overflow-y-auto space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Pemasok & Pembelian Stok</h2>
          <p className="text-xs text-slate-500">
            Kelola data vendor supplier, faktur pembelian stok (*Purchase Order*), dan penerimaan barang gudang.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {subTab === 'SUPPLIERS' ? (
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Supplier</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (suppliers.length === 0) {
                  alert('Harap daftarkan minimal 1 pemasok terlebih dahulu!')
                  setSubTab('SUPPLIERS')
                  return
                }
                setSelectedSupplierId(suppliers[0].id || 0)
                setOrderItems([])
                handleAddOrderItem()
                setShowNewPurchaseModal(true)
              }}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pesanan Beli (PO)</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setSubTab('PURCHASES')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
            subTab === 'PURCHASES'
              ? 'border-teal-700 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Faktur Pembelian Stok ({purchases.length})</span>
        </button>
        <button
          onClick={() => setSubTab('SUPPLIERS')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
            subTab === 'SUPPLIERS'
              ? 'border-teal-700 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Daftar Pemasok ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASES */}
      {subTab === 'PURCHASES' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. PO</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pemasok / Supplier</th>
                  <th className="py-3 px-4">Total Biaya Beli</th>
                  <th className="py-3 px-4">Status Pesanan</th>
                  <th className="py-3 px-4 text-center">Aksi Penerimaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      Belum ada transaksi pembelian stok tercatat.
                    </td>
                  </tr>
                ) : (
                  purchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-800">{p.purchaseNumber}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDateTime(p.orderDate)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.supplierName}</td>
                      <td className="py-3 px-4 font-bold text-teal-800">
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            p.status === 'RECEIVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === 'RECEIVED' ? 'DITERIMA' : 'MENUNGGU PENGIRIMAN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.status === 'ORDERED' ? (
                          <button
                            onClick={() => setReceivePurchaseTarget(p)}
                            className="py-1.5 px-3 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-lg font-bold text-xs border border-teal-200 flex items-center justify-center space-x-1 mx-auto"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Terima Barang</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic flex items-center justify-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Stok Ditambahkan</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS */}
      {subTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.length === 0 ? (
            <div className="col-span-3 py-10 text-center text-slate-400 bg-white rounded-2xl border">
              Belum ada data pemasok. Ketuk tombol Tambah Supplier untuk mendaftarkan vendor baru.
            </div>
          ) : (
            suppliers.map(s => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                </div>
                <div className="text-xs text-slate-500 space-y-1 pt-1">
                  <p>
                    <span className="font-semibold text-slate-700">Telepon:</span> {s.phone || '-'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Alamat:</span>{' '}
                    {s.address || '-'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: ADD SUPPLIER */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800">Daftarkan Pemasok Baru</h3>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Nama Toko / Distributor:
              </label>
              <input
                type="text"
                value={suppName}
                onChange={e => setSuppName(e.target.value)}
                placeholder="Contoh: PT. Sumber Berkah Mandiri"
                className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Nomor Telepon / Sales:
              </label>
              <input
                type="text"
                value={suppPhone}
                onChange={e => setSuppPhone(e.target.value)}
                placeholder="Contoh: 0812-9988-7766"
                className="w-full px-3 py-2 border rounded-xl text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Alamat Gudang:</label>
              <textarea
                value={suppAddress}
                onChange={e => setSuppAddress(e.target.value)}
                placeholder="Contoh: Jl. Industri No. 12, Majalengka"
                className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800 h-16"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSupplier}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW PURCHASE ORDER */}
      {showNewPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-800">Buat Faktur Pembelian Stok (PO)</h3>
              <button
                onClick={() => setShowNewPurchaseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Pilih Pemasok:
              </label>
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 text-xs bg-white"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.phone || 'No Phone'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Daftar Barang Dipesan:</label>
                <button
                  onClick={handleAddOrderItem}
                  className="text-xs text-teal-700 font-bold hover:underline"
                >
                  + Tambah Baris
                </button>
              </div>

              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2"
                  >
                    <select
                      value={item.productId}
                      onChange={e => {
                        const pid = Number(e.target.value)
                        const prod = products.find(p => p.id === pid)
                        const copy = [...orderItems]
                        copy[idx] = {
                          ...copy[idx],
                          productId: pid,
                          unitCost: prod?.costPrice || 0
                        }
                        setOrderItems(copy)
                      }}
                      className="flex-1 px-2 py-1.5 border rounded-lg text-xs font-bold bg-white"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty || ''}
                        onChange={e => {
                          const copy = [...orderItems]
                          copy[idx].qty = Number(e.target.value) || 0
                          setOrderItems(copy)
                        }}
                        className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold text-center"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        placeholder="Harga Beli"
                        value={item.unitCost || ''}
                        onChange={e => {
                          const copy = [...orderItems]
                          copy[idx].unitCost = Number(e.target.value) || 0
                          setOrderItems(copy)
                        }}
                        className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold text-right"
                      />
                    </div>

                    <button
                      onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-sm font-bold">
              <span>Total Estimasi PO:</span>
              <span className="text-teal-800 text-base">
                {formatRupiah(orderItems.reduce((acc, i) => acc + i.qty * i.unitCost, 0))}
              </span>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowNewPurchaseModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePurchase}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20"
              >
                Terbitkan Faktur PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM RECEIVE GOODS */}
      {receivePurchaseTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800">Konfirmasi Penerimaan Barang</h3>
            <p className="text-xs text-slate-600">
              Apakah seluruh barang fisik untuk nomor pesanan{' '}
              <span className="font-bold text-slate-900">
                {receivePurchaseTarget.purchaseNumber}
              </span>{' '}
              telah tiba di toko?
            </p>
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
              Stok produk terkait akan otomatis bertambah di katalog dan tercatat pada jurnal audit mutasi stok.
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setReceivePurchaseTarget(null)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReceive}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20"
              >
                Ya, Terima Barang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
