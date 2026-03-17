'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Category } from '@/types';
import { useAppStore } from '@/store/appStore';
import toast from 'react-hot-toast';

const emptyForm = { name: '', type: 'expense', icon: '', color: '#6366f1' };

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#10b981', '#14b8a6', '#3b82f6',
  '#64748b', '#84cc16', '#f97316', '#06b6d4',
];

export default function CategoriesPage() {
  const { categories, categoriesLoaded, setCategories, updateCategoryInStore, removeCategoryFromStore } =
    useAppStore();
  const [loading, setLoading] = useState(!categoriesLoaded);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (categoriesLoaded) { setLoading(false); return; }
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .finally(() => setLoading(false));
  }, [categoriesLoaded, setCategories]);

  // ── Add ────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    try {
      const res = await api.post('/categories', addForm);
      setCategories([...categories, res.data]);
      setShowAdd(false);
      setAddForm({ ...emptyForm });
      toast.success('Kategori berhasil ditambah!');
    } catch {
      toast.error('Gagal menambah kategori.');
    } finally {
      setAddSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────
  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setEditForm({
      name: cat.name,
      type: cat.type,
      icon: cat.icon ?? '',
      color: cat.color,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCat) return;
    setEditSaving(true);
    try {
      const res = await api.put(`/categories/${editCat.id}`, editForm);
      updateCategoryInStore(res.data);
      setEditCat(null);
      toast.success('Kategori berhasil diubah!');
    } catch {
      toast.error('Gagal mengubah kategori.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await api.delete(`/categories/${id}`);
      removeCategoryFromStore(id);
      toast.success('Kategori dihapus.');
    } catch {
      toast.error('Gagal menghapus kategori.');
    }
  };

  const incomeCategories  = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const FormFields = ({
    form,
    setForm,
  }: {
    form: typeof emptyForm;
    setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Makan, Gaji, Transport..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ikon (emoji)</label>
        <input
          type="text"
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="🍔 🚗 💼 ..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: form.color === color ? '#1e1e2e' : 'transparent',
                transform: form.color === color ? 'scale(1.15)' : undefined,
              }}
            />
          ))}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-8 h-8 rounded-full cursor-pointer border border-gray-200 p-0"
              title="Warna kustom"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const CategoryCard = ({ cat }: { cat: Category }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 flex items-center justify-between group hover:border-indigo-200 transition">
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: cat.color + '20', color: cat.color }}
        >
          {cat.icon || '🏷️'}
        </div>
        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => openEdit(cat)}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => handleDelete(cat.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Hapus"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kategori</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} kategori terdaftar</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setAddForm({ ...emptyForm }); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          {showAdd ? '✕ Batal' : '+ Tambah Kategori'}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Tambah Kategori Baru
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <FormFields form={addForm} setForm={setAddForm} />
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={addSaving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {addSaving ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Groups */}
      {[
        { label: 'Pemasukan', items: incomeCategories, accent: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pengeluaran', items: expenseCategories, accent: 'text-rose-600', bg: 'bg-rose-50' },
      ].map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm font-semibold ${group.accent}`}>{group.label}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${group.bg} ${group.accent}`}>
              {group.items.length}
            </span>
          </div>
          {group.items.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">
              Belum ada kategori {group.label.toLowerCase()}.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {group.items.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Edit Modal */}
      {editCat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Edit Kategori</h2>
              <button
                onClick={() => setEditCat(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <FormFields form={editForm} setForm={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditCat(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}