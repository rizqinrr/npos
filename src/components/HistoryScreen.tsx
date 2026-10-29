import React, { useState, useEffect } from 'react'
import {
  Receipt,
  Search,
  RotateCcw,
  Printer,
  Calendar,
  X,
  ArrowLeft
} from 'lucide-react'
import type { Transaction, TransactionItem, StoreSetting } from '@/db/types'
import { db } from '@/db/database'
import { formatRupiah, formatDateTime } from '@/core/utils/currency'

interface HistoryScreenProps {
  store: StoreSetting | null
  onReprintReceipt: (transaction: Transaction, items: TransactionItem[]) => void
  onStockUpdated: () => void
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  store: _store,
  onReprintReceipt,
  onStockUpdated
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [search, setSearch] = useState<string>('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([])
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false)

  // Return modal
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false)
  const [returnReason, setReturnReason] = useState<string>('Pelanggan komplain / tukar barang')
  const [returnItemsState, setReturnItemsState] = useState<
    { item: TransactionItem; returnQty: number; disposition: 'RESTOCK' | 'SCRAP' }[]
  >([])

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    const list = await db.transactions.orderBy('createdAt').reverse().toArray()
    setTransactions(list)
  }

  const handleSelectTransaction = async (tx: Transaction) => {
    setSelectedTx(tx)
    setShowMobileDetail(true)
    if (tx.id) {
      const items = await db.transaction_items.where('transactionId').equals(tx.id).toArray()
      setSelectedItems(items)
    }
  }

  const openReturnModal = () => {
    setReturnItemsState(
      selectedItems.map(item => ({
        item,
        returnQty: 0,
        disposition: 'RESTOCK'
      }))
    )
    setShowReturnModal(true)
  }

  const handleConfirmReturn = async () => {
    if (!selectedTx?.id) return

    const itemsToReturn = returnItemsState.filter(i => i.returnQty > 0)
    if (itemsToReturn.length === 0) {
      alert('Tentukan jumlah item yang diretur!')
      return
    }

    const now = Date.now()
    const returnReceiptNumber = `RET-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

    // Proportional refund calculation based on effective unit price
    let totalRefund = 0
    itemsToReturn.forEach(r => {
      const effectivePrice = Math.round(r.item.lineTotal / r.item.quantity)
      totalRefund += effectivePrice * r.returnQty
    })

    const returnId = await db.transaction_returns.add({
      originalTransactionId: selectedTx.id,
      returnReceiptNumber,
      createdAt: now,
      reason: returnReason,
      totalRefundAmount: totalRefund,
      refundMethod: selectedTx.paymentMethod === 'QRIS' ? 'QRIS' : 'CASH',
      status: 'REFUND_SETTLED',
      shiftId: selectedTx.shiftId
    })

    for (const r of itemsToReturn) {
      const effectivePrice = Math.round(r.item.lineTotal / r.item.quantity)
      const refundLine = effectivePrice * r.returnQty

      await db.transaction_return_items.add({
        returnId: returnId as number,
        originalItemId: r.item.id || 0,
        productId: r.item.productId,
        productName: r.item.productName,
        quantity: r.returnQty,
        unitPrice: r.item.unitPrice,
        unitDiscount: r.item.discountPerUnit,
        refundLineTotal: refundLine,
        disposition: r.disposition
      })

      // If Restock, return items to physical stock & create stock movement
      if (r.disposition === 'RESTOCK' && r.item.productId) {
        const prod = await db.products.get(r.item.productId)
        if (prod) {
          const newStock = prod.stock + r.returnQty
          await db.products.update(r.item.productId, { stock: newStock })

          await db.stock_movements.add({
            productId: r.item.productId,
            timestamp: now,
            movementType: 'RETURN_RESTOCK',
            quantityDelta: r.returnQty,
            stockBefore: prod.stock,
            stockAfter: newStock,
            unitCostPrice: prod.costPrice,
            referenceType: 'TRANSACTION_RETURN',
            referenceId: returnId as number,
            notes: `Retur Penjualan ${returnReceiptNumber}`,
            operatorName: 'Kasir'
          })
        }
      }
    }

    // Update original transaction status if all items returned
    await db.transactions.update(selectedTx.id, {
      status: 'RETURNED'
    })

    setShowReturnModal(false)
    loadTransactions()
    onStockUpdated()
    alert(`Retur berhasil diproses! Total pengembalian dana: ${formatRupiah(totalRefund)}`)
  }

  const filtered = transactions.filter(t => {
    return !search || t.receiptNumber.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-100">
      {/* LEFT: Transactions List */}
      <div
        className={`w-full md:w-1/2 flex flex-col border-r border-slate-200 overflow-hidden p-3 sm:p-4 ${
          showMobileDetail ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-slate-800">Riwayat Penjualan</h2>
            <p className="text-xs text-slate-500">Daftar transaksi nota kasir selesai.</p>
          </div>
          <span className="text-xs font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-full border border-teal-200">
            {transactions.length} Nota
          </span>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor nota struk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-700 min-h-[44px]"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">Belum ada transaksi</p>
          ) : (
            filtered.map(t => {
              const isSelected = selectedTx?.id === t.id
              const isReturned = t.status === 'RETURNED'

              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTransaction(t)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all min-h-[64px] ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{t.receiptNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isReturned
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {isReturned ? 'DIRETUR' : t.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateTime(t.createdAt)}</span>
                    </span>
                    <span className="font-extrabold font-mono text-teal-800">
                      {formatRupiah(t.totalAmount)}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT: Transaction Detail & Return Action */}
      <div
        className={`flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto bg-white ${
          showMobileDetail ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Mobile Back Button */}
        <div className="md:hidden mb-3">
          <button
            onClick={() => setShowMobileDetail(false)}
            className="flex items-center space-x-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-2 rounded-xl min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Nota</span>
          </button>
        </div>

        {selectedTx ? (
          <div className="space-y-6 max-w-lg mx-auto w-full">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Rincian Nota: {selectedTx.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDateTime(selectedTx.createdAt)} | Metode: {selectedTx.paymentMethod}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onReprintReceipt(selectedTx, selectedItems)}
                  className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Ulang</span>
                </button>
                {selectedTx.status !== 'RETURNED' && (
                  <button
                    onClick={openReturnModal}
                    className="py-2 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center space-x-1 border border-rose-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retur</span>
                  </button>
                )}
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Barang Belanjaan ({selectedItems.length} jenis)
              </h4>
              <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                {selectedItems.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50/50 flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.quantity} x {formatRupiah(item.unitPrice)}
                        {item.lineDiscount > 0 && ` (Diskon: -${formatRupiah(item.lineDiscount)})`}
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-800">
                      {formatRupiah(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatRupiah(selectedTx.subtotal)}</span>
              </div>
              {selectedTx.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(selectedTx.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t">
                <span>TOTAL AKHIR:</span>
                <span className="text-teal-800">{formatRupiah(selectedTx.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Uang Diterima:</span>
                <span>{formatRupiah(selectedTx.tenderAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Kembalian:</span>
                <span>{formatRupiah(selectedTx.changeAmount)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Receipt className="w-12 h-12 text-slate-200" />
            <p className="text-xs font-semibold">Pilih salah satu nota di sisi kiri untuk melihat rincian.</p>
          </div>
        )}
      </div>

      {/* RETURN MODAL */}
      {showReturnModal && selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-800">Retur Barang Belanjaan</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Alasan Retur / Pengembalian:
              </label>
              <input
                type="text"
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Pilih Jumlah Unit & Perlakuan Stok:
              </label>
              <div className="space-y-2">
                {returnItemsState.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{r.item.productName}</span>
                      <span>Maks: {r.item.quantity} unit</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-24">
                        <label className="text-[10px] text-slate-400 block">Qty Retur:</label>
                        <input
                          type="number"
                          min="0"
                          max={r.item.quantity}
                          value={r.returnQty}
                          onChange={e => {
                            const val = Math.min(
                              r.item.quantity,
                              Math.max(0, Number(e.target.value) || 0)
                            )
                            const copy = [...returnItemsState]
                            copy[idx].returnQty = val
                            setReturnItemsState(copy)
                          }}
                          className="w-full px-2 py-1 border rounded-lg text-xs font-bold text-center"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block">Perlakuan Barang:</label>
                        <select
                          value={r.disposition}
                          onChange={e => {
                            const copy = [...returnItemsState]
                            copy[idx].disposition = e.target.value as 'RESTOCK' | 'SCRAP'
                            setReturnItemsState(copy)
                          }}
                          className="w-full px-2 py-1 border rounded-lg text-xs font-semibold bg-white"
                        >
                          <option value="RESTOCK">Restock (Kembali ke Rak Toko)</option>
                          <option value="SCRAP">Scrap (Barang Rusak / Dibuang)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReturn}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Proses Retur & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
