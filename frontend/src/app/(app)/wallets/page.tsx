'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { Wallet } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const emptyForm = { name: '', balance: '', currency: 'IDR', color: '#7c6ff7' };

export default function WalletsPage() {
  const { wallets, walletsLoaded, setWallets, updateWalletInStore, removeWalletFromStore } = useAppStore();
  const [loading, setLoading] = useState(!walletsLoaded);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [addSaving, setAddSaving] = useState(false);
  const [editWallet, setEditWallet] = useState<Wallet | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (walletsLoaded) { setLoading(false); return; }
    api.get('/wallets').then((r) => setWallets(r.data)).finally(() => setLoading(false));
  }, [walletsLoaded, setWallets]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAddSaving(true);
    try {
      const res = await api.post('/wallets', addForm);
      setWallets([...wallets, res.data]);
      setShowAdd(false); setAddForm({ ...emptyForm });
      toast.success('Dompet ditambah!');
    } catch { toast.error('Gagal.'); } finally { setAddSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editWallet) return; setEditSaving(true);
    try {
      const res = await api.put(`/wallets/${editWallet.id}`, editForm);
      updateWalletInStore(res.data); setEditWallet(null);
      toast.success('Dompet diubah!');
    } catch { toast.error('Gagal.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus dompet ini?')) return;
    try {
      await api.delete(`/wallets/${id}`); removeWalletFromStore(id);
      toast.success('Dompet dihapus.');
    } catch { toast.error('Gagal.'); }
  };

  const openEdit = (w: Wallet) => {
    setEditWallet(w);
    setEditForm({ name: w.name, balance: String(w.balance), currency: w.currency, color: w.color });
  };

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  const WalletForm = ({ form, setForm, onSubmit, saving, submitLabel }: {
    form: typeof emptyForm; setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
    onSubmit: (e: React.FormEvent) => void; saving: boolean; submitLabel: string;
  }) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[
        { label: 'Nama Dompet', key: 'name', type: 'text', placeholder: 'BCA, GoPay, Tunai...' },
        { label: 'Saldo (Rp)', key: 'balance', type: 'number', placeholder: '0' },
      ].map(({ label, key, type, placeholder }) => (
        <div key={key}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
          <input type={type} value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-base" placeholder={placeholder} required={key === 'name'} />
        </div>
      ))}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mata Uang</label>
        <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-base">
          {['IDR', 'USD', 'EUR', 'SGD'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warna</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['#7c6ff7', '#34d399', '#fb7185', '#fbbf24', '#60a5fa', '#a78bfa', '#f97316', '#14b8a6'].map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{
              width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
              border: `3px solid ${form.color === c ? 'white' : 'transparent'}`,
              boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
              transition: 'all 0.15s',
            }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Menyimpan...' : submitLabel}
        </button>
        <button type="button" className="btn-ghost" onClick={() => { setShowAdd(false); setEditWallet(null); }}>Batal</button>
      </div>
    </form>
  );

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Dompet"
        subtitle={`${wallets.length} dompet · ${formatRupiah(totalBalance)}`}
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Plus size={15} /> Tambah
          </button>
        }
      />

      {wallets.length === 0 ? (
        <div className="card">
          <EmptyState icon="👛" title="Belum ada dompet" description="Tambahkan dompet pertama untuk mulai melacak keuangan" action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Tambah Dompet</button>} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {wallets.map((wallet, i) => (
            <div key={wallet.id} className="card card-hover animate-fadeup" style={{ padding: 20, animationDelay: `${i * 60}ms`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: wallet.color, borderRadius: '16px 16px 0 0' }} />
              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: wallet.color, opacity: 0.08, filter: 'blur(16px)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: wallet.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {wallet.icon ?? '👛'}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{wallet.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{wallet.currency}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(wallet)} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(wallet.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent-rose)' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <p className="stat-value" style={{ fontSize: 22, color: 'var(--text-primary)' }}>{formatRupiah(Number(wallet.balance))}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Dompet">
        <WalletForm form={addForm} setForm={setAddForm} onSubmit={handleAdd} saving={addSaving} submitLabel="Simpan Dompet" />
      </Modal>

      <Modal open={!!editWallet} onClose={() => setEditWallet(null)} title="Edit Dompet">
        <WalletForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} saving={editSaving} submitLabel="Simpan Perubahan" />
      </Modal>
    </div>
  );
}