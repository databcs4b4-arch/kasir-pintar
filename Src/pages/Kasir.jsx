import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

export default function Kasir() {
  const [produkList, setProdukList] = useState([]);
  const [kataKunci, setKataKunci] = useState(''); 
  const [keranjang, setKeranjang] = useState([]);
  const [bayar, setBayar] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [notaTerakhir, setNotaTerakhir] = useState(null); 
  const [infoToko, setInfoToko] = useState({ nama_toko: 'TOKO AI PINTAR', alamat_toko: 'Jl. Utama', telepon_toko: '0812', pesan_bawah: 'Terima Kasih' });

  const [jenisDiskon, setJenisDiskon] = useState('nominal'); 
  const [nilaiDiskon, setNilaiDiskon] = useState(''); 

  const [bukaPopupAddon, setBukaPopupAddon] = useState(false);
  const [produkTerpilihAddon, setProdukTerpilihAddon] = useState(null);
  const [daftarAddonCari, setDaftarAddonCari] = useState([]);
  const [addonYangDipilih, setAddonYangDipilih] = useState([]); 

  useEffect(() => {
    ambilDataProduk();
    ambilInfoToko();
  }, []);

  const ambilInfoToko = async () => {
    const { data } = await supabase.from('pengaturan_toko').select('*').eq('id', 1).single();
    if (data) setInfoToko(data);
  };

    const ambilDataProduk = async () => {
    // 🔍 KOREKSI FILTER UTAMA: Hanya menarik produk yang berstatus AKTIF (is_active = true) untuk menu kasir
    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .eq('is_active', true)
      .order('nama_produk', { ascending: true });
      
    if (!error) setProdukList(data || []);
  };


  const pemicuKlikProduk = async (produk) => {
    const { data: addons } = await supabase.from('opsi_tambahan').select('*').eq('produk_id', produk.id);
    if (addons && addons.length > 0) {
      setProdukTerpilihAddon(produk);
      setDaftarAddonCari(addons);
      setAddonYangDipilih([]); 
      setBukaPopupAddon(true);
    } else {
      eksekusiMasukKeranjang(produk, []);
    }
  };

  const tanganiChecklistAddon = (addon) => {
    const apakahSudahAda = addonYangDipilih.find(item => item.id === addon.id);
    if (apakahSudahAda) {
      setAddonYangDipilih(addonYangDipilih.filter(item => item.id !== addon.id));
    } else {
      setAddonYangDipilih([...addonYangDipilih, addon]);
    }
  };
  const simpanProdukDenganAddon = () => {
    if (!produkTerpilihAddon) return;
    eksekusiMasukKeranjang(produkTerpilihAddon, addonYangDipilih);
    setBukaPopupAddon(false);
    setProdukTerpilihAddon(null);
  };

  const eksekusiMasukKeranjang = (produk, addonsPilihan) => {
    const stringIdAddon = addonsPilihan.map(a => a.id).sort().join('-');
    const idKeranjangUnik = stringIdAddon ? `${produk.id}-${stringIdAddon}` : `${produk.id}`;
    const totalHargaAddon = addonsPilihan.reduce((sum, a) => sum + a.harga_opsi, 0);
    const hargaFinalProduk = produk.harga + totalHargaAddon;

    const ada = keranjang.find((item) => item.idUnik === idKeranjangUnik);
    if (ada) {
      if (ada.qty >= produk.stok) return alert('Stok produk tidak mencukupi!');
      setKeranjang(keranjang.map((item) => item.idUnik === idKeranjangUnik ? { ...ada, qty: ada.qty + 1 } : item));
    } else {
      if (produk.stok < 1) return alert('Stok produk habis!');
      const labelTeksAddon = addonsPilihan.map(a => `${a.nama_opsi}`).join(', ');
      setKeranjang([...keranjang, { 
        ...produk, idUnik: idKeranjangUnik, harga: hargaFinalProduk, hargaAsliTanpaAddon: produk.harga, labelAddonText: labelTeksAddon, qty: 1 
      }]);
    }
  };

  const ubahKuantitasItem = (idUnik, perubahan) => {
    setKeranjang(keranjang.map((item) => {
      if (item.idUnik === idUnik) {
        const qtyBaru = item.qty + perubahan;
        if (qtyBaru > item.stok) {
          alert(`Gagal: Stok gudang tidak mencukupi!`);
          return item;
        }
        if (qtyBaru < 1) return item;
        return { ...item, qty: qtyBaru };
      }
      return item;
    }));
  };

  const hapusItemDariKeranjang = (idUnik) => {
    setKeranjang(keranjang.filter((item) => item.idUnik !== idUnik));
  };

  const subtotalHarga = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
  const nominalPotonganInput = Number(nilaiDiskon) || 0;
  const totalPotonganDiskon = jenisDiskon === 'persen' ? Math.round((subtotalHarga * nominalPotonganInput) / 100) : nominalPotonganInput;
  const totalHargaSetelahDiskon = Math.max(0, subtotalHarga - totalPotonganDiskon);
  const angkaBayarMurni = Number(bayar.replace(/\./g, '')) || 0;
  const kembalian = angkaBayarMurni - totalHargaSetelahDiskon;

  const tanganiInputBayar = (e) => {
    const nilaiInput = e.target.value.replace(/\D/g, ''); 
    if (nilaiInput === '') { setBayar(''); return; }
    setBayar(Number(nilaiInput).toLocaleString('id-ID'));
  };
  const prosesPembayaran = async () => {
    if (keranjang.length === 0) return alert('Keranjang masih kosong!');
    if (angkaBayarMurni < totalHargaSetelahDiskon) return alert('Uang pembayaran kurang!');
    setLoading(true);

    try {
      const { data: transaksiBaru, error: errTx } = await supabase
        .from('transaksi')
        .insert([{ total_harga: Number(totalHargaSetelahDiskon), total_bayar: angkaBayarMurni, kembalian: Number(kembalian) }])
        .select().single();

      if (errTx) throw errTx;

      const detailData = keranjang.map((item) => ({
        transaksi_id: Number(transaksiBaru.id), produk_id: Number(item.id), jumlah: Number(item.qty), subtotal: Number(item.harga * item.qty),
      }));

      await supabase.from('detail_transaksi').insert(detailData);
      for (const item of keranjang) {
        await supabase.from('produk').update({ stok: Number(item.stok - item.qty) }).eq('id', item.id);
      }

      setNotaTerakhir({ id: transaksiBaru.id, tanggal: transaksiBaru.tanggal_transaksi, items: [...keranjang], subtotal: subtotalHarga, potongan: totalPotonganDiskon, total: totalHargaSetelahDiskon, bayar: angkaBayarMurni, kembali: kembalian });
      alert('Transaksi Berhasil Disimpan!');
      
      setTimeout(() => {
        window.print();
        setKeranjang([]); setBayar(''); setNilaiDiskon(''); setNotaTerakhir(null); ambilDataProduk(); 
      }, 500);
    } catch (error) {
      alert('Gagal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const produkTersaring = produkList.filter((p) => p.nama_produk.toLowerCase().includes(kataKunci.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 p-6 gap-6 min-h-screen">
      
      {/* SISI KIRI: MENU PRODUK */}
      <div className="w-7/12 bg-white p-6 rounded-2xl border border-gray-100 shadow-md flex flex-col no-print">
        <div className="mb-6 flex flex-col gap-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Menu Transaksi</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="cari_barang" style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Pencarian Cepat Barang</label>
            <input type="text" id="cari_barang" value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} placeholder="Ketik nama produk..." style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '500', outline: 'none' }} onFocus={(e) => e.target.style.borderBottom = '2px solid #4f46e5'} onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
            {produkTersaring.map((p) => (
              <button key={p.id} onClick={() => pemicuKlikProduk(p)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '130px', textAlign: 'left', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', width: '100%', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.backgroundColor = '#f5f3ff'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(79, 70, 229, 0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.05)'; }}>
                <div className="w-full">
                  <p className="font-extrabold text-gray-800 text-sm line-clamp-2 leading-snug m-0">{p.nama_produk}</p>
                  <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-lg font-bold text-[9px] uppercase ${p.stok <= 5 ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-gray-100 text-gray-500'}`}>Stok: {p.stok}</span>
                </div>
                <p className="font-black text-indigo-600 text-base m-0">Rp {p.harga.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* SISI KANAN: TABEL RINCIAN KERANJANG BELANJA */}
      <div className="w-5/12 bg-white p-6 rounded-2xl border border-gray-100 shadow-md flex flex-col justify-between no-print">
        <div className="flex flex-col flex-1 overflow-hidden">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center justify-between">
            <span>Keranjang Belanja </span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold">{keranjang.length} Jenis</span>
          </h2>
          <div className="overflow-y-auto flex-1 pr-1 mb-4">
            {keranjang.length === 0 ? (
              <div className="text-center pt-24 text-gray-400 italic text-sm">Keranjang belanja masih kosong</div>
            ) : (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '10px' }}>Nama</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keranjang.map((item) => (
                      <tr key={item.idUnik} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px', fontWeight: '600', color: '#111827', maxWidth: '110px', wordBreak: 'break-word' }}>
                          {item.nama_produk}
                          {item.labelAddonText && <span style={{ display: 'block', fontSize: '9px', color: '#ea580c', fontWeight: 'bold', marginTop: '2px' }}>+ ({item.labelAddonText})</span>}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button onClick={() => ubahKuantitasItem(item.idUnik, -1)} style={{ background: '#f3f4f6', border: 'none', width: '22px', height: '22px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                            <span style={{ fontWeight: 'bold', minWidth: '16px', display: 'inline-block' }}>{item.qty}</span>
                            <button onClick={() => ubahKuantitasItem(item.idUnik, 1)} style={{ background: '#f3f4f6', border: 'none', width: '22px', height: '22px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>Rp {(item.harga * item.qty).toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}><button onClick={() => hapusItemDariKeranjang(item.idUnik)} className="text-gray-400 hover:text-red-500 text-sm p-1 rounded">🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#4b5563' }}>🎟️ DISKON:</span>
            <select value={jenisDiskon} onChange={(e) => { setJenisDiskon(e.target.value); setNilaiDiskon(''); }} style={{ padding: '4px 6px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white' }}>
              <option value="nominal">Rupiah (Rp)</option>
              <option value="persen">Persen (%)</option>
            </select>
            <input type="number" value={nilaiDiskon} onChange={(e) => setNilaiDiskon(e.target.value)} placeholder={jenisDiskon === 'persen' ? "Contoh: 10" : "Contoh: 5000"} style={{ flex: 1, padding: '4px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }} />
          </div>

          <div className="space-y-1 text-sm font-semibold text-gray-500">
            <div className="flex justify-between"><span>Subtotal:</span><span>Rp {subtotalHarga.toLocaleString()}</span></div>
            {totalPotonganDiskon > 0 && <div className="flex justify-between text-rose-500"><span>Potongan Toko:</span><span>- Rp {totalPotonganDiskon.toLocaleString()}</span></div>}
          </div>

          <div className="flex justify-between font-black text-xl text-gray-900 border-t pt-2 border-dashed"><span>Total Tagihan:</span><span className="text-indigo-600">Rp {totalHargaSetelahDiskon.toLocaleString()}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="jumlah_bayar" style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' }}>Jumlah Uang Bayar</label>
            <input type="text" id="jumlah_bayar" value={bayar} placeholder="Contoh: 50.000" onChange={tanganiInputBayar} style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #e5e7eb', backgroundColor: 'transparent', color: '#1f2937', fontWeight: '700', fontSize: '16px', outline: 'none' }} onFocus={(e) => e.target.style.borderBottom = '2px solid #4f46e5'} onBlur={(e) => e.target.style.borderBottom = '2px solid #e5e7eb'} />
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-500"><span>Uang Kembali:</span><span className={kembalian >= 0 ? "text-emerald-600 font-extrabold text-base" : "text-rose-500 font-bold"}>Rp {kembalian > 0 && bayar ? kembalian.toLocaleString() : 0}</span></div>
          <button onClick={prosesPembayaran} disabled={loading || keranjang.length === 0} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-bold shadow-md">{loading ? 'Memproses...' : '🖨️ Bayar & Cetak Struk'}</button>
        </div>
      </div>
      {/* 🧾 STRUK PRINT THERMAL 58mm SAH */}
      {notaTerakhir && (
        <div className="print-only" style={{ width: '58mm', padding: '0 2mm', fontFamily: 'monospace', fontSize: '11px', color: 'black', backgroundColor: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{infoToko.nama_toko}</h3>
            <p style={{ margin: '0', fontSize: '10px' }}>{infoToko.alamat_toko}</p>
            <p style={{ margin: '0', fontSize: '10px' }}>HP: {infoToko.telepon_toko}</p>
            <p style={{ margin: '5px 0' }}>--------------------------------</p>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <p style={{ margin: '0' }}>Nota  : #TX-{notaTerakhir.id}</p>
            <p style={{ margin: '0' }}>Waktu : {new Date(notaTerakhir.tanggal).toLocaleString('id-ID')}</p>
            <p style={{ margin: '5px 0' }}>--------------------------------</p>
          </div>
          <div style={{ marginBottom: '5px' }}>
            {notaTerakhir.items.filter((item) => { const n = item.nama_produk.toLowerCase(); return !n.includes('0plastik') && !n.includes('0kemasan') && !n.includes('0sterefoam') && !n.includes('0dus') && !n.includes('0kresek') && !n.includes('0paper bag'); }).map((item) => (
              <div key={item.idUnik} style={{ marginBottom: '6px' }}>
                <p style={{ margin: '0', fontWeight: 'bold' }}>{item.nama_produk}</p>
                {item.labelAddonText && <p style={{ margin: '0 0 0 6px', fontSize: '8px', color: 'black' }}>* ({item.labelAddonText})</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}><span>{item.qty} x Rp {item.hargaAsliTanpaAddon.toLocaleString()}</span><span style={{ marginLeft: 'auto' }}>Rp {(item.harga * item.qty).toLocaleString()}</span></div>
              </div>
            ))}
            <p style={{ margin: '5px 0' }}>--------------------------------</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'end' }}>
            <div style={{ display: 'flex', width: '100%' }}><span>SUBTOTAL:</span><span style={{ marginLeft: 'auto' }}>Rp {notaTerakhir.subtotal.toLocaleString()}</span></div>
            {notaTerakhir.potongan > 0 && <div style={{ display: 'flex', width: '100%' }}><span>DISKON:</span><span style={{ marginLeft: 'auto' }}>-Rp {notaTerakhir.potongan.toLocaleString()}</span></div>}
            <div style={{ display: 'flex', width: '100%', fontWeight: 'bold' }}><span>TOTAL:</span><span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>Rp {notaTerakhir.total.toLocaleString()}</span></div>
            <div style={{ display: 'flex', width: '100%' }}><span>BAYAR:</span><span style={{ marginLeft: 'auto' }}>Rp {notaTerakhir.bayar.toLocaleString()}</span></div>
            <div style={{ display: 'flex', width: '100%', fontWeight: 'bold' }}><span>KEMBALI:</span><span style={{ marginLeft: 'auto' }}>Rp {notaTerakhir.kembali.toLocaleString()}</span></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '15px' }}><p style={{ margin: '0', fontStyle: 'italic' }}>-- {infoToko.pesan_bawah} --</p></div>
        </div>
      )}

      {/* JENDELA POPUP MODAL ADDITIONAL VARIAN */}
      {bukaPopupAddon && produkTerpilihAddon && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>📋 Pilihan Tambahan (Add-ons)</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#6b7280' }}>Sesuaikan varian untuk produk: <b>{produkTerpilihAddon.nama_produk}</b></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
              {daftarAddonCari.map((addon) => {
                const apakahChecked = addonYangDipilih.some(item => item.id === addon.id);
                return (
                  <label key={addon.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', backgroundColor: apakahChecked ? '#f5f3ff' : 'transparent', borderColor: apakahChecked ? '#c084fc' : '#e5e7eb' }}>
                    <input type="checkbox" checked={apakahChecked} onChange={() => tanganiChecklistAddon(addon)} style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{addon.nama_opsi}</span>
                    {addon.harga_opsi > 0 && <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'bold', color: '#ea580c' }}>+Rp {addon.harga_opsi.toLocaleString()}</span>}
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setBukaPopupAddon(false); setProdukTerpilihAddon(null); }} style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '12px', background: 'none', fontWeight: 'bold', cursor: 'pointer', color: '#4b5563', fontSize: '12px' }}>Batal</button>
              <button onClick={simpanProdukDenganAddon} style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '12px', background: 'linear-gradient(to right, #ea580c, #f97316)', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Masukkan Keranjang</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
