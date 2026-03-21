'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Category } from '@/types';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import { toast } from 'sonner';

const COLORS = ['#0ea5e9','#34d399','#f43f5e','#f59e0b','#60a5fa','#f472b6','#a78bfa','#2dd4bf','#f97316','#84cc16','#e879f9','#94a3b8'];
const ICONS  = ['🍔','☕','🚗','🏠','💊','🎬','👔','📚','✈️','💪','🎮','🛒','💡','📱','🎵','🐾','💰','📈','🏦','💳','⚡','🎁','💼','💻','🛍️','✨','🏋️','🎯','🔧','📷'];
const emptyForm = { name: '', type: 'expense' as 'income' | 'expense', color: '#0ea5e9', icon: '🛒' };

function CategoryCard({ cat, index, onEdit, onDelete }: { cat: Category; index: number; onEdit: (cat: Category) => void; onDelete: (id: number) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '14px 16px', borderRadius: 15,
        background: hov ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
        border: `1px solid ${hov ? cat.color + '30' : 'var(--border-subtle)'}`,
        display: 'flex', alignItems: 'center', gap: 13,
        position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateX(4px)' : 'none',
        transition: 'all 0.2s var(--ease-out)', cursor: 'default',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.3), inset 0 0 0 1px ${cat.color}20` : 'none',
      }}
    >
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cat.color, borderRadius: '15px 0 0 15px', opacity: hov ? 1 : 0.6, transition: 'opacity 0.2s' }} />

      <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: cat.color + '20', border: `1px solid ${cat.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'transform 0.2s var(--ease-spring)', transform: hov ? 'scale(1.12) rotate(-6deg)' : 'scale(1)', marginLeft: 6 }}>
        {cat.icon ?? '🏷️'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{cat.name}</p>
          {cat.is_default && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
              <Lock size={8} /> Default
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
          <div style={{ width: 20, height: 3, borderRadius: 99, background: cat.color, opacity: 0.7 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, opacity: hov ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        <button onClick={() => onEdit(cat)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-cyan-soft)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.4)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}>
          <Edit2 size={13} />
        </button>
        {!cat.is_default && (
          <button onClick={() => onDelete(cat.id)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fb7185'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,113,133,0.35)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CategoryForm({ form, setForm, isDefault, onSubmit, saving, submitLabel, onCancel }: any) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isDefault && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)' }}>
          <Lock size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: 'var(--accent-amber)', lineHeight: 1.5 }}>Default categories can only have their <strong>icon</strong> and <strong>color</strong> changed.</p>
        </div>
      )}
      <div>
        <label className="input-label">Category Name</label>
        <input className="input-base" required={!isDefault} disabled={isDefault} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name..." style={isDefault ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
      </div>
      {!isDefault && (
        <div>
          <label className="input-label">Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['income', 'expense'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} style={{ padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, background: form.type === t ? (t === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)') : 'var(--bg-overlay)', color: form.type === t ? (t === 'income' ? '#34d399' : '#fb7185') : 'var(--text-tertiary)', outline: form.type === t ? `1.5px solid ${t === 'income' ? 'rgba(52,211,153,0.4)' : 'rgba(251,113,133,0.4)'}` : '1px solid var(--border-subtle)', transition: 'all 0.18s' }}>
                {t === 'income' ? '↑ Income' : '↓ Expense'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="input-label">Icon</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, maxHeight: 180, overflowY: 'auto', padding: '10px', borderRadius: 12, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
          {ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => setForm({ ...form, icon })} style={{ width: '100%', aspectRatio: '1', borderRadius: 9, border: form.icon === icon ? `1.5px solid ${form.color}` : '1.5px solid transparent', background: form.icon === icon ? form.color + '22' : 'transparent', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', transform: form.icon === icon ? 'scale(1.1)' : 'scale(1)' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="input-label">Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: c, cursor: 'pointer', flexShrink: 0, outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transform: form.color === c ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.15s, outline 0.15s', boxShadow: form.color === c ? `0 0 14px ${c}66` : 'none' }} />
          ))}
        </div>
      </div>
      {/* Preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 13, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: form.color + '22', border: `1px solid ${form.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{form.icon}</div>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{form.name || 'Category Name'}</p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{form.type === 'income' ? '↑ Income' : '↓ Expense'}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : submitLabel}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const { categories, categoriesLoaded, fetchCategories, setCategories, updateCategoryInStore, removeCategoryFromStore } = useAppStore();
  const [loading, setLoading]     = useState(!categoriesLoaded);
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ ...emptyForm });
  const [addSaving, setAddSaving] = useState(false);
  const [editCat, setEditCat]     = useState<Category | null>(null);
  const [editForm, setEditForm]   = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    if (!categoriesLoaded) fetchCategories().finally(() => setLoading(false));
    else setLoading(false);
  }, [categoriesLoaded, fetchCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAddSaving(true);
    try {
      const res = await api.post('/categories', addForm);
      setCategories([...categories, res.data]);
      setShowAdd(false); setAddForm({ ...emptyForm });
      toast.success('Category added!', { style: { borderLeft: '4px solid var(--accent-emerald)' } });
    } catch { toast.error('Failed to add category.'); } finally { setAddSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editCat) return; setEditSaving(true);
    try {
      const payload = editCat.is_default
        ? { icon: editForm.icon, color: editForm.color }
        : { name: editForm.name, type: editForm.type, icon: editForm.icon, color: editForm.color };
      const res = await api.put(`/categories/${editCat.id}`, payload);
      updateCategoryInStore(res.data); setEditCat(null);
      toast.success('Category updated!', { style: { borderLeft: '4px solid var(--accent-cyan)' } });
    } catch { toast.error('Failed to update.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`); removeCategoryFromStore(deleteTarget.id);
      setDeleteTarget(null);
      toast.error('Category deleted.', { style: { borderLeft: '4px solid var(--accent-rose)' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.';
      toast.error(msg);
    } finally { setDeleting(false); }
  };

  const openEdit = (cat: Category) => { setEditCat(cat); setEditForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon ?? '🏷️' }); };
  const income  = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Categories</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>
            {categories.length} total · {categories.filter((c) => !c.is_default).length} custom
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, paddingRight: 20 }}>
          <Plus size={16} strokeWidth={2.5} /> Add Category
        </button>
      </div>

      {/* Info banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 14, background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.18)' }}>
        <Lock size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Default</strong> categories are provided automatically. You can change their icon & color, or add your own custom categories.
        </p>
      </div>

      {/* Categories grid — side by side on desktop */}
      {loading ? (
        <div className="content-grid-2">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 15 }} />)}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState icon="🏷️" title="No categories yet" description="Add your first category" action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Category</button>} />
      ) : (
        <div className="content-grid-2" style={{ gap: 24 }}>
          {/* Income column */}
          {income.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, padding: '0 2px' }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={16} style={{ color: '#34d399' }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Income</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{income.length} categories</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {income.map((cat, i) => <CategoryCard key={cat.id} cat={cat} index={i} onEdit={openEdit} onDelete={(id) => { const c = categories.find(c => c.id === id); if (c) setDeleteTarget(c); }} />)}
              </div>
            </div>
          )}
          {/* Expense column */}
          {expense.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, padding: '0 2px' }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(251,113,133,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowDownRight size={16} style={{ color: '#fb7185' }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Expenses</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{expense.length} categories</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {expense.map((cat, i) => <CategoryCard key={cat.id} cat={cat} index={i} onEdit={openEdit} onDelete={(id) => { const c = categories.find(c => c.id === id); if (c) setDeleteTarget(c); }} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddForm({ ...emptyForm }); }} title="Add Category" subtitle="Create your own custom category">
        <CategoryForm form={addForm} setForm={setAddForm} isDefault={false} onSubmit={handleAdd} saving={addSaving} submitLabel="Save Category" onCancel={() => { setShowAdd(false); setAddForm({ ...emptyForm }); }} />
      </Modal>
      <Modal open={!!(editCat)} onClose={() => setEditCat(null)} title={editCat?.is_default ? 'Edit Appearance' : 'Edit Category'} subtitle={editCat?.is_default ? 'Only icon and color can be changed' : 'Update category details'}>
        <CategoryForm form={editForm} setForm={setEditForm} isDefault={editCat?.is_default} onSubmit={handleEdit} saving={editSaving} submitLabel="Save Changes" onCancel={() => setEditCat(null)} />
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Category?"
        description="Menghapus kategori ini tidak akan menghapus transaksi, namun transaksi terkait tidak akan memiliki kategori."
        itemName={deleteTarget?.name}
      />
    </div>
  );
}