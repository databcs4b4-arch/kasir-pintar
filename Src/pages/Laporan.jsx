import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Laporan() {
  const [jenisLaporan, setJenisLaporan] = useState('harian'); // harian / bulanan
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [riwayatTx, setRiwayatTx] = useState([]);
  const [omzet, setOmzet] = useState(0);
  const [totalTx, setTotalTx] = useState(0);

  useEffect(() => {
    tarikDataLaporan();
  }, [jenisLaporan, filterTanggal, filterBulan]);

  const tarikDataLaporan = async () => {
    try {
      let query = supabase.from('transaksi').select('*').order('tanggal_transaksi', { ascending: false });

      if (jenisLaporan === 'harian') {
        // Ambil data dari jam 00:00:00 sampai 23:59:59 di tanggal terpilih
        query = query
          .gte('tanggal_transaksi', `${filterTanggal}T00:00:00.000Z`)
          .lte('tanggal_transaksi', `${filterTanggal}T23:59:59.999Z`);
      } else {
        // Ambil data berdasarkan bulan terpilih (contoh: 2026-06)
        const [tahun, bulan] = filterBulan.split('-');
        const hariTerakhir = new Date(tahun, bulan, 0).getDate();
        query = query
          .gte('tanggal_transaksi', `${filterBulan}-01T00:00:00.000Z`)
          .lte('tanggal_transaksi', `${filterBulan}-${hariTerakhir}T23:59:59.999Z`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        setRiwayatTx(data);
        setTotalTx(data.length);
        setOmzet(data.reduce((sum, item) => sum + item.total_harga, 0));
      }
    } catch (err) {
      console.error('Gagal menarik laporan:', err.message);
    }
  };

  // Fungsi memicu jendela cetak browser (Bisa simpan jadi PDF atau print kertas)
  const cetakLaporan = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen printable-area">
      {/* Header Laporan (Otomatis tersembunyi saat dicetak jika pakai css tambahan) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5 no-print">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Laporan Penjualan</h2>
          <p className="text-sm text-gray-500 mt-1">Tarik ringkasan omzet dan riwayat nota transaksi harian atau bulanan.</p>
        </div>
        
        {/* Kontrol Filter */}
        <div className="mt-4 md:mt-0 flex flex-wrap gap-4 items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <select value={jenisLaporan} onChange={(e) => setJenisLaporan(e.target.value)} className="p-2 border rounded-lg text-sm font-semibold bg-gray-50 outline-none">
            <option value="harian">📅 Laporan Harian</option>
            <option value="bulanan">📆 Laporan Bulanan</option>
          </select>

          {jenisLaporan === 'harian' ? (
            <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="p-2 border rounded-lg text-sm outline-none bg-gray-50 font-medium" />
          ) : (
            <input type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="p-2 border rounded-lg text-sm outline-none bg-gray-50 font-medium" />
          )}

          <button onClick={cetakLaporan} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-lg shadow transition flex items-center gap-1">
            🖨️ Cetak / PDF
          </button>
        </div>
      </div>

      {/* Tampilan Khusus Judul Saat Dicetak Ke Kertas / PDF */}
      <div className="hidden print:block text-center space-y-2 border-b-2 pb-4 border-gray-800">
        <h1 className="text-2xl font-bold uppercase tracking-wide">Laporan Keuangan Toko</h1>
        <p className="text-sm">Periode Laporan: {jenisLaporan === 'harian' ? filterTanggal : filterBulan}</p>
      </div>
      
      {/* 2 Kolom Ringkasan Data Keuangan */}
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '24px' }}>
        <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #059669, #047857)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', uppercase: 'true', opacity: 0.9, margin: 0 }}>Total Omzet Pendapatan</p>
          <p style={{ fontSize: '30px', fontWeight: '900', marginTop: '8px', margin: 0 }}>Rp {omzet.toLocaleString()}</p>
        </div>
        <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #4f46e5, #3730a3)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', uppercase: 'true', opacity: 0.9, margin: 0 }}>Total Nota Terbit</p>
          <p style={{ fontSize: '30px', fontWeight: '900', marginTop: '8px', margin: 0 }}>{totalTx} Transaksi</p>
        </div>
      </div>

      {/* Tabel Riwayat Dokumen Transaksi */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', color: '#4b5563', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}>
              <th style={{ padding: '14px' }}>ID Nota</th>
              <th style={{ padding: '14px' }}>Waktu Transaksi</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Total Transaksi</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Jumlah Bayar</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Kembalian</th>
            </tr>
          </thead>
          <tbody>
            {riwayatTx.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>Tidak ada riwayat transaksi pada periode ini.</td>
              </tr>
            ) : (
              riwayatTx.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '14px', fontWeight: '700', color: '#4f46e5' }}>#TX-{tx.id}</td>
                  <td style={{ padding: '14px', color: '#4b5563' }}>{new Date(tx.tanggal_transaksi).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>Rp {tx.total_harga.toLocaleString()}</td>
                  <td style={{ padding: '14px', textAlign: 'right', color: '#111827' }}>Rp {tx.total_bayar.toLocaleString()}</td>
                  <td style={{ padding: '14px', textAlign: 'right', color: '#059669', fontWeight: '600' }}>Rp {tx.kembalian.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
