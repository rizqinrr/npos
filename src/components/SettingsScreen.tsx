import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  Store,
  QrCode,
  Printer,
  Database,
  Download,
  Upload,
  Save,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react'
import type { StoreSetting } from '@/db/types'
import { db } from '@/db/database'

interface SettingsScreenProps {
  store: StoreSetting | null
  onStoreUpdated: () => void
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  store,
  onStoreUpdated
}) => {
  const [storeName, setStoreName] = useState<string>('')
  const [storeAddress, setStoreAddress] = useState<string>('')
  const [storePhone, setStorePhone] = useState<string>('')
  const [receiptFooter, setReceiptFooter] = useState<string>('')
  const [paperWidth, setPaperWidth] = useState<58 | 80>(58)

  // QRIS config
  const [qrisPayload, setQrisPayload] = useState<string>('')
  const [qrisMerchantName, setQrisMerchantName] = useState<string>('')
  const [qrisCity, setQrisCity] = useState<string>('')

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false)

  useEffect(() => {
    if (store) {
      setStoreName(store.storeName)
      setStoreAddress(store.storeAddress)
      setStorePhone(store.storePhone)
      setReceiptFooter(store.receiptFooter)
      setPaperWidth(store.printerPaperWidth)
    }

    async function loadQris() {
      const q = await db.merchant_qris_configs.get(1)
      if (q) {
        setQrisPayload(q.rawPayload)
        setQrisMerchantName(q.merchantName)
        setQrisCity(q.merchantCity)
      } else {
        setQrisPayload(
          '00020101021126580011ID.CO.QRIS01189360091100000000000215ID10200000000015204581253033605802ID5914TOKO BERKAH6010MAJALENGKA61054541162070703A016304'
        )
        setQrisMerchantName('TOKO BERKAH')
        setQrisCity('MAJALENGKA')
      }
    }
    loadQris()
  }, [store])

  const handleSaveStore = async () => {
    await db.store_settings.put({
      id: 1,
      storeName,
      storeAddress,
      storePhone,
      receiptFooter,
      printerType: 'NONE',
      printerPaperWidth: paperWidth,
      updatedAt: Date.now()
    })

    await db.merchant_qris_configs.put({
      id: 1,
      rawPayload: qrisPayload,
      merchantName: qrisMerchantName,
      merchantCity: qrisCity,
      updatedAt: Date.now()
    })

    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
    onStoreUpdated()
  }

  // Backup entire database to .npos JSON file
  const handleBackupDatabase = async () => {
    const backupData = {
      version: 1,
      timestamp: Date.now(),
      tables: {
        products: await db.products.toArray(),
        categories: await db.categories.toArray(),
        transactions: await db.transactions.toArray(),
        transaction_items: await db.transaction_items.toArray(),
        transaction_payments: await db.transaction_payments.toArray(),
        merchant_qris_configs: await db.merchant_qris_configs.toArray(),
        pending_qris_orders: await db.pending_qris_orders.toArray(),
        cashier_shifts: await db.cashier_shifts.toArray(),
        drawer_movements: await db.drawer_movements.toArray(),
        transaction_returns: await db.transaction_returns.toArray(),
        transaction_return_items: await db.transaction_return_items.toArray(),
        stock_movements: await db.stock_movements.toArray(),
        stock_opnames: await db.stock_opnames.toArray(),
        stock_opname_items: await db.stock_opname_items.toArray(),
        suppliers: await db.suppliers.toArray(),
        purchases: await db.purchases.toArray(),
        purchase_items: await db.purchase_items.toArray(),
        goods_receipts: await db.goods_receipts.toArray(),
        goods_receipt_items: await db.goods_receipt_items.toArray(),
        expenses: await db.expenses.toArray(),
        store_settings: await db.store_settings.toArray()
      }
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-npos-${new Date().toISOString().slice(0, 10)}.npos`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Restore database from .npos file
  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async event => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        if (!parsed.tables) {
          alert('Format berkas cadangan nPOS tidak valid!')
          return
        }

        if (confirm('PERINGATAN: Memulihkan database akan menimpa data yang ada saat ini. Lanjutkan?')) {
          await db.transaction('rw', db.tables, async () => {
            for (const table of db.tables) {
              const data = parsed.tables[table.name]
              if (data && Array.isArray(data)) {
                await table.clear()
                await table.bulkAdd(data)
              }
            }
          })
          alert('Database nPOS berhasil dipulihkan!')
          window.location.reload()
        }
      } catch (err) {
        console.error('Failed to restore backup', err)
        alert('Gagal membaca berkas cadangan!')
      }
    }
    reader.readAsText(file)
  }

  // Export catalog to Excel
  const handleExportProductsExcel = async () => {
    const prods = await db.products.toArray()
    const worksheet = XLSX.utils.json_to_sheet(
      prods.map(p => ({
        ID: p.id,
        'Nama Produk': p.name,
        Kategori: p.category,
        'Barcode / SKU': p.sku || '',
        'Harga Modal (HPP)': p.costPrice || 0,
        'Harga Jual': p.salePrice,
        Stok: p.stock,
        'Batas Stok Menipis': p.lowStockThreshold
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog Produk')
    XLSX.writeFile(workbook, `katalog-produk-npos-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-slate-100 overflow-y-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800">Pengaturan Sistem nPOS</h2>
          <p className="text-xs text-slate-500">
            Identitas toko, printer thermal, konfigurasi QRIS merchant, serta cadangkan & pulihkan basis data.
          </p>
        </div>

        <button
          onClick={handleSaveStore}
          className="w-full sm:w-auto py-2.5 px-5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs min-h-[44px]"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: IDENTITAS TOKO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Store className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-sm text-slate-800">Identitas Toko & Struk Kasir</h3>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Usaha / Toko:</label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Alamat Toko:</label>
            <input
              type="text"
              value={storeAddress}
              onChange={e => setStoreAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nomor Telepon / WhatsApp:</label>
            <input
              type="text"
              value={storePhone}
              onChange={e => setStorePhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Pesan Footer Struk Belanja:
            </label>
            <textarea
              value={receiptFooter}
              onChange={e => setReceiptFooter(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800 h-20"
            />
          </div>
        </div>

        {/* CARD 2: QRIS MERCHANT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b pb-3">
            <QrCode className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-sm text-slate-800">Konfigurasi QRIS Statis Merchant</h3>
          </div>

          <p className="text-xs text-slate-500">
            String payload QRIS statis toko Anda digunakan untuk menghasilkan kode QR dinamis dengan nominal tagihan belanja pelanggan secara otomatis.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Merchant QRIS:</label>
            <input
              type="text"
              value={qrisMerchantName}
              onChange={e => setQrisMerchantName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Kota Merchant:</label>
            <input
              type="text"
              value={qrisCity}
              onChange={e => setQrisCity(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-semibold text-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Payload String EMVCo QRIS Statis:
            </label>
            <textarea
              value={qrisPayload}
              onChange={e => setQrisPayload(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-mono text-[11px] text-slate-700 h-24"
            />
          </div>
        </div>

        {/* CARD 3: PRINTER SETTINGS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Printer className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-sm text-slate-800">Pengaturan Printer Thermal Struk</h3>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Lebar Kertas Thermal:</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaperWidth(58)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  paperWidth === 58 ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                58 mm (Kasir Portable)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth(80)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  paperWidth === 80 ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                80 mm (Printer Desktop)
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => window.print()}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all border border-slate-300"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Uji Coba Test Print Halaman</span>
            </button>
          </div>
        </div>

        {/* CARD 4: BACKUP & RESTORE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Database className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-sm text-slate-800">Cadangkan & Pulihkan Basis Data</h3>
          </div>

          <p className="text-xs text-slate-500">
            Karena nPOS bekerja offline (data tersimpan di perangkat lokal), lakukan pencadangan berkala untuk mengamankan data transaksi dan stok Anda.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleBackupDatabase}
              className="py-3 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Cadangkan (.npos)</span>
            </button>

            <label className="py-3 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Pulihkan Data</span>
              <input
                type="file"
                accept=".npos,.json"
                onChange={handleRestoreDatabase}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2 border-t">
            <button
              onClick={handleExportProductsExcel}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Katalog Produk ke Excel (XLSX)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
