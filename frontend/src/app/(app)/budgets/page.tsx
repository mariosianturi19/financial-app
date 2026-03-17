'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { Budget } from '@/types';
import { formatRupiah, formatMonth, addMonths } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

function BudgetCard({ budget, index, onDelete }: { budget: Budget; index: number; onDelete: (id: number) => void }) {
  const spent = Number(budget.spent ?? 0);
  const limit = Number(budget.amount);
  const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over  = spent > limit;
  const warn  = pct >= 80 && !over;
  const fillColor   = over ? 'var(--grad-rose)' : warn ? 'var(--grad-amber)' : 'var(--grad-emerald)';
  const accentColor = over ? 'var(--accent-rose)' : warn ? 'var(--accent-amber)' : 'var(--accent-emerald)';
  const [hov, setHov] = useState(false);

  return (
    <div className="animate-fadeup" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--bg-elevated)', border: `1px solid ${hov ? 'var(--border-default)' : 'var(--border-subtle)'}`, transition: 'all 0.2s var(--ease-out)', animationDelay: `${index * 60}ms`, transform: hov ? 'translateY(-1px)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: (budget.category?.color ?? '#7c6ff7') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{budget.category?.icon ?? '📂'}</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{budget.category?.name ?? 'Category'}</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{formatRupiah(spent)} / {formatRupiah(limit)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {over ? <AlertTriangle size={14} style={{ color: 'var(--accent-rose)' }} /> : pct >= 80 ? <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} /> : <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)', opacity: pct > 0 ? 1 : 0.3 }} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: accentColor, fontFamily: 'var(--font-display)' }}>{Math.round(over ? (spent / limit) * 100 : pct)}%</span>
          <button onClick={() => onDelete(budget.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, opacity: hov ? 1 : 0, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: fillColor, width: `${pct}%`, transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 10, height: '100%', background: 'rgba(255,255,255,0.35)', borderRadius: 99, filter: 'blur(3px)' }} />
        </div>
      </div>
      {over && <p style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} /> Over budget by {formatRupiah(spent - limit)}</p>}
      {!over && limit > 0 && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{formatRupiah(limit - spent)} remaining</p>}
    </div>
  );
}

export default function BudgetsPage() {
  const { categories, categoriesLoaded, fetchCategories } = useAppStore();
  const [budgets, setBudgets]         = useState<Budget[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState({ category_id: '', amount: '' });
  const [saving, setSaving]           = useState(false);

  useEffect(() => { if (!categoriesLoaded) fetchCategories(); }, [categoriesLoaded, fetchCategories]);

  const fetchBudgets = (month: string) => { setLoading(true); api.get(`/budgets?month=${month}`).then((r) => setBudgets(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetchBudgets(currentMonth); }, [currentMonth]);

  const expenseCategories  = categories.filter((c) => c.type === 'expense');
  const defaultExpense     = expenseCategories.filter((c) => c.is_default);
  const customExpense      = expenseCategories.filter((c) => !c.is_default);
  const usedIds            = new Set(budgets.map((b) => b.category_id));
  const availableDefault   = defaultExpense.filter((c) => !usedIds.has(c.id));
  const availableCustom    = customExpense.filter((c) => !usedIds.has(c.id));
  const totalAvailable     = availableDefault.length + availableCustom.length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post('/budgets', { ...addForm, month: currentMonth });
      setBudgets([...budgets, res.data]); setShowAdd(false); setAddForm({ category_id: '', amount: '' });
      toast.success('Budget added!');
    } catch { toast.error('Failed to save.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this budget?')) return;
    try { await api.delete(`/budgets/${id}`); setBudgets(budgets.filter((b) => b.id !== id)); toast.success('Budget deleted.'); }
    catch { toast.error('Failed to delete.'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent  = budgets.reduce((s, b) => s + Number(b.spent ?? 0), 0);
  const overallPct  = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOver      = totalSpent > totalBudget;
  const overCount   = budgets.filter((b) => Number(b.spent ?? 0) > Number(b.amount)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Budgets" subtitle="Set and track your spending limits" action={<button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} strokeWidth={2.5} /> Add</button>} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, alignSelf: 'flex-start' }}>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)')}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ minWidth: 130, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{formatMonth(currentMonth)}</p>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)')}>
          <ChevronRight size={16} />
        </button>
      </div>

      {budgets.length > 0 && (
        <div style={{ background: isOver ? 'rgba(251,113,133,0.08)' : 'var(--bg-elevated)', border: `1px solid ${isOver ? 'rgba(251,113,133,0.25)' : 'var(--border-subtle)'}`, borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total Budget</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {formatRupiah(totalSpent)} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)' }}>/ {formatRupiah(totalBudget)}</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: isOver ? 'var(--accent-rose)' : overallPct >= 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)', letterSpacing: '-0.02em' }}>{Math.round(overallPct)}%</span>
              {overCount > 0 && <p style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 2 }}>{overCount} over limit</p>}
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: isOver ? 'var(--grad-rose)' : overallPct >= 80 ? 'var(--grad-amber)' : 'var(--grad-emerald)', width: `${overallPct}%`, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}</div>
      ) : budgets.length === 0 ? (
        <div className="card"><EmptyState icon="🎯" title="No budgets set" description={`Set spending limits by category for ${formatMonth(currentMonth)}`} action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Budget</button>} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {budgets.map((budget, i) => <BudgetCard key={budget.id} budget={budget} index={i} onDelete={handleDelete} />)}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddForm({ category_id: '', amount: '' }); }} title="Add Budget" subtitle={`Month: ${formatMonth(currentMonth)}`}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="input-label">Expense Category</label>
            <select required value={addForm.category_id} onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })} className="input-base">
              <option value="">Select category...</option>
              {availableDefault.length > 0 && <optgroup label="── Default Categories">{availableDefault.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</optgroup>}
              {availableCustom.length > 0  && <optgroup label="── Custom Categories">{availableCustom.map((c)  => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</optgroup>}
            </select>
            {totalAvailable === 0 && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6 }}>All categories already have a budget for this month.</p>}
          </div>
          <div>
            <label className="input-label">Budget Limit (Rp)</label>
            <input type="number" required min="1" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} className="input-base" placeholder="0" style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={saving || totalAvailable === 0} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Add Budget'}</button>
            <button type="button" className="btn-ghost" onClick={() => { setShowAdd(false); setAddForm({ category_id: '', amount: '' }); }}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}