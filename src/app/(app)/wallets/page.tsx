'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, CreditCard, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import api from '@/lib/api';
import { Wallet } from '@/types';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';

const COLORS = ['#7c6ff7','#34d399','#fb7185','#fbbf24','#60a5fa','#f472b6','#a78bfa','#2dd4bf'];
const ICONS  = ['💳','🏦','💵','💎','🏠','🚗','📱','✈️','🎯','💡'];
const emptyForm = { name: '', balance: '', currency: 'IDR', color: '#7c6ff7', icon: '💳' };

function WalletCard({ wallet, onEdit, onDelete }: { wallet: Wallet; onEdit: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  const balance = Number(wallet.balance);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', damping: 22, stiffness: 400 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${hovered ? wallet.color + '44' : 'var(--border-subtle)'}`,
        borderRadius: 22, padding: 24,
        position: 'relative', overflow: 'hidden',
        boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${wallet.color}22` : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'border-color 0.3s, box-shadow 0.3s', cursor: 'default',
      }}
    >
      {/* Top color bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: wallet.color, borderRadius: '22px 22px 0 0' }} />
      {/* Background glow */}
      <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: wallet.color, opacity: hovered ? 0.12 : 0.05, filter: 'blur(50px)', transition: 'opacity 0.4s', pointerEvents: 'none' }} />
      {/* Top row: icon + name + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: wallet.color + '22', border: `1px solid ${wallet.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'transform 0.3s var(--ease-spring)', transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)' }}>
            {wallet.icon ?? '💳'}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{wallet.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{wallet.currency}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          {[{ icon: Edit2, fn: onEdit, hover: 'var(--accent-violet)' }, { icon: Trash2, fn: onDelete, hover: 'var(--accent-rose)' }].map(({ icon: Icon, fn, hover }, k) => (
            <button key={k} onClick={(e) => { e.stopPropagation(); fn(); }} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = hover; (e.currentTarget as HTMLElement).style.borderColor = hover + '66'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>
      {/* Balance */}
      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current balance</p>
        <NumberFlow
          value={balance}
          format={{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: balance >= 0 ? 'var(--text-primary)' : '#fb7185', letterSpacing: '-0.03em', lineHeight: 1 }}
        />
      </div>
    </motion.div>
  );
}

function WalletForm({ form, setForm, onSubmit, saving, submitLabel, onCancel }: any) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label className="input-label">Wallet Name</label>
        <input className="input-base" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. BCA Savings" />
      </div>
      <div>
        <label className="input-label">Balance (Rp)</label>
        <input className="input-base" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0" style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700 }} />
      </div>
      <div>
        <label className="input-label">Icon</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => setForm({ ...form, icon })} style={{ width: 44, height: 44, borderRadius: 11, fontSize: 20, background: form.icon === icon ? form.color + '22' : 'var(--bg-overlay)', border: `1px solid ${form.icon === icon ? form.color : 'var(--border-subtle)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', transform: form.icon === icon ? 'scale(1.12)' : 'scale(1)' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="input-label">Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: c, cursor: 'pointer', flexShrink: 0, outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 3, transform: form.color === c ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.15s, outline 0.15s', boxShadow: form.color === c ? `0 0 16px ${c}66` : 'none' }} />
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
  const [loading, setLoading]       = useState(!walletsLoaded);
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState({ ...emptyForm });
  const [addSaving, setAddSaving]   = useState(false);
  const [editWallet, setEditWallet] = useState<Wallet | null>(null);
  const [editForm, setEditForm]     = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);

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
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Wallets</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, paddingRight: 20 }}>
          <Plus size={16} strokeWidth={2.5} /> Add Wallet
        </button>
      </div>

      {/* Total balance hero */}
      {wallets.length > 0 && (
        <div className="card animate-fadeup noise" style={{ padding: '28px 32px', background: 'linear-gradient(135deg, #0f0f1e 0%, #181828 100%)', borderColor: 'var(--border-accent)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,247,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: 40, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-violet)' }}>
                <PiggyBank size={18} color="white" strokeWidth={2} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Total Balance — All Wallets</p>
            </div>
            <NumberFlow
              value={totalBalance}
              format={{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }}
              style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <TrendingUp size={13} style={{ color: 'var(--accent-emerald)' }} />
              <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{wallets.length} active wallet{wallets.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Wallet cards grid */}
      {loading ? (
        <div className="cards-grid">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 22 }} />)}
        </div>
      ) : wallets.length === 0 ? (
        <div className="card">
          <EmptyState icon="💳" title="No wallets yet" description="Add your first wallet to start tracking your finances" action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Wallet</button>} />
        </div>
      ) : (
        <div className="cards-grid">
          {wallets.map((w) => (
            <WalletCard key={w.id} wallet={w}
              onEdit={() => { setEditWallet(w); setEditForm({ name: w.name, balance: String(w.balance), currency: w.currency, color: w.color, icon: w.icon ?? '💳' }); }}
              onDelete={() => handleDelete(w.id)} />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Wallet" subtitle="Create a new wallet to track your money">
        <WalletForm form={addForm} setForm={setAddForm} onSubmit={handleAdd} saving={addSaving} submitLabel="Save Wallet" onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal open={!!editWallet} onClose={() => setEditWallet(null)} title="Edit Wallet">
        <WalletForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} saving={editSaving} submitLabel="Save Changes" onCancel={() => setEditWallet(null)} />
      </Modal>
    </div>
  );
}