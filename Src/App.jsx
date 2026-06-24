import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Kasir from './pages/Kasir';
import Produk from './pages/Produk';
import Laporan from './pages/Laporan';
import UserManajemen from './pages/UserManajemen';
import Pengaturan from './pages/Pengaturan';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(''); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [halamanAktif, setHalamanAktif] = useState('kasir');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'sa123') {
      setIsLoggedIn(true); setRole('SA'); setHalamanAktif('dashboard');
      sessionStorage.setItem('userRole', 'SA');
    } else if (username === 'kasir' && password === 'kasir123') {
      setIsLoggedIn(true); setRole('User'); setHalamanAktif('kasir');
      sessionStorage.setItem('userRole', 'User');
    } else {
      alert('Username atau Password salah!');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    setIsLoggedIn(false); setRole(''); setUsername(''); setPassword('');
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '380px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '36px' }}>🏪</span>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#111827', margin: '10px 0 0 0' }}>KASIR DIGITAL</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username..." style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600' }} />
          </div>
          <button type="submit" style={{ background: 'linear-gradient(to right,  #1b7294, #2e95be)', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>Masuk</button>
        </form>
      </div>
    );
  }

    return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <nav className="no-print" style={{ background: 'linear-gradient(to right, #1b7294, #2e95be)', padding: '14px 20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', flexShrink: 0, zIndex: 50 }}>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '15px', marginRight: '10px' }}>🏪 Kasir Digital ({role === 'SA' ? 'ADMIN' : 'KASIR'})</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* Dashboard kini bisa dibuka oleh Super Admin (SA) MAUPUN Staff Kasir (User) */}
          {(role === 'SA' || role === 'User') && (
            <button onClick={() => setHalamanAktif('dashboard')} style={tombolNavGaya(halamanAktif === 'dashboard')}>📊 Dashboard</button>
          )}
          
          {/* Menu Kasir tetap bisa dibuka oleh semua akun */}
          <button onClick={() => setHalamanAktif('kasir')} style={tombolNavGaya(halamanAktif === 'kasir')}>🏪 Kasir</button>
          
          {/* Menu Produk kini juga dibuka untuk semua akun (Kasir murni read-only di dalamnya) */}
          {(role === 'SA' || role === 'User') && (
            <button onClick={() => setHalamanAktif('produk')} style={tombolNavGaya(halamanAktif === 'produk')}>📦 Produk</button>
          )}

          {/* Menu Laporan, Karyawan, dan Pengaturan TETAP dikunci harian hanya untuk Super Admin (SA) */}
          {role === 'SA' && (
            <>
              <button onClick={() => setHalamanAktif('laporan')} style={tombolNavGaya(halamanAktif === 'laporan')}>📋 Laporan</button>
              <button onClick={() => setHalamanAktif('karyawan')} style={tombolNavGaya(halamanAktif === 'karyawan')}>👥 Karyawan</button>
              <button onClick={() => setHalamanAktif('setting')} style={tombolNavGaya(halamanAktif === 'setting')}>⚙️ Pengaturan</button>
            </>
          )}
        </div>

        <button onClick={handleLogout} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '11px', cursor: 'pointer', backgroundColor: 'transparent', color: 'white', marginLeft: 'auto' }}>🚪 Keluar</button>
      </nav>
      
      {/* KOREKSI VARIABEL BERHASIL: Menggunakan "halamanAktif" secara seragam agar layar tidak putih harian */}
            {/* AREA TENGAH: INTERNAL KONTEN SCROLL */}
      <div style={{ flex: 1, overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
        {halamanAktif === 'dashboard' && (role === 'SA' || role === 'User') && <Dashboard />}
        {halamanAktif === 'kasir' && <Kasir />}
        {halamanAktif === 'produk' && (role === 'SA' || role === 'User') && <Produk />}
        {halamanAktif === 'laporan' && role === 'SA' && <Laporan />}
        {halamanAktif === 'karyawan' && role === 'SA' && <UserManajemen />}
        {halamanAktif === 'setting' && role === 'SA' && <Pengaturan />}
      </div>
      
      <footer className="no-print" style={{ background: 'linear-gradient(to right, #1b7294, #2e95be)', padding: '12px 24px', textAlign: 'center', color: 'white', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
        © {new Date().getFullYear()} Toko Kasir Digital - POS Premium v1.0
      </footer>
    </div>
  );

  function tombolNavGaya(aktif) {
    return { padding: '8px 14px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', color: 'white', backgroundColor: aktif ? 'rgba(255, 255, 255, 0.25)' : 'transparent' };
  }
}

