'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Lock } from 'lucide-react';
import api from '@/lib/api';
import { Category } from '@/types';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const COLORS = ['#7c6ff7','#34d399','#fb7185','#fbbf24','#60a5fa','#f472b6','#a78bfa','#2dd4bf','#f97316','#84cc16','#e879f9','#94a3b8'];
const ICONS  = ['🍔','☕','🚗','🏠','💊','🎬','👔','📚','✈️','💪','🎮','🛒','💡','📱','🎵','🐾','💰','📈','🏦','💳','⚡','🎁','💼','💻','🛍️','✨','🏋️','🎯','🔧','📷'];
const emptyForm = { name: '', type: 'expense' as 'income' | 'expense', color: '#7c6ff7', icon: '🛒' };

function CategoryCard({ cat, index, onEdit, onDelete }: { cat: Category; index: number; onEdit: (cat: Category) => void; onDelete: (id: number) => void; }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} className="animate-fadeup" style={{ padding: '14px 16px', borderRadius: 14, background: hov ? 'var(--bg-overlay)' : 'var(--bg-elevated)', border: `1px solid ${hov ? 'var(--border-default)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden', transform: hov ? 'translateY(-2px)' : 'none', transition: 'all 0.2s var(--ease-out)', animationDelay: `${index * 35}ms`, cursor: 'default' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cat.color, borderRadius: '14px 0 0 14px', opacity: 0.8 }} />
      <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: cat.color + '20', border: `1px solid ${cat.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, transition: 'transform 0.2s var(--ease-spring)', transform: hov ? 'scale(1.1) rotate(-5deg)' : 'scale(1)', marginLeft: 6 }}>
        {cat.icon ?? '🏷️'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</p>
          {cat.is_default && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
              <Lock size={8} /> Default
            </span>
          )}
        </div>
        <div style={{ width: 18, height: 3, borderRadius: 99, background: cat.color, marginTop: 5, opacity: 0.7 }} />
      </div>
      <div style={{ display: 'flex', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        <button onClick={() => onEdit(cat)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s, background 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-violet)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-violet-dim)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }} title={cat.is_default ? 'Edit color / icon' : 'Edit category'}>
          <Edit2 size={13} />
        </button>
        {!cat.is_default && (
          <button onClick={() => onDelete(cat.id)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s, background 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-rose)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-rose-dim)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryForm({ form, setForm, isDefault, onSubmit, saving, submitLabel, onCancel }: { form: typeof emptyForm; setForm: (f: typeof emptyForm) => void; isDefault?: boolean; onSubmit: (e: React.FormEvent) => void; saving: boolean; submitLabel: string; onCancel: () => void; }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isDefault && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)' }}>
          <Lock size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: 'var(--accent-amber)', lineHeight: 1.5 }}>
            Default categories can only have their <strong>icon</strong> and <strong>color</strong> changed.
          </p>
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
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} style={{ padding: '9px 0', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, background: form.type === t ? (t === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)') : 'var(--bg-overlay)', color: form.type === t ? (t === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)') : 'var(--text-tertiary)', outline: form.type === t ? `1.5px solid ${t === 'income' ? 'rgba(52,211,153,0.4)' : 'rgba(251,113,133,0.4)'}` : '1px solid var(--border-subtle)', transition: 'all 0.18s' }}>
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
            <button key={icon} type="button" onClick={() => setForm({ ...form, icon })} style={{ width: '100%', aspectRatio: '1', borderRadius: 9, border: form.icon === icon ? `1.5px solid ${form.color}` : '1.5px solid transparent', background: form.icon === icon ? form.color + '22' : 'transparent', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="input-label">Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: c, cursor: 'pointer', flexShrink: 0, outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transform: form.color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s, outline 0.15s', boxShadow: form.color === c ? `0 0 12px ${c}66` : 'none' }} title={c} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: form.color + '22', border: `1px solid ${form.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{form.icon}</div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.name || 'Category Name'}</p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{form.type === 'income' ? 'Income' : 'Expense'}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : submitLabel}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0 10px' }}>
      <div style={{ width: 4, height: 18, borderRadius: 99, background: color, flexShrink: 0 }} />
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: color + '18', color, border: `1px solid ${color}33` }}>{count}</span>
    </div>
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
      toast.success('Category added!');
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
      toast.success('Category updated!');
    } catch { toast.error('Failed to update.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? Transactions will not be deleted.')) return;
    try {
      await api.delete(`/categories/${id}`); removeCategoryFromStore(id);
      toast.success('Category deleted.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.';
      toast.error(msg);
    }
  };

  const openEdit = (cat: Category) => { setEditCat(cat); setEditForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon ?? '🏷️' }); };
  const income  = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Categories" subtitle={`${categories.length} categories · ${categories.filter((c) => !c.is_default).length} custom`}
        action={<button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} strokeWidth={2.5} /> Add</button>} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 13, background: 'rgba(124,111,247,0.07)', border: '1px solid rgba(124,111,247,0.18)' }}>
        <Lock size={14} style={{ color: 'var(--accent-violet)', flexShrink: 0 }} />
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Default</strong> categories are provided automatically. You can change their icon & color, or add your own custom categories.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14 }} />)}</div>
      ) : categories.length === 0 ? (
        <EmptyState icon="🏷️" title="No categories yet" description="Add your first category" action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Category</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {income.length > 0 && (
            <div>
              <SectionHeader label="Income" count={income.length} color="var(--accent-emerald)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {income.map((cat, i) => <CategoryCard key={cat.id} cat={cat} index={i} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {expense.length > 0 && (
            <div>
              <SectionHeader label="Expenses" count={expense.length} color="var(--accent-rose)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {expense.map((cat, i) => <CategoryCard key={cat.id} cat={cat} index={i} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddForm({ ...emptyForm }); }} title="Add Category" subtitle="Create your own custom category">
        <CategoryForm form={addForm} setForm={setAddForm} isDefault={false} onSubmit={handleAdd} saving={addSaving} submitLabel="Save" onCancel={() => { setShowAdd(false); setAddForm({ ...emptyForm }); }} />
      </Modal>
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title={editCat?.is_default ? 'Edit Category Appearance' : 'Edit Category'} subtitle={editCat?.is_default ? 'Only icon and color can be changed' : 'Update category details'}>
        <CategoryForm form={editForm} setForm={setEditForm} isDefault={editCat?.is_default} onSubmit={handleEdit} saving={editSaving} submitLabel="Save Changes" onCancel={() => setEditCat(null)} />
      </Modal>
    </div>
  );
}