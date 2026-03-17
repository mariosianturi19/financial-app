'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Transaction, Category, Wallet } from '@/types';
import { formatRupiah, formatDate, toInputDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const emptyForm = {
  wallet_id: '',
  category_id: '',
  type: 'expense',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterWallet, setFilterWallet] = useState('');

  useEffect(() => {
    Promise.all([api.get('/transactions'), api.get('/categories'), api.get('/wallets')])
      .then(([txRes, catRes, walRes]) => {
        setTransactions(txRes.data);
        setCategories(catRes.data);
        setWallets(walRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // â”€â”€ Add â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/transactions', addForm);
      setTransactions([res.data, ...transactions]);
      setAddForm({ ...emptyForm });
      setShowAdd(false);
      toast.success('Transaksi berhasil ditambah!');
    } catch {
      toast.error('Gagal menambah transaksi.');
    } finally {
      setSaving(false);
    }
  };

  // â”€â”€ Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setEditForm({
      wallet_id: String(tx.wallet_id),
      category_id: String(tx.category_id),
      type: tx.type,
      amount: String(tx.amount),
      description: tx.description ?? '',
      date: toInputDate(tx.date),
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTx) return;
    setEditSaving(true);
    try {
      const res = await api.put(`/transactions/${editTx.id}`, editForm);
      setTransactions(transactions.map((t) => (t.id === editTx.id ? res.data : t)));
      setEditTx(null);
      toast.success('Transaksi berhasil diubah!');
    } catch {
      toast.error('Gagal mengubah transaksi.');
    } finally {
      setEditSaving(false);
    }
  };

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDelete = async (id: number) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter((t) => t.id !== id));
      toast.success('Transaksi dihapus.');
    } catch {
      toast.error('Gagal menghapus transaksi.');
    }
  };

  // â”€â”€ Filtered list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => filterType === 'all' || tx.type === filterType)
      .filter((tx) => !filterWallet || String(tx.wallet_id) === filterWallet)
      .filter((tx) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          tx.description?.toLowerCase().includes(q) ||
          tx.category?.name.toLowerCase().includes(q) ||
          tx.wallet?.name.toLowerCase().includes(q)
        );
      });
  }, [transactions, filterType, filterWallet, search]);

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  // â”€â”€ Shared form fields renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderFields = (
    form: typeof emptyForm,
    setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>,
  ) => {
    const filteredCats = categories.filter((c) => c.type === form.type);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipe */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipe</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value, category_id: '' })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
        {/* Jumlah */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jumlah (Rp)</label>
          <input
            type="number"
            min="1"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="50000"
          />
        </div>
        {/* Dompet */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dompet</label>
          <select
            value={form.wallet_id}
            required
            onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Pilih dompet</option>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        {/* Kategori */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kategori</label>
          <select
            value={form.category_id}
            required
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Pilih kategori</option>
            {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        {/* Tanggal */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tanggal</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {/* Keterangan */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Keterangan</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Opsional"
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Transaksi</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          {showAdd ? 'âœ• Batal' : '+ Tambah'}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Tambah Transaksi</h2>
          <form onSubmit={handleAdd}>
            {renderFields(addForm, setAddForm)}
            <div className="mt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="ðŸ”  Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          {/* Wallet Filter */}
          <select
            value={filterWallet}
            onChange={(e) => setFilterWallet(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Semua Dompet</option>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {/* Reset */}
          {(search || filterType !== 'all' || filterWallet) && (
            <button
              onClick={() => { setSearch(''); setFilterType('all'); setFilterWallet(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2"
            >
              Reset
            </button>
          )}
        </div>

        {/* Summary bar */}
        {filtered.length > 0 && (
          <div className="flex gap-6 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
            <span>{filtered.length} transaksi</span>
            {totalIncome > 0 && <span className="text-emerald-600 font-medium">+{formatRupiah(totalIncome)}</span>}
            {totalExpense > 0 && <span className="text-rose-600 font-medium">âˆ’{formatRupiah(totalExpense)}</span>}
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-300">
            <div className="text-5xl mb-3">ðŸ”</div>
            <p className="text-sm">Tidak ada transaksi yang cocok.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 group">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: (tx.category?.color ?? '#6366f1') + '25', color: tx.category?.color ?? '#6366f1' }}
                  >
                    {tx.category?.icon ?? 'ðŸ’³'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{tx.description || tx.category?.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(tx.date)} Â· {tx.category?.name} Â· {tx.wallet?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : 'âˆ’'}{formatRupiah(Number(tx.amount))}
                  </span>
                  <button
                    onClick={() => openEdit(tx)}
                    className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-600 px-1 transition"
                    title="Edit"
                  >
                    âœï¸
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 px-1 text-lg transition"
                    title="Hapus"
                  >
                    Ã—
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Edit Transaksi</h2>
              <button onClick={() => setEditTx(null)} className="text-gray-400 hover:text-gray-600 text-xl">Ã—</button>
            </div>
            <form onSubmit={handleEdit}>
              {renderFields(editForm, setEditForm)}
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTx(null)}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
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