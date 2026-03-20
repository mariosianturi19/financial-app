'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import api from '@/lib/api';
import { Budget } from '@/types';
import { formatRupiah, formatMonth, addMonths } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';

function BudgetCard({ budget, index, onDelete }: { budget: Budget; index: number; onDelete: (id: number) => void }) {
  const spent = Number(budget.spent ?? 0);
  const limit = Number(budget.amount);
  const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over  = spent > limit;
  const warn  = pct >= 80 && !over;
  const fillColor   = over ? 'var(--grad-rose)' : warn ? 'var(--grad-amber)' : 'var(--grad-emerald)';
  const accentColor = over ? '#fb7185' : warn ? '#fbbf24' : '#34d399';
  const catColor    = budget.category?.color ?? '#7c6ff7';
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.38, ease: 'easeOut' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '20px 22px', borderRadius: 20,
        background: 'var(--bg-elevated)',
        border: `1px solid ${hov ? catColor + '30' : 'var(--border-subtle)'}`,
        transition: 'all 0.22s var(--ease-out)',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${catColor}18` : '0 2px 8px rgba(0,0,0,0.2)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top glow */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor, opacity: 0.7, borderRadius: '20px 20px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: catColor + '22', border: `1px solid ${catColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'transform 0.2s var(--ease-spring)', transform: hov ? 'scale(1.1) rotate(-5deg)' : 'scale(1)' }}>
            {budget.category?.icon ?? '📂'}
          </div>
          <div>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, letterSpacing: '-0.01em' }}>{budget.category?.name ?? 'Category'}</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              {formatRupiah(spent)} <span style={{ opacity: 0.5 }}>/ {formatRupiah(limit)}</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {over ? <AlertTriangle size={14} style={{ color: '#fb7185' }} /> : pct >= 80 ? <AlertTriangle size={14} style={{ color: '#fbbf24' }} /> : <CheckCircle2 size={14} style={{ color: '#34d399', opacity: pct > 0 ? 1 : 0.3 }} />}
            <span style={{ fontSize: 14, fontWeight: 800, color: accentColor, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              {Math.round(over ? (spent / limit) * 100 : pct)}%
            </span>
          </div>
          <button onClick={() => onDelete(budget.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, borderRadius: 8, opacity: hov ? 1 : 0, transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fb7185'; (e.currentTarget as HTMLElement).style.background = 'rgba(251,113,133,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 7, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: index * 0.06 }}
          style={{ height: '100%', borderRadius: 99, background: fillColor, position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: '100%', background: 'rgba(255,255,255,0.35)', borderRadius: 99, filter: 'blur(4px)' }} />
        </motion.div>
      </div>

      {over
        ? <p style={{ fontSize: 11.5, color: '#fb7185', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> Over budget by {formatRupiah(spent - limit)}</p>
        : limit > 0 && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{formatRupiah(limit - spent)} remaining</p>
      }
    </motion.div>
  );
}

export default function BudgetsPage() {
  const { categories, categoriesLoaded, fetchCategories } = useAppStore();
  const [budgets, setBudgets]           = useState<Budget[]>([]);
  const [loading, setLoading]           = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAdd, setShowAdd]           = useState(false);
  const [addForm, setAddForm]           = useState({ category_id: '', amount: '' });
  const [saving, setSaving]             = useState(false);

  useEffect(() => { if (!categoriesLoaded) fetchCategories(); }, [categoriesLoaded, fetchCategories]);

  const fetchBudgets = (month: string) => {
    setLoading(true);
    api.get(`/budgets?month=${month}`).then((r) => setBudgets(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchBudgets(currentMonth); }, [currentMonth]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const usedIds           = new Set(budgets.map((b) => b.category_id));
  const available         = expenseCategories.filter((c) => !usedIds.has(c.id));

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
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Budgets</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>Set and track your spending limits</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 14, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)' }}>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} style={{ width: 28, height: 28, borderRadius: 8, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}>
              <ChevronLeft size={15} />
            </button>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', minWidth: 110, textAlign: 'center' }}>{formatMonth(currentMonth)}</p>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ width: 28, height: 28, borderRadius: 8, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}>
              <ChevronRight size={15} />
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, paddingRight: 20 }}>
            <Plus size={16} strokeWidth={2.5} /> Add Budget
          </button>
        </div>
      </div>

      {/* Total budget overview card */}
      {budgets.length > 0 && (
        <div className="card noise" style={{ padding: '24px 28px', background: isOver ? 'linear-gradient(135deg, rgba(251,113,133,0.1) 0%, rgba(251,113,133,0.04) 100%)' : 'linear-gradient(135deg, #111121 0%, #181828 100%)', borderColor: isOver ? 'rgba(251,113,133,0.3)' : 'var(--border-accent)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${isOver ? 'rgba(251,113,133,0.2)' : 'rgba(124,111,247,0.2)'} 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-violet)' }}>
                <Target size={16} color="white" />
              </div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Monthly Budget Overview</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <NumberFlow value={totalSpent} format={{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }} style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: isOver ? '#fb7185' : 'var(--text-primary)', letterSpacing: '-0.03em' }} />
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>of {formatRupiah(totalBudget)} budget</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: isOver ? '#fb7185' : overallPct >= 80 ? '#fbbf24' : '#34d399', letterSpacing: '-0.03em' }}>{Math.round(overallPct)}%</span>
                {overCount > 0 && <p style={{ fontSize: 11.5, color: '#fb7185', marginTop: 3 }}>{overCount} budget{overCount !== 1 ? 's' : ''} over limit</p>}
              </div>
            </div>
            <div style={{ height: 8, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ height: '100%', borderRadius: 99, background: isOver ? 'var(--grad-rose)' : overallPct >= 80 ? 'var(--grad-amber)' : 'var(--grad-emerald)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: '100%', background: 'rgba(255,255,255,0.4)', borderRadius: 99, filter: 'blur(4px)' }} />
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Budget grid */}
      {loading ? (
        <div className="content-grid-2">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 20 }} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState icon="🎯" title="No budgets set" description={`Set spending limits by category for ${formatMonth(currentMonth)}`} action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Budget</button>} />
        </div>
      ) : (
        <div className="content-grid-2">
          {budgets.map((budget, i) => <BudgetCard key={budget.id} budget={budget} index={i} onDelete={handleDelete} />)}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddForm({ category_id: '', amount: '' }); }} title="Add Budget" subtitle={`${formatMonth(currentMonth)}`}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="input-label">Expense Category</label>
            <select required value={addForm.category_id} onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })} className="input-base">
              <option value="">Select category...</option>
              {available.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            {available.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>All categories already have budgets for this month.</p>}
          </div>
          <div>
            <label className="input-label">Budget Limit (Rp)</label>
            <input type="number" required min="1" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} className="input-base" placeholder="0" style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={saving || available.length === 0} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Add Budget'}</button>
            <button type="button" className="btn-ghost" onClick={() => { setShowAdd(false); setAddForm({ category_id: '', amount: '' }); }}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}