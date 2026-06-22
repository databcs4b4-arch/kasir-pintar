import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [analisisAI, setAnalisisAI] = useState([]);
  const [totalOmzet, setTotalOmzet] = useState(0);
  const [totalProdukTerjual, setTotalProdukTerjual] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [dataGrafik, setDataGrafik] = useState({ labels: [], datasets: [] });

  const hariIni = new Date().toLocaleDateString('sv-SE'); 
  const [tanggalMulai, setTanggalMulai] = useState(hariIni);
  const [tanggalSelesai, setTanggalSelesai] = useState(hariIni);

  useEffect(() => {
    hitungStatistikToko();
    jalankanAnalisisAI();
  }, [tanggalMulai, tanggalSelesai]);

  const hitungStatistikToko = async () => {
    try {
      const { data: dataTx } = await supabase
        .from('transaksi')
        .select('*')
        .gte('tanggal_transaksi', `${tanggalMulai}T00:00:00.000Z`)
        .lte('tanggal_transaksi', `${tanggalSelesai}T23:59:59.999Z`);

      if (!dataTx || dataTx.length === 0) {
        setTotalOmzet(0);
        setTotalTransaksi(0);
        setTotalProdukTerjual(0);
        
        const dataKosong = JSON.parse("[0,0,0]");
        setDataGrafik({ 
          labels: ['Belum Ada Data'], 
          datasets: [{ label: 'Terjual', data: dataKosong, backgroundColor: '#3b82f6' }] 
        });
        return;
      }

      setTotalOmzet(dataTx.reduce((sum, item) => sum + item.total_harga, 0));
      setTotalTransaksi(dataTx.length);

      const { data: dataDetail } = await supabase.from('detail_transaksi').select('jumlah, produk_id, transaksi_id');
      const { data: dataProduk } = await supabase.from('produk').select('id, nama_produk');

      if (dataDetail && dataProduk) {
        const listIdTx = dataTx.map(tx => tx.id);
        const detailTersaring = dataDetail.filter(dt => listIdTx.includes(dt.transaksi_id));
        setTotalProdukTerjual(detailTersaring.reduce((sum, item) => sum + item.jumlah, 0));

        const mapNamaProduk = {};
        dataProduk.forEach(p => { mapNamaProduk[p.id] = p.nama_produk; });

        const rekapProduk = {};
        detailTersaring.forEach((item) => {
          const namaAsli = mapNamaProduk[item.produk_id] || `Produk #${item.produk_id}`;
          rekapProduk[namaAsli] = (rekapProduk[namaAsli] || 0) + item.jumlah;
        });

        const limaTerlaris = Object.keys(rekapProduk).map((nama) => ({
          name: nama,
          Terjual: rekapProduk[nama],
        })).sort((a, b) => b.Terjual - a.Terjual).slice(0, 5);

        if (limaTerlaris.length > 0) {
          setDataGrafik({
            labels: limaTerlaris.map(item => item.name),
            datasets: [{
              label: 'Kuantitas Terjual (Pcs)',
              data: limaTerlaris.map(item => item.Terjual),
              backgroundColor: '#3b82f6',
              borderColor: '#1d4ed8',
              borderWidth: 1,
              borderRadius: 6,
              barThickness: 24,
            }],
          });
        }
      }
    } catch (err) {
      console.error("Gagal menghitung statistik:", err.message);
    }
  };

  const jalankanAnalisisAI = async () => {
    try {
      const { data: staticProduk } = await supabase.from('produk').select('*');
      if (staticProduk) {
        const produkKritis = staticProduk
          .map(item => {
            let status = ""; let warnaText = ""; let warnaBg = ""; let warnaBorder = "";
            if (item.stok === 0) {
              status = "Habis"; warnaText = "#b91c1c"; warnaBg = "#fee2e2"; warnaBorder = "#fca5a5";
            } else if (item.stok < 10) {
              status = "Hampir Habis"; warnaText = "#ea580c"; warnaBg = "#ffedd5"; warnaBorder = "#fdba74";
            }
            return { ...item, status, warnaText, warnaBg, warnaBorder };
          })
          .filter(item => item.status !== "");
        setAnalisisAI(produkKritis);
      }
    } catch (err) {
      console.error("Gagal analisis AI:", err.message);
    }
  };
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 pb-5 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Dashboard Analisis</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Pantau performa penjualan harian toko.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-xs font-semibold">
          <div className="flex items-center gap-1">
            <label htmlFor="tgl_mulai" className="text-gray-500 text-[10px] uppercase">Dari:</label>
            <input type="date" id="tgl_mulai" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="p-1.5 border rounded-lg bg-gray-50 outline-none text-gray-700" />
          </div>
          <div className="flex items-center gap-1">
            <label htmlFor="tgl_selesai" className="text-gray-500 text-[10px] uppercase">Smp:</label>
            <input type="date" id="tgl_selesai" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="p-1.5 border rounded-lg bg-gray-50 outline-none text-gray-700" />
          </div>
          <button onClick={() => { setTanggalMulai(hariIni); setTanggalSelesai(hariIni); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1.5 rounded-lg transition">Today</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div style={{ background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8)', color: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.9, margin: 0, textTransform: 'uppercase' }}>Total Pendapatan</p>
          <p style={{ fontSize: '26px', fontWeight: '900', marginTop: '6px', margin: 0 }}>Rp {totalOmzet.toLocaleString()}</p>
          <p style={{ fontSize: '10px', marginTop: '12px', opacity: 0.8, margin: 0 }}>💰 Omzet pada periode terpilih</p>
        </div>

        <div style={{ background: 'linear-gradient(to bottom right, #059669, #047857)', color: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.9, margin: 0, textTransform: 'uppercase' }}>Volume Penjualan</p>
          <p style={{ fontSize: '26px', fontWeight: '900', marginTop: '6px', margin: 0 }}>{totalProdukTerjual} Pcs</p>
          <p style={{ fontSize: '10px', marginTop: '12px', opacity: 0.8, margin: 0 }}>📦 Total barang keluar kasir</p>
        </div>

        <div style={{ background: 'linear-gradient(to bottom right, #9333ea, #7e22ce)', color: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.9, margin: 0, textTransform: 'uppercase' }}>Total Transaksi</p>
          <p style={{ fontSize: '26px', fontWeight: '900', marginTop: '6px', margin: 0 }}>{totalTransaksi} Nota</p>
          <p style={{ fontSize: '10px', marginTop: '12px', opacity: 0.8, margin: 0 }}>🧾 Jumlah struk tercetak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 min-h-[350px] flex flex-col justify-between">
          <h3 className="text-base font-bold text-gray-800 m-0">🔥 Tren 5 Produk Terlaris Periode Ini</h3>
          <div className="w-full h-64 mt-4 flex items-center justify-center">
            {dataGrafik.labels.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Belum ada grafik transaksi.</p>
            ) : (
              <Bar data={dataGrafik} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f3f4f6' }, ticks: { stepSize: 1, color: '#6b7280', fontSize: 10 } }, x: { grid: { display: false }, ticks: { color: '#6b7280', fontSize: 10 } } } }} />
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-800 m-0">🤖 Asisten Otomatis AI Stok</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'justify', margin: 0 }}>Kondisi riil gudang inventori saat ini.</p>
          </div>
          <div className="overflow-y-auto flex-1 pr-1">
            {analisisAI.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#059669', margin: 0 }}>✅ Semua Stok Aman</p>
              </div>
            ) : (
              <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', color: '#4b5563', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}>
                      <th style={{ padding: '10px' }}>Nama</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Stok</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisisAI.map((pro) => (
                      <tr key={pro.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px', fontWeight: '600', color: '#1f2937', maxWidth: '90px', wordBreak: 'break-word' }}>{pro.nama_produk}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>{pro.stok} Pcs</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '9999px', fontWeight: '800', fontSize: '9px', textTransform: 'uppercase', backgroundColor: pro.warnaBg, color: pro.warnaText, border: `1px solid ${pro.warnaBorder}` }}>{pro.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
