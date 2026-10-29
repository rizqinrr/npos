# Panduan Instalasi & Penggunaan nPOS (Aplikasi Android)

Dokumen ini menjelaskan tata cara instalasi, kompilasi mandiri, dan pengoperasian **nPOS** pada perangkat smartphone maupun tablet Android (berbasis arsitektur **Capacitor Android**).

---

## Daftar Isi
1. [Ikhtisar Arsitektur Android](#1-ikhtisar-arsitektur-android)
2. [Cara Mendapatkan Berkas APK](#2-cara-mendapatkan-berkas-apk)
3. [Instalasi APK pada Smartphone / Tablet](#3-instalasi-apk-pada-smartphone--tablet)
4. [Kompilasi Mandiri di Komputer Lokal (Opsional)](#4-kompilasi-mandiri-di-komputer-lokal-opsional)
5. [Izin Akses & Pengaturan Perangkat](#5-izin-akses--pengaturan-perangkat)
6. [Pengoperasian nPOS di Android](#6-pengoperasian-npos-di-android)
7. [Koneksi Printer Thermal Bluetooth](#7-koneksi-printer-thermal-bluetooth)
8. [Pemecahan Masalah (Troubleshooting)](#8-pemecahan-masalah-troubleshooting)

---

## 1. Ikhtisar Arsitektur Android

Aplikasi Android nPOS dibangun menggunakan **Capacitor 8.6** yang mengintegrasikan mesin React 19 ke dalam runtime native Android WebView bertenaga tinggi:
- **Min SDK:** Android 7.0 (Nougat / API 24).
- **Target SDK:** Android 14+ (API 34/35).
- **Penyimpanan:** SQLite / IndexedDB lokal via WebView Sandbox (data transaksi tersimpan aman di internal memori perangkat dan tidak bergantung pada sinyal internet).

---

## 2. Cara Mendapatkan Berkas APK

Terdapat dua cara mudah untuk memperoleh file instalasi `.apk`:

### Jalur A: Unduh Otomatis dari Cloud Build (GitHub Actions)
Repository nPOS telah dilengkapi alur CI/CD otomatis (*GitHub Actions*):
1. Buka repositori nPOS di browser GitHub Anda.
2. Masuk ke tab **Actions**.
3. Pilih workflow run kompilasi terbaru pada branch `main`.
4. Di bagian bawah (Artifacts), unduh arsip berkas **`npos-android-apk`** (berisi file APK siap pasang).

### Jalur B: Mengambil dari Folder Proyek Lokal
Jika proyek ini sudah pernah dikompilasi sebelumnya, berkas APK telah tersedia di:
```text
d:\01_Coding\nProjects\nPos\release-apk\app-debug.apk
```

---

## 3. Instalasi APK pada Smartphone / Tablet

1. **Transfer Berkas:**  
   Kirimkan file `app-debug.apk` ke HP/Tablet Android Anda melalui kabel data USB, WhatsApp Dokumen, Google Drive, atau Telegram.
2. **Buka File Manager:**  
   Buka aplikasi File Manager / Pengelola File di perangkat Android, lalu temukan file APK tersebut (biasanya di folder `Download`).
3. **Pemberian Izin Instalasi:**  
   Saat pertama kali mengetuk file APK, sistem Android akan menampilkan peringatan keamanan:  
   *"Demi keamanan, ponsel Anda tidak diizinkan memasang aplikasi yang tidak dikenal dari sumber ini"*.  
   $\to$ Masuk ke **Setelan / Settings**, lalu aktifkan **Izinkan dari sumber ini** (*Allow from this source*).
4. **Pasang Aplikasi:**  
   Ketuk **Instal** dan tunggu hingga proses pemasangan selesai.
5. **Buka Aplikasi:**  
   Tekan **Buka** atau cari ikon **nPOS** di beranda aplikasi Android Anda.

---

## 4. Kompilasi Mandiri di Komputer Lokal (Opsional)

Jika Anda seorang pengembang dan ingin melakukan perubahan kode lalu mengompilasi APK sendiri secara lokal di Windows:

### Prasyarat di Komputer:
- **JDK:** Java Development Kit 17 atau 21.
- **Android Studio:** Lengkap dengan Android SDK Build-Tools 34.0.0+.
- **Environment Variables:** `JAVA_HOME` dan `ANDROID_HOME` terpasang di sistem PATH.

### Perintah Kompilasi:
```bash
# 1. Pastikan bundel web terbaru sudah terkompilasi
npm run build

# 2. Sinkronkan bundel web ke dalam direktori native Android
npx cap sync android

# 3. Jalankan kompilasi APK via Gradle Wrapper
cd android
./gradlew assembleDebug
```

Berkas APK hasil kompilasi lokal akan tersimpan di:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Untuk membuka proyek di Android Studio secara langsung:
```bash
npx cap open android
```

---

## 5. Izin Akses & Pengaturan Perangkat

Agar seluruh fitur nPOS berjalan optimal di Android, berikan izin berikut saat diminta:

1. **Penyimpanan Dokumen (*Storage / Files*):**  
   Dibutuhkan saat Anda mengekspor laporan transaksi ke format PDF, ekspor katalog ke Excel (XLSX), atau membuat berkas cadangan database `.npos`.
2. **Kamera (Opsional):**  
   Dibutuhkan jika Anda ingin memindai barcode produk langsung melalui kamera smartphone tanpa alat scanner fisik terpisah.
3. **Perangkat Sekitar (*Nearby Devices / Bluetooth*):**  
   Dibutuhkan pada Android 12 ke atas untuk mendeteksi dan menghubungkan aplikasi ke printer thermal Bluetooth.

---

## 6. Pengoperasian nPOS di Android

Tampilan nPOS pada smartphone Android dirancang ramah satu tangan (*thumb-friendly*):

- **Bottom Navigation Bar:**  
  Navigasi cepat di sisi bawah layar untuk berpindah antar modul: **Kasir**, **Shift**, **Produk**, **Riwayat**, dan **Laporan**.
- **Floating Cart Sheet (Keranjang Melayang):**  
  Pada layar kecil, keranjang transaksi hadir dalam bentuk panel yang dapat digeser ke atas (*bottom sheet*), memungkinkan kasir melihat katalog dengan lega sebelum menyelesaikan pembayaran.
- **Papan Ketik Numerik Cepat:**  
  Kalkulator pembayaran tunai memiliki tombol pecahan uang rupiah instan (*10k, 20k, 50k, 100k*) sehingga kasir tidak perlu mengetik banyak angka secara manual di layar sentuh.
- **Tampilan QRIS Dinamis Pelanggan:**  
  Saat metode pembayaran QRIS dipilih, kode QR otomatis muncul memenuhi layar dengan nominal pas dan kontras tinggi, siap di-scan langsung oleh kamera aplikasi m-Banking atau e-Wallet pembeli di meja kasir.

---

## 7. Koneksi Printer Thermal Bluetooth

nPOS mendukung pencetakan struk menggunakan printer thermal Bluetooth portabel standar (ukuran kertas 58mm maupun 80mm):

1. Hidupkan printer thermal Bluetooth Anda.
2. Buka menu **Pengaturan Bluetooth** di Android HP Anda, lalu lakukan *Pairing* dengan printer (biasanya nama perangkat: `MPT-II`, `RPP02N`, atau `POS-58`). Masukkan PIN standar (umumnya `0000` atau `1234`).
3. Buka aplikasi **nPOS** $\to$ menu **Pengaturan**.
4. Di bagian **Pengaturan Printer**, pilih ukuran kertas (**58 mm** atau **80 mm**).
5. Pada saat transaksi kasir selesai, pilih opsi **Cetak Struk**. Dialog cetak Android akan meneruskan instruksi teks ESC/POS ke printer yang telah terhubung.

---

## 8. Pemecahan Masalah (Troubleshooting)

- **Error: *"App not installed"* / Aplikasi tidak terpasang:**  
  Penyebab umum: Terdapat versi nPOS lama yang terpasang dengan signature/sertifikat yang berbeda. Solusi: Copot (*uninstall*) versi lama terlebih dahulu di HP Anda, kemudian lakukan instalasi ulang file APK baru.
- **Layar putih (*Blank Screen*) saat dibuka pertama kali:**  
  Pastikan perangkat Anda memiliki aplikasi **Android System WebView** versi terkini (dapat diperbarui melalui Google Play Store).
- **Data kasir tidak muncul di perangkat lain:**  
  Perlu diingat bahwa nPOS adalah aplikasi **Offline-First**, artinya basis data tersimpan di memori lokal masing-masing perangkat. Gunakan fitur **Ekspor Cadangan (.npos)** di menu Pengaturan untuk memindahkan data antar perangkat jika diperlukan.
