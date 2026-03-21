'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Plus, ChevronLeft, ChevronRight, Trash2, AlertTriangle, CheckCircle2, Target, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import api from '@/lib/api';
import { Budget } from '@/types';
import { formatRupiah, formatMonth, addMonths } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import NumericInput from '@/components/ui/NumericInput';
import { toast } from 'sonner';

/* ── Shared icon action button ── */
function ActionBtn({ icon: Icon, onClick, hoverColor }: { icon: React.ElementType; onClick: (e: React.MouseEvent) => void; hoverColor: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 10,
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-overlay)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', transition: 'all 0.15s', flexShrink: 0,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = hoverColor; (e.currentTarget as HTMLElement).style.borderColor = hoverColor + '66'; (e.currentTarget as HTMLElement).style.background = hoverColor + '15'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'; }}
    >
      <Icon size={14} />
    </button>
  );
}

/* ── Budget Card ── */
function BudgetCard({ budget, index, onDelete, onEdit }: { budget: Budget; index: number; onDelete: (b: Budget) => void; onEdit: (b: Budget) => void }) {
  const spent = Number(budget.spent ?? 0);
  const limit = Number(budget.amount);
  const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over  = spent > limit;
  const warn  = pct >= 80 && !over;
  const fillColor   = over ? 'var(--grad-rose)' : warn ? 'var(--grad-amber)' : 'var(--grad-emerald)';
  const accentColor = over ? '#f43f5e' : warn ? '#f59e0b' : '#34d399';
  const catColor    = budget.category?.color ?? '#0ea5e9';
  const [hov, setHov] = useState(false);
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.25 });

  return (
    <motion.div
      ref={inViewRef}
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
      {/* Top glow bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor, opacity: 0.7, borderRadius: '20px 20px 0 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: catColor + '22', border: `1px solid ${catColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, transition: 'transform 0.2s var(--ease-spring)', transform: hov ? 'scale(1.1) rotate(-5deg)' : 'scale(1)' }}>
            {budget.category?.icon ?? '📂'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{budget.category?.name ?? 'Category'}</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              {formatRupiah(spent)} <span style={{ opacity: 0.5 }}>/ {formatRupiah(limit)}</span>
            </p>
          </div>
        </div>

        {/* Right: pct + action buttons — always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {over
              ? <AlertTriangle size={13} style={{ color: '#f43f5e' }} />
              : pct >= 80
                ? <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
                : <CheckCircle2 size={13} style={{ color: '#34d399', opacity: pct > 0 ? 1 : 0.3 }} />}
            <span style={{ fontSize: 13, fontWeight: 800, color: accentColor, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              {Math.round(over ? (spent / limit) * 100 : pct)}%
            </span>
          </div>
          <ActionBtn icon={Edit2}  onClick={(e) => { e.stopPropagation(); onEdit(budget); }}   hoverColor="var(--accent-cyan)" />
          <ActionBtn icon={Trash2} onClick={(e) => { e.stopPropagation(); onDelete(budget); }} hoverColor="#f43f5e" />
        </div>
      </div>

      {/* Progress bar — animates only when in viewport */}
      <div style={{ height: 7, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${pct}%` : 0 }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: inView ? index * 0.07 : 0 }}
          style={{ height: '100%', borderRadius: 99, background: fillColor, position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: '100%', background: 'rgba(255,255,255,0.35)', borderRadius: 99, filter: 'blur(4px)' }} />
        </motion.div>
      </div>

      {over
        ? <p style={{ fontSize: 11.5, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> Over budget by {formatRupiah(spent - limit)}</p>
        : limit > 0 && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{formatRupiah(limit - spent)} remaining</p>
      }
    </motion.div>
  );
}

/* ── Page ── */
export default function BudgetsPage() {
  const { categories, categoriesLoaded, fetchCategories } = useAppStore();
  const [budgets, setBudgets]           = useState<Budget[]>([]);
  const [loading, setLoading]           = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAdd, setShowAdd]           = useState(false);
  const [addForm, setAddForm]           = useState({ category_id: '', amount: '' });
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [deleting, setDeleting]         = useState(false);
  // Edit state
  const [editTarget, setEditTarget]     = useState<Budget | null>(null);
  const [editAmount, setEditAmount]     = useState('');
  const [editSaving, setEditSaving]     = useState(false);

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
      setBudgets([...budgets, res.data]);
      setShowAdd(false); setAddForm({ category_id: '', amount: '' });
      toast.success('Budget added!', { style: { borderLeft: '4px solid var(--accent-emerald)' } });
    } catch { toast.error('Failed to save.'); } finally { setSaving(false); }
  };

  const openEdit = (budget: Budget) => {
    setEditTarget(budget);
    setEditAmount(String(budget.amount));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const res = await api.put(`/budgets/${editTarget.id}`, { amount: editAmount, month: currentMonth });
      setBudgets(budgets.map((b) => b.id === editTarget.id ? { ...b, amount: res.data.amount } : b));
      setEditTarget(null);
      toast.success('Budget updated!', { style: { borderLeft: '4px solid var(--accent-cyan)' } });
    } catch { toast.error('Failed to update.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/budgets/${deleteTarget.id}`);
      setBudgets(budgets.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.error('Budget deleted.', { style: { borderLeft: '4px solid var(--accent-rose)' } });
    } catch { toast.error('Failed to delete.'); } finally { setDeleting(false); }
  };

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent  = budgets.reduce((s, b) => s + Number(b.spent ?? 0), 0);
  const overallPct  = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOver      = totalSpent > totalBudget;
  const overCount   = budgets.filter((b) => Number(b.spent ?? 0) > Number(b.amount)).length;
  const remaining   = Math.max(0, totalBudget - totalSpent);

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Budgets</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>Set and track your spending limits</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} strokeWidth={2.5} /> Add Budget
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {budgets.length > 0 && (
        <div className="content-grid-3" style={{ marginBottom: 4 }}>
          {[
            { label: 'Total Budget', value: totalBudget, color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)', icon: '🎯' },
            { label: 'Total Spent',  value: totalSpent,  color: isOver ? '#f43f5e' : 'var(--accent-amber)', bg: isOver ? 'rgba(244,63,94,0.12)' : 'var(--accent-amber-dim)', icon: '💸' },
            { label: 'Remaining',    value: remaining,   color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-dim)', icon: '✅' },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} style={{ padding: '16px 20px', borderRadius: 16, background: bg, border: `1px solid ${color}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              </div>
              <NumberFlow value={value} format={{ style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }}
                style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.03em' }} />
            </div>
          ))}
        </div>
      )}

      {/* Monthly overview bar */}
      {budgets.length > 0 && (
        <div className="card noise" style={{ padding: '22px 28px', background: isOver ? 'linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.03) 100%)' : 'linear-gradient(135deg, #060d1b 0%, #0d1628 100%)', borderColor: isOver ? 'rgba(244,63,94,0.3)' : 'var(--border-accent)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${isOver ? 'rgba(244,63,94,0.2)' : 'rgba(14,165,233,0.2)'} 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--grad-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-cyan)' }}>
                <Target size={15} color="white" />
              </div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Monthly Budget Overview</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <NumberFlow value={totalSpent} format={{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }} style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: isOver ? '#f43f5e' : 'var(--text-primary)', letterSpacing: '-0.03em' }} />
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>of {formatRupiah(totalBudget)} budget</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: isOver ? '#f43f5e' : overallPct >= 80 ? '#f59e0b' : '#34d399', letterSpacing: '-0.03em' }}>{Math.round(overallPct)}%</span>
                {overCount > 0 && <p style={{ fontSize: 11.5, color: '#f43f5e', marginTop: 3 }}>{overCount} budget{overCount !== 1 ? 's' : ''} over limit</p>}
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
          {budgets.map((budget, i) => (
            <BudgetCard key={budget.id} budget={budget} index={i} onDelete={setDeleteTarget} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddForm({ category_id: '', amount: '' }); }} title="Add Budget" subtitle={formatMonth(currentMonth)}>
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
            <NumericInput
              value={addForm.amount}
              onChange={(raw) => setAddForm({ ...addForm, amount: raw })}
              placeholder="0"
              style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}
            />
            {addForm.amount && (
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>
                = Rp {parseInt(addForm.amount || '0', 10).toLocaleString('id-ID')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={saving || available.length === 0} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Add Budget'}</button>
            <button type="button" className="btn-ghost" onClick={() => { setShowAdd(false); setAddForm({ category_id: '', amount: '' }); }}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Budget" subtitle={editTarget ? `${editTarget.category?.icon ?? ''} ${editTarget.category?.name ?? ''}` : ''}>
        <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="input-label">Budget Limit (Rp)</label>
            <NumericInput
              value={editAmount}
              onChange={setEditAmount}
              placeholder="0"
              style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}
            />
            {editAmount && (
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>
                = Rp {parseInt(editAmount || '0', 10).toLocaleString('id-ID')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={editSaving} style={{ flex: 1 }}>{editSaving ? 'Saving...' : 'Update Budget'}</button>
            <button type="button" className="btn-ghost" onClick={() => setEditTarget(null)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Budget?"
        description="Budget yang dihapus tidak bisa dikembalikan. Data spending bulanan ini akan hilang."
        itemName={deleteTarget?.category?.name}
      />
    </div>
  );
}