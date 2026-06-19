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

  useEffect(() => {
    hitungStatistikToko();
    jalankanAnalisisAI();
  }, []);

  const hitungStatistikToko = async () => {
    try {
      const { data: dataTx } = await supabase.from('transaksi').select('total_harga');
      if (dataTx) {
        setTotalOmzet(dataTx.reduce((sum, item) => sum + item.total_harga, 0));
        setTotalTransaksi(dataTx.length);
      }

      const { data: dataDetail } = await supabase.from('detail_transaksi').select('jumlah, produk_id');
      const { data: dataProduk } = await supabase.from('produk').select('id, nama_produk');

      let labelProduk = ['Kopi Jual', 'Roti Jual', 'Teh Jual'];
      let jumlahTerjual =[0,0,0]; 

      if (dataDetail && dataProduk && dataDetail.length > 0) {
        setTotalProdukTerjual(dataDetail.reduce((sum, item) => sum + item.jumlah, 0));

        const mapNamaProduk = {};
        dataProduk.forEach(p => { mapNamaProduk[p.id] = p.nama_produk; });

        const rekapProduk = {};
        dataDetail.forEach((item) => {
          const namaAsli = mapNamaProduk[item.produk_id] || `Produk #${item.produk_id}`;
          rekapProduk[namaAsli] = (rekapProduk[namaAsli] || 0) + item.jumlah;
        });

        const limaTerlaris = Object.keys(rekapProduk).map((nama) => ({
          name: nama,
          Terjual: rekapProduk[nama],
        })).sort((a, b) => b.Terjual - a.Terjual).slice(0, 5);

        if (limaTerlaris.length > 0) {
          labelProduk = limaTerlaris.map(item => item.name);
          jumlahTerjual = limaTerlaris.map(item => item.Terjual);
        }
      }

      setDataGrafik({
        labels: labelProduk,
        datasets: [
          {
            label: 'Kuantitas Terjual (Pcs)',
            data: jumlahTerjual,
            backgroundColor: '#3b82f6', 
            borderColor: '#1d4ed8',
            borderWidth: 1,
            borderRadius: 6, 
            barThickness: 32, 
          },
        ],
      });

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
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Analisis</h2>
          <p className="text-sm text-gray-500 mt-1">Pantau performa penjualan dan rekomendasi stok harian.</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '24px', margin: '20px 0' }}>
        <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9, margin: 0 }}>Total Pendapatan</p>
          <p style={{ fontSize: '30px', fontWeight: '900', marginTop: '8px', margin: 0 }}>Rp {totalOmzet.toLocaleString()}</p>
          <p style={{ fontSize: '11px', marginTop: '16px', opacity: 0.8, margin: 0 }}>💰 Uang masuk kasir harian</p>
        </div>
        <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #059669, #047857)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9, margin: 0 }}>Volume Penjualan</p>
          <p style={{ fontSize: '30px', fontWeight: '900', marginTop: '8px', margin: 0 }}>{totalProdukTerjual} Pcs</p>
          <p style={{ fontSize: '11px', marginTop: '16px', opacity: 0.8, margin: 0 }}>📦 Barang keluar gudang</p>
        </div>
        <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #9333ea, #7e22ce)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9, margin: 0 }}>Total Transaksi</p>
          <p style={{ fontSize: '30px', fontWeight: '900', marginTop: '8px', margin: 0 }}>{totalTransaksi} Nota</p>
          <p style={{ fontSize: '11px', marginTop: '16px', opacity: 0.8, margin: 0 }}>🧾 Jumlah struk tercetak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col justify-between">
          <div><h3 className="text-lg font-bold text-gray-800 m-0">🔥 Tren 5 Produk Terlaris</h3></div>
          <div className="w-full h-64 mt-4 flex items-center justify-center">
            {dataGrafik.labels.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Memuat grafik batang...</p>
            ) : (
              <Bar data={dataGrafik} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { display: true, color: '#f3f4f6' }, ticks: { stepSize: 1, color: '#6b7280' } }, x: { grid: { display: false }, ticks: { color: '#6b7280' } } } }} />
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-96">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 m-0">🤖 Asisten Otomatis AI</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'justify', margin: 0 }}>Daftar produk kritis berdasarkan volume stok gudang harian.</p>
          </div>
          <div className="overflow-y-auto flex-1 pr-1">
            {analisisAI.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', margin: 0 }}>✅ Semua Stok Aman</p>
                <p style={{ fontSize: '12px', marginTop: '4px', margin: 0 }}>Tidak ada produk dengan stok di bawah 10 pcs.</p>
              </div>
            ) : (
              <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', color: '#4b5563', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #d1d5db' }}>
                      <th style={{ padding: '12px' }}>Nama Barang</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Stok</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisisAI.map((pro) => (
                      <tr key={pro.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#1f2937', textAlign: 'justify', maxWidth: '110px', wordBreak: 'break-word' }}>{pro.nama_produk}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>{pro.stok} Pcs</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '9999px', fontWeight: '800', fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: pro.warnaBg, color: pro.warnaText, border: `1px solid ${pro.warnaBorder}` }}>{pro.status}</span>
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
