import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  X,
  Banknote,
  QrCode,
  Check,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import type { CartItem } from '@/core/cart/useCart'
import type { StoreSetting, CashierShift } from '@/db/types'
import { db } from '@/db/database'
import { formatRupiah } from '@/core/utils/currency'
import { generateDynamicQRIS } from '@/core/qris/emvco'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  subtotal: number
  totalDiscount: number
  totalAmount: number
  totalQuantity: number
  store: StoreSetting | null
  activeShift: CashierShift | null
  onPaymentSuccess: (transactionId: number) => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  totalDiscount,
  totalAmount,
  totalQuantity,
  store: _store,
  activeShift,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<'CASH' | 'QRIS' | 'SPLIT'>('CASH')
  const [tenderCash, setTenderCash] = useState<number>(totalAmount)
  const [splitCash, setSplitCash] = useState<number>(Math.floor(totalAmount / 2))
  const [qrisQrDataUrl, setQrisQrDataUrl] = useState<string>('')
  const [qrisCountdown, setQrisCountdown] = useState<number>(300) // 5 minutes
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Default merchant QRIS if none set
  const defaultStaticQris = '00020101021126580011ID.CO.QRIS01189360091100000000000215ID10200000000015204581253033605802ID5914TOKO BERKAH6010MAJALENGKA61054541162070703A016304'

  // Reset tender cash whenever modal opens or totalAmount changes
  useEffect(() => {
    if (isOpen) {
      setTenderCash(totalAmount)
      setSplitCash(Math.floor(totalAmount / 2))
      setQrisCountdown(300)
    }
  }, [isOpen, totalAmount])

  // Generate Dynamic QRIS when switching to QRIS or SPLIT
  useEffect(() => {
    if (!isOpen) return
    const qrisAmount = method === 'SPLIT' ? Math.max(0, totalAmount - splitCash) : totalAmount

    async function loadQR() {
      const config = await db.merchant_qris_configs.get(1)
      const basePayload = config?.rawPayload || defaultStaticQris
      const dynamicPayload = generateDynamicQRIS(basePayload, qrisAmount)
      try {
        const url = await QRCode.toDataURL(dynamicPayload, {
          width: 250,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        })
        setQrisQrDataUrl(url)
      } catch (err) {
        console.error('Failed to generate QR code', err)
      }
    }

    if (method === 'QRIS' || method === 'SPLIT') {
      loadQR()
    }
  }, [isOpen, method, totalAmount, splitCash])

  // Timer countdown for QRIS
  useEffect(() => {
    if (!isOpen || (method !== 'QRIS' && method !== 'SPLIT')) return
    const timer = setInterval(() => {
      setQrisCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, method])

  if (!isOpen) return null

  const changeCash = Math.max(0, tenderCash - totalAmount)
  const isCashSufficient = method === 'CASH' ? tenderCash >= totalAmount : true
  const splitQrisAmount = Math.max(0, totalAmount - splitCash)

  // Quick cash buttons
  const cashPresets = [
    totalAmount,
    10000,
    20000,
    50000,
    100000,
    Math.ceil(totalAmount / 50000) * 50000 || 50000,
    Math.ceil(totalAmount / 100000) * 100000 || 100000
  ]
  const uniquePresets = Array.from(new Set(cashPresets)).sort((a, b) => a - b)

  const handleCompleteTransaction = async () => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      const now = Date.now()
      const receiptNumber = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

      // 1. Insert Transaction
      const transactionId = await db.transactions.add({
        receiptNumber,
        createdAt: now,
        paymentMethod: method,
        totalAmount,
        tenderAmount: method === 'CASH' ? tenderCash : totalAmount,
        changeAmount: method === 'CASH' ? changeCash : 0,
        totalQuantity,
        subtotal,
        totalDiscount,
        status: 'COMPLETED',
        shiftId: activeShift?.id
      })

      // 2. Insert Transaction Items & Update Stock Movements
      for (const item of items) {
        await db.transaction_items.add({
          transactionId: transactionId as number,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          notes: item.notes,
          discountType: item.discountType,
          discountValue: item.discountValue,
          discountPerUnit: item.discountPerUnit,
          lineDiscount: item.lineDiscount,
          costPrice: item.costPrice
        })

        // Decrement Product stock
        const currentProd = await db.products.get(item.productId)
        if (currentProd) {
          const newStock = Math.max(0, currentProd.stock - item.quantity)
          await db.products.update(item.productId, { stock: newStock })

          // Add stock movement audit
          await db.stock_movements.add({
            productId: item.productId,
            timestamp: now,
            movementType: 'SALE',
            quantityDelta: -item.quantity,
            stockBefore: currentProd.stock,
            stockAfter: newStock,
            unitCostPrice: currentProd.costPrice,
            referenceType: 'TRANSACTION',
            referenceId: transactionId as number,
            notes: `Penjualan ${receiptNumber}`,
            operatorName: activeShift?.cashierName || 'Kasir'
          })
        }
      }

      // 3. Insert Transaction Payments
      if (method === 'CASH') {
        await db.transaction_payments.add({
          transactionId: transactionId as number,
          paymentMethod: 'CASH',
          amountDue: totalAmount,
          tenderAmount: tenderCash,
          changeAmount: changeCash,
          status: 'COMPLETED',
          createdAt: now
        })
      } else if (method === 'QRIS') {
        await db.transaction_payments.add({
          transactionId: transactionId as number,
          paymentMethod: 'QRIS',
          amountDue: totalAmount,
          tenderAmount: totalAmount,
          changeAmount: 0,
          status: 'COMPLETED',
          createdAt: now
        })
      } else if (method === 'SPLIT') {
        await db.transaction_payments.add({
          transactionId: transactionId as number,
          paymentMethod: 'CASH',
          amountDue: splitCash,
          tenderAmount: splitCash,
          changeAmount: 0,
          status: 'COMPLETED',
          createdAt: now
        })
        await db.transaction_payments.add({
          transactionId: transactionId as number,
          paymentMethod: 'QRIS',
          amountDue: splitQrisAmount,
          tenderAmount: splitQrisAmount,
          changeAmount: 0,
          status: 'COMPLETED',
          createdAt: now
        })
      }

      onPaymentSuccess(transactionId as number)
      onClose()
    } catch (err) {
      console.error('Failed to complete transaction', err)
      alert('Terjadi kesalahan saat memproses pembayaran!')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="bg-teal-800 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base sm:text-lg">Pilih Metode Pembayaran</h3>
            <p className="text-xs text-teal-200">
              Total Tagihan: <span className="font-black font-mono text-white text-sm sm:text-base">{formatRupiah(totalAmount)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setMethod('CASH')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all min-h-[44px] ${
              method === 'CASH'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Tunai</span>
          </button>
          <button
            onClick={() => setMethod('QRIS')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all min-h-[44px] ${
              method === 'QRIS'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QRIS Dinamis</span>
          </button>
          <button
            onClick={() => setMethod('SPLIT')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all min-h-[44px] ${
              method === 'SPLIT'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Split Payment</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: TUNAI */}
          {method === 'CASH' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={tenderCash || ''}
                    onChange={e => setTenderCash(Number(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Cash Presets */}
              <div>
                <span className="text-xs text-slate-500 font-semibold mb-2 block">
                  Nominal Cepat:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {uniquePresets.map(val => (
                    <button
                      key={val}
                      onClick={() => setTenderCash(val)}
                      className={`py-2.5 px-2 text-xs rounded-xl font-bold font-mono border transition-all min-h-[44px] ${
                        tenderCash === val
                          ? 'bg-teal-50 border-teal-700 text-teal-800 ring-2 ring-teal-700/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {val === totalAmount ? 'Uang Pas' : formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian Box */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isCashSufficient
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold uppercase">
                    {isCashSufficient ? 'Uang Kembalian' : 'Uang Kurang'}
                  </span>
                  <p className="text-2xl font-black font-mono">
                    {isCashSufficient
                      ? formatRupiah(changeCash)
                      : `-${formatRupiah(totalAmount - tenderCash)}`}
                  </p>
                </div>
                {isCashSufficient ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QRIS DINAMIS */}
          {method === 'QRIS' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Berlaku: {formatCountdown(qrisCountdown)}</span>
              </div>

              <div className="p-3 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
                {qrisQrDataUrl ? (
                  <img
                    src={qrisQrDataUrl}
                    alt="QRIS Dinamis"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                    Membuat Kode QR...
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Arahkan pelanggan memindai kode QRIS di atas dengan aplikasi mobile banking atau e-wallet apa pun.
                </p>
                <p className="text-xs text-teal-700 font-semibold mt-1">
                  Nominal pas otomatis tertera: {formatRupiah(totalAmount)}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SPLIT PAYMENT */}
          {method === 'SPLIT' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Porsi Tunai (Cash):
                  </label>
                  <input
                    type="number"
                    value={splitCash || ''}
                    onChange={e => {
                      const val = Math.min(totalAmount, Math.max(0, Number(e.target.value) || 0))
                      setSplitCash(val)
                    }}
                    className="w-full px-3 py-2 border rounded-lg font-bold text-slate-800 bg-white"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Sisa QRIS:</span>
                  <span className="font-bold text-teal-700">{formatRupiah(splitQrisAmount)}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                {qrisQrDataUrl && (
                  <img
                    src={qrisQrDataUrl}
                    alt="QRIS Split"
                    className="w-40 h-40 border rounded-xl p-2 bg-white"
                  />
                )}
                <span className="text-xs text-slate-400 mt-1">
                  QRIS untuk sisa tagihan: {formatRupiah(splitQrisAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all min-h-[48px]"
          >
            Batal
          </button>
          <button
            disabled={!isCashSufficient || isProcessing}
            onClick={handleCompleteTransaction}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-black text-sm flex items-center justify-center space-x-2 transition-all min-h-[48px] ${
              isCashSufficient && !isProcessing
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.99]'
                : 'bg-slate-200 cursor-not-allowed text-slate-400'
            }`}
          >
            <Check className="w-5 h-5" />
            <span>{isProcessing ? 'Memproses...' : 'Selesaikan Transaksi'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
