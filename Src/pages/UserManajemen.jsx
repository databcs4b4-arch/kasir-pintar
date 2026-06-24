import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function UserManajemen() {
  const [userList, setUserList] = useState([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('User'); // Default: Staff Kasir biasa
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ambilDataUser();
  }, []);

  const ambilDataUser = async () => {
    const { data, error } = await supabase.from('users').select('*').order('id', { ascending: false });
    if (!error) setUserList(data || []);
  };

  const simpanUser = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return alert('Mohon isi Username dan Password karyawan!');
    setLoading(true);

    try {
      const { error } = await supabase.from('users').insert([
        { 
          username: usernameInput.toLowerCase().trim(), 
          password: passwordInput, 
          role: roleInput 
        }
      ]);

      if (error) {
        if (error.code === '23505') {
          alert('Gagal: Username tersebut sudah digunakan oleh karyawan lain!');
        } else {
          alert('Gagal menambah karyawan: ' + error.message);
        }
      } else {
        alert('Karyawan baru berhasil didaftarkan!');
        setUsernameInput('');
        setPasswordInput('');
        setRoleInput('User');
        ambilDataUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hapusUser = async (id, namaUser) => {
    if (namaUser === 'admin') return alert('Gagal: Akun utama Super Admin tidak boleh dihapus!');
    
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus akun karyawan "${namaUser}"?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus karyawan: ' + error.message);
    } else {
      alert('Akun karyawan berhasil dihapus!');
      ambilDataUser();
    }
  };

    return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Kelola Karyawan</h2>
        <p className="text-sm text-gray-500 mt-1">Daftarkan staff kasir baru atau hapus hak akses pengguna aplikasi kasir.</p>
      </div>
      
      {/* Form Input Karyawan Desain Minimalis Tanpa Kotak */}
      <form onSubmit={simpanUser} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6">
        <h3 className="font-bold text-base text-gray-700 border-b border-gray-100 pb-2">
          👤 Pendaftaran Akun Staff Baru
        </h3>

        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '20px', flexWrap: 'wrap' }}>
          {/* Kolom 1: Username */}
          <div style={{ flex: 2, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="username_baru" style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
            <input type="text" id="username_baru" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required placeholder="Contoh: Alexander" 
              style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }}
              onFocus={(e) => e.target.style.borderBottom = '2px solid #ea580c'}
              onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>

          {/* Kolom 2: Password */}
          <div style={{ flex: 2, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="password_baru" style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type="text" id="password_baru" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required placeholder="Masukkan sandi..." 
              style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }}
              onFocus={(e) => e.target.style.borderBottom = '2px solid #ea580c'}
              onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>

          {/* Kolom 3: Pilihan Hak Akses / Role Dropdown */}
          <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="role_baru" style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hak Akses</label>
            <select id="role_baru" value={roleInput} onChange={(e) => setRoleInput(e.target.value)} 
              style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '700', outline: 'none' }}>
              <option value="User">👩‍💼 Staff Kasir</option>
              <option value="SA">👑 Super Admin</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(to right, #ea2d0c, #e03e16)', marginTop: '12px' }} className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 disabled:bg-gray-400 shadow-md transition-all duration-200">
          {loading ? 'Mendaftarkan...' : '➕ Daftarkan Akun Karyawan'}
        </button>
      </form>

      {/* Tabel Riwayat Akun Terdaftar */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '16px' }}>Nama Pengguna (Username)</th>
              <th style={{ padding: '16px' }}>Kata Sandi (Password)</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Jabatan (Role)</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }} className="hover:bg-gray-50/80 transition">
                <td style={{ padding: '16px', fontWeight: '700', color: '#111827' }}>👤 {u.username}</td>
                <td style={{ padding: '16px', color: '#4b5563', fontFamily: 'monospace' }}>{u.password}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', backgroundColor: u.role === 'SA' ? '#ffedd5' : '#f3f4f6', color: u.role === 'SA' ? '#ea580c' : '#4b5563' }}>
                    {u.role === 'SA' ? 'SUPER ADMIN' : 'STAFF KASIR'}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button onClick={() => hapusUser(u.id, u.username)} disabled={u.username === 'admin'} style={{ display: u.username === 'admin' ? 'none' : 'inline-block' }} className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-3 rounded-lg transition text-xs border border-rose-200">
                    🗑️ Hapus Akun
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
