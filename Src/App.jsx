import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Kasir from './pages/Kasir';
import Produk from './pages/Produk';
import Laporan from './pages/Laporan';

export default function App() {
  const [halamanAktif, setHalamanAktif] = useState('dashboard');

  return (
    // Mengunci tinggi penuh di laptop, namun fleksibel di HP agar bisa di-scroll jika layar kekecilan
    <div className="min-h-screen md:h-screen flex flex-col overflow-hidden bg-gray-50">
      
      {/* 🟠 TOP LAYAR: NAVIGASI RESPONSIF ORANYE */}
      <nav className="no-print bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 flex-shrink-0 z-50">
        {/* Nama Toko */}
        <span className="text-white font-black text-base tracking-tight text-center md:text-left md:mr-4">
          🏪 TOKO AI PINTAR
        </span>

        {/* Baris Tombol Navigasi: Otomatis membungkus diri (Wrap) jika di layar HP */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {roleSA() && (
            <button onClick={() => setHalamanAktif('dashboard')} style={tombolGaya(halamanAktif === 'dashboard')}>
              📊 Dashboard
            </button>
          )}
          <button onClick={() => setHalamanAktif('kasir')} style={tombolGaya(halamanAktif === 'kasir')}>
            🏪 Kasir
          </button>
          {roleSA() && (
            <>
              <button onClick={() => setHalamanAktif('produk')} style={tombolGaya(halamanAktif === 'produk')}>
                📦 Produk
              </button>
              <button onClick={() => setHalamanAktif('laporan')} style={tombolGaya(halamanAktif === 'laporan')}>
                📋 Laporan
              </button>
            </>
          )}
        </div>

        {/* Tombol Keluar Otomatis Pindah ke Kanan di Laptop, Tengah di HP */}
        <button onClick={handleLogout} className="md:ml-auto border border-white/40 hover:bg-white/10 text-white font-bold text-xs py-2 px-4 rounded-xl transition duration-200">
          🚪 Keluar
        </button>
      </nav>

      {/* 🟢 AREA KONTEN TENGAH: INTERNAL SCROLL */}
      <div className="flex-1 overflow-y-auto w-full">
        {halamanAktif === 'dashboard' && <Dashboard />}
        {halamanAktif === 'kasir' && <Kasir />}
        {halamanAktif === 'produk' && <Produk />}
        {halamanAktif === 'laporan' && <Laporan />}
      </div>

      {/* 🟠 BOTTOM LAYAR: FOOTER TERKUNCI */}
      <footer className="no-print bg-gradient-to-r from-orange-600 to-orange-500 py-2.5 text-center text-white text-[10px] md:text-xs font-bold tracking-wide flex-shrink-0 shadow-inner">
        © {new Date().getFullYear()} Toko AI Pintar - POS Responsif v1.0
      </footer>

    </div>
  );

  // Fungsi Pembantu Gaya Tombol Melengkung
  function tombolGaya(aktif) {
    return {
      padding: '8px 14px',
      borderRadius: '10px',
      border: 'none',
      fontWeight: '700',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: aktif ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
      color: 'white'
    };
  }

  // Simulasi pembacaan role lokal aman
  function roleSA() {
    return true; // Mode bypass aman untuk testing, pemicu layout
  }
  function handleLogout() {
    window.location.reload(); // Refresh aman untuk logout
  }
}