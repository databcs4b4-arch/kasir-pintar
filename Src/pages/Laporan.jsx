import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Laporan() {
  const [pilihanLaporan, setPilihanLaporan] = useState('keuangan'); 
  const [jenisLaporan, setJenisLaporan] = useState('harian'); 
  const [filterTanggal, setFilterTanggal] = useState(new Date().toLocaleDateString('sv-SE'));
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); 
  
  const hariIni = new Date().toLocaleDateString('sv-SE');
  const [absenMulai, setAbsenMulai] = useState(hariIni);
  const [absenSelesai, setAbsenSelesai] = useState(hariIni);

  const [riwayatTx, setRiwayatTx] = useState([]);
  const [rekapItem, setRekapItem] = useState([]);
  const [dataAbsensi, setDataAbsensi] = useState([]); 
  const [omzet, setOmzet] = useState(0);
  const [totalTx, setTotalTx] = useState(0);

  useEffect(() => {
    tarikDataLaporan();
  }, [pilihanLaporan, jenisLaporan, filterTanggal, filterBulan, absenMulai, absenSelesai]);

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
        const { data: dataAbsen } = await supabase
          .from('absensi')
          .select('*')
          .gte('waktu_login', `${absenMulai}T00:00:00.000Z`)
          .lte('waktu_login', `${absenSelesai}T23:59:59.999Z`)
          .order('waktu_login', { ascending: true });

        if (!dataAbsen || dataAbsen.length === 0) {
          setDataAbsensi([]);
          return;
        }

        const grupAbsensi = {};
        dataAbsen.forEach((row) => {
          const tanggalSaja = new Date(row.waktu_login).toLocaleDateString('sv-SE');
          const kunciUnik = `${row.username}-${tanggalSaja}`;

          if (!grupAbsensi[kunciUnik]) {
            grupAbsensi[kunciUnik] = {
              username: row.username, role: row.role, tanggal: tanggalSaja, waktu_pertama: row.waktu_login, total_hadir: 1
            };
          } else {
            grupAbsensi[kunciUnik].total_hadir += 1;
          }
        });

        const hasilRekapAbsen = Object.values(grupAbsensi).sort((a, b) => new Date(b.waktu_pertama) - new Date(a.waktu_pertama));
        setDataAbsensi(hasilRekapAbsen);
      }
    } catch (err) { console.error(err); }
  };

  const cetakLaporan = () => { window.print(); };
  const eksekusiExcel = () => {
    let tabelHtml = document.getElementById('tabel-laporan-toko').outerHTML;
    let blob = new Blob([tabelHtml], { type: 'application/vnd.ms-excel' });
    let url = URL.createObjectURL(blob);
    let linkUnduh = document.createElement('a');
    linkUnduh.href = url; linkUnduh.download = `Laporan_${pilihanLaporan}.xls`; linkUnduh.click();
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 pb-5 gap-4 no-print">
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
          {pilihanLaporan !== 'absensi' ? (
            <>
              <select value={jenisLaporan} onChange={(e) => setJenisLaporan(e.target.value)} className="p-2 border rounded-lg bg-gray-50 outline-none text-gray-700"><option value="harian">📅 Harian</option><option value="bulanan">📆 Bulanan</option></select>
              {jenisLaporan === 'harian' ? (
                <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="p-1.5 border rounded-lg bg-gray-50 outline-none text-gray-700" />
              ) : (
                <input type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="p-1.5 border rounded-lg bg-gray-50 outline-none text-gray-700" />
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 border-l pl-2 border-gray-200">
              <div className="flex items-center gap-1"><span className="text-gray-400 text-[10px] uppercase">Dari:</span><input type="date" value={absenMulai} onChange={(e) => setAbsenMulai(e.target.value)} className="p-1 border rounded-lg bg-gray-50 text-gray-700 outline-none" /></div>
              <div className="flex items-center gap-1"><span className="text-gray-400 text-[10px] uppercase">Sampai:</span><input type="date" value={absenSelesai} onChange={(e) => setAbsenSelesai(e.target.value)} className="p-1 border rounded-lg bg-gray-50 text-gray-700 outline-none" /></div>
              <button onClick={() => { setAbsenMulai(hariIni); setAbsenSelesai(hariIni); }} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Today</button>
            </div>
          )}
          <button onClick={cetakLaporan} className="bg-indigo-600 text-white font-bold px-3 py-2 rounded-lg">🖨️ Cetak</button>
          <button onClick={eksekusiExcel} className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-lg">📊 Excel</button>
        </div>
      </div>
      <div className="hidden print:block text-center space-y-1 border-b-2 pb-3 border-gray-800">
        <h1 className="text-xl font-bold uppercase">Laporan {pilihanLaporan}</h1>
        <p className="text-xs">Periode: {pilihanLaporan === 'absensi' ? `${absenMulai} s/d ${absenSelesai}` : (jenisLaporan === 'harian' ? filterTanggal : filterBulan)}</p>
      </div>

      {pilihanLaporan === 'keuangan' && (
        <div className="space-y-6">
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '20px' }}>
            <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #059669, #047857)', color: 'white', padding: '20px', borderRadius: '14px' }}><p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Total Omzet</p><p style={{ fontSize: '26px', fontWeight: '900', marginTop: '6px', margin: 0 }}>Rp {omzet.toLocaleString()}</p></div>
            <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #4f46e5, #3730a3)', color: 'white', padding: '20px', borderRadius: '14px' }}><p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Total Nota</p><p style={{ fontSize: '26px', fontWeight: '900', marginTop: '6px', margin: 0 }}>{totalTx} Transaksi</p></div>
          </div>
          <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
            <table id="tabel-laporan-toko" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead><tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}><th style={{ padding: '12px' }}>Nota</th><th style={{ padding: '12px', textAlign: 'right' }}>Total Tagihan</th><th style={{ padding: '12px', textAlign: 'right' }}>Kembalian</th></tr></thead>
              <tbody>{riwayatTx.length === 0 ? (<tr><td colSpan="3" style={{ padding: '20px', color: '#9ca3af', textAlign: 'center' }}>Tidak ada transaksi.</td></tr>) : (riwayatTx.map((tx) => (<tr key={tx.id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '12px', fontWeight: '700', color: '#4f46e5' }}>#TX-{tx.id}</td><td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Rp {tx.total_harga.toLocaleString()}</td><td style={{ padding: '12px', textAlign: 'right', color: '#059669' }}>Rp {tx.kembalian.toLocaleString()}</td></tr>)))}</tbody>
            </table>
          </div>
        </div>
      )}

      {pilihanLaporan === 'barang' && (
        <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
          <table id="tabel-laporan-toko" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}><th style={{ padding: '12px' }}>Nama Barang</th><th style={{ padding: '12px', textAlign: 'center' }}>Total Terjual</th></tr></thead>
            <tbody>{rekapItem.length === 0 ? (<tr><td colSpan="2" style={{ padding: '20px', color: '#9ca3af', textAlign: 'center' }}>Belum ada produk terjual.</td></tr>) : (rekapItem.map((item, idx) => (<tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '12px', fontWeight: '600' }}>{item.nama_produk}</td><td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#4f46e5' }}>{item.total_terjual} Pcs</td></tr>)))}</tbody>
          </table>
        </div>
      )}

      {pilihanLaporan === 'absensi' && (
        <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
          <table id="tabel-laporan-toko" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}><th style={{ padding: '12px' }}>Tanggal Kerja</th><th style={{ padding: '12px' }}>Nama Karyawan</th><th style={{ padding: '12px' }}>Jabatan</th><th style={{ padding: '12px', textAlign: 'center' }}>Jam Masuk</th><th style={{ padding: '12px', textAlign: 'center' }}>Frekuensi Login</th></tr></thead>
            <tbody>{dataAbsensi.length === 0 ? (<tr><td colSpan="5" style={{ padding: '24px', color: '#9ca3af', textAlign: 'center' }}>Tidak ditemukan rekap absensi.</td></tr>) : (dataAbsensi.map((absen, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: '600', color: '#4b5563' }}>📅 {new Date(absen.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '12px', fontWeight: '700' }}>👤 {absen.username.toUpperCase()}</td>
                <td style={{ padding: '12px' }}><span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', backgroundColor: absen.role === 'SA' ? '#ffedd5' : '#f3f4f6', color: absen.role === 'SA' ? '#ea580c' : '#4b5563' }}>{absen.role === 'SA' ? 'SUPER ADMIN' : 'STAFF KASIR'}</span></td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>🕒 {new Date(absen.waktu_pertama).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</td>
                <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>{absen.total_hadir} Kali Masuk</span></td>
              </tr>
            )))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
