'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FinancialGoal } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const PRESET_COLORS = ['#6366f1','#10b981','#f59e0b','#f43f5e','#3b82f6','#8b5cf6','#14b8a6','#f97316'];
const PRESET_ICONS  = ['🏠','🚗','✈️','💍','📱','🎓','💪','🏖️','💰','🐕','👶','🛍️'];

const emptyForm = {
  name: '', icon: '🏆', color: '#6366f1',
  target_amount: '', current_amount: '0',
  target_date: '', notes: '',
};

export default function GoalsPage() {
  const [goals, setGoals]       = useState<FinancialGoal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ ...emptyForm });
  const [saving, setSaving]     = useState(false);
  const [editGoal, setEditGoal] = useState<FinancialGoal | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);

  // Fund modal
  const [fundGoal, setFundGoal] = useState<FinancialGoal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundSaving, setFundSaving] = useState(false);

  useEffect(() => {
    api.get('/goals').then((r) => setGoals(r.data)).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, target_date: form.target_date || null, current_amount: Number(form.current_amount) || 0 };
      const res = await api.post('/goals', payload);
      setGoals([res.data, ...goals]);
      setShowAdd(false); setForm({ ...emptyForm });
      toast.success('Target ditambah!');
    } catch { toast.error('Gagal menambah target.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editGoal) return; setEditSaving(true);
    try {
      const payload = { ...editForm, target_date: editForm.target_date || null };
      const res = await api.put(`/goals/${editGoal.id}`, payload);
      setGoals(goals.map((g) => g.id === editGoal.id ? res.data : g));
      setEditGoal(null);
      toast.success('Target diubah!');
    } catch { toast.error('Gagal mengubah.'); }
    finally { setEditSaving(false); }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fundGoal) return; setFundSaving(true);
    try {
      const res = await api.post(`/goals/${fundGoal.id}/add-funds`, { amount: Number(fundAmount) });
      setGoals(goals.map((g) => g.id === fundGoal.id ? res.data : g));
      setFundGoal(null); setFundAmount('');
      toast.success('Dana berhasil ditambahkan!');
    } catch { toast.error('Gagal menambah dana.'); }
    finally { setFundSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus target ini?')) return;
    try {
      await api.delete(`/goals/${id}`);
      setGoals(goals.filter((g) => g.id !== id));
      toast.success('Target dihapus.');
    } catch { toast.error('Gagal menghapus.'); }
  };

  const handleStatusChange = async (goal: FinancialGoal, status: string) => {
    try {
      const res = await api.put(`/goals/${goal.id}`, { status });
      setGoals(goals.map((g) => g.id === goal.id ? res.data : g));
      toast.success('Status diubah.');
    } catch { toast.error('Gagal mengubah status.'); }
  };

  const openEdit = (g: FinancialGoal) => {
    setEditGoal(g);
    setEditForm({
      name: g.name, icon: g.icon ?? '🏆', color: g.color,
      target_amount: String(g.target_amount),
      current_amount: String(g.current_amount),
      target_date: g.target_date ? g.target_date.substring(0, 10) : '',
      notes: g.notes ?? '',
    });
  };

  const activeGoals    = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const cancelledGoals = goals.filter((g) => g.status === 'cancelled');

  const FormFields = ({ f, setF }: { f: typeof emptyForm; setF: React.Dispatch<React.SetStateAction<typeof emptyForm>> }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Target</label>
          <input type="text" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Beli Rumah, Dana Darurat..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Tanggal (opsional)</label>
          <input type="date" value={f.target_date} onChange={(e) => setF({ ...f, target_date: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Dana (Rp)</label>
          <input type="number" min="1" required value={f.target_amount} onChange={(e) => setF({ ...f, target_amount: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="50000000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dana Awal (Rp)</label>
          <input type="number" min="0" value={f.current_amount} onChange={(e) => setF({ ...f, current_amount: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ikon</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => setF({ ...f, icon })}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${
                f.icon === icon ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-50 hover:bg-gray-100'
              }`}>{icon}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((color) => (
            <button key={color} type="button" onClick={() => setF({ ...f, color })}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: color, borderColor: f.color === color ? '#1e1e2e' : 'transparent' }} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
        <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Motivasi atau detail target..." />
      </div>
    </div>
  );

  const GoalCard = ({ goal }: { goal: FinancialGoal }) => {
    const pct     = goal.progress_percentage;
    const isOver  = pct >= 100;
    const barColor = isOver ? 'bg-emerald-500' : pct >= 75 ? 'bg-indigo-500' : pct >= 50 ? 'bg-blue-400' : 'bg-gray-300';

    const daysLeft = goal.target_date
      ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: goal.color + '20', color: goal.color }}>
              {goal.icon ?? '🏆'}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{goal.name}</p>
              {goal.target_date && (
                <p className={`text-xs mt-0.5 ${daysLeft !== null && daysLeft < 0 ? 'text-red-500' : daysLeft !== null && daysLeft <= 30 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {daysLeft !== null
                    ? daysLeft < 0
                      ? `${Math.abs(daysLeft)} hari terlewat`
                      : daysLeft === 0 ? 'Hari ini!' : `${daysLeft} hari lagi`
                    : ''} · {formatDate(goal.target_date)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            {goal.status === 'active' && (
              <>
                <button onClick={() => setFundGoal(goal)} title="Tambah Dana"
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition text-sm">💰</button>
                <button onClick={() => openEdit(goal)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => handleStatusChange(goal, 'cancelled')}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition text-xs" title="Batalkan">✕</button>
              </>
            )}
            <button onClick={() => handleDelete(goal.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-lg font-bold text-gray-900">{formatRupiah(Number(goal.current_amount))}</span>
            <span className="text-sm text-gray-400">dari {formatRupiah(Number(goal.target_amount))}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{pct.toFixed(1)}% tercapai</span>
            <span className="text-gray-500 font-medium">{formatRupiah(goal.remaining_amount)} lagi</span>
          </div>
          {goal.notes && <p className="text-xs text-gray-400 italic mt-1">{goal.notes}</p>}
        </div>

        {goal.status === 'completed' && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-2 rounded-xl">
            🎉 Target tercapai!
          </div>
        )}
        {goal.status === 'cancelled' && (
          <div className="mt-3 flex items-center gap-2 bg-gray-50 text-gray-500 text-xs font-medium px-3 py-2 rounded-xl">
            ✕ Dibatalkan
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Target Keuangan</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeGoals.length} aktif · {completedGoals.length} selesai</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
          {showAdd ? '✕ Batal' : '+ Tambah Target'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Target Baru</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <FormFields f={form} setF={setForm} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan Target'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-gray-500 font-medium">Belum ada target keuangan</p>
          <p className="text-gray-400 text-sm mt-1">Tetapkan tujuan untuk motivasi menabung</p>
        </div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3">Aktif ({activeGoals.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-emerald-600 mb-3">Selesai ({completedGoals.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
          {cancelledGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Dibatalkan ({cancelledGoals.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cancelledGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editGoal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Edit Target</h2>
              <button onClick={() => setEditGoal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <FormFields f={editForm} setF={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSaving}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                  {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" onClick={() => setEditGoal(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {fundGoal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Tambah Dana ke Target</h2>
              <button onClick={() => setFundGoal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4 p-3 bg-indigo-50 rounded-xl">
              <p className="text-sm font-medium text-indigo-800">{fundGoal.name}</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                {formatRupiah(Number(fundGoal.current_amount))} / {formatRupiah(Number(fundGoal.target_amount))} ({fundGoal.progress_percentage.toFixed(1)}%)
              </p>
            </div>
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Dana (Rp)</label>
                <input type="number" min="1" required value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)} autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="500000" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={fundSaving}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                  {fundSaving ? 'Menyimpan...' : 'Tambah Dana'}
                </button>
                <button type="button" onClick={() => setFundGoal(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
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