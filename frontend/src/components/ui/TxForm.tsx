'use client';

import { Wallet, Category } from '@/types';
import AmountInput from '@/components/ui/AmountInput';

export interface TxFormData {
  wallet_id:   string;
  category_id: string;
  type:        'income' | 'expense';
  amount:      string;   // raw numeric string
  description: string;
  date:        string;
}

interface TxFormProps {
  form:        TxFormData;
  setForm:     (f: TxFormData) => void;
  wallets:     Wallet[];
  categories:  Category[];
  onSubmit:    (e: React.FormEvent) => void;
  saving:      boolean;
  submitLabel: string;
  onCancel:    () => void;
  /** When editing an existing transaction — pass its original amount
   *  so balance validation adds it back to available funds */
  editingTxCurrentAmount?: number;
}

export default function TxForm({
  form, setForm, wallets, categories,
  onSubmit, saving, submitLabel, onCancel,
  editingTxCurrentAmount = 0,
}: TxFormProps) {

  const filteredCats  = categories.filter((c) => c.type === form.type);
  const selectedWallet = wallets.find((w) => String(w.id) === form.wallet_id) ?? null;

  /* Prevent submit if amount exceeds wallet balance on expense */
  const numericAmount  = parseInt(form.amount, 10) || 0;
  const effectiveBalance = selectedWallet
    ? Number(selectedWallet.balance) + (form.type === 'expense' ? editingTxCurrentAmount : 0)
    : Infinity;
  const exceedsBalance = form.type === 'expense' && !!selectedWallet && numericAmount > effectiveBalance;

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Type toggle ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t} type="button"
            onClick={() => setForm({ ...form, type: t, category_id: '' })}
            style={{
              padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              background: form.type === t
                ? (t === 'income' ? 'rgba(52,211,153,0.18)' : 'rgba(251,113,133,0.18)')
                : 'var(--bg-overlay)',
              color: form.type === t
                ? (t === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)')
                : 'var(--text-tertiary)',
              outline: form.type === t
                ? `1.5px solid ${t === 'income' ? 'rgba(52,211,153,0.4)' : 'rgba(251,113,133,0.4)'}`
                : '1px solid var(--border-subtle)',
              transition: 'all 0.18s',
            }}
          >
            {t === 'income' ? '↑ Income' : '↓ Expense'}
          </button>
        ))}
      </div>

      {/* ── Amount (with formatted display + wallet validation) ── */}
      <div>
        <label className="input-label">Amount</label>
        <AmountInput
          value={form.amount}
          onChange={(raw) => setForm({ ...form, amount: raw })}
          type={form.type}
          selectedWallet={selectedWallet}
          editingTxCurrentAmount={editingTxCurrentAmount}
          required
        />
      </div>

      {/* ── Wallet ── */}
      <div>
        <label className="input-label">Wallet</label>
        <select
          className="input-base" required
          value={form.wallet_id}
          onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
        >
          <option value="">Select wallet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.icon} {w.name}
              {form.type === 'expense'
                ? ` — ${Number(w.balance).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}`
                : ''}
            </option>
          ))}
        </select>
      </div>

      {/* ── Category ── */}
      <div>
        <label className="input-label">Category</label>
        <select
          className="input-base" required
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          <option value="">Select category</option>
          {filteredCats.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* ── Note ── */}
      <div>
        <label className="input-label">Note (optional)</label>
        <input
          className="input-base"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What was it for?"
        />
      </div>

      {/* ── Date ── */}
      <div>
        <label className="input-label">Date</label>
        <input
          className="input-base" type="date" required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={saving || exceedsBalance}
          style={{ flex: 1, opacity: exceedsBalance ? 0.45 : 1, cursor: exceedsBalance ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving...' : exceedsBalance ? 'Insufficient Balance' : submitLabel}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}