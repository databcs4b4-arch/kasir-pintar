import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './pages/Dashboard';
import Kasir from './pages/Kasir';
import Produk from './pages/Produk';
import Laporan from './pages/Laporan';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(''); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [halamanAktif, setHalamanAktif] = useState('kasir');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoadingLogin(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        alert('Username atau Password salah! Periksa kembali data login Anda.');
      } else {
        setIsLoggedIn(true);
        setRole(data.role);
        setHalamanAktif(data.role === 'SA' ? 'dashboard' : 'kasir');
      }
    } catch (err) {
      alert('Kendala sistem login: ' + err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setRole(''); setUsername(''); setPassword('');
  };

  // 🔒 MEMAKSA TAMPILAN KOTAK LOGIN ORANYE PREMIUM MUNCUL KEMBALI
  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6', padding: '20px', boxSizing: 'border-box' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '380px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '36px' }}>🏪</span>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#111827', margin: '10px 0 0 0', letterSpacing: '-0.025em' }}>KASIR AI LOGIN</h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Sistem Manajemen Kasir Otentik.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username..." style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600', backgroundColor: 'transparent' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600', backgroundColor: 'transparent' }} />
          </div>
          <button type="submit" disabled={loadingLogin} style={{ background: 'linear-gradient(to right, #ea580c, #f97316)', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)', transition: 'all 0.2s' }}>
            {loadingLogin ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}
          </button>
        </form>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      {/* 🟠 TOP LAYAR: HEADER ORANYE GRADASI PREMIUM (DIKUNCI DAN TERBUNGKUS RESPONSIF) */}
      <nav className="no-print" style={{ 
        background: 'linear-gradient(to right, #ea580c, #f97316)', 
        padding: '14px 20px', 
        display: 'flex', 
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '10px', 
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        flexShrink: 0,
        zIndex: 50
      }}>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '15px', marginRight: '10px', letterSpacing: '-0.02em' }}>
          🏪 TOKO AI ({role === 'SA' ? 'ADMIN' : 'KASIR'})
        </span>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {role === 'SA' && (
            <button onClick={() => setHalamanAktif('dashboard')} style={tombolNavGaya(halamanAktif === 'dashboard')}>📊 Dashboard</button>
          )}
          <button onClick={() => setHalamanAktif('kasir')} style={tombolNavGaya(halamanAktif === 'kasir')}>🏪 Kasir</button>
          {role === 'SA' && (
            <>
              <button onClick={() => setHalamanAktif('produk')} style={tombolNavGaya(halamanAktif === 'produk')}>📦 Produk</button>
              <button onClick={() => setHalamanAktif('laporan')} style={tombolNavGaya(halamanAktif === 'laporan')}>📋 Laporan</button>
            </>
          )}
        </div>

        <button onClick={handleLogout} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '11px', cursor: 'pointer', backgroundColor: 'transparent', color: 'white', marginLeft: 'auto' }}>
          🚪 Keluar
        </button>
      </nav>

      {/* 🟢 AREA TENGAH: INTERNAL SCROLL (TIDAK PERLU SCROLL KELUAR) */}
      <div style={{ flex: 1, overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
        {halamanAktif === 'dashboard' && role === 'SA' && <Dashboard />}
        {halamanAktif === 'kasir' && <Kasir />}
        {halamanAktif === 'produk' && role === 'SA' && <Produk />}
        {halamanAktif === 'laporan' && role === 'SA' && <Laporan />}
      </div>

      {/* 🟠 BOTTOM LAYAR: FOOTER ORANYE GRADASI PREMIUM (TIDAK AKAN HILANG) */}
      <footer className="no-print" style={{ 
        background: 'linear-gradient(to right, #ea580c, #f97316)', 
        padding: '12px 24px', 
        textAlign: 'center', 
        color: 'white', 
        fontSize: '11px', 
        fontWeight: '700',
        letterSpacing: '0.02em',
        flexShrink: 0,
        boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        © {new Date().getFullYear()} Toko AI Pintar - POS Premium v1.0
      </footer>

    </div>
  );

  // Fungsi pembentuk gaya tombol navigasi melengkung horizontal
  function tombolNavGaya(aktif) {
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
}
