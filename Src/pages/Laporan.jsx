import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Laporan() {
  const [pilihanLaporan, setPilihanLaporan] = useState('keuangan'); 
  const [jenisLaporan, setJenisLaporan] = useState('harian'); 
  const [filterTanggal, setFilterTanggal] = useState(new Date().toLocaleDateString('sv-SE'));
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [riwayatTx, setRiwayatTx] = useState([]);
  const [rekapItem, setRekapItem] = useState([]);
  const [dataAbsensi, setDataAbsensi] = useState([]); 
  const [omzet, setOmzet] = useState(0);
  const [totalTx, setTotalTx] = useState(0);

  useEffect(() => {
    tarikDataLaporan();
  }, [pilihanLaporan, jenisLaporan, filterTanggal, filterBulan]);

  const tarikDataLaporan = async () => {
    try {
      let tglMulai = `${filterTanggal}T00:00:00.000Z`;
      let tglSelesai = `${filterTanggal}T23:59:59.999Z`;

      if (jenisLaporan === 'bulanan') {
        const [tahun, bulan] = filterBulan.split('-');
        const hariTerakhir = new Date(tahun, bulan, 0).getDate();
        tglMulai = `${filterBulan}-01T00:00:00.000Z`;
        tglSelesai = `${filterBulan}-${hariTerakhir}T23:59:59.999Z`;
      }

      if (pilihanLaporan === 'keuangan' || pilihanLaporan === 'barang') {
        const { data: dataTx } = await supabase.from('transaksi').select('*').gte('tanggal_transaksi', tglMulai).lte('tanggal_transaksi', tglSelesai).order('tanggal_transaksi', { ascending: false });
        
        if (!dataTx || dataTx.length === 0) {
          setRiwayatTx([]); setTotalTx(0); setOmzet(0); setRekapItem([]);
          return;
        }

        setRiwayatTx(dataTx);
        setTotalTx(dataTx.length);
        setOmzet(dataTx.reduce((sum, item) => sum + item.total_harga, 0));

        const { data: dataDetail } = await supabase.from('detail_transaksi').select('jumlah, produk_id, transaksi_id');
        const { data: dataProduk } = await supabase.from('produk').select('id, nama_produk');

        if (dataDetail && dataProduk) {
          const listIdTx = dataTx.map(tx => tx.id);
          const detailTersaring = dataDetail.filter(dt => listIdTx.includes(dt.transaksi_id));
          const mapNamaProduk = {};
          dataProduk.forEach(p => { mapNamaProduk[p.id] = p.nama_produk; });

          const rekapMurni = {};
          detailTersaring.forEach((item) => {
            const nama = mapNamaProduk[item.produk_id] || `Produk #${item.produk_id}`;
            rekapMurni[nama] = (rekapMurni[nama] || 0) + item.jumlah;
          });

          setRekapItem(Object.keys(rekapMurni).map(nama => ({ nama_produk: nama, total_terjual: rekapMurni[nama] })).sort((a, b) => b.total_terjual - a.total_terjual));
        }
      }

      if (pilihanLaporan === 'absensi') {
        const { data: dataAbsen } = await supabase.from('absensi').select('*').gte('waktu_login', tglMulai).lte('waktu_login', tglSelesai).order('waktu_login', { ascending: false });
        setDataAbsensi(dataAbsen || []);
      }

    } catch (err) {
      console.error('Gagal memuat laporan:', err.message);
    }
  };

  const cetakLaporan = () => { window.print(); };

  // 📥 FITUR BARU: Fungsi Ekspor Excel Otomatis Tanpa Library Eksternal
  const eksporExcel = () => {
    let tabelHtml = document.getElementById('tabel-laporan-toko').outerHTML;
    // Mengubah dokumen tabel menjadi format Blob khusus data spreadsheet Excel
    let blob = new Blob([tabelHtml], { type: 'application/vnd.ms-excel' });
    let url = URL.createObjectURL(blob);
    let linkUnduh = document.createElement('a');
    linkUnduh.href = url;
    linkUnduh.download = `Laporan_${pilihanLaporan}_${jenisLaporan === 'harian' ? filterTanggal : filterBulan}.xls`;
    linkUnduh.click();
  };
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Kontrol Navigasi Atas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5 gap-4 no-print">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Pusat Laporan</h2>
          <p className="text-xs text-gray-500 mt-1">Unduh rekap data keuangan, item terjual, atau absensi staff kasir.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-xs font-semibold">
          <select value={pilihanLaporan} onChange={(e) => setPilihanLaporan(e.target.value)} className="p-2 border rounded-lg bg-orange-50 text-orange-700 outline-none font-bold">
            <option value="keuangan">📈 Laporan Keuangan</option>
            <option value="barang">📦 Rekap Item Terjual</option>
            <option value="absensi">👥 Rekap Absensi Staff</option>
          </select>

          <select value={jenisLaporan} onChange={(e) => setJenisLaporan(e.target.value)} className="p-2 border rounded-lg bg-gray-50 outline-none text-gray-700">
            <option value="harian">📅 Harian</option>
            <option value="bulanan">📆 Bulanan</option>
          </select>

          {jenisLaporan === 'harian' ? (
            <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="p-1.5 border rounded-lg bg-gray-50 outline-none text-gray-700" />
          ) : (
            <input type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="p-1.5 border rounded-lg bg-gray-50 outline-none text-gray-700" />
          )}

          {/* 📥 DUA TOMBOL AKSI: PDF DAN EXCEL */}
          <button onClick={cetakLaporan} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg shadow transition">🖨️ Cetak / PDF</button>
          <button onClick={eksporExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg shadow transition">📊 Excel</button>
        </div>
      </div>

      {/* Header Print */}
      <div className="hidden print:block text-center space-y-1 border-b-2 pb-3 border-gray-800">
        <h1 className="text-xl font-bold uppercase">Laporan {pilihanLaporan} Toko</h1>
        <p className="text-xs">Periode: {jenisLaporan === 'harian' ? filterTanggal : filterBulan}</p>
      </div>

      {/* TAMPILAN KEUANGAN */}
      {pilihanLaporan === 'keuangan' && (
        <div className="space-y-6">
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '20px' }}>
            <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #059669, #047857)', color: 'white', padding: '20px', borderRadius: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Total Omzet Pendapatan</p>
              <p style={{ fontSize: '26px', fontWeight: '900', marginTop: '6px', margin: 0 }}>Rp {omzet.toLocaleString()}</p>
            </div>
            <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #4f46e5, #3730a3)', color: 'white', padding: '20px', borderRadius: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Total Nota Terbit</p>
              <p style={{ fontSize: '26px', fontWeight: '900', marginTop: '6px', margin: 0 }}>{totalTx} Transaksi</p>
            </div>
          </div>
          <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
            <table id="tabel-laporan-toko" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '12px' }}>Nota</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Kembali</th>
                </tr>
              </thead>
              <tbody>
                {riwayatTx.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '20px', color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>Tidak ada transaksi.</td></tr>
                ) : (
                  riwayatTx.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#4f46e5' }}>#TX-{tx.id}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Rp {tx.total_harga.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#059669' }}>Rp {tx.kembalian.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAMPILAN BARANG */}
      {pilihanLaporan === 'barang' && (
        <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
          <table id="tabel-laporan-toko" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ padding: '12px' }}>Nama Barang</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Total Terjual</th>
              </tr>
            </thead>
            <tbody>
              {rekapItem.length === 0 ? (
                <tr><td colSpan="2" style={{ padding: '20px', color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>Belum ada produk terjual.</td></tr>
              ) : (
                rekapItem.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#1f2937' }}>{item.nama_produk}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#4f46e5' }}>{item.total_terjual} Pcs</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAMPILAN ABSENSI */}
      {pilihanLaporan === 'absensi' && (
        <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
          <table id="tabel-laporan-toko" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ padding: '12px' }}>Nama Karyawan (User)</th>
                <th style={{ padding: '12px' }}>Hak Akses (Role)</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Waktu Absen Masuk</th>
              </tr>
            </thead>
            <tbody>
              {dataAbsensi.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: '20px', color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>Tidak ada log absensi masuk pada tanggal ini.</td></tr>
              ) : (
                dataAbsensi.map((absen) => (
                  <tr key={absen.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#1f2937' }}>👤 {absen.username.toUpperCase()}</td>
                    <td style={{ padding: '12px', color: '#4b5563', fontWeight: '600' }}>{absen.role === 'SA' ? 'SUPER ADMIN' : 'STAFF KASIR'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4f46e5', fontWeight: 'bold' }}>{new Date(absen.waktu_login).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
