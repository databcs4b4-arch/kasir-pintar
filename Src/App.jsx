import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Menghubungkan database
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
      // Mencocokkan username dan password langsung ke tabel Supabase
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

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '32px' }}>🏪</span>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', margin: '10px 0 0 0' }}>KASIR AI LOGIN</h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Sistem Manajemen Akun Terintegrasi Database.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username..." style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600' }} />
          </div>
          <button type="submit" disabled={loadingLogin} style={{ background: 'linear-gradient(to right, #ea580c, #f97316)', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
            {loadingLogin ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
      <nav className="no-print" style={{ background: 'linear-gradient(to right, #ea580c, #f97316)', padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', flexShrink: 0, zIndex: 50 }}>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '16px', marginRight: '16px' }}>
          🏪 TOKO AI PINTAR ({role === 'SA' ? 'SUPER ADMIN' : 'STAFF KASIR'})
        </span>
        {role === 'SA' && (
          <button onClick={() => setHalamanAktif('dashboard')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: halamanAktif === 'dashboard' ? 'rgba(255, 255, 255, 0.25)' : 'transparent', color: 'white' }}>📊 Dashboard AI</button>
        )}
        <button onClick={() => setHalamanAktif('kasir')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: halamanAktif === 'kasir' ? 'rgba(255, 255, 255, 0.25)' : 'transparent', color: 'white' }}>🏪 Menu Kasir</button>
        {role === 'SA' && (
          <>
            <button onClick={() => setHalamanAktif('produk')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: halamanAktif === 'produk' ? 'rgba(255, 255, 255, 0.25)' : 'transparent', color: 'white' }}>📦 Kelola Produk</button>
            <button onClick={() => setHalamanAktif('laporan')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: halamanAktif === 'laporan' ? 'rgba(255, 255, 255, 0.25)' : 'transparent', color: 'white' }}>📋 Laporan Keuangan</button>
          </>
        )}
        <button onClick={handleLogout} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', backgroundColor: 'transparent', color: 'white', marginLeft: 'auto' }}>
          🚪 Keluar
        </button>
      </nav>

      <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
        {halamanAktif === 'dashboard' && role === 'SA' && <Dashboard />}
        {halamanAktif === 'kasir' && <Kasir />}
        {halamanAktif === 'produk' && role === 'SA' && <Produk />}
        {halamanAktif === 'laporan' && role === 'SA' && <Laporan />}
      </div>

      <footer className="no-print" style={{ background: 'linear-gradient(to right, #ea580c, #f97316)', padding: '12px 24px', textAlign: 'center', color: 'white', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
        © {new Date().getFullYear()} Toko AI Pintar - Sistem Kasir Otentik Terenkripsi v1.0
      </footer>
    </div>
  );
}
