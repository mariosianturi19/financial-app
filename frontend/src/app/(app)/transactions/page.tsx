'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, X, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { formatRupiah, formatDate, toInputDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const emptyForm = { wallet_id: '', category_id: '', type: 'expense', amount: '', description: '', date: new Date().toISOString().split('T')[0] };

interface PaginationMeta { current_page: number; last_page: number; per_page: number; total: number; has_more: boolean; }

function TransactionRow({ tx, onEdit }: { tx: Transaction; onEdit: () => void }) {
  const [hov, setHov] = useState(false);
  const isIncome = tx.type === 'income';
  return (
    <div
      onClick={onEdit}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderRadius: 12, cursor: 'pointer',
        background: hov ? 'var(--bg-overlay)' : 'transparent',
        transition: 'background 0.15s, transform 0.15s',
        transform: hov ? 'translateX(2px)' : 'none',
        margin: '0 4px',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: (tx.category?.color ?? '#7c6ff7') + '20',
        border: `1px solid ${(tx.category?.color ?? '#7c6ff7')}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, transition: 'transform 0.2s',
        transform: hov ? 'scale(1.08) rotate(-4deg)' : 'scale(1)',
      }}>
        {tx.category?.icon ?? (isIncome ? '📈' : '📉')}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
          {tx.description || tx.category?.name || '—'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDate(tx.date)}</span>
          {tx.wallet && (
            <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', background: 'var(--bg-overlay)', padding: '1px 7px', borderRadius: 99, border: '1px solid var(--border-subtle)' }}>
              {tx.wallet.name}
            </span>
          )}
          {tx.category && (
            <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 99, background: (tx.category.color ?? '#7c6ff7') + '18', color: tx.category.color ?? '#7c6ff7', border: `1px solid ${tx.category.color}33` }}>
              {tx.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {isIncome
          ? <ArrowUpRight size={14} style={{ color: 'var(--accent-emerald)' }} strokeWidth={2.5} />
          : <ArrowDownRight size={14} style={{ color: 'var(--accent-rose)' }} strokeWidth={2.5} />}
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.015em', color: isIncome ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
          {formatRupiah(tx.amount)}
        </span>
      </div>
    </div>
  );
}

function TxForm({ form, setForm, wallets, categories, onSubmit, saving, submitLabel, onCancel }: {
  form: typeof emptyForm; setForm: (f: typeof emptyForm) => void;
  wallets: any[];
  categories: any[];
  onSubmit: (e: React.FormEvent) => void; saving: boolean;
  submitLabel: string; onCancel: () => void;
}) {
  const filteredCats = categories.filter((c: any) => c.type === form.type);
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Type toggle */}
      <div style={{ display: 'flex', background: 'var(--bg-overlay)', borderRadius: 12, padding: 4, gap: 4 }}>
        {(['expense','income'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category_id: '' })}
            style={{
              flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
              background: form.type === t ? (t === 'expense' ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)') : 'transparent',
              color: form.type === t ? (t === 'expense' ? 'var(--accent-rose)' : 'var(--accent-emerald)') : 'var(--text-tertiary)',
              transition: 'all 0.2s',
            }}>
            {t === 'expense' ? '📉 Pengeluaran' : '📈 Pemasukan'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="input-label">Dompet</label>
          <select required value={form.wallet_id} onChange={(e) => setForm({ ...form, wallet_id: e.target.value })} className="input-base">
            <option value="">Pilih dompet</option>
            {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Kategori</label>
          <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-base">
            <option value="">Pilih kategori</option>
            {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="input-label">Jumlah (Rp)</label>
        <input type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-base" placeholder="0" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="input-label">Tanggal</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-base" />
        </div>
        <div>
          <label className="input-label">Keterangan</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base" placeholder="Opsional" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Menyimpan...' : submitLabel}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}

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

  useEffect(() => { setLoading(true); fetchTx(1,false).finally(()=>setLoading(false)); }, [fetchTx]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post('/transactions', addForm);
      setTransactions([res.data, ...transactions]);
      setShowAdd(false); setAddForm({ ...emptyForm });
      toast.success('Transaksi ditambah!');
    } catch { toast.error('Gagal.'); } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editTx) return; setEditSaving(true);
    try {
      const res = await api.put(`/transactions/${editTx.id}`, editForm);
      setTransactions(transactions.map((t) => t.id === editTx.id ? res.data : t));
      setEditTx(null); toast.success('Diubah!');
    } catch { toast.error('Gagal.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try { await api.delete(`/transactions/${id}`); setTransactions(transactions.filter((t)=>t.id!==id)); toast.success('Dihapus.'); }
    catch { toast.error('Gagal.'); }
  };

  const filtered = useMemo(() =>
    search.trim() ? transactions.filter((t) =>
      (t.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.category?.name ?? '').toLowerCase().includes(search.toLowerCase())
    ) : transactions
  , [transactions, search]);

  const hasFilter = filterType !== 'all' || filterWallet;
  const totalIncome = filtered.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
  const totalExpense = filtered.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Transaksi" subtitle={meta ? `${meta.total} transaksi total` : undefined}
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} strokeWidth={2.5} /> Tambah
          </button>
        }
      />

      {/* Quick stats */}
      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="animate-fadeup">
          {[
            { label: 'Pemasukan', value: totalIncome, color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-dim)', icon: '📈' },
            { label: 'Pengeluaran', value: totalExpense, color: 'var(--accent-rose)', bg: 'var(--accent-rose-dim)', icon: '📉' },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} style={{ padding: '16px 18px', borderRadius: 16, background: bg, border: `1px solid ${color}33` }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{icon} {label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{formatRupiah(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari transaksi..."
            className="input-base" style={{ paddingLeft: 36 }} />
        </div>
        <button onClick={() => setShowFilter(!showFilter)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 42,
            borderRadius: 12, background: hasFilter ? 'var(--accent-violet-dim)' : 'var(--bg-overlay)',
            border: `1px solid ${hasFilter ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
            color: hasFilter ? 'var(--accent-violet)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
            transition: 'all 0.15s',
          }}>
          <Filter size={13} />
          Filter
          {hasFilter && <span style={{ background: 'var(--accent-violet)', color: 'white', borderRadius: 99, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>!</span>}
          <ChevronDown size={12} style={{ transform: showFilter ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {showFilter && (
        <div className="card animate-fadein" style={{ padding: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label className="input-label">Tipe</label>
            <select value={filterType} onChange={(e)=>setFilterType(e.target.value as 'all'|'income'|'expense')} className="input-base">
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label className="input-label">Dompet</label>
            <select value={filterWallet} onChange={(e)=>setFilterWallet(e.target.value)} className="input-base">
              <option value="">Semua</option>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          {hasFilter && (
            <button onClick={()=>{setFilterType('all');setFilterWallet('');}}
              style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px', borderRadius: 10, background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 12, marginTop: 20 }}>
              <X size={12} /> Reset
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 62, borderRadius: 12 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="💸" title="Belum ada transaksi" description="Mulai catat pemasukan dan pengeluaran kamu"
            action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Catat Transaksi</button>} />
        ) : (
          <div style={{ padding: '8px 0' }}>
            {filtered.map((tx, i) => (
              <div key={tx.id} className="animate-fadeup" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                <TransactionRow tx={tx} onEdit={() => {
                  setEditTx(tx);
                  setEditForm({ wallet_id: String(tx.wallet_id), category_id: String(tx.category_id), type: tx.type, amount: String(tx.amount), description: tx.description ?? '', date: toInputDate(tx.date) });
                }} />
              </div>
            ))}
            {meta?.has_more && (
              <div style={{ padding: '12px 16px', textAlign: 'center' }}>
                <button onClick={async () => { setLoadingMore(true); await fetchTx((meta.current_page)+1, true); setLoadingMore(false); }}
                  disabled={loadingMore} className="btn-ghost" style={{ fontSize: 13 }}>
                  {loadingMore ? 'Memuat...' : 'Muat lebih banyak'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Catat Transaksi" subtitle="Tambahkan pemasukan atau pengeluaran baru">
        <TxForm form={addForm} setForm={setAddForm} wallets={wallets} categories={categories} onSubmit={handleAdd} saving={saving} submitLabel="Simpan" onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Edit Transaksi"
        footer={
          <button onClick={() => { if (editTx) handleDelete(editTx.id); setEditTx(null); }}
            className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
            Hapus Transaksi
          </button>
        }
      >
        <TxForm form={editForm} setForm={setEditForm} wallets={wallets} categories={categories} onSubmit={handleEdit} saving={editSaving} submitLabel="Simpan Perubahan" onCancel={() => setEditTx(null)} />
      </Modal>
    </div>
  );
}