# nPOS - Sistem Kasir Pintar (Point of Sale)

> **Proyek Rekonstruksi REA (Reverse Engineer Anything) dari SIGAP POS v2**  
> **Dua Versi:** Web App (PWA) & Native Android App (APK via Capacitor)  
> **Arsitektur:** Offline-First, TypeScript, React 19, Tailwind CSS, Dexie.js (IndexedDB 20 Tabel)

---

## 🚀 Fitur Utama nPOS

1. **Operasional Kasir Touch-Screen:**
   - Pencarian instan dan navigasi kategori produk.
   - Keranjang belanja interaktif dengan pengaturan diskon per item (persentase `%` atau nominal `Rp`).
   - Kalkulator pembayaran tunai dengan tombol uang pas dan pecahan cepat (*10k, 20k, 50k, 100k*).
   - Perhitungan uang kembalian otomatis.

2. **Pembayaran QRIS Dinamis Lokal:**
   - Konversi QRIS statis merchant menjadi **QRIS Dinamis dengan nominal pas** otomatis (EMVCo Tag 54).
   - Kalkulasi checksum **CRC-16-CCITT** secara lokal tanpa server pihak ketiga.
   - Penghitung waktu kedaluwarsa pesanan (*5 minutes countdown*).
   - Opsi pembayaran terpisah (*Split Payment: Tunai + QRIS*).

3. **Manajemen Shift & Rekonsiliasi Kas Laci (*Cash Float*):**
   - Buka shift dengan pencatatan modal awal uang kas laci.
   - Mutasi Kas Masuk & Kas Keluar non-penjualan dengan alasan operasional.
   - Rekonsiliasi akhir shift: Membandingkan uang fisik riil dengan kas ekspektasi sistem untuk mendeteksi selisih (*Variance: Balanced, Shortage, Overage*).

4. **Katalog Produk, Barcode SKU & Audit Stok:**
   - Master produk dengan harga jual, harga pokok modal (HPP), dan margin keuntungan.
   - Ambang batas stok menipis (*Low-stock alerts*).
   - Jurnal audit pergerakan stok (*Stock Movements*) otomatis untuk penjualan, retur, penerimaan barang, dan opname.

5. **Pemasok (*Suppliers*) & Pengadaan Stok (*Purchasing*):**
   - Direktori vendor dan faktur pesanan beli (*Purchase Orders*).
   - Penerimaan barang (*Goods Receipts*) yang otomatis menambah stok fisik toko dan mencatat jurnal mutasi.

6. **Stock Opname Periodik:**
   - Sesi audit fisik barang gudang/rak toko dengan snapshot stok sistem.
   - Kalkulasi selisih unit dan nilai rupiah kerugian/keuntungan.
   - Penerapan penyesuaian otomatis ke stok katalog.

7. **Riwayat Penjualan & Retur Transaksi:**
   - Cetak ulang struk nota kasir kapan saja.
   - Retur barang per item dengan opsi perlakuan barang: **Restock** (kembali ke rak toko) atau **Scrap** (rusak/dibuang).
   - Kalkulasi pengembalian dana (*refund*) proporsional berdasarkan harga efektif belanja.

8. **Biaya Operasional Toko & Laporan Laba Rugi:**
   - Pencatatan pengeluaran operasional toko (memotong kas laci atau rekening luar).
   - Laporan real-time: Omzet Penjualan, Total HPP, Laba Kotor, Beban Operasional, dan **Laba Bersih (*Net Profit*)**.

9. **Cetak Struk Thermal & Cadangan Basis Data:**
   - Generator ESC/POS thermal printer (58mm dan 80mm).
   - Generator PDF struk belanja dan fitur salin/bagikan teks receipt.
   - Ekspor-impor katalog produk ke spreadsheet Excel (XLSX).
   - Cadangkan & pulihkan database dalam berkas `.npos` (JSON terstruktur 20 tabel).

---

## 🛠️ Peta 20 Entitas Basis Data (Room v7 Parity)

| No | Nama Tabel | Deskripsi |
| :--- | :--- | :--- |
| 1 | `products` | Master katalog produk, harga jual, HPP, stok, barcode/SKU |
| 2 | `categories` | Pengelompokan kategori produk |
| 3 | `transactions` | Nota transaksi belanja kasir |
| 4 | `transaction_items` | Rincian baris belanja, diskon item, HPP modal |
| 5 | `transaction_payments` | Rekapitulasi pembayaran (Tunai, QRIS, Split) |
| 6 | `merchant_qris_configs` | Konfigurasi payload QRIS statis toko |
| 7 | `pending_qris_orders` | Antrean pesanan QRIS dinamis |
| 8 | `cashier_shifts` | Sesi kerja kasir & rekonsiliasi kas laci |
| 9 | `drawer_movements` | Mutasi kas masuk & kas keluar non-penjualan |
| 10 | `transaction_returns` | Nota retur dan pembatalan transaksi |
| 11 | `transaction_return_items` | Rincian barang diretur (Restock vs Scrap) |
| 12 | `stock_movements` | Jurnal audit mutasi stok barang |
| 13 | `stock_opnames` | Sesi stock opname periodik |
| 14 | `stock_opname_items` | Lembar hitung fisik vs sistem per item |
| 15 | `suppliers` | Direktori data pemasok/vendor |
| 16 | `purchases` | Faktur purchase order ke supplier |
| 17 | `purchase_items` | Rincian barang dipesan ke supplier |
| 18 | `goods_receipts` | Penerimaan barang riil dari supplier |
| 19 | `goods_receipt_items` | Rincian barang masuk penambah stok |
| 20 | `expenses` | Beban biaya operasional toko |
| * | `store_settings` | Identitas usaha toko & konfigurasi printer |

---

## 💻 Panduan Menjalankan

### 1. Menjalankan Versi Web (Local Development)
```bash
npm run dev
```
Buka browser pada alamat `http://localhost:5173`.

### 2. Membangun Versi Web PWA Siap Produksi
```bash
npm run build
```
Hasil bundle web produksi akan disimpan di folder `dist/` lengkap dengan Service Worker offline caching dan web manifest.

### 3. Membangun Versi Aplikasi Android APK (via Capacitor)
Pastikan Android Studio & Android SDK telah terpasang di komputer Anda:
```bash
# 1. Bangun asset web & sinkronisasi ke project Android
npm run build
npx cap sync android

# 2. Buka project Android di Android Studio
npx cap open android
```
Di Android Studio, pilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)** untuk menghasilkan berkas `.apk` yang siap dipasang di tablet/HP kasir.
