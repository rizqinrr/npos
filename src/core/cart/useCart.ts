import { useState, useMemo } from 'react'
import type { Product } from '@/db/types'

export interface CartItem {
  productId: number
  productName: string
  productSku?: string
  unitPrice: number
  costPrice?: number
  quantity: number
  notes: string
  discountType?: 'PERCENT' | 'AMOUNT'
  discountValue: number
  discountPerUnit: number
  lineDiscount: number
  lineTotal: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = (product: Product) => {
    const prodId = product.id
    if (!prodId) return
    setItems(current => {
      const existing = current.find(i => i.productId === prodId)
      if (existing) {
        return current.map(i => {
          if (i.productId === prodId) {
            const newQty = i.quantity + 1
            const lineDisc = i.discountType === 'PERCENT'
              ? Math.round((i.unitPrice * (i.discountValue / 100)) * newQty)
              : i.discountValue * newQty
            return {
              ...i,
              quantity: newQty,
              lineDiscount: lineDisc,
              lineTotal: (i.unitPrice * newQty) - lineDisc
            }
          }
          return i
        })
      }

      return [
        ...current,
        {
          productId: prodId,
          productName: product.name,
          productSku: product.sku,
          unitPrice: product.salePrice,
          costPrice: product.costPrice,
          quantity: 1,
          notes: '',
          discountValue: 0,
          discountPerUnit: 0,
          lineDiscount: 0,
          lineTotal: product.salePrice
        }
      ]
    })
  }

  const updateQuantity = (productId: number, qtyOrDelta: number, isAbsolute = false) => {
    setItems(current =>
      current
        .map(i => {
          if (i.productId === productId) {
            const newQty = isAbsolute ? qtyOrDelta : i.quantity + qtyOrDelta
            if (newQty <= 0) return null
            const lineDisc = i.discountType === 'PERCENT'
              ? Math.round((i.unitPrice * (i.discountValue / 100)) * newQty)
              : i.discountValue * newQty
            return {
              ...i,
              quantity: newQty,
              lineDiscount: lineDisc,
              lineTotal: (i.unitPrice * newQty) - lineDisc
            }
          }
          return i
        })
        .filter((i): i is CartItem => i !== null)
    )
  }

  const setItemDiscount = (productId: number, type: 'PERCENT' | 'AMOUNT', value: number) => {
    setItems(current =>
      current.map(i => {
        if (i.productId === productId) {
          const discountPerUnit = type === 'PERCENT'
            ? Math.round(i.unitPrice * (value / 100))
            : value
          const lineDisc = discountPerUnit * i.quantity
          return {
            ...i,
            discountType: type,
            discountValue: value,
            discountPerUnit,
            lineDiscount: lineDisc,
            lineTotal: Math.max(0, (i.unitPrice * i.quantity) - lineDisc)
          }
        }
        return i
      })
    )
  }

  const removeItem = (productId: number) => {
    setItems(current => current.filter(i => i.productId !== productId))
  }

  const clearCart = () => {
    setItems([])
  }

  const summary = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0)
    const totalDiscount = items.reduce((acc, i) => acc + i.lineDiscount, 0)
    const totalAmount = items.reduce((acc, i) => acc + i.lineTotal, 0)
    const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0)
    return { subtotal, totalDiscount, totalAmount, totalQuantity }
  }, [items])

  return {
    items,
    addToCart,
    updateQuantity,
    setItemDiscount,
    removeItem,
    clearCart,
    ...summary
  }
}
