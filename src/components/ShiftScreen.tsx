import React, { useState, useEffect } from 'react'
import {
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  DollarSign,
  FileText
} from 'lucide-react'
import type { CashierShift, DrawerMovement, Transaction } from '@/db/types'
import { db } from '@/db/database'
import { formatRupiah, formatDateTime } from '@/core/utils/currency'

interface ShiftScreenProps {
  activeShift: CashierShift | null
  onShiftUpdated: () => void
}

export const ShiftScreen: React.FC<ShiftScreenProps> = ({
  activeShift,
  onShiftUpdated
}) => {
  const [shifts, setShifts] = useState<CashierShift[]>([])
  const [movements, setMovements] = useState<DrawerMovement[]>([])
  const [shiftTransactions, setShiftTransactions] = useState<Transaction[]>([])

  // Modals
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false)
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false)
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false)

  // Form states
  const [cashierName, setCashierName] = useState<string>('Kasir 1')
  const [startingCash, setStartingCash] = useState<number>(100000)
  const [movementType, setMovementType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_OUT')
  const [movementAmount, setMovementAmount] = useState<number>(0)
  const [movementReason, setMovementReason] = useState<string>('')
  const [actualCash, setActualCash] = useState<number>(0)
  const [closingNotes, setClosingNotes] = useState<string>('')

  // Load shifts & movements
  useEffect(() => {
    loadData()
  }, [activeShift])

  const loadData = async () => {
    const allShifts = await db.cashier_shifts.orderBy('openedAt').reverse().limit(20).toArray()
    setShifts(allShifts)

    if (activeShift?.id) {
      const allMovs = await db.drawer_movements
        .where('shiftId')
        .equals(activeShift.id)
        .reverse()
        .toArray()
      setMovements(allMovs)

      const txs = await db.transactions
        .where('shiftId')
        .equals(activeShift.id)
        .toArray()
      setShiftTransactions(txs)
    } else {
      setMovements([])
      setShiftTransactions([])
    }
  }

  // Calculations for current shift
  const cashSales = shiftTransactions
    .filter(t => t.paymentMethod === 'CASH' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.totalAmount, 0)

  const qrisSales = shiftTransactions
    .filter(t => t.paymentMethod === 'QRIS' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.totalAmount, 0)

  const totalCashIn = movements
    .filter(m => m.movementType === 'CASH_IN')
    .reduce((acc, m) => acc + m.amount, 0)

  const totalCashOut = movements
    .filter(m => m.movementType === 'CASH_OUT')
    .reduce((acc, m) => acc + m.amount, 0)

  const expectedCashInDrawer = (activeShift?.startingCash || 0) + cashSales + totalCashIn - totalCashOut
  const variance = actualCash - expectedCashInDrawer

  const handleOpenShift = async () => {
    if (!cashierName.trim()) {
      alert('Nama kasir wajib diisi!')
      return
    }
    await db.cashier_shifts.add({
      cashierName,
      openedAt: Date.now(),
      startingCash,
      expectedCash: startingCash,
      status: 'OPEN'
    })
    setShowOpenModal(false)
    onShiftUpdated()
  }

  const handleAddMovement = async () => {
    if (!activeShift?.id || movementAmount <= 0 || !movementReason.trim()) {
      alert('Lengkapi nominal dan alasan mutasi kas!')
      return
    }

    await db.drawer_movements.add({
      shiftId: activeShift.id,
      timestamp: Date.now(),
      movementType,
      amount: movementAmount,
      reason: movementReason,
      authorizedBy: activeShift.cashierName
    })

    setShowMovementModal(false)
    setMovementAmount(0)
    setMovementReason('')
    loadData()
  }

  const handleCloseShift = async () => {
    if (!activeShift?.id) return

    await db.cashier_shifts.update(activeShift.id, {
      closedAt: Date.now(),
      expectedCash: expectedCashInDrawer,
      actualCash,
      cashVariance: variance,
      status: 'CLOSED',
      closingNotes
    })

    setShowCloseModal(false)
    onShiftUpdated()
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-slate-100 overflow-y-auto space-y-4 sm:space-y-6">
      {/* Top Banner: Shift Status */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <h2 className="text-lg sm:text-xl font-black text-slate-800">
              {activeShift
                ? `Shift Berjalan: ${activeShift.cashierName}`
                : 'Tidak Ada Shift Aktif'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeShift
              ? `Dibuka: ${formatDateTime(activeShift.openedAt)} | Modal Awal: ${formatRupiah(activeShift.startingCash)}`
              : 'Silakan buka shift kasir baru sebelum melayani transaksi penjualan.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeShift ? (
            <>
              <button
                onClick={() => setShowMovementModal(true)}
                className="flex-1 sm:flex-none py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all border border-slate-300 min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4 text-slate-600" />
                <span>Kas Masuk/Keluar</span>
              </button>
              <button
                onClick={() => {
                  setActualCash(expectedCashInDrawer)
                  setShowCloseModal(true)
                }}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs min-h-[44px]"
              >
                <Clock className="w-4 h-4" />
                <span>Tutup Shift</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="w-full sm:w-auto py-2.5 px-5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buka Shift Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Reconciliation Cards (Only if Shift Active) */}
      {activeShift && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Modal Awal Laci
            </span>
            <p className="text-base sm:text-lg font-black font-mono text-slate-800 mt-1">
              {formatRupiah(activeShift.startingCash)}
            </p>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Penjualan Tunai
            </span>
            <p className="text-base sm:text-lg font-black font-mono text-emerald-700 mt-1">
              +{formatRupiah(cashSales)}
            </p>
            <span className="text-[10px] text-slate-400 font-mono">QRIS: {formatRupiah(qrisSales)}</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Kas Masuk / Keluar
            </span>
            <p className="text-base sm:text-lg font-black font-mono text-slate-800 mt-1">
              {formatRupiah(totalCashIn - totalCashOut)}
            </p>
            <span className="text-[10px] text-slate-400 font-mono truncate block">
              +{formatRupiah(totalCashIn)} / -{formatRupiah(totalCashOut)}
            </span>
          </div>
          <div className="bg-teal-50 border border-teal-200 p-3.5 sm:p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Ekspektasi Kas Laci
            </span>
            <p className="text-base sm:text-lg font-black font-mono text-teal-900 mt-1">
              {formatRupiah(expectedCashInDrawer)}
            </p>
            <span className="text-[10px] text-teal-700 font-medium">Uang fisik di laci</span>
          </div>
        </div>
      )}

      {/* Drawer Movements Audit List */}
      {activeShift && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-teal-600" />
            <span>Mutasi Kas Laci Non-Penjualan (Shift Saat Ini)</span>
          </h3>

          {movements.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Belum ada pencatatan kas masuk atau kas keluar pada shift ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {movements.map(m => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        m.movementType === 'CASH_IN'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {m.movementType === 'CASH_IN' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{m.reason}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatDateTime(m.timestamp)} oleh {m.authorizedBy}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-black text-sm ${
                      m.movementType === 'CASH_IN' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {m.movementType === 'CASH_IN' ? '+' : '-'}
                    {formatRupiah(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shift History Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-teal-600" />
          <span>Riwayat Shift Sebelumnya</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Kasir</th>
                <th className="py-2.5 px-3">Dibuka</th>
                <th className="py-2.5 px-3">Ditutup</th>
                <th className="py-2.5 px-3">Modal Awal</th>
                <th className="py-2.5 px-3">Kas Ekspektasi</th>
                <th className="py-2.5 px-3">Kas Riil Fisik</th>
                <th className="py-2.5 px-3">Selisih (*Variance*)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map(s => {
                const isShort = (s.cashVariance || 0) < 0
                const isOver = (s.cashVariance || 0) > 0

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{s.cashierName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{formatDateTime(s.openedAt)}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {s.closedAt ? formatDateTime(s.closedAt) : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-medium">{formatRupiah(s.startingCash)}</td>
                    <td className="py-2.5 px-3 font-medium">{formatRupiah(s.expectedCash)}</td>
                    <td className="py-2.5 px-3 font-bold">
                      {s.actualCash != null ? formatRupiah(s.actualCash) : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {s.cashVariance != null ? (
                        <span
                          className={`font-bold ${
                            isShort ? 'text-rose-600' : isOver ? 'text-teal-600' : 'text-slate-600'
                          }`}
                        >
                          {isShort ? '-' : isOver ? '+' : ''}
                          {formatRupiah(Math.abs(s.cashVariance))}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          s.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status === 'OPEN' ? 'BERJALAN' : 'DITUTUP'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: BUKA SHIFT */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800">Buka Shift Kasir Baru</h3>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Kasir:</label>
              <input
                type="text"
                value={cashierName}
                onChange={e => setCashierName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Modal Awal Kas Laci (Rp):
              </label>
              <input
                type="number"
                value={startingCash || ''}
                onChange={e => setStartingCash(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl font-black text-slate-800 text-lg"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowOpenModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleOpenShift}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20"
              >
                Mulai Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MUTASI KAS MASUK / KELUAR */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800">Catat Kas Masuk / Keluar</h3>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMovementType('CASH_OUT')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  movementType === 'CASH_OUT' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Kas Keluar
              </button>
              <button
                onClick={() => setMovementType('CASH_IN')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  movementType === 'CASH_IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Kas Masuk
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nominal (Rp):</label>
              <input
                type="number"
                value={movementAmount || ''}
                onChange={e => setMovementAmount(Number(e.target.value) || 0)}
                placeholder="Contoh: 15000"
                className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 text-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Alasan / Keperluan:</label>
              <input
                type="text"
                value={movementReason}
                onChange={e => setMovementReason(e.target.value)}
                placeholder="Contoh: Beli kantong kresek, tambah uang kembalian"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowMovementModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleAddMovement}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20"
              >
                Simpan Mutasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TUTUP SHIFT & REKONSILIASI */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800">Rekonsiliasi & Tutup Shift</h3>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span>Modal Awal:</span>
                <span className="font-semibold">{formatRupiah(activeShift?.startingCash || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Penjualan Tunai:</span>
                <span className="font-semibold text-emerald-600">+{formatRupiah(cashSales)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kas Masuk:</span>
                <span className="font-semibold text-emerald-600">+{formatRupiah(totalCashIn)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kas Keluar:</span>
                <span className="font-semibold text-rose-600">-{formatRupiah(totalCashOut)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-teal-900 pt-2 border-t border-slate-200">
                <span>Kas Ekspektasi Sistem:</span>
                <span>{formatRupiah(expectedCashInDrawer)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Hitung Uang Kas Fisik Riil di Laci (Rp):
              </label>
              <input
                type="number"
                value={actualCash || ''}
                onChange={e => setActualCash(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border-2 border-teal-500 rounded-xl font-black text-slate-900 text-xl"
              />
            </div>

            {/* Variance Alert */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                variance === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : variance < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                {variance === 0 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
                <div>
                  <span className="font-bold">
                    {variance === 0
                      ? 'Kas Seimbang (Sesuai)'
                      : variance < 0
                      ? 'Selisih Kurang (Shortage)'
                      : 'Selisih Lebih (Overage)'}
                  </span>
                  <p className="text-[11px] font-semibold">
                    {variance === 0 ? 'Tidak ada selisih' : formatRupiah(Math.abs(variance))}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Catatan Penutupan Shift:
              </label>
              <textarea
                value={closingNotes}
                onChange={e => setClosingNotes(e.target.value)}
                placeholder="Catatan kendala atau laporan pergantian kasir..."
                className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800 h-16"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleCloseShift}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Konfirmasi Tutup Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
