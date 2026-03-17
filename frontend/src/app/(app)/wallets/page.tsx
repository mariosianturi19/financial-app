// ================================================================
// WALLETS PAGE — src/app/(app)/wallets/page.tsx
// ================================================================

'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Wallet as WalletIcon, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { Wallet } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const COLORS = ['#7c6ff7','#34d399','#fb7185','#fbbf24','#60a5fa','#f472b6','#a78bfa','#2dd4bf'];
const ICONS  = ['💳','🏦','💵','💎','🏠','🚗','📱','✈️','🎯','💡'];
const emptyForm = { name: '', balance: '', currency: 'IDR', color: '#7c6ff7', icon: '💳' };

function WalletCard({ wallet, onEdit, onDelete }: { wallet: Wallet; onEdit: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: 'var(--bg-elevated)', border: `1px solid ${hovered ? 'var(--border-default)' : 'var(--border-subtle)'}`, borderRadius: 20, padding: 22, position: 'relative', overflow: 'hidden', transform: hovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.2)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', cursor: 'default' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: wallet.color, borderRadius: '20px 20px 0 0' }} />
      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: wallet.color, opacity: hovered ? 0.12 : 0.06, filter: 'blur(30px)', transition: 'opacity 0.3s', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: wallet.color + '22', border: `1px solid ${wallet.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'transform 0.2s', transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1)' }}>
            {wallet.icon ?? '💳'}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{wallet.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{wallet.currency}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button onClick={onEdit} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-overlay)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-violet)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-overlay)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-rose)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', position: 'relative' }}>
        {formatRupiah(wallet.balance)}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, position: 'relative' }}>Current balance</p>
    </div>
  );
}

function WalletForm({ form, setForm, onSubmit, saving, submitLabel, onCancel }: { form: typeof emptyForm; setForm: (f: typeof emptyForm) => void; onSubmit: (e: React.FormEvent) => void; saving: boolean; submitLabel: string; onCancel: () => void; }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="input-label">Wallet Name</label>
        <input className="input-base" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Account" />
      </div>
      <div>
        <label className="input-label">Balance (Rp)</label>
        <input className="input-base" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0" style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700 }} />
      </div>
      <div>
        <label className="input-label">Icon</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => setForm({ ...form, icon })} style={{ width: 40, height: 40, borderRadius: 10, fontSize: 20, background: form.icon === icon ? form.color + '22' : 'var(--bg-overlay)', border: `1px solid ${form.icon === icon ? form.color : 'var(--border-subtle)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', transform: form.icon === icon ? 'scale(1.1)' : 'scale(1)' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="input-label">Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: c, cursor: 'pointer', flexShrink: 0, outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transform: form.color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s, outline 0.15s', boxShadow: form.color === c ? `0 0 12px ${c}66` : 'none' }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : submitLabel}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function WalletsPage() {
  const { wallets, walletsLoaded, fetchWallets, setWallets, updateWalletInStore, removeWalletFromStore } = useAppStore();
  const [loading, setLoading]     = useState(!walletsLoaded);
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ ...emptyForm });
  const [addSaving, setAddSaving] = useState(false);
  const [editWallet, setEditWallet]   = useState<Wallet | null>(null);
  const [editForm, setEditForm]       = useState({ ...emptyForm });
  const [editSaving, setEditSaving]   = useState(false);

  useEffect(() => {
    if (walletsLoaded) { setLoading(false); return; }
    fetchWallets().finally(() => setLoading(false));
  }, [walletsLoaded, fetchWallets]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAddSaving(true);
    try {
      const res = await api.post('/wallets', addForm);
      setWallets([...wallets, res.data]);
      setShowAdd(false); setAddForm({ ...emptyForm });
      toast.success('Wallet added!');
    } catch { toast.error('Failed to add wallet.'); } finally { setAddSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editWallet) return; setEditSaving(true);
    try {
      const res = await api.put(`/wallets/${editWallet.id}`, editForm);
      updateWalletInStore(res.data); setEditWallet(null);
      toast.success('Wallet updated!');
    } catch { toast.error('Failed to update.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this wallet? All related transactions will also be deleted.')) return;
    try {
      await api.delete(`/wallets/${id}`); removeWalletFromStore(id);
      toast.success('Wallet deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Wallets" subtitle={`${wallets.length} wallet${wallets.length !== 1 ? 's' : ''} registered`}
        action={<button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} strokeWidth={2.5} /> Add</button>} />

      {wallets.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #12121e 0%, #17172a 100%)', border: '1px solid var(--border-accent)', borderRadius: 20, padding: '24px 28px', position: 'relative', overflow: 'hidden' }} className="animate-fadeup noise">
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,247,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WalletIcon size={14} color="white" strokeWidth={2} />
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Balance Across All Wallets</p>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{formatRupiah(totalBalance)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <TrendingUp size={12} style={{ color: 'var(--accent-emerald)' }} />
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{wallets.length} active wallet{wallets.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 20 }} />)}
        </div>
      ) : wallets.length === 0 ? (
        <div className="card"><EmptyState icon="💳" title="No wallets yet" description="Add your first wallet to start tracking your finances" action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Wallet</button>} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
          {wallets.map((w) => (
            <WalletCard key={w.id} wallet={w}
              onEdit={() => { setEditWallet(w); setEditForm({ name: w.name, balance: String(w.balance), currency: w.currency, color: w.color, icon: w.icon ?? '💳' }); }}
              onDelete={() => handleDelete(w.id)} />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Wallet" subtitle="Create a new wallet to track your money">
        <WalletForm form={addForm} setForm={setAddForm} onSubmit={handleAdd} saving={addSaving} submitLabel="Save" onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal open={!!editWallet} onClose={() => setEditWallet(null)} title="Edit Wallet">
        <WalletForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} saving={editSaving} submitLabel="Save Changes" onCancel={() => setEditWallet(null)} />
      </Modal>
    </div>
  );
}