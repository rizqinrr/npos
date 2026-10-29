# nPOS Design System Direction

Dokumen ini mendefinisikan identitas, gaya visual, tipografi, palet warna, dan standar ergonomi untuk **nPOS** (Point-of-Sale Offline-First).

---

## 1. Identitas & Karakter
- **Produk:** Aplikasi Kasir / Point-of-Sale Offline-First untuk Toko Retail & F&B.
- **Audiens:** Pemilik toko, kasir, dan staf gudang/operasional yang butuh kecepatan, kejelasan angka, dan kemudahan pengoperasian via sentuhan layar atau barcode scanner.
- **Karakter:** Taktis, lugas, presisi, cepat, dan tidak bising secara visual.

## 2. Antislop Dials
- **ENERGY:** 2 — Fungsional, tenang, stabil, mengutamakan keterbacaan data belanja.
- **RHYTHM:** 2 — Hirarki terstruktur jelas antara navigasi, katalog, ringkasan kalkulasi, dan tombol eksekusi.
- **MOTION:** 1 — Transisi instan untuk respon klik kasir tanpa penundaan durasi yang memperlambat transaksi.

## 3. Palet Warna (Capped: 3 Core + 1 Accent)
- **Neutral Base:**
  - Background Canvas: `bg-slate-100` (`#f1f5f9`)
  - Surface Kartu/Panel: `bg-white` (`#ffffff`)
  - Border Halus: `border-slate-200` (`#e2e8f0`)
  - Teks Utama: `text-slate-900` (`#0f172a`)
  - Teks Sekunder: `text-slate-500` (`#64748b`)
  - Teks Redup/Disabled: `text-slate-400` (`#94a3b8`)
- **Brand Primary (Sistem Kasir):**
  - Primary Base: `teal-700` (`#0f766e`)
  - Primary Hover: `teal-800` (`#115e59`)
  - Primary Soft: `teal-50` (`#f0fdfa`)
  - Primary Accent: `teal-600` (`#0d9488`)
- **Action Accent (Tombol Bayar & Sukses):**
  - Positive Action: `emerald-600` (`#059669`)
  - Positive Soft: `emerald-50` (`#ecfdf5`)
- **Alert & Destructive (Retur, Kurang, Hapus):**
  - Destructive: `rose-600` (`#e11d48`)
  - Destructive Soft: `rose-50` (`#fff1f2`)

## 4. Tipografi
- **Body & Controls:** San-serif modern (`Inter`, system UI font stack).
- **Financial / Numbers:** Monospace atau tabular figures (`font-mono` / `tabular-nums`) untuk semua angka harga, total bayar, kembalian, dan jumlah stok agar mudah diinspeksi sejajar.
- **Scale:**
  - H1 Screen: `text-lg font-black` (Mobile) / `text-xl font-black` (Desktop)
  - Card Titles: `text-sm font-bold`
  - Meta/Subtext: `text-xs font-medium`
  - Badges: `text-[10px] font-bold uppercase tracking-wider`
  - Big Financials: `text-2xl font-black font-mono`

## 5. Bentuk & Elevasi
- **Border Radius:**
  - Tombol Utama & Input: `rounded-xl` (12px)
  - Kartu Produk & Container: `rounded-2xl` (16px)
  - Badges: `rounded-md` (6px)
- **Elevation / Shadow:**
  - Elemen di canvas: `shadow-none border border-slate-200`
  - Floating Bottom Bar: `shadow-lg border-t border-slate-200`
  - Modal Popups: `shadow-2xl border border-slate-200`

## 6. Standar Responsivitas Mobile (`antislop-layoutmobile`)
- **Target Sentuh Minimum:** 44 x 44 px untuk semua tombol kuantitas, pecahan uang, dan aksi.
- **Navigasi Mobile:** Bottom Navigation Bar ergonomis untuk satu jempol.
- **Layar Kasir:** Reflow otomatis menjadi katalog 2-kolom + Floating Cart Drawer di layar kecil.
- **Tabel Data:** Reflow menjadi Stacked Card List di layar mobile untuk mencegah horizontal scroll overflow.
