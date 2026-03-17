'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Budget, Category } from '@/types';
import { formatRupiah, formatMonth, addMonths } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ category_id: '', amount: '' });
  const [saving, setSaving] = useState(false);

  const fetchBudgets = (month: string) => {
    setLoading(true);
    api.get(`/budgets?month=${month}`)
      .then((res) => setBudgets(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    fetchBudgets(currentMonth);
  }, [currentMonth]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const usedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = expenseCategories.filter((c) => !usedCategoryIds.has(c.id));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/budgets', { ...addForm, month: currentMonth });
      setBudgets([...budgets, res.data]);
      setAddForm({ category_id: '', amount: '' });
      setShowAdd(false);
      toast.success('Anggaran berhasil ditambah!');
    } catch {
      toast.error('Gagal menambah anggaran.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus anggaran ini?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(budgets.filter((b) => b.id !== id));
      toast.success('Anggaran dihapus.');
    } catch {
      toast.error('Gagal menghapus anggaran.');
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Anggaran</h1>
          <p className="text-sm text-gray-400 mt-1">Batas pengeluaran per kategori</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          disabled={availableCategories.length === 0}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Tambah Anggaran
        </button>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-700">{formatMonth(currentMonth)}</p>
          {totalBudget > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {formatRupiah(totalSpent)} / {formatRupiah(totalBudget)} terpakai
            </p>
          )}
        </div>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
        >
          ›
        </button>
      </div>

      {/* Budget List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-300">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-sm font-medium">Belum ada anggaran untuk bulan ini.</p>
          <p className="text-xs mt-1">Klik "Tambah Anggaran" untuk mulai mengatur keuangan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const spent = Number(budget.spent ?? 0);
            const limit = Number(budget.amount);
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over = spent > limit;
            const barColor = over ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500';
            const amtColor = over ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-emerald-600';

            return (
              <div key={budget.id} className="bg-white rounded-2xl shadow-sm p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={{
                        backgroundColor: (budget.category?.color ?? '#6366f1') + '25',
                        color: budget.category?.color ?? '#6366f1',
                      }}
                    >
                      {budget.category?.icon ?? '📁'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">{budget.category?.name ?? '—'}</p>
                      <p className={`text-xs font-semibold ${amtColor}`}>
                        {formatRupiah(spent)} / {formatRupiah(limit)}
                        {over && <span className="ml-1 text-red-500">⚠ Melebihi!</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="text-gray-300 hover:text-red-500 text-lg transition"
                      title="Hapus"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${barColor} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                  <span>Sisa: <span className={amtColor}>{formatRupiah(Math.max(limit - spent, 0))}</span></span>
                  <span>Anggaran: {formatRupiah(limit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Tambah Anggaran — {formatMonth(currentMonth)}
              </h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {availableCategories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Semua kategori pengeluaran sudah dianggarkan untuk bulan ini.
              </p>
            ) : (
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kategori</label>
                  <select
                    value={addForm.category_id}
                    required
                    onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Pilih kategori pengeluaran</option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Batas Anggaran (Rp)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="500000"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
