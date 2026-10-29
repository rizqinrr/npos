import { jsPDF } from 'jspdf'
import type { Transaction, TransactionItem, StoreSetting } from '@/db/types'
import { formatRupiah, formatDateTime } from '../utils/currency'

export function generateReceiptText(
  store: StoreSetting,
  transaction: Transaction,
  items: TransactionItem[]
): string {
  const line = '--------------------------------'
  const lines: string[] = [
    store.storeName.toUpperCase(),
    store.storeAddress,
    `Telp: ${store.storePhone}`,
    line,
    `No: ${transaction.receiptNumber}`,
    `Tgl: ${formatDateTime(transaction.createdAt)}`,
    `Metode: ${transaction.paymentMethod}`,
    line
  ]

  items.forEach(item => {
    lines.push(item.productName)
    const qtyPrice = `${item.quantity} x ${formatRupiah(item.unitPrice)}`
    const sub = formatRupiah(item.lineTotal)
    lines.push(`${qtyPrice.padEnd(20)} ${sub.padStart(11)}`)
    if (item.lineDiscount > 0) {
      lines.push(`  Diskon: -${formatRupiah(item.lineDiscount)}`)
    }
  })

  lines.push(line)
  lines.push(`Subtotal:    ${formatRupiah(transaction.subtotal)}`)
  if (transaction.totalDiscount > 0) {
    lines.push(`Diskon Total:${formatRupiah(transaction.totalDiscount)}`)
  }
  lines.push(`TOTAL:       ${formatRupiah(transaction.totalAmount)}`)
  lines.push(`Bayar:       ${formatRupiah(transaction.tenderAmount)}`)
  lines.push(`Kembali:     ${formatRupiah(transaction.changeAmount)}`)
  lines.push(line)
  lines.push(store.receiptFooter)

  return lines.join('\n')
}

export function generateReceiptPdf(
  store: StoreSetting,
  transaction: Transaction,
  items: TransactionItem[]
): jsPDF {
  // 58mm thermal receipt PDF (58mm width, variable height)
  const doc = new jsPDF({
    unit: 'mm',
    format: [58, 140 + items.length * 8]
  })

  let y = 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(store.storeName, 29, y, { align: 'center' })

  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(store.storeAddress, 29, y, { align: 'center' })

  y += 3
  doc.text(`Telp: ${store.storePhone}`, 29, y, { align: 'center' })

  y += 3
  doc.line(4, y, 54, y)

  y += 4
  doc.setFontSize(6.5)
  doc.text(`No: ${transaction.receiptNumber}`, 4, y)
  y += 3
  doc.text(`Tgl: ${formatDateTime(transaction.createdAt)}`, 4, y)
  y += 3
  doc.text(`Metode: ${transaction.paymentMethod}`, 4, y)

  y += 2
  doc.line(4, y, 54, y)

  y += 4
  items.forEach(item => {
    doc.setFont('helvetica', 'bold')
    doc.text(item.productName, 4, y)
    y += 3
    doc.setFont('helvetica', 'normal')
    const qtyPrice = `${item.quantity} x ${formatRupiah(item.unitPrice)}`
    doc.text(qtyPrice, 4, y)
    doc.text(formatRupiah(item.lineTotal), 54, y, { align: 'right' })
    y += 3.5
  })

  doc.line(4, y, 54, y)
  y += 4
  doc.text('Subtotal:', 4, y)
  doc.text(formatRupiah(transaction.subtotal), 54, y, { align: 'right' })

  if (transaction.totalDiscount > 0) {
    y += 3
    doc.text('Diskon:', 4, y)
    doc.text(`-${formatRupiah(transaction.totalDiscount)}`, 54, y, { align: 'right' })
  }

  y += 3.5
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 4, y)
  doc.text(formatRupiah(transaction.totalAmount), 54, y, { align: 'right' })

  y += 3.5
  doc.setFont('helvetica', 'normal')
  doc.text('Bayar:', 4, y)
  doc.text(formatRupiah(transaction.tenderAmount), 54, y, { align: 'right' })

  y += 3
  doc.text('Kembali:', 4, y)
  doc.text(formatRupiah(transaction.changeAmount), 54, y, { align: 'right' })

  y += 4
  doc.line(4, y, 54, y)
  y += 4
  doc.setFontSize(6)
  const footerLines = doc.splitTextToSize(store.receiptFooter, 50)
  doc.text(footerLines, 29, y, { align: 'center' })

  return doc
}

/**
 * Generates raw ESC/POS commands buffer for 58mm/80mm Bluetooth / USB thermal printers
 */
export function generateEscPosBuffer(
  store: StoreSetting,
  transaction: Transaction,
  items: TransactionItem[]
): Uint8Array {
  const encoder = new TextEncoder()
  const bytes: number[] = []

  // ESC @ (Initialize printer)
  bytes.push(0x1b, 0x40)

  // ESC a 1 (Center alignment)
  bytes.push(0x1b, 0x61, 0x01)

  // GS ! 0x11 (Double height + double width for title)
  bytes.push(0x1d, 0x21, 0x11)
  bytes.push(...encoder.encode(store.storeName + '\n'))

  // Normal font
  bytes.push(0x1d, 0x21, 0x00)
  bytes.push(...encoder.encode(store.storeAddress + '\n'))
  bytes.push(...encoder.encode(`Telp: ${store.storePhone}\n`))
  bytes.push(...encoder.encode('--------------------------------\n'))

  // Left alignment
  bytes.push(0x1b, 0x61, 0x00)
  bytes.push(...encoder.encode(`No : ${transaction.receiptNumber}\n`))
  bytes.push(...encoder.encode(`Tgl: ${formatDateTime(transaction.createdAt)}\n`))
  bytes.push(...encoder.encode(`Mtd: ${transaction.paymentMethod}\n`))
  bytes.push(...encoder.encode('--------------------------------\n'))

  // Items
  items.forEach(item => {
    bytes.push(...encoder.encode(`${item.productName}\n`))
    const qtyPrice = `${item.quantity} x ${formatRupiah(item.unitPrice)}`
    const sub = formatRupiah(item.lineTotal)
    // 32 chars line for 58mm
    const spaceCount = Math.max(1, 32 - qtyPrice.length - sub.length)
    const line = qtyPrice + ' '.repeat(spaceCount) + sub + '\n'
    bytes.push(...encoder.encode(line))
  })

  bytes.push(...encoder.encode('--------------------------------\n'))
  bytes.push(...encoder.encode(`Subtotal : ${formatRupiah(transaction.subtotal)}\n`))
  if (transaction.totalDiscount > 0) {
    bytes.push(...encoder.encode(`Diskon   : -${formatRupiah(transaction.totalDiscount)}\n`))
  }
  // Bold Total
  bytes.push(0x1b, 0x45, 0x01)
  bytes.push(...encoder.encode(`TOTAL    : ${formatRupiah(transaction.totalAmount)}\n`))
  bytes.push(0x1b, 0x45, 0x00)
  bytes.push(...encoder.encode(`Bayar    : ${formatRupiah(transaction.tenderAmount)}\n`))
  bytes.push(...encoder.encode(`Kembali  : ${formatRupiah(transaction.changeAmount)}\n`))
  bytes.push(...encoder.encode('--------------------------------\n'))

  // Center alignment for footer
  bytes.push(0x1b, 0x61, 0x01)
  bytes.push(...encoder.encode(store.receiptFooter + '\n'))

  // Feed 4 lines & cut paper
  bytes.push(0x1b, 0x64, 0x04)
  bytes.push(0x1d, 0x56, 0x41, 0x00)

  return new Uint8Array(bytes)
}
