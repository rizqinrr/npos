import React, { useState } from 'react'
import {
  Printer,
  Download,
  Share2,
  CheckCircle,
  X,
  Check
} from 'lucide-react'
import type { Transaction, TransactionItem, StoreSetting } from '@/db/types'
import {
  generateReceiptText,
  generateReceiptPdf,
  generateEscPosBuffer
} from '@/core/printer/receiptFormatter'
import { formatRupiah, formatDateTime } from '@/core/utils/currency'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  store: StoreSetting | null
  transaction: Transaction | null
  items: TransactionItem[]
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  store,
  transaction,
  items
}) => {
  const [copied, setCopied] = useState<boolean>(false)
  const [isPrinting, setIsPrinting] = useState<boolean>(false)

  if (!isOpen || !transaction || !store) return null

  const handleCopyText = async () => {
    const text = generateReceiptText(store, transaction, items)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPdf = () => {
    const doc = generateReceiptPdf(store, transaction, items)
    doc.save(`struk-${transaction.receiptNumber}.pdf`)
  }

  const handlePrintThermal = async () => {
    setIsPrinting(true)
    try {
      const buffer = generateEscPosBuffer(store, transaction, items)
      console.log('Generated ESC/POS buffer bytes:', buffer.length)
      // Check if Web Bluetooth is available
      if ('bluetooth' in navigator) {
        try {
          const device = await (navigator as unknown as { bluetooth: { requestDevice: (opts: unknown) => Promise<unknown> } }).bluetooth.requestDevice({
            filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
          })
          console.log('Bluetooth thermal printer connected:', device)
        } catch {
          // If bluetooth prompt canceled or failed, fallback to browser print
          window.print()
        }
      } else {
        // Fallback to browser print or raw ESC/POS download
        window.print()
      }
    } catch (err) {
      console.error('Print thermal error', err)
      window.print()
    } finally {
      setIsPrinting(false)
    }
  }

  const handleShare = async () => {
    const text = generateReceiptText(store, transaction, items)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Struk Belanja ${transaction.receiptNumber}`,
          text
        })
      } catch (err) {
        console.log('Share dismissed', err)
      }
    } else {
      handleCopyText()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">Transaksi Berhasil</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Receipt Simulation */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 text-slate-800 font-mono text-xs w-full max-w-xs space-y-3 leading-relaxed">
            {/* Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <h4 className="font-bold text-sm text-slate-900">{store.storeName}</h4>
              <p className="text-[11px] text-slate-500">{store.storeAddress}</p>
              <p className="text-[11px] text-slate-500">Telp: {store.storePhone}</p>
            </div>

            {/* Info */}
            <div className="space-y-0.5 border-b border-dashed border-slate-300 pb-2 text-[11px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-bold">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{formatDateTime(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="font-bold text-teal-700">{transaction.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
              {items.map(item => (
                <div key={item.id || item.productId} className="space-y-0.5">
                  <p className="font-semibold text-slate-900">{item.productName}</p>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {item.quantity} x {formatRupiah(item.unitPrice)}
                    </span>
                    <span className="font-bold">{formatRupiah(item.lineTotal)}</span>
                  </div>
                  {item.lineDiscount > 0 && (
                    <p className="text-rose-600 text-[10px]">
                      Diskon: -{formatRupiah(item.lineDiscount)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Total Diskon:</span>
                  <span>-{formatRupiah(transaction.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{formatRupiah(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bayar:</span>
                <span>{formatRupiah(transaction.tenderAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kembali:</span>
                <span>{formatRupiah(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-2 whitespace-pre-line">
              {store.receiptFooter}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePrintThermal}
              disabled={isPrinting}
              className="py-3 px-3 bg-teal-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 hover:bg-teal-900 transition-all shadow-xs min-h-[48px]"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="py-3 px-3 bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 hover:bg-slate-900 transition-all shadow-xs min-h-[48px]"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF</span>
            </button>
            <button
              onClick={handleShare}
              className="py-3 px-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 hover:bg-slate-200 transition-all border border-slate-200 min-h-[48px]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-teal-50 text-teal-900 hover:bg-teal-100 rounded-xl font-black text-sm border border-teal-200 transition-all min-h-[48px]"
          >
            Selesai & Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  )
}
