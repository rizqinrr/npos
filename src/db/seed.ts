import { db } from './database'

export async function seedInitialDataIfNeeded() {
  const settingsCount = await db.store_settings.count()
  if (settingsCount === 0) {
    await db.store_settings.put({
      id: 1,
      storeName: 'Toko Berkah nPOS',
      storeAddress: 'Jl. Merdeka No. 45, Majalengka',
      storePhone: '0812-3456-7890',
      receiptFooter: 'Terima kasih telah berbelanja!\nBarang yang sudah dibeli dapat ditukar 1x24 jam dengan struk.',
      printerType: 'NONE',
      printerPaperWidth: 58,
      updatedAt: Date.now()
    })
  }

  const categoryCount = await db.categories.count()
  if (categoryCount === 0) {
    const now = Date.now()
    await db.categories.bulkAdd([
      { name: 'Kopi & Minuman', nameNormalized: 'kopi & minuman', createdAt: now },
      { name: 'Makanan & Snack', nameNormalized: 'makanan & snack', createdAt: now },
      { name: 'Sembako', nameNormalized: 'sembako', createdAt: now },
      { name: 'Lainnya', nameNormalized: 'lainnya', createdAt: now }
    ])
  }

  const productCount = await db.products.count()
  if (productCount === 0) {
    const now = Date.now()
    await db.products.bulkAdd([
      {
        name: 'Kopi Susu Gula Aren',
        category: 'Kopi & Minuman',
        salePrice: 18000,
        costPrice: 9000,
        stock: 50,
        lowStockThreshold: 10,
        sku: 'MIN-001',
        skuNormalized: 'min-001',
        createdAt: now
      },
      {
        name: 'Es Teh Manis Jumbo',
        category: 'Kopi & Minuman',
        salePrice: 6000,
        costPrice: 2000,
        stock: 100,
        lowStockThreshold: 20,
        sku: 'MIN-002',
        skuNormalized: 'min-002',
        createdAt: now
      },
      {
        name: 'Roti Bakar Cokelat Keju',
        category: 'Makanan & Snack',
        salePrice: 16000,
        costPrice: 8000,
        stock: 25,
        lowStockThreshold: 5,
        sku: 'MAK-001',
        skuNormalized: 'mak-001',
        createdAt: now
      },
      {
        name: 'Keripik Singkong Pedas',
        category: 'Makanan & Snack',
        salePrice: 12000,
        costPrice: 6500,
        stock: 35,
        lowStockThreshold: 8,
        sku: 'SNK-001',
        skuNormalized: 'snk-001',
        createdAt: now
      },
      {
        name: 'Beras Premium 5kg',
        category: 'Sembako',
        salePrice: 72000,
        costPrice: 64000,
        stock: 20,
        lowStockThreshold: 5,
        sku: 'SEM-001',
        skuNormalized: 'sem-001',
        createdAt: now
      },
      {
        name: 'Minyak Goreng 2L',
        category: 'Sembako',
        salePrice: 35000,
        costPrice: 31000,
        stock: 25,
        lowStockThreshold: 5,
        sku: 'SEM-002',
        skuNormalized: 'sem-002',
        createdAt: now
      }
    ])
  }
}
