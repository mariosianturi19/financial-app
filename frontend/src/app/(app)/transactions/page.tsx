'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, X, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { formatRupiah, formatDate, toInputDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const emptyForm = {
  wallet_id: '', category_id: '', type: 'expense',
  amount: '', description: '', date: new Date().toISOString().split('T')[0],
};

interface PaginationMeta { current_page: number; last_page: number; per_page: number; total: number; has_more: boolean; }

export default function TransactionsPage() {
  const { wallets, walletsLoaded, fetchWallets, categories, categoriesLoaded, fetchCategories } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all'|'income'|'expense'>('all');
  const [filterWallet, setFilterWallet] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (!walletsLoaded) fetchWallets();
    if (!categoriesLoaded) fetchCategories();
  }, [walletsLoaded, categoriesLoaded, fetchWallets, fetchCategories]);

  const fetchTx = useCallback(async (page = 1, append = false) => {
    const params = new URLSearchParams({ page: String(page), per_page: '20' });
    if (filterType !== 'all') params.set('type', filterType);
    if (filterWallet) params.set('wallet_id', filterWallet);
    try {
      const res = await api.get(`/transactions?${params}`);
      setTransactions((prev) => append ? [...prev, ...res.data.data] : res.data.data);
      setMeta(res.data);
    } catch { toast.error('Gagal memuat transaksi.'); }
  }, [filterType, filterWallet]);

  useEffect(() => {
    setLoading(true);
    fetchTx(1, false).finally(() => setLoading(false));
  }, [fetchTx]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post('/transactions', addForm);
      setTransactions([res.data, ...transactions]);
      setMeta((m) => m ? { ...m, total: m.total + 1 } : m);
      setShowAdd(false); setAddForm({ ...emptyForm });
      toast.success('Transaksi ditambah!');
    } catch { toast.error('Gagal.'); } finally { setSaving(false); }
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setEditForm({ wallet_id: String(tx.wallet_id), category_id: String(tx.category_id), type: tx.type, amount: String(tx.amount), description: tx.description ?? '', date: toInputDate(tx.date) });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editTx) return; setEditSaving(true);
    try {
      const res = await api.put(`/transactions/${editTx.id}`, editForm);
      setTransactions(transactions.map((t) => t.id === editTx.id ? res.data : t));
      setEditTx(null); toast.success('Transaksi diubah!');
    } catch { toast.error('Gagal.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter((t) => t.id !== id));
      setMeta((m) => m ? { ...m, total: m.total - 1 } : m);
      toast.success('Dihapus.');
    } catch { toast.error('Gagal.'); }
  };

  const filtered = useMemo(() => {
    if (!search) return transactions;
    const q = search.toLowerCase();
    return transactions.filter((tx) =>
      tx.description?.toLowerCase().includes(q) ||
      tx.category?.name.toLowerCase().includes(q) ||
      tx.wallet?.name.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const TxForm = ({ form, setForm, onSubmit, saving: s, label }: { form: typeof emptyForm; setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>; onSubmit: (e: React.FormEvent) => void; saving: boolean; label: string; }) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Tipe</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category_id: '' })} className="input-base">
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Jumlah (Rp)</label>
          <input type="number" min="1" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-base" placeholder="50000" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Dompet</label>
          <select value={form.wallet_id} required onChange={(e) => setForm({ ...form, wallet_id: e.target.value })} className="input-base">
            <option value="">Pilih</option>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Kategori</label>
          <select value={form.category_id} required onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-base">
            <option value="">Pilih</option>
            {categories.filter((c) => c.type === form.type).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Tanggal</label>
        <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-base" />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Keterangan</label>
        <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base" placeholder="Opsional" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn-primary" disabled={s} style={{ flex: 1 }}>{s ? 'Menyimpan...' : label}</button>
        <button type="button" className="btn-ghost" onClick={() => { setShowAdd(false); setEditTx(null); }}>Batal</button>
      </div>
    </form>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Transaksi"
        subtitle={meta ? `${meta.total} total` : undefined}
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Plus size={15} /> Tambah
          </button>
        }
      />

      {/* Summary strip */}
      {(totalIncome > 0 || totalExpense > 0) && (
        <div style={{ display: 'flex', gap: 12 }}>
          {totalIncome > 0 && (
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 600 }}>Pemasukan</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-emerald)' }}>+{formatRupiah(totalIncome)}</p>
            </div>
          )}
          {totalExpense > 0 && (
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)' }}>
              <p style={{ fontSize: 11, color: 'var(--accent-rose)', fontWeight: 600 }}>Pengeluaran</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-rose)' }}>−{formatRupiah(totalExpense)}</p>
            </div>
          )}
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari transaksi..." className="input-base" style={{ paddingLeft: 36 }} />
        </div>
        <button onClick={() => setShowFilter(!showFilter)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 14px', borderRadius: 12, fontSize: 13, fontWeight: 500,
          background: (filterType !== 'all' || filterWallet) ? 'var(--accent-violet-dim)' : 'var(--bg-elevated)',
          border: `1px solid ${(filterType !== 'all' || filterWallet) ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
          color: (filterType !== 'all' || filterWallet) ? 'var(--accent-violet)' : 'var(--text-secondary)',
          cursor: 'pointer', height: 42,
        }}>
          <Filter size={14} />
          Filter
          <ChevronDown size={12} style={{ transform: showFilter ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>
      </div>

      {showFilter && (
        <div className="card animate-fadein" style={{ padding: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipe</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all'|'income'|'expense')} className="input-base">
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dompet</label>
            <select value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)} className="input-base">
              <option value="">Semua</option>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          {(filterType !== 'all' || filterWallet) && (
            <button onClick={() => { setFilterType('all'); setFilterWallet(''); }} style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px', borderRadius: 10, background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 12, marginTop: 20 }}>
              <X size={12} /> Reset
            </button>
          )}
        </div>
      )}

      {/* Transaction List */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="Tidak ada transaksi" description="Coba ubah filter atau tambahkan transaksi baru" />
        ) : (
          <div style={{ padding: '8px 16px' }}>
            {filtered.map((tx, i) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                cursor: 'pointer',
              }}
                onClick={() => openEdit(tx)}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: (tx.category?.color ?? '#7c6ff7') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {tx.category?.icon ?? '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || tx.category?.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                    {formatDate(tx.date)} · {tx.category?.name} · {tx.wallet?.name}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: tx.type === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {tx.type === 'income' ? '+' : '−'}{formatRupiah(Number(tx.amount))}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                    style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(251,113,133,0.08)', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6, transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            ))}

            {meta?.has_more && !search && (
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <button onClick={async () => { setLoadingMore(true); await fetchTx(meta.current_page + 1, true); setLoadingMore(false); }} disabled={loadingMore}
                  style={{ fontSize: 12, color: 'var(--accent-violet)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {loadingMore ? 'Memuat...' : `Muat lagi (${meta.total - transactions.length} tersisa)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Transaksi">
        <TxForm form={addForm} setForm={setAddForm} onSubmit={handleAdd} saving={saving} label="Simpan Transaksi" />
      </Modal>
      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Edit Transaksi">
        <TxForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} saving={editSaving} label="Simpan Perubahan" />
      </Modal>
    </div>
  );
}