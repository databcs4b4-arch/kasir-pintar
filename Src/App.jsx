import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './pages/Dashboard';
import Kasir from './pages/Kasir';
import Produk from './pages/Produk';
import Laporan from './pages/Laporan';
import UserManajemen from './pages/UserManajemen';
import Pengaturan from './pages/Pengaturan';
import PesanInternal from './pages/PesanInternal';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(''); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [halamanAktif, setHalamanAktif] = useState('kasir');
  
  // KOREKSI UTAMA: Mendaftarkan state loading agar tombol login tidak freeze saat diklik
  const [loadingLogin, setLoadingLogin] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoadingLogin(true);

    try {
      // Mencari kecocokan akun langsung ke database Supabase secara real-time
      const { data: userDitemukan, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .eq('password', password)
        .single();

      if (error || !userDitemukan) {
        alert('Username atau Password salah! Periksa kembali data login Anda.');
      } else {
        // Catat otomatis data absensi masuk karyawan ke database harian
        await supabase.from('absensi').insert([
          { username: userDitemukan.username, role: userDitemukan.role }
        ]);

        // Simpan status jabatan di memori browser harian
        sessionStorage.setItem('userRole', userDitemukan.role);
        sessionStorage.setItem('usernameLokal', userDitemukan.username);

        
        setIsLoggedIn(true);
        setRole(userDitemukan.role);
        setHalamanAktif(userDitemukan.role === 'SA' ? 'dashboard' : 'kasir');
      }
    } catch (err) {
      alert('Kendala sistem login: ' + err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('usernameLokal');
    setIsLoggedIn(false); setRole(''); setUsername(''); setPassword('');
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '380px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '36px' }}>🏪</span>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#111827', margin: '10px 0 0 0' }}>Kasir Digital</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username..." style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600' }} />
          </div>
          <button type="submit" disabled={loadingLogin} style={{ background: 'linear-gradient(to right, #1b7294, #2e95be)', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
            {loadingLogin ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}
          </button>
        </form>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      {/* HEADER NAVIGASI BAR ATAS ORANYE */}
      <nav className="no-print" style={{ background: 'linear-gradient(to right, #1b7294, #2e95be)', padding: '14px 20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', flexShrink: 0, zIndex: 50 }}>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '15px', marginRight: '10px' }}>🏪 Kasir Digital({role === 'SA' ? 'ADMIN' : 'KASIR'})</span>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {(role === 'SA' || role === 'User') && (
            <button onClick={() => setHalamanAktif('dashboard')} style={tombolNavGaya(halamanAktif === 'dashboard')}>📊 Dashboard</button>
          )}
          
          <button onClick={() => setHalamanAktif('kasir')} style={tombolNavGaya(halamanAktif === 'kasir')}>🏪 Kasir</button>
          
          {(role === 'SA' || role === 'User') && (
            <button onClick={() => setHalamanAktif('produk')} style={tombolNavGaya(halamanAktif === 'produk')}>📦 Produk</button>
          )}
          <button onClick={() => setHalamanAktif('pesan')} style={tombolNavGaya(halamanAktif === 'pesan')}>📝 Catatan</button>

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

      {/* AREA TENGAH: ROUTING HALAMAN AKTIF */}
      <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
        {halamanAktif === 'dashboard' && (role === 'SA' || role === 'User') && <Dashboard />}
        {halamanAktif === 'kasir' && <Kasir />}
        {halamanAktif === 'produk' && (role === 'SA' || role === 'User') && <Produk />}
        {halamanAktif === 'pesan' && <PesanInternal />} 
        {halamanAktif === 'laporan' && role === 'SA' && <Laporan />}
        {halamanAktif === 'karyawan' && role === 'SA' && <UserManajemen />}
        {halamanAktif === 'setting' && role === 'SA' && <Pengaturan />}
      </div>

      {/* FOOTER BAWAH ELEGAN */}
      <footer className="no-print" style={{ background: 'linear-gradient(to right, #1b7294, #2e95be)', padding: '12px 24px', textAlign: 'center', color: 'white', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
        © {new Date().getFullYear()} Kasir Digital - POS Premium v1.0
      </footer>
    </div>
  );

  function tombolNavGaya(aktif) {
    return { padding: '8px 14px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', color: 'white', backgroundColor: aktif ? 'rgba(255, 255, 255, 0.25)' : 'transparent' };
  }
}
