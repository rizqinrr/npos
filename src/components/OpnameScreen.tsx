import React, { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Play,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react'
import type { Product, StockOpname, StockOpnameItem } from '@/db/types'
import { db } from '@/db/database'
import { formatRupiah, formatDateTime } from '@/core/utils/currency'

interface OpnameScreenProps {
  products: Product[]
  onStockUpdated: () => void
}

export const OpnameScreen: React.FC<OpnameScreenProps> = ({
  products,
  onStockUpdated
}) => {
  const [activeOpname, setActiveOpname] = useState<StockOpname | null>(null)
  const [opnameItems, setOpnameItems] = useState<StockOpnameItem[]>([])
  const [pastOpnames, setPastOpnames] = useState<StockOpname[]>([])
  const [conductedBy, setConductedBy] = useState<string>('Petugas Gudang')

  useEffect(() => {
    loadOpnames()
  }, [])

  const loadOpnames = async () => {
    const active = await db.stock_opnames.where('status').equals('IN_PROGRESS').first()
    setActiveOpname(active || null)

    if (active?.id) {
      const items = await db.stock_opname_items.where('opnameId').equals(active.id).toArray()
      setOpnameItems(items)
    }

    const past = await db.stock_opnames.where('status').equals('COMPLETED').reverse().toArray()
    setPastOpnames(past)
  }

  const handleStartOpname = async () => {
    if (products.length === 0) {
      alert('Tidak ada produk di katalog untuk di-opname!')
      return
    }

    const now = Date.now()
    const opnameNumber = `SO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

    const opnameId = await db.stock_opnames.add({
      opnameNumber,
      startedAt: now,
      status: 'IN_PROGRESS',
      totalItemsCounted: 0,
      totalDiscrepancyQty: 0,
      totalDiscrepancyValue: 0,
      conductedBy
    })

    // Snapshot all products into opname items
    for (const p of products) {
      await db.stock_opname_items.add({
        opnameId: opnameId as number,
        productId: p.id || 0,
        productName: p.name,
        systemStockSnapshot: p.stock,
        physicalCount: p.stock, // Default to system stock
        varianceQuantity: 0,
        unitCostPrice: p.costPrice || 0,
        varianceValue: 0
      })
    }

    loadOpnames()
  }

  const handleUpdatePhysicalCount = async (itemId: number, count: number) => {
    const item = opnameItems.find(i => i.id === itemId)
    if (!item) return

    const variance = count - item.systemStockSnapshot
    const varianceVal = variance * (item.unitCostPrice || 0)

    await db.stock_opname_items.update(itemId, {
      physicalCount: count,
      varianceQuantity: variance,
      varianceValue: varianceVal
    })

    const updated = opnameItems.map(i =>
      i.id === itemId
        ? {
            ...i,
            physicalCount: count,
            varianceQuantity: variance,
            varianceValue: varianceVal
          }
        : i
    )
    setOpnameItems(updated)
  }

  const handleCompleteOpname = async () => {
    if (!activeOpname?.id) return

    const now = Date.now()
    let totalDiscQty = 0
    let totalDiscVal = 0

    // Adjust product stock and create movement audits
    for (const item of opnameItems) {
      totalDiscQty += Math.abs(item.varianceQuantity)
      totalDiscVal += Math.abs(item.varianceValue)

      if (item.varianceQuantity !== 0) {
        await db.products.update(item.productId, {
          stock: item.physicalCount
        })

        await db.stock_movements.add({
          productId: item.productId,
          timestamp: now,
          movementType: 'OPNAME_ADJUSTMENT',
          quantityDelta: item.varianceQuantity,
          stockBefore: item.systemStockSnapshot,
          stockAfter: item.physicalCount,
          unitCostPrice: item.unitCostPrice,
          referenceType: 'STOCK_OPNAME',
          referenceId: activeOpname.id,
          notes: `Penyesuaian Opname ${activeOpname.opnameNumber}`,
          operatorName: activeOpname.conductedBy
        })
      }
    }

    await db.stock_opnames.update(activeOpname.id, {
      completedAt: now,
      status: 'COMPLETED',
      totalItemsCounted: opnameItems.length,
      totalDiscrepancyQty: totalDiscQty,
      totalDiscrepancyValue: totalDiscVal
    })

    setActiveOpname(null)
    setOpnameItems([])
    loadOpnames()
    onStockUpdated()
    alert('Sesi Stock Opname selesai! Seluruh stok sistem telah diperbarui.')
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-slate-100 overflow-y-auto space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-teal-700" />
            <h2 className="text-xl font-black text-slate-800">Stock Opname Fisik Toko</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit pencocokan stok fisik toko dengan catatan sistem untuk mendeteksi selisih barang hilang atau rusak.
          </p>
        </div>

        <div>
          {activeOpname ? (
            <button
              onClick={handleCompleteOpname}
              className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesaikan & Terapkan Penyesuaian</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={conductedBy}
                onChange={e => setConductedBy(e.target.value)}
                placeholder="Nama Petugas Opname"
                className="px-3 py-2 border rounded-xl text-xs font-semibold"
              />
              <button
                onClick={handleStartOpname}
                className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-600/20 whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                <span>Mulai Sesi Opname</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE OPNAME SHEET */}
      {activeOpname ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-3 p-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                Sesi Berjalan: {activeOpname.opnameNumber}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Dimulai: {formatDateTime(activeOpname.startedAt)} oleh {activeOpname.conductedBy}
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Silakan masukkan hasil hitungan riil fisik barang pada kolom &quot;Hitung Fisik&quot;.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                <tr>
                  <th className="py-2.5 px-3">Nama Produk</th>
                  <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                  <th className="py-2.5 px-3 text-center w-36">Hitung Fisik Riil</th>
                  <th className="py-2.5 px-3 text-center">Selisih (*Variance*)</th>
                  <th className="py-2.5 px-3 text-right">Nilai Rupiah Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opnameItems.map(item => {
                  const isDiff = item.varianceQuantity !== 0

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.productName}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                        {item.systemStockSnapshot}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          value={item.physicalCount}
                          onChange={e =>
                            item.id && handleUpdatePhysicalCount(item.id, Number(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 border-2 border-teal-500 rounded-lg text-center font-black text-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {isDiff ? (
                          <span
                            className={
                              item.varianceQuantity < 0 ? 'text-rose-600' : 'text-emerald-600'
                            }
                          >
                            {item.varianceQuantity > 0 ? `+${item.varianceQuantity}` : item.varianceQuantity}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {isDiff ? (
                          <span
                            className={
                              item.varianceValue < 0 ? 'text-rose-600' : 'text-emerald-600'
                            }
                          >
                            {formatRupiah(item.varianceValue)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Rp 0</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PAST OPNAME SESSIONS */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Riwayat Sesi Stock Opname Sebelumnya</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                <tr>
                  <th className="py-2.5 px-3">No. Opname</th>
                  <th className="py-2.5 px-3">Tanggal Pelaksanaan</th>
                  <th className="py-2.5 px-3">Petugas</th>
                  <th className="py-2.5 px-3 text-center">Barang Diaudit</th>
                  <th className="py-2.5 px-3 text-center">Total Selisih Unit</th>
                  <th className="py-2.5 px-3 text-right">Nilai Selisih</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastOpnames.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Belum pernah ada sesi stock opname yang diselesaikan.
                    </td>
                  </tr>
                ) : (
                  pastOpnames.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{po.opnameNumber}</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDateTime(po.startedAt)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{po.conductedBy}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {po.totalItemsCounted} item
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                        {po.totalDiscrepancyQty} unit
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-700">
                        {formatRupiah(po.totalDiscrepancyValue)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          SELESAI
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
