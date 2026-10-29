# Panduan Instalasi & Penggunaan nPOS (Web & PWA)

Dokumen ini berisi panduan teknis lengkap untuk menginstal, menjalankan, dan mengoperasikan **nPOS** pada platform Web (Local Development, Production Hosting, serta Progressive Web App / PWA).

---

## Daftar Isi
1. [Persyaratan Sistem](#1-persyaratan-sistem)
2. [Instalasi & Menjalankan di Lokal (Development)](#2-instalasi--menjalankan-di-lokal-development)
3. [Membangun Versi Produksi & Hosting Mandiri](#3-membangun-versi-produksi--hosting-mandiri)
4. [Instalasi Mode PWA (Desktop & Mobile)](#4-instalasi-mode-pwa-desktop--mobile)
5. [Panduan Operasional Fitur Kasir](#5-panduan-operasional-fitur-kasir)
6. [Cadangkan & Pulihkan Data (Backup & Restore)](#6-cadangkan--pulihkan-data-backup--restore)
7. [Pemecahan Masalah (Troubleshooting)](#7-pemecahan-masalah-troubleshooting)

---

## 1. Persyaratan Sistem

- **Runtime:** Node.js versi 20.x atau 22.x LTS.
- **Package Manager:** npm (versi 10+) atau pnpm.
- **Browser:** Peramban modern berbasis Chromium (Google Chrome, Brave Browser, Microsoft Edge) atau Firefox/Safari versi terbaru yang mendukung IndexedDB dan Service Worker.
- **Jaringan:** Hanya dibutuhkan saat instalasi awal dan unduh dependensi. Setelah aplikasi berjalan, seluruh operasi kasir bekerja 100% **Offline-First**.

---

## 2. Instalasi & Menjalankan di Lokal (Development)

Lakukan langkah-langkah berikut di terminal:

```bash
# 1. Masuk ke direktori proyek nPOS
cd d:\01_Coding\nProjects\nPos

# 2. Pasang seluruh dependensi proyek
npm install

# 3. Jalankan server pengembangan Vite
npm run dev
```

Output terminal akan menampilkan alamat server lokal:
```text
  VITE v8.3.5  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Buka peramban dan navigasikan ke `http://localhost:5173`.

---

## 3. Membangun Versi Produksi & Hosting Mandiri

Untuk mempublikasikan nPOS ke server hosting (Vercel, Netlify, Cloudflare Pages, atau VPS Nginx):

```bash
# Kompilasi TypeScript dan bundel aset produksi
npm run build
```

Berkas keluaran siap saji akan disimpan di folder `dist/`.

### Konfigurasi Web Server (Nginx / Apache)
Pastikan server web dikonfigurasi dengan fallback SPA (*Single Page Application*) dan protokol **HTTPS** (wajib agar Service Worker PWA aktif):

**Contoh Blok Nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name pos.tokoanda.com;
    root /var/www/npos/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caching aset statis
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 4. Instalasi Mode PWA (Desktop & Mobile)

nPOS telah dilengkapi manifest PWA dan Service Worker untuk caching aset. Pengguna dapat menginstalnya layaknya aplikasi desktop tanpa bilah alamat URL peramban.

### Pada Google Chrome / Brave Browser (Desktop):
1. Buka URL nPOS (misal `http://localhost:5173` atau URL produksi HTTPS).
2. Perhatikan ikon **Install** (tanda monitor/panah unduh) di sisi kanan bilah alamat (Omnibox).
3. Klik **Install nPOS**.
4. nPOS akan terbuka dalam jendela mandiri (*standalone window*) dan ikon pintasan akan muncul di Desktop / Start Menu.

### Pada Smartphone Android (Chrome Mobile):
1. Buka URL aplikasi nPOS.
2. Tekan menu titik tiga di kanan atas.
3. Pilih **Tambahkan ke Layar Utama** (*Add to Home Screen*) atau **Instal Aplikasi**.

---

## 5. Panduan Operasional Fitur Kasir

Berikut alur kerja standar harian menggunakan nPOS:

### Tahap 1: Pengaturan Identitas Toko
- Masuk ke menu **Pengaturan**.
- Isi nama toko, alamat, nomor telepon/WhatsApp, dan catatan kaki struk (*footer receipt*).
- Jika ingin menggunakan pembayaran QRIS dinamis otomatis, masukkan string **NMID / QRIS Statis** toko Anda pada kolom konfigurasi QRIS.

### Tahap 2: Input Master Produk & Stok
- Masuk ke menu **Produk & Stok**.
- Tambah produk dengan rincian:
  - Nama barang dan kategori.
  - Barcode / SKU (bisa dipindai menggunakan scanner USB/Bluetooth).
  - Harga Pokok Penjualan (HPP modal) dan Harga Jual Kasir.
  - Jumlah stok awal dan ambang batas minimum stok (*low-stock threshold*).

### Tahap 3: Pembukaan Shift Kasir (Wajib di awal hari)
- Masuk ke menu **Shift Kasir**.
- Tekan tombol **Buka Shift**.
- Masukkan **Modal Awal Kas Laci** (misal: Rp 200.000 untuk uang kembalian).
- Shift kini berstatus aktif dan siap mencatat transaksi.

### Tahap 4: Transaksi Belanja Kasir
- Masuk ke menu utama **Kasir**.
- Pilih produk dari katalog atau ketik nama/SKU di kolom pencarian.
- Sesuaikan jumlah item atau tambahkan diskon per baris item (nominal Rp atau persentase %).
- Tekan tombol **Bayar** di keranjang:
  - **Pembayaran Tunai:** Masukkan nominal uang yang diterima pembeli (tersedia tombol cepat uang pas: 10k, 20k, 50k, 100k). Sistem langsung menampilkan uang kembalian.
  - **Pembayaran QRIS:** Sistem langsung men-generate QRIS Dinamis berstandar EMVCo Tag 54 dengan nominal pas rupiah dan timer 5 menit.
  - **Split Payment:** Kombinasikan sebagian tunai dan sisanya QRIS.
- Tekan **Selesaikan Transaksi**. Struk belanja akan langsung tercetak atau tampil di layar.

### Tahap 5: Mutasi Kas Masuk / Keluar Non-Penjualan
- Jika kasir mengambil uang laci untuk operasional mendadak (misal beli es batu atau token listrik), catat di menu **Shift Kasir** $\to$ **Kas Keluar**.
- Jika pemilik menambah modal kas laci di tengah hari, catat via **Kas Masuk**.

### Tahap 6: Penutupan Shift & Rekonsiliasi Kas Laci
- Di akhir jam kerja kasir, buka menu **Shift Kasir**.
- Tekan tombol **Tutup Shift**.
- Hitung uang fisik riil yang ada di laci kasir, lalu input nilainya ke kolom **Uang Fisik Aktual**.
- Sistem akan membandingkan fisik riil dengan ekspektasi sistem:
  - **Balanced:** Pas tanpa selisih.
  - **Shortage:** Selisih minus (uang fisik kurang dari catatan sistem).
  - **Overage:** Selisih plus (uang fisik lebih dari catatan sistem).
- Cetak atau simpan laporan ringkasan shift.

---

## 6. Cadangkan & Pulihkan Data (Backup & Restore)

Karena nPOS bekerja secara **Offline-First**, seluruh basis data (20 tabel) tersimpan di IndexedDB peramban lokal komputer/perangkat Anda.

### Cara Mencadangkan (Backup):
1. Buka menu **Pengaturan** $\to$ bagian **Basis Data & Cadangan**.
2. Klik tombol **Ekspor Cadangan (.npos)**.
3. Berkas JSON terenkapsulasi dengan nama `npos-backup-YYYY-MM-DD.npos` akan otomatis terunduh ke komputer Anda.
4. Simpan berkas ini ke Google Drive atau flashdisk secara berkala.

### Cara Memulihkan (Restore):
1. Buka menu **Pengaturan** $\to$ bagian **Basis Data & Cadangan**.
2. Klik **Pilih Berkas Cadangan** dan pilih berkas `.npos` yang telah disimpan sebelumnya.
3. Konfirmasi pemulihan. Seluruh transaksi, katalog, dan riwayat shift akan dikembalikan seperti sedia kala.

---

## 7. Pemecahan Masalah (Troubleshooting)

- **Data hilang saat browser ditutup:**  
  Pastikan Anda **tidak** menggunakan mode penyamaran (*Incognito / Private Browsing*), karena browser otomatis menghapus IndexedDB saat jendela penyamaran ditutup.
- **Pembaruan aplikasi tidak muncul di layar:**  
  PWA menggunakan Service Worker agresif. Untuk memuat versi terbaru, lakukan *Hard Reload* dengan menekan `Ctrl + F5` (Windows) atau `Cmd + Shift + R` (Mac).
- **Scanner barcode tidak merespons:**  
  Pastikan kursor fokus pada kolom pencarian produk atau gunakan scanner barcode dalam mode HID (Keyboard Emulation).
