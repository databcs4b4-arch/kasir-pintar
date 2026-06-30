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

  // State Baru: Mengontrol Popup Modal Tambah Stok
  const [bukaModalRestock, setBukaModalRestock] = useState(false);
  const [produkTerpilihRestock, setProdukTerpilihRestock] = useState(null);
  const [jumlahInputRestock, setJumlahInputRestock] = useState('');

  const roleUserLokal = sessionStorage.getItem('userRole') || 'User'; 
  const statusHakAksesKasir = roleUserLokal === 'User';

  useEffect(() => {
    ambilProduk();
  }, []);

  const ambilProduk = async () => {
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
        batalEdit(); ambilProduk();
      }
    } else {
      // Pendaftaran produk baru pertama kali, stok_sebelumnya diset 0
      const { error } = await supabase.from('produk').insert([{ ...dataProduk, stok_sebelumnya: 0, is_active: true }]);
      if (error) {
        alert('Gagal menambah produk: ' + error.message);
      } else {
        alert('Produk berhasil ditambahkan!');
        bersihkanForm(); ambilProduk();
      }
    }
    setLoading(false);
  };

  // ✨ FITUR BARU: Logika penambahan kuantitas stok (Restock) via Modal
  const eksekusiTambahStok = async (e) => {
    e.preventDefault();
    if (statusHakAksesKasir) return alert('Akses ditolak!');
    if (!jumlahInputRestock || Number(jumlahInputRestock) <= 0) return alert('Masukkan jumlah yang valid!');
    setLoading(true);

    try {
      const stokLama = produkTerpilihRestock.stok;
      const tambahan = Number(jumlahInputRestock);
      const stokBaruTotal = stokLama + tambahan;

      // Update angka stok_sebelumnya dengan nilai stokLama, dan stok baru dengan akumulasi total
      const { error } = await supabase
        .from('produk')
        .update({ 
          stok_sebelumnya: stokLama, 
          stok: stokBaruTotal 
        })
        .eq('id', produkTerpilihRestock.id);

      if (error) throw error;

      alert(`Sukses menambah +${tambahan} Pcs untuk produk ${produkTerpilihRestock.nama_produk}`);
      setBukaModalRestock(false);
      setProdukTerpilihRestock(null);
      setJumlahInputRestock('');
      ambilProduk();
    } catch (err) {
      alert('Gagal menambah stok: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const pemicuEdit = (p) => {
    if (statusHakAksesKasir) return;
    setIdEdit(p.id); setNama(p.nama_produk); setHarga(p.harga); setStok(p.stok); setBarcode(p.barcode || '');
  };

  const pemicuRestock = (p) => {
    if (statusHakAksesKasir) return alert('Akses ditolak! Kasir tidak boleh menambah stok.');
    setProdukTerpilihRestock(p);
    setBukaModalRestock(true);
  };

  const batalEdit = () => { setIdEdit(null); bersihkanForm(); };
  const bersihkanForm = () => { setNama(''); setHarga(''); setStok(''); setBarcode(''); };

  const ubahStatusKeaktifanProduk = async (id, namaBarang, statusSekarang) => {
    if (statusHakAksesKasir) return alert('Akses ditolak!');
    const konfirmasi = window.confirm(`Apakah Anda yakin?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('produk').update({ is_active: !statusSekarang }).eq('id', id);
    if (!error) { alert('Status produk diperbarui!'); ambilProduk(); }
  };
  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen space-y-8 relative">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Kelola Inventori</h2>
        <p className="text-sm text-gray-500 mt-1">
          {statusHakAksesKasir ? "Mode Lihat Stok Aktif (Hanya Baca Data)" : "Kelola ketersediaan, riwayat audit stok, dan status aktif produk."}
        </p>
      </div>
      
      {/* Form Pendaftaran/Ubah Data Utama */}
      <form onSubmit={simpanProduk} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <h3 className="font-bold text-base text-gray-700">{idEdit ? '✏️ Mode Ubah Data Produk' : '📦 Tambah Produk Baru'}</h3>
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
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Stok Awal</label>
            <input type="number" value={stok} onChange={(e) => setStok(e.target.value)} required={!idEdit} placeholder="Stok" disabled={statusHakAksesKasir || idEdit} style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: idEdit ? '#9ca3af' : '#1f2937', fontWeight: '500', outline: 'none' }} />
          </div>
          <div style={{ flex: 1.5, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Barcode</label>
            <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Opsional" disabled={statusHakAksesKasir} style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ background: idEdit ? 'linear-gradient(to right, #ea580c, #d97706)' : 'linear-gradient(to right, #4f46e5, #2563eb)', marginTop: '12px', display: statusHakAksesKasir ? 'none' : 'block' }} className="w-full text-white py-3 rounded-xl font-bold shadow-md">
          {loading ? 'Memproses...' : idEdit ? '💾 Simpan Perubahan Data' : '➕ Daftarkan Produk Baru'}
        </button>
      </form>
            {/* Tabel Data Mutasi Stok */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '16px' }}>Nama Produk</th>
              <th style={{ padding: '16px' }}>Harga</th>
              
              {/* 🔄 POSISI DISESUAIKAN: Current Stock di kiri, Prev Stock di kanan */}
              <th style={{ padding: '16px', textAlign: 'center', backgroundColor: '#f0fdf4' }}>Current Stock</th>
              <th style={{ padding: '16px', textAlign: 'center', backgroundColor: '#fffbeb' }}>Prev Stock</th>
              
              <th style={{ padding: '16px', textAlign: 'center' }}>Status</th>
              {!statusHakAksesKasir && <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {produkList.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: p.is_active ? 1 : 0.6 }}>
                <td style={{ padding: '16px', fontWeight: '600', color: '#111827' }}>{p.nama_produk}</td>
                <td style={{ padding: '16px', color: '#374151' }}>Rp {p.harga.toLocaleString()}</td>
                
                {/* 🔄 POSISI DATA DISESUAIKAN: Current Stock (Hijau) tampil duluan sebelum Prev Stock (Kuning) */}
                <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#166534', backgroundColor: '#f6fdf9' }}>{p.stok} Pcs</td>
                <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#b45309', backgroundColor: '#fffdf5' }}>{p.stok_sebelumnya} Pcs</td>
                
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 'bold', backgroundColor: p.is_active ? '#ecfdf5' : '#f3f4f6', color: p.is_active ? '#059669' : '#6b7280' }}>
                    {p.is_active ? '🌐 AKTIF' : '🚫 NONAKTIF'}
                  </span>
                </td>
                {!statusHakAksesKasir && (
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button type="button" onClick={() => pemicuRestock(p)} className="bg-emerald-50 text-emerald-700 font-bold py-1.5 px-2.5 rounded-lg text-xs border border-emerald-200 hover:bg-emerald-100 transition">➕ Stok</button>
                      <button type="button" onClick={() => pemicuEdit(p)} className="bg-amber-50 text-amber-700 font-bold py-1.5 px-2.5 rounded-lg text-xs border border-amber-200">✏️ Edit</button>
                      <button type="button" onClick={() => ubahStatusKeaktifanProduk(p.id, p.nama_produk, p.is_active)} style={{ backgroundColor: p.is_active ? '#fff1f2' : '#eff6ff', color: p.is_active ? '#e11d48' : '#2563eb' }} className="font-bold py-1.5 px-2.5 rounded-lg text-xs border">
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

      {/* JENDELA POPUP MODAL PENGISIAN ULANG STOK */}
      {bukaModalRestock && produkTerpilihRestock && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
          <form onSubmit={eksekusiTambahStok} style={{ backgroundColor: 'white', padding: '28px', borderRadius: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>✨ Pengisian Ulang Produk</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Produk: <b className="text-gray-900">{produkTerpilihRestock.nama_produk}</b></p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '12px', fontSize: '12px', color: '#4b5563' }}>
              <span>Stok Saat Ini: <b>{produkTerpilihRestock.stok} Pcs</b></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="jumlah_restock" style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Kuantitas Tambahan</label>
              <input type="number" id="jumlah_restock" value={jumlahInputRestock} onChange={(e) => setJumlahInputRestock(e.target.value)} required min="1" placeholder="Masukkan jumlah barang masuk..." style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '12px', outline: 'none', fontWeight: 'bold' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button type="button" onClick={() => { setBukaModalRestock(false); setProdukTerpilihRestock(null); }} className="flex-1 py-2.5 border rounded-xl font-bold text-xs text-gray-500 bg-white cursor-pointer">Batal</button>
              <button type="submit" disabled={loading} style={{ background: 'linear-gradient(to right, #059669, #10b981)' }} className="flex-2 py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer shadow-md">
                {loading ? 'Menyimpan...' : '➕ Konfirmasi Masuk Barang'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

