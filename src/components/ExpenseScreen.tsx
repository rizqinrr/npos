import React, { useState, useEffect } from 'react'
import {
  TrendingDown,
  Plus
} from 'lucide-react'
import type { Expense, CashierShift } from '@/db/types'
import { db } from '@/db/database'
import { formatRupiah, formatDateTime } from '@/core/utils/currency'

interface ExpenseScreenProps {
  activeShift: CashierShift | null
  onExpenseAdded: () => void
}

export const ExpenseScreen: React.FC<ExpenseScreenProps> = ({
  activeShift,
  onExpenseAdded
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showAddModal, setShowAddModal] = useState<boolean>(false)

  // Form states
  const [category, setCategory] = useState<string>('Operasional')
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState<string>('')
  const [paymentSource, setPaymentSource] = useState<'DRAWER_CASH' | 'BANK_ACCOUNT'>('DRAWER_CASH')

  // Financial Summary states
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [totalCogs, setTotalCogs] = useState<number>(0)
  const [totalExpenses, setTotalExpenses] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const allExpenses = await db.expenses.orderBy('expenseDate').reverse().toArray()
    setExpenses(allExpenses)

    // Calculate revenue & COGS from completed transactions & items
    const transactions = await db.transactions.where('status').equals('COMPLETED').toArray()
    const rev = transactions.reduce((acc, t) => acc + t.totalAmount, 0)
    setTotalRevenue(rev)

    const items = await db.transaction_items.toArray()
    const cogs = items.reduce((acc, i) => acc + ((i.costPrice || 0) * i.quantity), 0)
    setTotalCogs(cogs)

    const exp = allExpenses.reduce((acc, e) => acc + e.amount, 0)
    setTotalExpenses(exp)
  }

  const handleSaveExpense = async () => {
    if (amount <= 0 || !description.trim()) {
      alert('Lengkapi jumlah biaya dan keterangan!')
      return
    }

    const now = Date.now()
    await db.expenses.add({
      expenseDate: now,
      category,
      amount,
      description,
      paymentSource,
      shiftId: paymentSource === 'DRAWER_CASH' ? activeShift?.id : undefined,
      createdAt: now
    })

    // If paid from drawer cash, also add to drawer movements so shift variance remains accurate!
    if (paymentSource === 'DRAWER_CASH' && activeShift?.id) {
      await db.drawer_movements.add({
        shiftId: activeShift.id,
        timestamp: now,
        movementType: 'CASH_OUT',
        amount,
        reason: `Biaya: ${description} (${category})`,
        authorizedBy: activeShift.cashierName
      })
    }

    setShowAddModal(false)
    setAmount(0)
    setDescription('')
    loadData()
    onExpenseAdded()
  }

  const grossProfit = totalRevenue - totalCogs
  const netProfit = grossProfit - totalExpenses
  const profitMarginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

  return (
    <div className="flex-1 p-3 sm:p-6 bg-slate-100 overflow-y-auto space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800">Biaya Toko & Laporan Laba Rugi</h2>
          <p className="text-xs text-slate-500">
            Pencatatan pengeluaran operasional toko dan kalkulasi laba rugi bersih real-time.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Biaya Pengeluaran</span>
        </button>
      </div>

      {/* PROFIT & LOSS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Penjualan (Omzet)
          </span>
          <p className="text-base sm:text-lg font-black font-mono text-slate-800 mt-1">
            {formatRupiah(totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Modal Produk (HPP)
          </span>
          <p className="text-base sm:text-lg font-black font-mono text-slate-600 mt-1">
            -{formatRupiah(totalCogs)}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            Laba Kotor: {formatRupiah(grossProfit)}
          </span>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Beban Biaya Operasional
          </span>
          <p className="text-base sm:text-lg font-black font-mono text-rose-600 mt-1">
            -{formatRupiah(totalExpenses)}
          </p>
          <span className="text-[10px] text-slate-400">{expenses.length} transaksi biaya</span>
        </div>
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs ${
            netProfit >= 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block">
            Laba Bersih (*Net Profit*)
          </span>
          <p className="text-lg sm:text-xl font-black font-mono mt-1">
            {formatRupiah(netProfit)}
          </p>
          <span className="text-[10px] font-semibold">
            Margin: {profitMarginPct}% dari omzet
          </span>
        </div>
      </div>

      {/* Expenses History List */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
          <TrendingDown className="w-4 h-4 text-rose-600" />
          <span>Daftar Pengeluaran Operasional Toko</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Keterangan</th>
                <th className="py-2.5 px-3">Sumber Kas</th>
                <th className="py-2.5 px-3 text-right">Jumlah Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    Belum ada pencatatan biaya operasional toko.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">{formatDateTime(e.expenseDate)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-700">{e.category}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{e.description}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.paymentSource === 'DRAWER_CASH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {e.paymentSource === 'DRAWER_CASH' ? 'Kas Laci Kasir' : 'Rekening Bank Luar'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-600">
                      -{formatRupiah(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800">Catat Pengeluaran Toko</h3>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Kategori Biaya:
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 text-xs bg-white"
              >
                <option value="Listrik & Air">Listrik & Air</option>
                <option value="Kemasan & Kantong">Kemasan & Kantong</option>
                <option value="Sewa Tempat">Sewa Tempat</option>
                <option value="Gaji Karyawan">Gaji Karyawan</option>
                <option value="Transport & Logistik">Transport & Logistik</option>
                <option value="Operasional Lainnya">Operasional Lainnya</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Nominal Biaya (Rp):
              </label>
              <input
                type="number"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value) || 0)}
                placeholder="Contoh: 25000"
                className="w-full px-3 py-2 border rounded-xl font-black text-slate-800 text-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Keterangan Biaya:
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Contoh: Beli kantong kresek 2 pack"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Sumber Dana Pembayaran:
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentSource('DRAWER_CASH')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    paymentSource === 'DRAWER_CASH'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Kas Laci Toko
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentSource('BANK_ACCOUNT')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    paymentSource === 'BANK_ACCOUNT'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Rekening Luar
                </button>
              </div>
              {paymentSource === 'DRAWER_CASH' && (
                <p className="text-[10px] text-amber-600 mt-1 italic">
                  *Akan otomatis memotong saldo fisik laci kasir pada shift aktif saat ini.
                </p>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleSaveExpense}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20"
              >
                Simpan Biaya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
