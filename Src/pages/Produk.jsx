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

  useEffect(() => {
    ambilProduk();
  }, []);

  const ambilProduk = async () => {
    const { data, error } = await supabase.from('produk').select('*').order('id', { ascending: false });
    if (!error) setProdukList(data || []);
  };

  const simpanProduk = async (e) => {
    e.preventDefault();
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
      const { error } = await supabase.from('produk').insert([dataProduk]);
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

  const pemicuEdit = (produk) => {
    setIdEdit(produk.id);
    setNama(produk.nama_produk);
    setHarga(produk.harga);
    setStok(produk.stok);
    setBarcode(produk.barcode || '');
  };

  const batalEdit = () => {
    setIdEdit(null);
    bersihkanForm();
  };

  const bersihkanForm = () => {
    setNama(''); setHarga(''); setStok(''); setBarcode('');
  };

  const hapusProduk = async (id, namaProduk) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus produk "${namaProduk}"?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('produk').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus produk: ' + error.message);
    } else {
      alert('Produk berhasil dihapus!');
      if (idEdit === id) batalEdit();
      ambilProduk();
    }
  };
  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Kelola Inventori</h2>
        <p className="text-sm text-gray-500 mt-1">Tambah, ubah, dan hapus ketersediaan produk toko Anda secara real-time.</p>
      </div>
      
      {/* Form Input Barang Desain Minimalis Tanpa Kotak Tegas */}
      <form onSubmit={simpanProduk} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <h3 className="font-bold text-base text-gray-700 flex items-center gap-2">
            {idEdit ? '✏️ Mode Ubah Data Produk' : '📦 Tambah Produk Baru'}
          </h3>
          {idEdit && (
            <button type="button" onClick={batalEdit} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition font-bold border border-gray-200">
              Batal Edit
            </button>
          )}
        </div>

        {/* Layout Susunan Horizontal Menjalar ke Samping */}
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* Field 1: Nama Produk */}
          <div style={{ flex: 2, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="nama_produk" style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nama Produk
            </label>
            <input type="text" id="nama_produk" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="Masukkan nama barang..." 
              style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderBottom = '2px solid #4f46e5'}
              onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>

          {/* Field 2: Harga Jual */}
          <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="harga_jual" style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Harga (Rp)
            </label>
            <input type="number" id="harga_jual" value={harga} onChange={(e) => setHarga(e.target.value)} required placeholder="Contoh: 15000" 
              style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderBottom = '2px solid #4f46e5'}
              onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>

          {/* Field 3: Jumlah Stok */}
          <div style={{ flex: 1, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="jumlah_stok" style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stok
            </label>
            <input type="number" id="jumlah_stok" value={stok} onChange={(e) => setStok(e.target.value)} required placeholder="Jumlah" 
              style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderBottom = '2px solid #4f46e5'}
              onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>

          {/* Field 4: Kode Barcode */}
          <div style={{ flex: 1.5, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="kode_barcode" style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Barcode
            </label>
            <input type="text" id="kode_barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Opsional" 
              style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderBottom = '2px solid #4f46e5'}
              onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>

        </div>

        <button type="submit" disabled={loading} 
          style={{ background: idEdit ? 'linear-gradient(to right, #ea580c, #d97706)' : 'linear-gradient(to right, #4f46e5, #2563eb)', marginTop: '12px' }}
          className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 disabled:bg-gray-400 shadow-md transition-all duration-200 transform active:scale-[0.99]">
          {loading ? 'Sedang Memproses...' : idEdit ? '💾 Simpan Perubahan Data Produk' : '➕ Daftarkan Produk Baru'}
        </button>
      </form>

      {/* Tabel Daftar Produk */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '16px' }}>Nama Produk</th>
              <th style={{ padding: '16px' }}>Harga</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Stok</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Barcode</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {produkList.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>Belum ada produk terdaftar.</td>
              </tr>
            ) : (
              produkList.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }} className="hover:bg-gray-50/80 transition">
                  <td style={{ padding: '16px', fontWeight: '600', color: '#111827' }}>{p.nama_produk}</td>
                  <td style={{ padding: '16px', color: '#374151' }}>Rp {p.harga.toLocaleString()}</td>
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>{p.stok} Pcs</td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>{p.barcode || '-'}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => pemicuEdit(p)} className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-1.5 px-3 rounded-lg transition text-xs border border-amber-200">✏️ Edit</button>
                      <button onClick={() => hapusProduk(p.id, p.nama_produk)} className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-3 rounded-lg transition text-xs border border-rose-200">🗑️ Hapus</button>
                    </div>
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
