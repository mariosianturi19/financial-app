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
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = spent > limit;
  const warn = pct >= 80 && !over;
  const fillColor = over ? 'var(--grad-rose)' : warn ? 'var(--grad-amber)' : 'var(--grad-emerald)';
  const accentColor = over ? 'var(--accent-rose)' : warn ? 'var(--accent-amber)' : 'var(--accent-emerald)';
  const [hov, setHov] = useState(false);

  return (
    <div className="animate-fadeup"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--bg-elevated)', border: `1px solid ${hov ? 'var(--border-default)' : 'var(--border-subtle)'}`, transition: 'all 0.2s', animationDelay: `${index * 60}ms`, transform: hov ? 'translateY(-1px)' : 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: (budget.category?.color ?? '#7c6ff7') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
            {budget.category?.icon ?? '📂'}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{budget.category?.name ?? 'Kategori'}</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{formatRupiah(spent)} / {formatRupiah(limit)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: accentColor, fontFamily: 'var(--font-display)' }}>
            {Math.round(over ? (spent/limit)*100 : pct)}%
          </span>
          <button onClick={() => onDelete(budget.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, opacity: hov ? 1 : 0, transition: 'all 0.15s' }}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--accent-rose)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--text-tertiary)')}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {/* Bar */}
      <div style={{ height: 6, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: fillColor, width: `${pct}%`, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 10, height: '100%', background: 'rgba(255,255,255,0.35)', borderRadius: 99, filter: 'blur(3px)' }} />
        </div>
      </div>
      {over && (
        <p style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertTriangle size={10} /> Melebihi {formatRupiah(spent - limit)}
        </p>
      )}
    </div>
  );
}

export default function BudgetsPage() {
  const { categories, categoriesLoaded, fetchCategories } = useAppStore();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ category_id: '', amount: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!categoriesLoaded) fetchCategories(); }, [categoriesLoaded, fetchCategories]);

  const fetchBudgets = (month: string) => {
    setLoading(true);
    api.get(`/budgets?month=${month}`).then((r) => setBudgets(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBudgets(currentMonth); }, [currentMonth]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const usedIds = new Set(budgets.map((b) => b.category_id));
  const availableCats = expenseCategories.filter((c) => !usedIds.has(c.id));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post('/budgets', { ...addForm, month: currentMonth });
      setBudgets([...budgets, res.data]); setShowAdd(false); setAddForm({ category_id: '', amount: '' });
      toast.success('Anggaran ditambah!');
    } catch { toast.error('Gagal.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus anggaran ini?')) return;
    try { await api.delete(`/budgets/${id}`); setBudgets(budgets.filter((b) => b.id !== id)); toast.success('Dihapus.'); }
    catch { toast.error('Gagal.'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent  = budgets.reduce((s, b) => s + Number(b.spent ?? 0), 0);
  const overallPct  = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOver      = totalSpent > totalBudget;
  const overCount   = budgets.filter((b) => Number(b.spent ?? 0) > Number(b.amount)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Anggaran"
        subtitle="Kelola batas pengeluaran per kategori"
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} strokeWidth={2.5} /> Tambah
          </button>
        }
      />

      {/* Month navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, alignSelf: 'flex-start' }}>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
          onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)')}
          onMouseLeave={e=>(e.currentTarget.style.background='var(--bg-overlay)')}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ minWidth: 130, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{formatMonth(currentMonth)}</p>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
          onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)')}
          onMouseLeave={e=>(e.currentTarget.style.background='var(--bg-overlay)')}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Overall summary */}
      {budgets.length > 0 && (
        <div style={{ background: isOver ? 'rgba(251,113,133,0.08)' : 'var(--bg-elevated)', border: `1px solid ${isOver ? 'rgba(251,113,133,0.25)' : 'var(--border-subtle)'}`, borderRadius: 20, padding: '20px 24px', position: 'relative', overflow: 'hidden' }} className="animate-fadeup">
          {/* Glow */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: isOver ? 'rgba(251,113,133,0.15)' : 'rgba(124,111,247,0.12)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, position: 'relative' }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Anggaran Bulan Ini</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: isOver ? 'var(--accent-rose)' : 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                  {formatRupiah(totalSpent)}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/ {formatRupiah(totalBudget)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: isOver ? 'rgba(251,113,133,0.15)' : overallPct >= 80 ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.12)', border: `1px solid ${isOver ? 'rgba(251,113,133,0.3)' : overallPct >= 80 ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.2)'}` }}>
              {isOver ? <AlertTriangle size={12} style={{ color: 'var(--accent-rose)' }} /> : overallPct >= 80 ? <AlertTriangle size={12} style={{ color: 'var(--accent-amber)' }} /> : <CheckCircle2 size={12} style={{ color: 'var(--accent-emerald)' }} />}
              <span style={{ fontSize: 12, fontWeight: 700, color: isOver ? 'var(--accent-rose)' : overallPct >= 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                {Math.round(overallPct)}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: isOver ? 'var(--grad-rose)' : overallPct >= 80 ? 'var(--grad-amber)' : 'var(--grad-violet)',
              width: `${overallPct}%`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: '100%', background: 'rgba(255,255,255,0.3)', borderRadius: 99, filter: 'blur(4px)' }} />
            </div>
          </div>

          {overCount > 0 && (
            <p style={{ fontSize: 11.5, color: 'var(--accent-rose)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={11} /> {overCount} kategori melebihi anggaran
            </p>
          )}
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState icon="🎯" title="Belum ada anggaran" description="Tetapkan batas pengeluaran per kategori untuk bulan ini"
            action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Tambah Anggaran</button>} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {budgets.map((budget, i) => (
            <BudgetCard key={budget.id} budget={budget} index={i} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Anggaran" subtitle={`Bulan ${formatMonth(currentMonth)}`}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="input-label">Kategori</label>
            <select required value={addForm.category_id} onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })} className="input-base">
              <option value="">Pilih kategori pengeluaran</option>
              {availableCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            {availableCats.length === 0 && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6 }}>Semua kategori sudah memiliki anggaran bulan ini.</p>}
          </div>
          <div>
            <label className="input-label">Batas Anggaran (Rp)</label>
            <input type="number" required min="1" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} className="input-base" placeholder="0" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={saving || availableCats.length === 0} style={{ flex: 1 }}>
              {saving ? 'Menyimpan...' : 'Tambah Anggaran'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Batal</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}