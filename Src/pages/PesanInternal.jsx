import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function PesanInternal() {
  const [listCatatan, setListCatatan] = useState([]);
  const [catatanInput, setCatatanInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Ambil tanggal hari ini murni (Format: YYYY-MM-DD) sebagai default penguncian data
  const tanggalHariIni = new Date().toLocaleDateString('sv-SE');

  useEffect(() => {
    ambilCatatanInternal();
  }, []);

  const ambilCatatanInternal = async () => {
    // Menarik seluruh data pesan diurutkan berdasarkan tanggal terbaru (created_at descending)
    const { data, error } = await supabase
      .from('catatan_internal')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setListCatatan(data || []);
  };

  const simpanCatatanBaru = async (e) => {
    e.preventDefault();
    if (!catatanInput.trim()) return alert('Isi catatan pesan terlebih dahulu!');
    setLoading(true);

    // Otomatis mendeteksi nama username karyawan yang sedang aktif login dari sessionStorage
    // Catatan: Pastikan sistem login Anda menyimpan nama user, jika kosong default ke 'Staff'
    const userAktif = sessionStorage.getItem('usernameLokal') || 'Staff';

    try {
      const { error } = await supabase.from('catatan_internal').insert([
        {
          tanggal: tanggalHariIni,
          catatan: catatanInput.trim(),
          user_input: userAktif.toUpperCase()
        }
      ]);

      if (error) {
        alert('Gagal mengirim catatan: ' + error.message);
      } else {
        setCatatanInput('');
        ambilCatatanInternal(); // Segarkan tabel instan
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Catatan Internal</h2>
        <p className="text-sm text-gray-500 mt-1">Media koordinasi, pengumuman, dan serah terima informasi.</p>
      </div>

      {/* Form Input Pesan Baru Desain Linear Berjejer */}
      <form onSubmit={simpanCatatanBaru} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-gray-700 border-b border-gray-100 pb-2">📝 Tulis Catatan Baru</h3>
        
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
          {/* Kolom Teks Pengisi Catatan */}
          <div style={{ flex: 4, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="isi_catatan" style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Isi Pesan Catatan</label>
            <input type="text" id="isi_catatan" value={catatanInput} onChange={(e) => setCatatanInput(e.target.value)} required placeholder="Ketik pengumuman atau catatan..." 
              style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }}
              onFocus={(e) => e.target.style.borderBottom = '2px solid #ea580c'}
              onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>

          {/* Tombol Kirim Instan */}
          <div style={{ flex: 1, minWidth: '120px' }}>
            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(to right, #ea580c, #f97316)' }} className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 disabled:bg-gray-400 shadow-sm transition">
              {loading ? 'Mengirim...' : '🚀 Kirim Catatan'}
            </button>
          </div>
        </div>
      </form>

      {/* Tabel Riwayat Dokumen Catatan Diurutkan Paling Baru */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '16px', width: '160px' }}>Tanggal Catatan</th>
              <th style={{ padding: '16px' }}>Isi Catatan Koordinasi</th>
              <th style={{ padding: '16px', width: '130px', textAlign: 'center' }}>User Penginput</th>
            </tr>
          </thead>
          <tbody>
            {listCatatan.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '32px', color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>Belum ada catatan internal yang ditinggalkan.</td></tr>
            ) : (
              listCatatan.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }} className="hover:bg-gray-50/80 transition">
                  <td style={{ padding: '16px', color: '#4b5563', fontWeight: '600' }}>
                    📅 {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px', color: '#111827', fontWeight: '500', lineHeight: '1.5' }}>
                    {item.catatan}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                      👤 {item.user_input}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
