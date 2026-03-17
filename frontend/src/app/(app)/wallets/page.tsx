'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Wallet } from '@/types';
import { formatRupiah } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', balance: '', currency: 'IDR', color: '#10b981' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/wallets').then((res) => setWallets(res.data)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/wallets', form);
      setWallets([...wallets, res.data]);
      setShowForm(false);
      setForm({ name: '', balance: '', currency: 'IDR', color: '#10b981' });
      toast.success('Dompet berhasil ditambah!');
    } catch {
      toast.error('Gagal menambah dompet.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus dompet ini?')) return;
    try {
      await api.delete(`/wallets/${id}`);
      setWallets(wallets.filter((w) => w.id !== id));
      toast.success('Dompet dihapus.');
    } catch {
      toast.error('Gagal menghapus dompet.');
    }
  };

  if (loading) return <p className="text-gray-500">Memuat data...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dompet</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          {showForm ? 'Batal' : '+ Tambah Dompet'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tambah Dompet</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Dompet</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Contoh: BCA, Tunai..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Awal (Rp)</label>
              <input
                type="number"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-10 w-full rounded-lg border border-gray-300 cursor-pointer"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-3 text-center py-10">Belum ada dompet.</p>
        ) : (
          wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-white rounded-2xl shadow-sm p-6 relative border-l-4"
              style={{ borderColor: wallet.color }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">{wallet.name}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{formatRupiah(wallet.balance)}</p>
                  <p className="text-xs text-gray-400 mt-1">{wallet.currency}</p>
                </div>
                <button
                  onClick={() => handleDelete(wallet.id)}
                  className="text-gray-300 hover:text-red-500 transition text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
