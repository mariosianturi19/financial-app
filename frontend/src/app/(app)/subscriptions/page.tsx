'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Subscription } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import toast from 'react-hot-toast';

const CYCLE_LABEL: Record<string, string> = {
  weekly: 'Mingguan', monthly: 'Bulanan',
  quarterly: 'Per 3 Bulan', yearly: 'Tahunan',
};

const emptyForm = {
  name: '', icon: '📦', color: '#f43f5e', amount: '',
  billing_cycle: 'monthly', next_billing_date: '', start_date: '',
  wallet_id: '', category_id: '', notes: '',
};

export default function SubscriptionsPage() {
  const { wallets, walletsLoaded, fetchWallets, categories, categoriesLoaded, fetchCategories } = useAppStore();
  const [data, setData]         = useState<{ data: Subscription[]; total_monthly: number; total_yearly: number } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ ...emptyForm });
  const [saving, setSaving]     = useState(false);
  const [editSub, setEditSub]   = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!walletsLoaded) fetchWallets();
    if (!categoriesLoaded) fetchCategories();
    api.get('/subscriptions').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [walletsLoaded, categoriesLoaded, fetchWallets, fetchCategories]);

  const reload = () => api.get('/subscriptions').then((r) => setData(r.data));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/subscriptions', { ...form, category_id: form.category_id || null });
      await reload(); setShowAdd(false); setForm({ ...emptyForm });
      toast.success('Langganan ditambah!');
    } catch { toast.error('Gagal menambah.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editSub) return; setEditSaving(true);
    try {
      await api.put(`/subscriptions/${editSub.id}`, { ...editForm, category_id: editForm.category_id || null });
      await reload(); setEditSub(null);
      toast.success('Langganan diubah!');
    } catch { toast.error('Gagal mengubah.'); }
    finally { setEditSaving(false); }
  };

  const handleToggle = async (sub: Subscription) => {
    try {
      await api.put(`/subscriptions/${sub.id}`, { is_active: !sub.is_active });
      await reload();
      toast.success(sub.is_active ? 'Dinonaktifkan.' : 'Diaktifkan.');
    } catch { toast.error('Gagal mengubah status.'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus langganan ini?')) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      await reload(); toast.success('Dihapus.');
    } catch { toast.error('Gagal menghapus.'); }
  };

  const openEdit = (s: Subscription) => {
    setEditSub(s);
    setEditForm({
      name: s.name, icon: s.icon ?? '📦', color: s.color,
      amount: String(s.amount), billing_cycle: s.billing_cycle,
      next_billing_date: s.next_billing_date.substring(0, 10),
      start_date: s.start_date.substring(0, 10),
      wallet_id: String(s.wallet_id),
      category_id: s.category_id ? String(s.category_id) : '',
      notes: s.notes ?? '',
    });
  };

  const today = new Date();
  const upcomingInDays = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const PRESET_ICONS = ['📦','🎵','📺','🎮','☁️','📰','💊','🏋️','🚀','📚','🍕','✈️'];
  const PRESET_COLORS = ['#f43f5e','#f59e0b','#10b981','#6366f1','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

  const FormFields = ({ f, setF }: { f: typeof emptyForm; setF: React.Dispatch<React.SetStateAction<typeof emptyForm>> }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan</label>
          <input type="text" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Netflix, Spotify, iCloud..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
          <input type="number" min="1" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="65000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Siklus Tagihan</label>
          <select value={f.billing_cycle} onChange={(e) => setF({ ...f, billing_cycle: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="quarterly">Per 3 Bulan</option>
            <option value="yearly">Tahunan</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tagihan Berikutnya</label>
          <input type="date" required value={f.next_billing_date} onChange={(e) => setF({ ...f, next_billing_date: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
          <input type="date" required value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dompet</label>
          <select value={f.wallet_id} required onChange={(e) => setF({ ...f, wallet_id: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Pilih dompet</option>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori (opsional)</label>
          <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tanpa kategori</option>
            {categories.filter((c) => c.type === 'expense').map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
          <input type="text" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Opsional" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ikon</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => setF({ ...f, icon })}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${
                f.icon === icon ? 'bg-rose-100 ring-2 ring-rose-400' : 'bg-gray-50 hover:bg-gray-100'
              }`}>{icon}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button key={color} type="button" onClick={() => setF({ ...f, color })}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: color, borderColor: f.color === color ? '#1e1e2e' : 'transparent' }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  const subs = data?.data ?? [];
  const active = subs.filter((s) => s.is_active);
  const inactive = subs.filter((s) => !s.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Langganan</h1>
          <p className="text-sm text-gray-400 mt-0.5">{active.length} aktif</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
          {showAdd ? '✕ Batal' : '+ Tambah Langganan'}
        </button>
      </div>

      {/* Summary Cards */}
      {data && active.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl p-5">
            <p className="text-xs opacity-80 font-medium uppercase tracking-wide">Pengeluaran Bulanan</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(data.total_monthly)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-5">
            <p className="text-xs opacity-80 font-medium uppercase tracking-wide">Pengeluaran Tahunan</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(data.total_yearly)}</p>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Langganan Baru</h2>
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

      {subs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-gray-500 font-medium">Belum ada langganan</p>
          <p className="text-gray-400 text-sm mt-1">Catat Netflix, Spotify, dan layanan berlangganan lainnya</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              {active.map((sub) => {
                const days = upcomingInDays(sub.next_billing_date);
                const isUrgent = days <= 7;
                return (
                  <div key={sub.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: sub.color + '20', color: sub.color }}>
                        {sub.icon ?? '📦'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{sub.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {CYCLE_LABEL[sub.billing_cycle]} · {sub.wallet?.name}
                          {sub.category && ` · ${sub.category.icon} ${sub.category.name}`}
                        </p>
                        <p className={`text-xs mt-0.5 font-medium ${isUrgent ? 'text-amber-600' : 'text-gray-400'}`}>
                          {days < 0 ? '⚠️ Terlambat' : days === 0 ? '⚠️ Hari ini!' : `Tagihan dalam ${days} hari`} · {formatDate(sub.next_billing_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-gray-800">{formatRupiah(Number(sub.amount))}</p>
                        <p className="text-xs text-gray-400">{formatRupiah(Number(sub.yearly_cost))}/thn</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => handleToggle(sub)} title="Nonaktifkan"
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition text-sm">⏸</button>
                        <button onClick={() => openEdit(sub)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(sub.id)}
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

          {inactive.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Nonaktif ({inactive.length})</h2>
              <div className="space-y-2">
                {inactive.map((sub) => (
                  <div key={sub.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center justify-between opacity-60 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gray-100">
                        {sub.icon ?? '📦'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">{sub.name}</p>
                        <p className="text-xs text-gray-400">{formatRupiah(Number(sub.amount))} / {CYCLE_LABEL[sub.billing_cycle]}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleToggle(sub)} title="Aktifkan"
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition text-sm">▶</button>
                      <button onClick={() => handleDelete(sub.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editSub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Edit Langganan</h2>
              <button onClick={() => setEditSub(null)} className="text-gray-400 hover:text-gray-600 p-1">
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
                <button type="button" onClick={() => setEditSub(null)}
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