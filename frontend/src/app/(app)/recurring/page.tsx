'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { RecurringTransaction } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import toast from 'react-hot-toast';

const emptyForm = {
  wallet_id: '', category_id: '', type: 'expense',
  amount: '', description: '', frequency: 'monthly',
  start_date: new Date().toISOString().split('T')[0], end_date: '',
};

const FREQ_LABEL: Record<string, string> = {
  daily: 'Setiap Hari', weekly: 'Setiap Minggu',
  monthly: 'Setiap Bulan', yearly: 'Setiap Tahun',
};

export default function RecurringPage() {
  const { wallets, walletsLoaded, fetchWallets, categories, categoriesLoaded, fetchCategories } = useAppStore();
  const [items, setItems]       = useState<RecurringTransaction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ ...emptyForm });
  const [saving, setSaving]     = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editItem, setEditItem] = useState<RecurringTransaction | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!walletsLoaded) fetchWallets();
    if (!categoriesLoaded) fetchCategories();
    api.get('/recurring').then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [walletsLoaded, categoriesLoaded, fetchWallets, fetchCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, end_date: form.end_date || null };
      const res = await api.post('/recurring', payload);
      setItems([...items, res.data]);
      setShowAdd(false); setForm({ ...emptyForm });
      toast.success('Transaksi rutin ditambah!');
    } catch { toast.error('Gagal menambah.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editItem) return; setEditSaving(true);
    try {
      const payload = { ...editForm, end_date: editForm.end_date || null };
      const res = await api.put(`/recurring/${editItem.id}`, payload);
      setItems(items.map((i) => i.id === editItem.id ? res.data : i));
      setEditItem(null);
      toast.success('Transaksi rutin diubah!');
    } catch { toast.error('Gagal mengubah.'); }
    finally { setEditSaving(false); }
  };

  const handleToggle = async (item: RecurringTransaction) => {
    try {
      const res = await api.put(`/recurring/${item.id}`, { is_active: !item.is_active });
      setItems(items.map((i) => i.id === item.id ? res.data : i));
      toast.success(res.data.is_active ? 'Diaktifkan.' : 'Dinonaktifkan.');
    } catch { toast.error('Gagal mengubah status.'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus transaksi rutin ini?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      setItems(items.filter((i) => i.id !== id));
      toast.success('Dihapus.');
    } catch { toast.error('Gagal menghapus.'); }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/recurring/process');
      toast.success(res.data.message);
      // Reload items & refresh page setelah proses
      const r = await api.get('/recurring');
      setItems(r.data);
    } catch { toast.error('Gagal memproses.'); }
    finally { setProcessing(false); }
  };

  const openEdit = (item: RecurringTransaction) => {
    setEditItem(item);
    setEditForm({
      wallet_id: String(item.wallet_id),
      category_id: String(item.category_id),
      type: item.type,
      amount: String(item.amount),
      description: item.description ?? '',
      frequency: item.frequency,
      start_date: item.start_date.substring(0, 10),
      end_date: item.end_date ? item.end_date.substring(0, 10) : '',
    });
  };

  const dueCount = items.filter((i) => {
    if (!i.is_active) return false;
    return new Date(i.next_due_date) <= new Date();
  }).length;

  const FormFields = ({ f, setF }: { f: typeof emptyForm; setF: React.Dispatch<React.SetStateAction<typeof emptyForm>> }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { label: 'Tipe', field: (
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, category_id: '' })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        )},
        { label: 'Jumlah (Rp)', field: (
          <input type="number" min="1" required value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="100000" />
        )},
        { label: 'Frekuensi', field: (
          <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="daily">Setiap Hari</option>
            <option value="weekly">Setiap Minggu</option>
            <option value="monthly">Setiap Bulan</option>
            <option value="yearly">Setiap Tahun</option>
          </select>
        )},
        { label: 'Dompet', field: (
          <select value={f.wallet_id} required onChange={(e) => setF({ ...f, wallet_id: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Pilih dompet</option>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )},
        { label: 'Kategori', field: (
          <select value={f.category_id} required onChange={(e) => setF({ ...f, category_id: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Pilih kategori</option>
            {categories.filter((c) => c.type === f.type).map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        )},
        { label: 'Tanggal Mulai', field: (
          <input type="date" required value={f.start_date}
            onChange={(e) => setF({ ...f, start_date: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        )},
      ].map(({ label, field }) => (
        <div key={label}><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>{field}</div>
      ))}
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Keterangan</label>
        <input type="text" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Opsional" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tanggal Berakhir (opsional)</label>
        <input type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transaksi Rutin</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} terdaftar{dueCount > 0 && ` · ${dueCount} jatuh tempo`}</p>
        </div>
        <div className="flex gap-2">
          {dueCount > 0 && (
            <button onClick={handleProcess} disabled={processing}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60">
              🔄 {processing ? 'Memproses...' : `Proses ${dueCount} Jatuh Tempo`}
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            {showAdd ? '✕ Batal' : '+ Tambah'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Tambah Transaksi Rutin</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <FormFields f={form} setF={setForm} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-3">🔄</div>
          <p className="text-gray-500 font-medium">Belum ada transaksi rutin</p>
          <p className="text-gray-400 text-sm mt-1">Tambahkan tagihan atau pemasukan yang terjadi rutin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isDue = item.is_active && new Date(item.next_due_date) <= new Date();
            return (
              <div key={item.id}
                className={`bg-white rounded-2xl shadow-sm border p-5 flex items-center justify-between group transition ${
                  isDue ? 'border-amber-200 bg-amber-50' : 'border-gray-100'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: (item.category?.color ?? '#6366f1') + '20', color: item.category?.color ?? '#6366f1' }}>
                    {item.category?.icon ?? '🔄'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700">{item.description || item.category?.name}</p>
                      {isDue && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Jatuh Tempo</span>}
                      {!item.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {FREQ_LABEL[item.frequency]} · Berikutnya: {formatDate(item.next_due_date)} · {item.wallet?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.type === 'income' ? '+' : '−'}{formatRupiah(Number(item.amount))}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleToggle(item)} title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-xs">
                      {item.is_active ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Edit Transaksi Rutin</h2>
              <button onClick={() => setEditItem(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <FormFields f={editForm} setF={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSaving}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                  {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" onClick={() => setEditItem(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}