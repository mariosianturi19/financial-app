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
import TxForm, { TxFormData } from '@/components/ui/TxForm';
import toast from 'react-hot-toast';

const makeEmptyForm = (): TxFormData => ({
  wallet_id: '', category_id: '', type: 'expense',
  amount: '', description: '',
  date: new Date().toISOString().split('T')[0],
});

interface PaginationMeta {
  current_page: number; last_page: number;
  per_page: number; total: number; has_more: boolean;
}

/* ── Date grouping helpers ──────────────────────────────────── */
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

  return date.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function groupByDate(txList: Transaction[]): { label: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txList) {
    const key = tx.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([, items]) => ({
    label: getDateLabel(items[0].date),
    items,
  }));
}

/* ── Single transaction row ─────────────────────────────────── */
function TxRow({ tx, onEdit }: { tx: Transaction; onEdit: () => void }) {
  const [hov, setHov] = useState(false);
  const isIncome = tx.type === 'income';
  const color    = tx.category?.color ?? '#7c6ff7';

  return (
    <div
      onClick={onEdit}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 13, cursor: 'pointer',
        background: hov ? 'var(--bg-overlay)' : 'transparent',
        transition: 'background 0.14s, transform 0.14s',
        transform: hov ? 'translateX(3px)' : 'none',
        margin: '0 6px',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: color + '1e', border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17,
        transition: 'transform 0.2s var(--ease-spring)',
        transform: hov ? 'scale(1.08) rotate(-4deg)' : 'scale(1)',
      }}>
        {tx.category?.icon ?? (isIncome ? '📈' : '📉')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2,
        }}>
          {tx.description || tx.category?.name || '—'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDate(tx.date)}</span>
          {tx.wallet && (
            <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', background: 'var(--bg-overlay)', padding: '1px 7px', borderRadius: 99, border: '1px solid var(--border-subtle)' }}>
              {tx.wallet.name}
            </span>
          )}
          {tx.category && (
            <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 99, background: color + '18', color, border: `1px solid ${color}30` }}>
              {tx.category.icon} {tx.category.name}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        {isIncome
          ? <ArrowUpRight   size={13} style={{ color: 'var(--accent-emerald)' }} />
          : <ArrowDownRight size={13} style={{ color: 'var(--accent-rose)' }} />
        }
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em',
          color: isIncome ? 'var(--accent-emerald)' : 'var(--accent-rose)',
        }}>
          {formatRupiah(tx.amount)}
        </span>
      </div>
    </div>
  );
}

