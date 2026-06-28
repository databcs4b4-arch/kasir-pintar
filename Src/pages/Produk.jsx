import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Produk() {
  const [produkList, setProdukList] = useState([]);
  const [idEdit, setIdEdit] = useState(null);
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  const roleUserLokal = sessionStorage.getItem('userRole') || 'User'; 
  const statusHakAksesKasir = roleUserLokal === 'User';

  useEffect(() => {
    ambilProduk();
  }, []);

  const ambilProduk = async () => {
    // Tarik semua produk (baik yang aktif maupun nonaktif) untuk halaman kelola admin
    const { data, error } = await supabase.from('produk').select('*').order('id', { ascending: false });
    if (!error) setProdukList(data || []);
  };

  const simpanProduk = async (e) => {
    e.preventDefault();
    if (statusHakAksesKasir) return alert('Akses ditolak!');
    if (!nama || !harga || !stok) return alert('Mohon isi semua data utama!');
    setLoading(true);

    const dataProduk = {
      nama_produk: nama,
      harga: Number(harga),
      stok: Number(stok),
      barcode: barcode || null
    };

    if (idEdit) {
      const { error } = await supabase.from('produk').update(dataProduk).eq('id', idEdit);
      if (error) {
        alert('Gagal memperbarui produk: ' + error.message);
      } else {
        alert('Produk berhasil diperbarui!');
        batalEdit();
        ambilProduk();
      }
    } else {
      // Produk baru otomatis berstatus aktif (true)
      const { error } = await supabase.from('produk').insert([{ ...dataProduk, is_active: true }]);
      if (error) {
        alert('Gagal menambah produk: ' + error.message);
      } else {
        alert('Produk berhasil ditambahkan!');
        bersihkanForm();
        ambilProduk();
      }
    }
    setLoading(false);
  };

  const pemicuEdit = (p) => {
    if (statusHakAksesKasir) return;
    setIdEdit(p.id); setNama(p.nama_produk); setHarga(p.harga); setStok(p.stok); setBarcode(p.barcode || '');
  };

  const batalEdit = () => { setIdEdit(null); bersihkanForm(); };
  const bersihkanForm = () => { setNama(''); setHarga(''); setStok(''); setBarcode(''); };

  // 📝 FITUR BARU: Fungsi untuk mengubah status keaktifan (Sakelar Aktif / Nonaktif)
  const ubahStatusKeaktifanProduk = async (id, namaBarang, statusSekarang) => {
    if (statusHakAksesKasir) return alert('Akses ditolak!');
    const aksiTeks = statusSekarang ? 'MENONAKTIFKAN' : 'MENGAKTIFKAN KEMBALI';
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin ${aksiTeks} produk "${namaBarang}"?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('produk').update({ is_active: !statusSekarang }).eq('id', id);
    if (error) {
      alert('Gagal mengubah status: ' + error.message);
    } else {
      alert(`Produk berhasil di${statusSekarang ? 'nonaktifkan' : 'aktifkan kembali'}!`);
      ambilProduk();
    }
  };
  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Kelola Inventori</h2>
        <p className="text-sm text-gray-500 mt-1">
          {statusHakAksesKasir ? "Mode Lihat Stok Aktif (Hanya Baca Data)" : "Kelola ketersediaan dan status aktif menu produk toko Anda."}
        </p>
      </div>
      
      <form onSubmit={simpanProduk} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <h3 className="font-bold text-base text-gray-700 flex items-center gap-2">{idEdit ? '✏️ Mode Ubah Data Produk' : '📦 Tambah Produk Baru'}</h3>
          {idEdit && <button type="button" onClick={batalEdit} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold border">Batal</button>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Nama Produk</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder={statusHakAksesKasir ? "Terkunci" : "Masukkan nama..."} disabled={statusHakAksesKasir} style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Harga (Rp)</label>
            <input type="number" value={harga} onChange={(e) => setHarga(e.target.value)} required placeholder="Harga" disabled={statusHakAksesKasir} style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Stok</label>
            <input type="number" value={stok} onChange={(e) => setStok(e.target.value)} required placeholder="Stok" disabled={statusHakAksesKasir} style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }} />
          </div>
          <div style={{ flex: 1.5, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Barcode</label>
            <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Opsional" disabled={statusHakAksesKasir} style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ background: idEdit ? 'linear-gradient(to right, #ea580c, #d97706)' : 'linear-gradient(to right, #4f46e5, #2563eb)', marginTop: '12px', display: statusHakAksesKasir ? 'none' : 'block' }} className="w-full text-white py-3 rounded-xl font-bold shadow-md">
          {loading ? 'Memproses...' : idEdit ? '💾 Simpan Perubahan' : '➕ Daftarkan Produk Baru'}
        </button>
      </form>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '16px' }}>Nama Produk</th>
              <th style={{ padding: '16px' }}>Harga</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Stok</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Status</th>
              {!statusHakAksesKasir && <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {produkList.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: p.is_active ? 1 : 0.6 }}>
                <td style={{ padding: '16px', fontWeight: '600', color: '#111827' }}>{p.nama_produk}</td>
                <td style={{ padding: '16px', color: '#374151' }}>Rp {p.harga.toLocaleString()}</td>
                <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold' }}>{p.stok} Pcs</td>
                
                {/* Lencana Status Keaktifan Baru */}
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 'bold', backgroundColor: p.is_active ? '#ecfdf5' : '#f3f4f6', color: p.is_active ? '#059669' : '#6b7280' }}>
                    {p.is_active ? '🌐 AKTIF' : '🚫 NONAKTIF'}
                  </span>
                </td>

                {!statusHakAksesKasir && (
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button type="button" onClick={() => pemicuEdit(p)} className="bg-amber-50 text-amber-700 font-bold py-1.5 px-3 rounded-lg text-xs border border-amber-200">✏️ Edit</button>
                      
                      {/* Tombol Hapus bertransformasi menjadi tombol Sakelar Aktif/Nonaktif */}
                      <button type="button" onClick={() => ubahStatusKeaktifanProduk(p.id, p.nama_produk, p.is_active)} style={{ backgroundColor: p.is_active ? '#fff1f2' : '#eff6ff', color: p.is_active ? '#e11d48' : '#2563eb', borderColor: p.is_active ? '#fecdd3' : '#bfdbfe' }} className="font-bold py-1.5 px-3 rounded-lg text-xs border">
                        {p.is_active ? '🚫 Sembunyikan' : '👁️ Munculkan'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
