'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Debt } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import toast from 'react-hot-toast';

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif', partially_paid: 'Sebagian', paid: 'Lunas',
};

const emptyForm = {
  wallet_id: '', counterparty: '', type: 'debt',
  original_amount: '', due_date: '', description: '', color: '#f59e0b',
};

export default function DebtsPage() {
  const { wallets, walletsLoaded, fetchWallets } = useAppStore();
  const [data, setData] = useState<{ data: Debt[]; total_debt: number; total_receivable: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ ...emptyForm });
  const [saving, setSaving]   = useState(false);
  const [editDebt, setEditDebt]   = useState<Debt | null>(null);
  const [editForm, setEditForm]   = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);

  // Pay modal
  const [payDebt, setPayDebt]     = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paySaving, setPaySaving] = useState(false);

  useEffect(() => {
    if (!walletsLoaded) fetchWallets();
    api.get('/debts').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [walletsLoaded, fetchWallets]);

  const reload = () => api.get('/debts').then((r) => setData(r.data));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/debts', { ...form, due_date: form.due_date || null });
      await reload(); setShowAdd(false); setForm({ ...emptyForm });
      toast.success('Hutang/piutang ditambah!');
    } catch { toast.error('Gagal menambah.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editDebt) return; setEditSaving(true);
    try {
      await api.put(`/debts/${editDebt.id}`, { ...editForm, due_date: editForm.due_date || null });
      await reload(); setEditDebt(null);
      toast.success('Berhasil diubah!');
    } catch { toast.error('Gagal mengubah.'); }
    finally { setEditSaving(false); }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault(); if (!payDebt) return; setPaySaving(true);
    try {
      await api.post(`/debts/${payDebt.id}/pay`, { amount: Number(payAmount) });
      await reload(); setPayDebt(null); setPayAmount('');
      toast.success('Pembayaran dicatat!');
    } catch { toast.error('Gagal mencatat pembayaran.'); }
    finally { setPaySaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus hutang/piutang ini?')) return;
    try {
      await api.delete(`/debts/${id}`);
      await reload(); toast.success('Dihapus.');
    } catch { toast.error('Gagal menghapus.'); }
  };

  const openEdit = (d: Debt) => {
    setEditDebt(d);
    setEditForm({
      wallet_id: String(d.wallet_id),
      counterparty: d.counterparty,
      type: d.type,
      original_amount: String(d.original_amount),
      due_date: d.due_date ? d.due_date.substring(0, 10) : '',
      description: d.description ?? '',
      color: d.color,
    });
  };

  const PRESET_COLORS = ['#f59e0b','#f43f5e','#6366f1','#10b981','#3b82f6','#8b5cf6'];

  const FormFields = ({ f, setF }: { f: typeof emptyForm; setF: React.Dispatch<React.SetStateAction<typeof emptyForm>> }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="debt">Hutang (saya berhutang)</option>
          <option value="receivable">Piutang (orang lain berhutang)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama {f.type === 'debt' ? 'Kreditur' : 'Debitur'}</label>
        <input type="text" required value={f.counterparty} onChange={(e) => setF({ ...f, counterparty: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Nama orang/lembaga" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
        <input type="number" min="1" required value={f.original_amount} onChange={(e) => setF({ ...f, original_amount: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="1000000" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dompet</label>
        <select value={f.wallet_id} required onChange={(e) => setF({ ...f, wallet_id: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Pilih dompet</option>
          {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo (opsional)</label>
        <input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (opsional)</label>
        <input type="text" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Pinjam untuk..." />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((color) => (
            <button key={color} type="button" onClick={() => setF({ ...f, color })}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: color, borderColor: f.color === color ? '#1e1e2e' : 'transparent' }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  const debts = data?.data ?? [];
  const active = debts.filter((d) => d.status !== 'paid');
  const paid   = debts.filter((d) => d.status === 'paid');

  const DebtCard = ({ d }: { d: Debt }) => {
    const pct = Number(d.original_amount) > 0
      ? (Number(d.paid_amount) / Number(d.original_amount)) * 100 : 0;
    const today = new Date();
    const dueDate = d.due_date ? new Date(d.due_date) : null;
    const isOverdue = dueDate && dueDate < today && d.status !== 'paid';
    const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000*60*60*24)) : null;

    return (
      <div className={`bg-white rounded-2xl shadow-sm border p-5 group ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: d.color + '20', color: d.color }}>
              {d.type === 'debt' ? '📤' : '📥'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800">{d.counterparty}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  d.type === 'debt' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>{d.type === 'debt' ? 'Hutang' : 'Piutang'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  d.status === 'paid' ? 'bg-gray-100 text-gray-500' :
                  d.status === 'partially_paid' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>{STATUS_LABEL[d.status]}</span>
              </div>
              {d.description && <p className="text-xs text-gray-400 mt-0.5">{d.description}</p>}
              {dueDate && (
                <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-medium' : daysLeft !== null && daysLeft <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {isOverdue ? `⚠️ Terlambat ${Math.abs(daysLeft!)} hari` :
                   daysLeft === 0 ? '⚠️ Jatuh tempo hari ini' :
                   `Jatuh tempo: ${formatDate(d.due_date!)}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            {d.status !== 'paid' && (
              <button onClick={() => { setPayDebt(d); setPayAmount(String(d.remaining_amount)); }} title="Bayar"
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition text-sm">💳</button>
            )}
            <button onClick={() => openEdit(d)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => handleDelete(d.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Terbayar: <span className="font-medium text-gray-700">{formatRupiah(Number(d.paid_amount))}</span>
            </span>
            <span className="font-semibold text-gray-800">{formatRupiah(Number(d.original_amount))}</span>
          </div>
          {d.status !== 'paid' && (
            <>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-400">Sisa: <span className="font-medium text-gray-600">{formatRupiah(Number(d.remaining_amount))}</span></p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hutang & Piutang</h1>
          <p className="text-sm text-gray-400 mt-0.5">{active.length} aktif · {paid.length} lunas</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
          {showAdd ? '✕ Batal' : '+ Tambah'}
        </button>
      </div>

      {/* Summary */}
      {data && (data.total_debt > 0 || data.total_receivable > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl p-5">
            <p className="text-xs opacity-80 uppercase tracking-wide font-medium">Total Hutang</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(data.total_debt)}</p>
            <p className="text-xs opacity-70 mt-0.5">Yang harus saya bayar</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-5">
            <p className="text-xs opacity-80 uppercase tracking-wide font-medium">Total Piutang</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(data.total_receivable)}</p>
            <p className="text-xs opacity-70 mt-0.5">Yang harus diterima</p>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Tambah Hutang / Piutang</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <FormFields f={form} setF={setForm} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {debts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-gray-500 font-medium">Belum ada hutang atau piutang</p>
          <p className="text-gray-400 text-sm mt-1">Catat pinjaman untuk melacak dengan mudah</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3">Aktif ({active.length})</h2>
              <div className="space-y-3">
                {active.map((d) => <DebtCard key={d.id} d={d} />)}
              </div>
            </div>
          )}
          {paid.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Lunas ({paid.length})</h2>
              <div className="space-y-3 opacity-60">
                {paid.map((d) => <DebtCard key={d.id} d={d} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editDebt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Edit Hutang / Piutang</h2>
              <button onClick={() => setEditDebt(null)} className="text-gray-400 hover:text-gray-600 p-1">
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
                <button type="button" onClick={() => setEditDebt(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payDebt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">
                {payDebt.type === 'debt' ? 'Catat Pembayaran' : 'Catat Penerimaan'}
              </h2>
              <button onClick={() => setPayDebt(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4 p-3 bg-amber-50 rounded-xl">
              <p className="text-sm font-medium text-amber-800">{payDebt.counterparty}</p>
              <p className="text-xs text-amber-600 mt-0.5">Sisa: {formatRupiah(Number(payDebt.remaining_amount))}</p>
            </div>
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pembayaran (Rp)</label>
                <input type="number" min="1" required value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)} autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={String(payDebt.remaining_amount)} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={paySaving}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                  {paySaving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setPayDebt(null)}
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