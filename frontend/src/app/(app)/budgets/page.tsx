'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Budget } from '@/types';
import { formatRupiah, formatMonth, addMonths } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

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
    if (!confirm('Hapus?')) return;
    try {
      await api.delete(`/budgets/${id}`); setBudgets(budgets.filter((b) => b.id !== id));
      toast.success('Dihapus.');
    } catch { toast.error('Gagal.'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent ?? 0), 0);
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isCurrentMonth = currentMonth === new Date().toISOString().slice(0, 7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Anggaran"
        subtitle={formatMonth(currentMonth)}
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Plus size={15} /> Tambah
          </button>
        }
      />

      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {formatMonth(currentMonth)} {isCurrentMonth && <span style={{ fontSize: 11, color: 'var(--accent-violet)', marginLeft: 6, fontWeight: 500 }}>• Bulan ini</span>}
        </span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Overall summary */}
      {budgets.length > 0 && (
        <div className="card noise" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, var(--bg-elevated) 0%, #1a1630 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Anggaran</p>
              <p className="stat-value" style={{ fontSize: 22, color: 'var(--text-primary)' }}>{formatRupiah(totalBudget)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terpakai</p>
              <p className="stat-value" style={{ fontSize: 22, color: totalSpent > totalBudget ? 'var(--accent-rose)' : 'var(--text-primary)' }}>{formatRupiah(totalSpent)}</p>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{
              width: `${overallPct}%`,
              background: totalSpent > totalBudget ? 'var(--grad-rose)' : overallPct >= 80 ? 'var(--grad-amber)' : 'var(--grad-violet)',
            }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
            {formatRupiah(Math.max(totalBudget - totalSpent, 0))} tersisa · {Math.round(overallPct)}% terpakai
          </p>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState icon="🎯" title="Belum ada anggaran" description="Tetapkan batas pengeluaran per kategori" action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Tambah Anggaran</button>} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgets.map((budget, i) => {
            const spent = Number(budget.spent ?? 0);
            const limit = Number(budget.amount);
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over = spent > limit;
            const fillColor = over ? 'var(--grad-rose)' : pct >= 80 ? 'var(--grad-amber)' : 'var(--grad-emerald)';

            return (
              <div key={budget.id} className="card card-hover animate-fadeup" style={{ padding: '18px 20px', animationDelay: `${i * 50}ms` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: (budget.category?.color ?? '#7c6ff7') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {budget.category?.icon ?? '📂'}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{budget.category?.name ?? 'Kategori'}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                        {formatRupiah(spent)} <span style={{ color: 'var(--border-strong)' }}>/</span> {formatRupiah(limit)}
                        {over && <span style={{ color: 'var(--accent-rose)', marginLeft: 6, fontWeight: 600 }}>Over!</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: over ? 'var(--accent-rose)' : pct >= 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {Math.round(pct)}%
                    </span>
                    <button onClick={() => handleDelete(budget.id)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,113,133,0.08)', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6, transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: fillColor }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  {formatRupiah(Math.max(limit - spent, 0))} tersisa
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddForm({ category_id: '', amount: '' }); }} title="Tambah Anggaran">
        {availableCats.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
            Semua kategori sudah dianggarkan bulan ini.
          </p>
        ) : (
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori Pengeluaran</label>
              <select value={addForm.category_id} required onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })} className="input-base">
                <option value="">Pilih kategori</option>
                {availableCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batas Anggaran (Rp)</label>
              <input type="number" min="1" required value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} className="input-base" placeholder="500000" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Menyimpan...' : 'Simpan Anggaran'}</button>
              <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Batal</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}