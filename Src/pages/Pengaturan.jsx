import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Pengaturan() {
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telp, setTelp] = useState('');
  const [pesan, setPesan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ambilPengaturan();
  }, []);

  const ambilPengaturan = async () => {
    const { data } = await supabase.from('pengaturan_toko').select('*').eq('id', 1).single();
    if (data) {
      setNama(data.nama_toko);
      setAlamat(data.alamat_toko);
      setTelp(data.telepon_toko);
      setPesan(data.pesan_bawah);
    }
  };

  const simpanPengaturan = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('pengaturan_toko').update({
      nama_toko: nama,
      alamat_toko: alamat,
      telepon_toko: telp,
      pesan_bawah: pesan
    }).eq('id', 1);

    if (error) {
      alert('Gagal memperbarui pengaturan: ' + error.message);
    } else {
      alert('Template Struk Bluetooth Berhasil Diperbarui!');
      ambilPengaturan();
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Pengaturan Struk</h2>
        <p className="text-sm text-gray-500 mt-1">Sesuaikan nama toko, alamat, dan pesan teks bawah yang akan tercetak di printer bluetooth harian.</p>
      </div>

      <form onSubmit={simpanPengaturan} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6">
        <h3 className="font-bold text-base text-gray-700 border-b border-gray-100 pb-2">⚙️ Kustomisasi Nota Kasir</h3>
        
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Nama Toko di Struk</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '700', outline: 'none' }} onFocus={(e) => e.target.style.borderBottom = '2px solid #ea580c'} onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>
          <div style={{ flex: 1.5, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>No. Telepon / HP</label>
            <input type="text" value={telp} onChange={(e) => setTelp(e.target.value)} required style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '600', outline: 'none' }} onFocus={(e) => e.target.style.borderBottom = '2px solid #ea580c'} onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Alamat Lengkap Toko</label>
            <input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} required style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', outline: 'none' }} onFocus={(e) => e.target.style.borderBottom = '2px solid #ea580c'} onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>
          <div style={{ flex: 2, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Pesan Kaki Struk (Promo/Sosmed)</label>
            <input type="text" value={pesan} onChange={(e) => setPesan(e.target.value)} required style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', outline: 'none' }} onFocus={(e) => e.target.style.borderBottom = '2px solid #ea580c'} onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(to right, #ea2d0c, #e03e16)' }} className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 disabled:bg-gray-400 shadow-md transition-all duration-200">
          {loading ? 'Menyimpan Pengaturan...' : '💾 Terapkan Perubahan Template Struk'}
        </button>
      </form>
    </div>
  );
}
