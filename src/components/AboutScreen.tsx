import React from 'react'
import {
  Globe,
  Mail,
  Smartphone,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Code2
} from 'lucide-react'

export const AboutScreen: React.FC = () => {
  return (
    <div className="flex-1 p-3 sm:p-6 bg-slate-100 overflow-y-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-800">Tentang Pengembang & Aplikasi</h2>
        <p className="text-xs text-slate-500">
          Informasi profil pengembang dan spesifikasi sistem aplikasi kasir nPOS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* CARD 1: Profil Pengembang */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            {/* Avatar Badge */}
            <div className="w-20 h-20 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black text-2xl shadow-sm mb-3">
              RN
            </div>

            <h3 className="text-lg font-black text-slate-900">Rizqi Nur</h3>
            <p className="text-xs font-bold text-teal-800 mt-0.5">Software Engineer & Creator</p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs">
              Membangun produk web modern dan aplikasi mobile yang tangguh, cepat, serta berorientasi pada kemudahan pengguna.
            </p>
          </div>

          {/* Social / Portfolio Links */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <a
              href="https://github.com/rizqinrr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all min-h-[44px]"
            >
              <div className="flex items-center space-x-2.5">
                <Code2 className="w-4 h-4 text-slate-800" />
                <span>github.com/rizqinrr</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="https://rizqinrr.github.io/cv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-all min-h-[44px]"
            >
              <div className="flex items-center space-x-2.5">
                <Globe className="w-4 h-4 text-teal-800" />
                <span>Portofolio & CV Online</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
            </a>

            <a
              href="mailto:studyrizqi@gmail.com"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all min-h-[44px]"
            >
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-slate-600" />
                <span>studyrizqi@gmail.com</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* CARD 2: Spesifikasi & Fitur nPOS */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <Cpu className="w-5 h-5 text-teal-800" />
              <div>
                <h3 className="font-black text-sm text-slate-800">nPOS — Smart Point of Sale Engine</h3>
                <p className="text-[11px] text-slate-400">Versi 2.0 &bull; Dual Target Platform (Web & Native Android)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              nPOS dirancang khusus dengan arsitektur <strong>100% Offline-First</strong> untuk keandalan operasional kasir ritel & F&B tanpa ketergantungan pada koneksi internet. Semua data disimpan secara lokal pada memori perangkat menggunakan mesin <em>IndexedDB</em> berkinerja tinggi.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Offline-First (20 Tabel)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Basis data lokal Dexie.js lengkap dengan riwayat audit stok, HPP modal, dan rekonsiliasi kas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>QRIS Dinamis EMVCo</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Kalkulasi checksum CRC-16-CCITT dan Tag 54 lokal otomatis tanpa server pihak ketiga.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  <span>Native Android & PWA</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dapat di-install sebagai APK Android (Capacitor) atau langsung via PWA Chrome di tablet kasir.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Cetak Struk ESC/POS</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dukungan printer thermal 58mm & 80mm via Web Bluetooth dan cetak dokumen nota PDF.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Teknologi & Framework
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['React 19', 'TypeScript', 'Vite 8', 'Tailwind CSS v4', 'Capacitor 8', 'Dexie.js', 'EMVCo QRIS', 'ESC/POS Engine', 'jsPDF'].map(tech => (
                <span
                  key={tech}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded-lg border border-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
