'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, X, ChevronDown, ArrowUpRight, ArrowDownRight, SlidersHorizontal, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { formatRupiah, formatDate, toInputDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import TxForm, { TxFormData } from '@/components/ui/TxForm';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import { toast } from 'sonner';
import NumberFlow from '@number-flow/react';

const makeEmptyForm = (): TxFormData => ({
  wallet_id: '', category_id: '', type: 'expense',
  amount: '', description: '',
  date: new Date().toISOString().split('T')[0],
});

interface PaginationMeta {
  current_page: number; last_page: number;
  per_page: number; total: number; has_more: boolean;
}

function getDateLabel(dateStr: string): string {
  const date      = new Date(dateStr);
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();
  if (sameDay(date, today))     return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDate(txList: Transaction[]): { label: string; items: Transaction[]; dayTotal: number }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txList) {
    const key = tx.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([, items]) => ({
    label: getDateLabel(items[0].date),
    items,
    dayTotal: items.reduce((s, tx) => tx.type === 'income' ? s + Number(tx.amount) : s - Number(tx.amount), 0),
  }));
}

function TxRow({ tx, onEdit, onDelete }: { tx: Transaction; onEdit: () => void; onDelete: () => void }) {
  const isIncome = tx.type === 'income';
  const color    = tx.category?.color ?? '#0ea5e9';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="tx-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '11px 14px', margin: '0 6px', borderRadius: 13,
      }}
    >
      {/* Category icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: color + '1e', border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
      }}>
        {tx.category?.icon ?? (isIncome ? '📈' : '📉')}
      </div>

      {/* Middle — name + meta */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <p style={{
          fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 3,
        }}>
          {tx.description || tx.category?.name || '—'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
            {formatDate(tx.date)}
          </span>
          {tx.wallet && (
            <span style={{
              fontSize: 10.5, color: 'var(--text-tertiary)',
              background: 'var(--bg-overlay)', padding: '1px 7px',
              borderRadius: 99, border: '1px solid var(--border-subtle)',
              flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 72,
            }}>
              {tx.wallet.name}
            </span>
          )}
          {tx.category && (
            <span style={{
              fontSize: 10.5, padding: '1px 7px', borderRadius: 99,
              background: color + '18', color, border: `1px solid ${color}30`,
              flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 80,
            }}>
              {tx.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Right: amount + action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {/* Amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {isIncome
            ? <ArrowUpRight size={13} style={{ color: '#34d399' }} />
            : <ArrowDownRight size={13} style={{ color: '#fb7185' }} />}
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700,
            letterSpacing: '-0.01em',
            color: isIncome ? '#34d399' : '#fb7185',
          }}>
            {formatRupiah(tx.amount)}
          </span>
        </div>
        {/* Action buttons — always visible */}
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { Icon: Edit2,  fn: onEdit,   hoverColor: 'var(--accent-cyan)' },
            { Icon: Trash2, fn: onDelete, hoverColor: '#f43f5e' },
          ].map(({ Icon, fn, hoverColor }, k) => (
            <button key={k}
              onClick={(e) => { e.stopPropagation(); fn(); }}
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-overlay)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)',
                transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = hoverColor; (e.currentTarget as HTMLElement).style.borderColor = hoverColor + '66'; (e.currentTarget as HTMLElement).style.background = hoverColor + '15'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'; }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function TransactionsPage() {
  const { wallets, walletsLoaded, fetchWallets, refetchWallets, categories, categoriesLoaded, fetchCategories } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta]               = useState<PaginationMeta | null>(null);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState<TxFormData>(makeEmptyForm());
  const [saving, setSaving]           = useState(false);
  const [editTx, setEditTx]           = useState<Transaction | null>(null);
  const [editForm, setEditForm]       = useState<TxFormData>(makeEmptyForm());
  const [editOriginalAmount, setEditOriginalAmount] = useState(0);
  const [editSaving, setEditSaving]   = useState(false);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState<'all' | 'income' | 'expense'>('all');
  const [filterWallet, setFilterWallet] = useState('');
  const [showFilter, setShowFilter]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    if (!walletsLoaded)    fetchWallets();
    if (!categoriesLoaded) fetchCategories();
  }, [walletsLoaded, categoriesLoaded, fetchWallets, fetchCategories]);

  const fetchTx = useCallback(async (page = 1, append = false) => {
    const params = new URLSearchParams({ page: String(page), per_page: '30' });
    if (filterType !== 'all') params.set('type', filterType);
    if (filterWallet) params.set('wallet_id', filterWallet);
    try {
      const res = await api.get(`/transactions?${params}`);
      setTransactions((prev) => append ? [...prev, ...res.data.data] : res.data.data);
      setMeta(res.data);
    } catch { toast.error('Failed to load transactions.'); }
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
      setShowAdd(false); setAddForm(makeEmptyForm());
      toast.success('Transaction saved!', { style: { borderLeft: '4px solid var(--accent-emerald)' } });
      refetchWallets(); // force-refresh wallet balances in store
    } catch { toast.error('Failed to save.'); } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editTx) return; setEditSaving(true);
    try {
      const res = await api.put(`/transactions/${editTx.id}`, editForm);
      setTransactions(transactions.map((t) => t.id === editTx.id ? res.data : t));
      setEditTx(null);
      toast.success('Transaction updated!', { style: { borderLeft: '4px solid var(--accent-cyan)' } });
      refetchWallets(); // force-refresh wallet balances in store
    } catch { toast.error('Failed to save.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/transactions/${deleteTarget.id}`);
      setTransactions(transactions.filter((t) => t.id !== deleteTarget.id));
      setEditTx(null);
      setDeleteTarget(null);
      toast.error('Transaction deleted.', { style: { borderLeft: '4px solid var(--accent-rose)' } });
      refetchWallets(); // force-refresh wallet balances in store
    } catch { toast.error('Failed to delete.'); } finally { setDeleting(false); }
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setEditOriginalAmount(Number(tx.amount));
    setEditForm({ wallet_id: String(tx.wallet_id), category_id: String(tx.category_id), type: tx.type, amount: String(tx.amount), description: tx.description ?? '', date: toInputDate(tx.date) });
  };

  const filtered = useMemo(() =>
    search.trim()
      ? transactions.filter((t) =>
          (t.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (t.category?.name ?? '').toLowerCase().includes(search.toLowerCase()))
      : transactions
  , [transactions, search]);

  const groups       = useMemo(() => groupByDate(filtered), [filtered]);
  const totalIncome  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const hasFilter    = filterType !== 'all' || !!filterWallet;

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Transactions</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>
            {meta ? `${meta.total} transaction${meta.total !== 1 ? 's' : ''} total` : 'Loading...'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, paddingRight: 20 }}>
          <Plus size={16} strokeWidth={2.5} /> Add Transaction
        </button>
      </div>

      {/* Stat cards */}
      <div className="content-grid-2">
        {[
          { label: 'Total Income', value: totalIncome, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', Icon: ArrowUpRight },
          { label: 'Total Expenses', value: totalExpense, color: '#fb7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)', Icon: ArrowDownRight },
        ].map(({ label, value, color, bg, border, Icon }) => (
          <div key={label} className="card animate-fadeup" style={{ padding: '22px 24px', background: bg, borderColor: border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} style={{ color }} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </div>
            <NumberFlow value={value} format={{ style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }} style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }} />
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className="input-base" style={{ paddingLeft: 40, height: 44 }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2 }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilter(!showFilter)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 44, borderRadius: 12, background: hasFilter ? 'var(--accent-cyan-dim)' : 'var(--bg-overlay)', border: `1px solid ${hasFilter ? 'rgba(14,165,233,0.5)' : 'var(--border-subtle)'}`, color: hasFilter ? 'var(--accent-cyan-soft)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
          <SlidersHorizontal size={14} />
          <span>Filter</span>
          {hasFilter && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', flexShrink: 0 }} />}
        </button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="card" style={{ padding: '18px 20px' }}>
            <div className="content-grid-2">
              <div>
                <label className="input-label">Type</label>
                <select className="input-base" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                  <option value="all">All types</option>
                  <option value="income">Income only</option>
                  <option value="expense">Expenses only</option>
                </select>
              </div>
              <div>
                <label className="input-label">Wallet</label>
                <select className="input-base" value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)}>
                  <option value="">All wallets</option>
                  {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
            {hasFilter && (
              <button onClick={() => { setFilterType('all'); setFilterWallet(''); setShowFilter(false); }} className="btn-ghost" style={{ marginTop: 12, fontSize: 12.5, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 5 }}>
                <X size={13} /> Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction list */}
      <div className="card" style={{ overflow: 'hidden', padding: '6px 0' }}>
        {loading ? (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 13 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="💸" title="No transactions yet" description="Start recording your income and expenses" action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Transaction</button>} />
        ) : (
          <div>
            {groups.map((group, i) => (
              <div key={group.label} className="animate-fadeup" style={{ animationDelay: `${i * 40}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 6px', background: 'linear-gradient(to bottom, var(--bg-elevated), transparent)', position: 'sticky', top: 0, zIndex: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{group.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: group.dayTotal >= 0 ? '#34d399' : '#fb7185', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                    {group.dayTotal >= 0 ? '+' : ''}{formatRupiah(Math.abs(group.dayTotal))}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 6 }}>
                  {group.items.map((tx) => <TxRow key={tx.id} tx={tx} onEdit={() => openEdit(tx)} onDelete={() => setDeleteTarget(tx)} />)}
                </div>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 18px 4px' }} />
              </div>
            ))}
            {meta?.has_more && (
              <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                <button onClick={async () => { setLoadingMore(true); await fetchTx(meta.current_page + 1, true); setLoadingMore(false); }} disabled={loadingMore} className="btn-ghost" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {loadingMore ? 'Loading...' : `Load more (${meta.total - filtered.length} remaining)`}
                  {!loadingMore && <ChevronDown size={14} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddForm(makeEmptyForm()); }} title="Add Transaction" subtitle="Record a new income or expense">
        <TxForm form={addForm} setForm={setAddForm} wallets={wallets} categories={categories} onSubmit={handleAdd} saving={saving} submitLabel="Save Transaction" onCancel={() => { setShowAdd(false); setAddForm(makeEmptyForm()); }} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Edit Transaction" footer={
        <button onClick={() => { if (editTx) setDeleteTarget(editTx); }} className="btn-danger" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
          Delete Transaction
        </button>
      }>
        <TxForm form={editForm} setForm={setEditForm} wallets={wallets} categories={categories} onSubmit={handleEdit} saving={editSaving} submitLabel="Save Changes" onCancel={() => setEditTx(null)} editingTxCurrentAmount={editOriginalAmount} />
      </Modal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Transaction?"
        description="Menghapus transaksi ini akan mempengaruhi saldo dompet terkait. Tindakan ini tidak bisa dibatalkan."
        itemName={deleteTarget?.description || deleteTarget?.category?.name}
      />
    </div>
  );
}