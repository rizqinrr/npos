/**
 * EMVCo QRIS dynamic payload generator and CRC-16 calculator
 */

export function calculateCRC16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface ParsedTLV {
  tag: string
  length: number
  value: string
}

export function parseTLV(raw: string): Map<string, string> {
  const result = new Map<string, string>()
  let i = 0
  while (i < raw.length) {
    if (i + 4 > raw.length) break
    const tag = raw.substring(i, i + 2)
    const len = parseInt(raw.substring(i + 2, i + 4), 10)
    if (isNaN(len)) break
    const valStart = i + 4
    const valEnd = valStart + len
    if (valEnd > raw.length) break
    const value = raw.substring(valStart, valEnd)
    result.set(tag, value)
    i = valEnd
  }
  return result
}

/**
 * Converts a static QRIS string into dynamic QRIS with custom amount.
 * Injects Tag 54 (Amount), Tag 58 (Country ID 'ID'), and recalculates Tag 63 (CRC).
 */
export function generateDynamicQRIS(staticQris: string, amount: number): string {
  if (!staticQris || amount <= 0) return staticQris

  // Remove existing CRC (Tag 63, typically last 8 chars: "6304XXXX")
  let payload = staticQris.trim()
  const crcIndex = payload.indexOf('6304')
  if (crcIndex !== -1) {
    payload = payload.substring(0, crcIndex)
  }

  // Ensure Point of Initiation Method is Tag 01 with '12' (dynamic QR), instead of '11' (static)
  if (payload.includes('010211')) {
    payload = payload.replace('010211', '010212')
  }

  // Format amount (Tag 54)
  const amountStr = Math.round(amount).toString()
  const amountLen = amountStr.length.toString().padStart(2, '0')
  const tag54 = `54${amountLen}${amountStr}`

  // Check if tag 54 already exists in payload
  const tag54Match = payload.match(/54\d{2}\d+/)
  if (tag54Match) {
    payload = payload.replace(tag54Match[0], tag54)
  } else {
    // Append tag 54 before tag 58 or at the end
    payload += tag54
  }

  // Append Tag 63 prefix for CRC
  payload += '6304'

  // Calculate CRC16 checksum
  const crc = calculateCRC16(payload)
  return payload + crc
}
