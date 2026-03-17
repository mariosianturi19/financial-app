'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Category } from '@/types';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const COLORS = ['#7c6ff7','#34d399','#fb7185','#fbbf24','#60a5fa','#f472b6','#a78bfa','#2dd4bf','#f97316','#84cc16'];
const ICONS  = ['🍔','☕','🚗','🏠','💊','🎬','👔','📚','✈️','💪','🎮','🛒','💡','📱','🎵','🐾','💰','📈','🏦','💳'];
const emptyForm = { name: '', type: 'expense' as 'income'|'expense', color: '#7c6ff7', icon: '🛒' };

function CategoryCard({ cat, index, onEdit, onDelete }: { cat: Category; index: number; onEdit: (cat: Category) => void; onDelete: (id: number) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="animate-fadeup"
      style={{
        padding: '14px 16px', borderRadius: 14,
        background: hov ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
        border: `1px solid ${hov ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s',
        animationDelay: `${index * 40}ms`,
      }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: cat.color + '22',
        border: `1px solid ${cat.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, transition: 'transform 0.2s',
        transform: hov ? 'scale(1.1) rotate(-5deg)' : 'none',
      }}>
        {cat.icon ?? '🏷️'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cat.name}
        </p>
        <div style={{ width: 20, height: 3, borderRadius: 99, background: cat.color, marginTop: 4, opacity: 0.7 }} />
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        opacity: hov ? 1 : 0, transition: 'opacity 0.2s', flexShrink: 0,
      }}>
        <button onClick={() => onEdit(cat)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}>
          <Edit2 size={12} />
        </button>
        <button onClick={() => onDelete(cat.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--accent-rose)' }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { categories, categoriesLoaded, setCategories, updateCategoryInStore, removeCategoryFromStore } = useAppStore();
  const [loading, setLoading] = useState(!categoriesLoaded);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [addSaving, setAddSaving] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);
  const [tab, setTab] = useState<'expense'|'income'>('expense');

  useEffect(() => {
    if (categoriesLoaded) { setLoading(false); return; }
    api.get('/categories').then((r) => setCategories(r.data)).finally(() => setLoading(false));
  }, [categoriesLoaded, setCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAddSaving(true);
    try {
      const res = await api.post('/categories', addForm);
      setCategories([...categories, res.data]);
      setShowAdd(false); setAddForm({ ...emptyForm });
      toast.success('Kategori ditambah!');
    } catch { toast.error('Gagal.'); } finally { setAddSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editCat) return; setEditSaving(true);
    try {
      const res = await api.put(`/categories/${editCat.id}`, editForm);
      updateCategoryInStore(res.data); setEditCat(null);
      toast.success('Kategori diubah!');
    } catch { toast.error('Gagal.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await api.delete(`/categories/${id}`); removeCategoryFromStore(id);
      toast.success('Dihapus.');
    } catch { toast.error('Gagal.'); }
  };

  const filtered = categories.filter((c) => c.type === tab);

  const CategoryForm = ({ form, setForm, onSubmit, saving, submitLabel, onCancel }: {
    form: typeof emptyForm; setForm: (f: typeof emptyForm) => void;
    onSubmit: (e: React.FormEvent) => void; saving: boolean;
    submitLabel: string; onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label className="input-label">Nama Kategori</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-base" placeholder="cth. Makan, Transport..." autoFocus />
      </div>
      <div>
        <label className="input-label">Tipe</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['expense','income'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                background: form.type === t ? (t === 'expense' ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)') : 'var(--bg-overlay)',
                color: form.type === t ? (t === 'expense' ? 'var(--accent-rose)' : 'var(--accent-emerald)') : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                border: `1px solid ${form.type === t ? (t === 'expense' ? 'rgba(251,113,133,0.3)' : 'rgba(52,211,153,0.3)') : 'var(--border-subtle)'}`,
                transition: 'all 0.15s',
              }}>
              {t === 'expense' ? '📉 Pengeluaran' : '📈 Pemasukan'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="input-label">Ikon</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
              style={{
                width: 38, height: 38, borderRadius: 9, fontSize: 17,
                background: form.icon === icon ? 'var(--accent-violet-dim)' : 'var(--bg-overlay)',
                border: `1px solid ${form.icon === icon ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                transform: form.icon === icon ? 'scale(1.1)' : 'scale(1)',
              }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="input-label">Warna</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
              style={{
                width: 26, height: 26, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                outline: form.color === c ? `3px solid ${c}` : '3px solid transparent',
                outlineOffset: 2, transition: 'all 0.15s',
                transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
              }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Menyimpan...' : submitLabel}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Kategori"
        subtitle={`${categories.length} kategori total`}
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} strokeWidth={2.5} /> Tambah
          </button>
        }
      />

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 14, padding: 4, border: '1px solid var(--border-subtle)', alignSelf: 'flex-start', gap: 2 }}>
        {(['expense','income'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', borderRadius: 11, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
              background: tab === t ? (t === 'expense' ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)') : 'transparent',
              color: tab === t ? (t === 'expense' ? 'var(--accent-rose)' : 'var(--accent-emerald)') : 'var(--text-tertiary)',
              transition: 'all 0.2s',
            }}>
            {t === 'expense' ? '📉 Pengeluaran' : '📈 Pemasukan'}
            <span style={{
              marginLeft: 7, fontSize: 10.5, fontWeight: 700,
              background: tab === t ? 'rgba(255,255,255,0.15)' : 'var(--bg-overlay)',
              padding: '1px 7px', borderRadius: 99,
            }}>
              {categories.filter(c => c.type === t).length}
            </span>
          </button>
        ))}
      </div>

      {/* Category grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={tab === 'expense' ? '📉' : '📈'}
            title={`Belum ada kategori ${tab === 'expense' ? 'pengeluaran' : 'pemasukan'}`}
            description="Buat kategori untuk mengelompokkan transaksi kamu"
            action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Tambah Kategori</button>} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10 }}>
          {filtered.map((cat, i) => (
            <CategoryCard 
              key={cat.id} 
              cat={cat} 
              index={i} 
              onEdit={(c) => { setEditCat(c); setEditForm({ name: c.name, type: c.type, color: c.color, icon: c.icon ?? '🏷️' }); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Kategori">
        <CategoryForm form={addForm} setForm={setAddForm} onSubmit={handleAdd} saving={addSaving} submitLabel="Tambah" onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Edit Kategori">
        <CategoryForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} saving={editSaving} submitLabel="Simpan" onCancel={() => setEditCat(null)} />
      </Modal>
    </div>
  );
}