/* ── Date group section ─────────────────────────────────────── */
function DateGroup({
  label, items, onEdit, index,
}: {
  label: string; items: Transaction[];
  onEdit: (tx: Transaction) => void; index: number;
}) {
  const dayTotal   = items.reduce((s, tx) =>
    tx.type === 'income' ? s + Number(tx.amount) : s - Number(tx.amount), 0);
  const isPositive = dayTotal >= 0;

  return (
    <div className="animate-fadeup" style={{ animationDelay: `${index * 50}ms` }}>
      {/* Sticky date header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px 6px',
        position: 'sticky', top: 0,
        background: 'var(--bg-base)', zIndex: 2,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span style={{
          fontSize: 11.5, fontWeight: 700,
          color: isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
        }}>
          {isPositive ? '+' : ''}
          {dayTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((tx) => (
          <TxRow key={tx.id} tx={tx} onEdit={() => onEdit(tx)} />
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 16px 2px' }} />
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function TransactionsPage() {
  const {
    wallets, walletsLoaded, fetchWallets,
    categories, categoriesLoaded, fetchCategories,
  } = useAppStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta]           = useState<PaginationMeta | null>(null);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add form
  const [showAdd, setShowAdd]   = useState(false);
  const [addForm, setAddForm]   = useState<TxFormData>(makeEmptyForm());
  const [saving, setSaving]     = useState(false);

  // Edit form — track original amount for balance validation
  const [editTx, setEditTx]                     = useState<Transaction | null>(null);
  const [editForm, setEditForm]                 = useState<TxFormData>(makeEmptyForm());
  const [editOriginalAmount, setEditOriginalAmount] = useState(0);
  const [editSaving, setEditSaving]             = useState(false);

  // Filters
  const [search, setSearch]               = useState('');
  const [filterType, setFilterType]       = useState<'all' | 'income' | 'expense'>('all');
  const [filterWallet, setFilterWallet]   = useState('');
  const [showFilter, setShowFilter]       = useState(false);

  useEffect(() => {
    if (!walletsLoaded)   fetchWallets();
    if (!categoriesLoaded) fetchCategories();
  }, [walletsLoaded, categoriesLoaded, fetchWallets, fetchCategories]);

  const fetchTx = useCallback(async (page = 1, append = false) => {
    const params = new URLSearchParams({ page: String(page), per_page: '30' });
    if (filterType !== 'all') params.set('type', filterType);
    if (filterWallet)         params.set('wallet_id', filterWallet);
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

  /* ── Handlers ── */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post('/transactions', addForm);
      setTransactions([res.data, ...transactions]);
      setShowAdd(false);
      setAddForm(makeEmptyForm());
      toast.success('Transaction saved!');
      // Refresh wallets so balances stay accurate in next open
      fetchWallets();
    } catch { toast.error('Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTx) return;
    setEditSaving(true);
    try {
      const res = await api.put(`/transactions/${editTx.id}`, editForm);
      setTransactions(transactions.map((t) => t.id === editTx.id ? res.data : t));
      setEditTx(null);
      toast.success('Transaction updated!');
      fetchWallets();
    } catch { toast.error('Failed to save.'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter((t) => t.id !== id));
      setEditTx(null);
      toast.success('Transaction deleted.');
      fetchWallets();
    } catch { toast.error('Failed to delete.'); }
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setEditOriginalAmount(Number(tx.amount));
    setEditForm({
      wallet_id:   String(tx.wallet_id),
      category_id: String(tx.category_id),
      type:        tx.type,
      amount:      String(tx.amount),
      description: tx.description ?? '',
      date:        toInputDate(tx.date),
    });
  };

  /* ── Derived data ── */
  const filtered = useMemo(() =>
    search.trim()
      ? transactions.filter((t) =>
          (t.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (t.category?.name ?? '').toLowerCase().includes(search.toLowerCase())
        )
      : transactions
  , [transactions, search]);

  const groups       = useMemo(() => groupByDate(filtered), [filtered]);
  const totalIncome  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const hasFilter    = filterType !== 'all' || !!filterWallet;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Transactions"
        subtitle={meta ? `${meta.total} transaction${meta.total !== 1 ? 's' : ''} total` : undefined}
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} strokeWidth={2.5} /> Add
          </button>
        }
      />

      {/* Quick stats */}
      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="animate-fadeup">
          {[
            { label: 'Income',   value: totalIncome,  color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  icon: '↑' },
            { label: 'Expenses', value: totalExpense, color: 'var(--accent-rose)',    bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)', icon: '↓' },
          ].map(({ label, value, color, bg, border, icon }) => (
            <div key={label} style={{ padding: '14px 16px', borderRadius: 16, background: bg, border: `1px solid ${border}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{icon} {label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
                {formatRupiah(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="input-base"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 14px', height: 42, borderRadius: 12,
            background: hasFilter ? 'var(--accent-violet-dim)' : 'var(--bg-overlay)',
            border: `1px solid ${hasFilter ? 'rgba(124,111,247,0.5)' : 'var(--border-subtle)'}`,
            color: hasFilter ? 'var(--accent-violet)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          }}
        >
          <Filter size={14} />
          {hasFilter && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-violet)', flexShrink: 0 }} />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="card animate-fadeup" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label">Type</label>
              <select className="input-base" value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}>
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
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
            <button
              onClick={() => { setFilterType('all'); setFilterWallet(''); }}
              className="btn-ghost"
              style={{ marginTop: 12, fontSize: 12, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Transaction list */}
      <div className="card" style={{ overflow: 'hidden', padding: '4px 0' }}>
        {loading ? (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 62, borderRadius: 12 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No transactions yet"
            description="Start recording your income and expenses"
            action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Transaction</button>}
          />
        ) : (
          <div>
            {groups.map((group, i) => (
              <DateGroup key={group.label} label={group.label} items={group.items} index={i} onEdit={openEdit} />
            ))}

            {/* Load more */}
            {meta?.has_more && (
              <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                <button
                  onClick={async () => {
                    setLoadingMore(true);
                    await fetchTx(meta.current_page + 1, true);
                    setLoadingMore(false);
                  }}
                  disabled={loadingMore}
                  className="btn-ghost"
                  style={{ fontSize: 13, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {loadingMore ? 'Loading...' : `Load more (${meta.total - filtered.length} remaining)`}
                  {!loadingMore && <ChevronDown size={13} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom spacing for FAB */}
      <div style={{ height: 80 }} />

      {/* ── Add Modal ── */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setAddForm(makeEmptyForm()); }}
        title="Add Transaction"
        subtitle="Record a new income or expense"
      >
        <TxForm
          form={addForm} setForm={setAddForm}
          wallets={wallets} categories={categories}
          onSubmit={handleAdd} saving={saving}
          submitLabel="Save"
          onCancel={() => { setShowAdd(false); setAddForm(makeEmptyForm()); }}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={!!editTx}
        onClose={() => setEditTx(null)}
        title="Edit Transaction"
        footer={
          <button
            onClick={() => { if (editTx) handleDelete(editTx.id); }}
            className="btn-danger"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Delete Transaction
          </button>
        }
      >
        <TxForm
          form={editForm} setForm={setEditForm}
          wallets={wallets} categories={categories}
          onSubmit={handleEdit} saving={editSaving}
          submitLabel="Save Changes"
          onCancel={() => setEditTx(null)}
          editingTxCurrentAmount={editOriginalAmount}
        />
      </Modal>
    </div>
  );
}