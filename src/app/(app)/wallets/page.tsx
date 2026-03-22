'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, PiggyBank, ArrowRightLeft, Building2, Wallet2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import api from '@/lib/api';
import { Wallet, Transfer, WalletType } from '@/types';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import NumericInput from '@/components/ui/NumericInput';
import { toast } from 'sonner';

const COLORS = ['#0ea5e9','#34d399','#fb7185','#fbbf24','#60a5fa','#f472b6','#a78bfa','#2dd4bf'];
const ICONS  = ['💳','🏦','💵','💎','🏠','🚗','📱','✈️','🎯','💡'];
const emptyForm = { name: '', balance: '', currency: 'IDR', color: '#0ea5e9', icon: '💳', wallet_type: 'bank' as WalletType };

/* ── Admin fee table ── */
const ADMIN_FEES: Record<string, number> = {
  'bank-ewallet': 1000,
  'ewallet-bank': 2500,
};
function getAdminFee(from: WalletType, to: WalletType): number {
  return ADMIN_FEES[`${from}-${to}`] ?? 0;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

/* ── Wallet type badge ── */
function TypeBadge({ type }: { type: WalletType }) {
  const isBank = type === 'bank';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 700,
      background: isBank ? 'rgba(14,165,233,0.15)' : 'rgba(52,211,153,0.15)',
      color: isBank ? '#0ea5e9' : '#34d399',
      border: `1px solid ${isBank ? 'rgba(14,165,233,0.3)' : 'rgba(52,211,153,0.3)'}`,
      letterSpacing: '0.03em', textTransform: 'uppercase',
    }}>
      {isBank ? <Building2 size={9} /> : <Wallet2 size={9} />}
      {isBank ? 'Bank' : 'E-Wallet'}
    </span>
  );
}

/* ── Wallet Card ── */
function WalletCard({ wallet, onEdit, onDelete }: { wallet: Wallet; onEdit: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  const balance = Number(wallet.balance);
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', damping: 22, stiffness: 400 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${hovered ? wallet.color + '55' : 'var(--border-subtle)'}`,
        borderRadius: 22, padding: 22,
        position: 'relative', overflow: 'hidden',
        boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${wallet.color}22` : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'border-color 0.3s, box-shadow 0.3s', cursor: 'default',
      }}
    >
      {/* Top color bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: wallet.color, borderRadius: '22px 22px 0 0' }} />
      {/* Background glow */}
      <div style={{ position: 'absolute', bottom: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: wallet.color, opacity: hovered ? 0.12 : 0.05, filter: 'blur(50px)', transition: 'opacity 0.4s', pointerEvents: 'none' }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: wallet.color + '22', border: `1px solid ${wallet.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'transform 0.3s var(--ease-spring)', transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)' }}>
            {wallet.icon ?? '💳'}
          </div>
          <div>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 4 }}>{wallet.name}</p>
            <TypeBadge type={wallet.wallet_type ?? 'bank'} />
          </div>
        </div>
        {/* Action buttons — always visible */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { icon: Edit2,  fn: onEdit,   hoverColor: 'var(--accent-cyan)' },
            { icon: Trash2, fn: onDelete, hoverColor: 'var(--accent-rose)' },
          ].map(({ icon: Icon, fn, hoverColor }, k) => (
            <button key={k} onClick={(e) => { e.stopPropagation(); fn(); }}
              style={{ width: 36, height: 36, borderRadius: 11, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = hoverColor; (e.currentTarget as HTMLElement).style.borderColor = hoverColor + '66'; (e.currentTarget as HTMLElement).style.background = hoverColor + '15'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'; }}>
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Balance */}
      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current balance</p>
        <NumberFlow
          value={balance}
          format={{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: balance >= 0 ? 'var(--text-primary)' : 'var(--accent-rose)', letterSpacing: '-0.03em', lineHeight: 1 }}
        />
      </div>
    </motion.div>
  );
}

/* ── Wallet Form (add/edit) ── */
function WalletForm({ form, setForm, onSubmit, saving, submitLabel, onCancel, isEdit = false }: {
  form: typeof emptyForm; setForm: (f: typeof emptyForm) => void;
  onSubmit: (e: React.FormEvent) => void; saving: boolean; submitLabel: string; onCancel: () => void; isEdit?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Wallet type — only on add */}
      {!isEdit && (
        <div>
          <label className="input-label">Wallet Type</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['bank', 'ewallet'] as WalletType[]).map((t) => (
              <button key={t} type="button"
                onClick={() => setForm({ ...form, wallet_type: t })}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${form.wallet_type === t ? (t === 'bank' ? '#0ea5e9' : '#34d399') : 'var(--border-subtle)'}`,
                  background: form.wallet_type === t ? (t === 'bank' ? 'rgba(14,165,233,0.12)' : 'rgba(52,211,153,0.12)') : 'var(--bg-overlay)',
                  color: form.wallet_type === t ? (t === 'bank' ? '#0ea5e9' : '#34d399') : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}>
                {t === 'bank' ? <Building2 size={14} /> : <Wallet2 size={14} />}
                {t === 'bank' ? 'Bank' : 'E-Wallet'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="input-label">Wallet Name</label>
        <input className="input-base" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.wallet_type === 'bank' ? 'e.g. BCA, Mandiri' : 'e.g. GoPay, OVO, Dana'} />
      </div>
      <div>
        <label className="input-label">{isEdit ? 'Balance (Rp) — saldo awal baru' : 'Initial Balance (Rp)'}</label>
        <NumericInput value={form.balance} onChange={(raw) => setForm({ ...form, balance: raw })} placeholder="0"
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700 }} />
        {form.balance && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>= Rp {parseInt(form.balance || '0', 10).toLocaleString('id-ID')}</p>}
      </div>
      <div>
        <label className="input-label">Icon</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
              style={{ width: 44, height: 44, borderRadius: 11, fontSize: 20, background: form.icon === icon ? form.color + '22' : 'var(--bg-overlay)', border: `1px solid ${form.icon === icon ? form.color : 'var(--border-subtle)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', transform: form.icon === icon ? 'scale(1.12)' : 'scale(1)' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="input-label">Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
              style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: c, cursor: 'pointer', flexShrink: 0, outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 3, transform: form.color === c ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.15s, outline 0.15s', boxShadow: form.color === c ? `0 0 16px ${c}66` : 'none' }} />
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

/* ── Transfer Modal ── */
function TransferModal({ wallets, open, onClose, onSuccess }: {
  wallets: Wallet[]; open: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId]     = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!open) { setFromId(''); setToId(''); setAmount(''); setNotes(''); setError(''); }
  }, [open]);

  const fromWallet = wallets.find((w) => w.id === Number(fromId));
  const toWallet   = wallets.find((w) => w.id === Number(toId));
  const adminFee   = fromWallet && toWallet ? getAdminFee(fromWallet.wallet_type ?? 'bank', toWallet.wallet_type ?? 'bank') : 0;
  const amt        = Number(amount) || 0;
  const totalDeducted = amt + adminFee;
  const sufficient = fromWallet ? Number(fromWallet.balance) >= totalDeducted : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || !amt) return;
    if (fromId === toId) { setError('Wallet sumber dan tujuan tidak boleh sama.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/transfers', { from_wallet_id: Number(fromId), to_wallet_id: Number(toId), amount: amt, notes });
      toast.success(`Transfer Rp ${amt.toLocaleString('id-ID')} berhasil!`, { style: { borderLeft: '4px solid var(--accent-emerald)' } });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Transfer gagal.';
      setError(msg);
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Transfer Dana" subtitle="Pindahkan saldo antar wallet">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* From wallet */}
        <div>
          <label className="input-label">Dari Wallet</label>
          <select required className="input-base" value={fromId} onChange={(e) => { setFromId(e.target.value); setError(''); }}>
            <option value="">Pilih wallet sumber...</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.icon} {w.name} ({w.wallet_type === 'bank' ? 'Bank' : 'E-Wallet'}) — {formatRp(Number(w.balance))}
              </option>
            ))}
          </select>
        </div>

        {/* Arrow indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRightLeft size={14} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* To wallet */}
        <div>
          <label className="input-label">Ke Wallet</label>
          <select required className="input-base" value={toId} onChange={(e) => { setToId(e.target.value); setError(''); }}>
            <option value="">Pilih wallet tujuan...</option>
            {wallets.filter((w) => w.id !== Number(fromId)).map((w) => (
              <option key={w.id} value={w.id}>
                {w.icon} {w.name} ({w.wallet_type === 'bank' ? 'Bank' : 'E-Wallet'}) — {formatRp(Number(w.balance))}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="input-label">Jumlah Transfer (Rp)</label>
          <NumericInput value={amount} onChange={setAmount} placeholder="0"
            style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700 }} />
        </div>

        {/* Fee breakdown — shown when both wallets selected & amount entered */}
        {fromWallet && toWallet && amt > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px 16px', borderRadius: 14,
              background: !sufficient ? 'rgba(244,63,94,0.08)' : 'var(--bg-overlay)',
              border: `1px solid ${!sufficient ? 'rgba(244,63,94,0.3)' : 'var(--border-subtle)'}`,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Rincian Transfer</p>
            {[
              { label: 'Jumlah transfer', value: formatRp(amt), color: 'var(--text-primary)' },
              { label: `Biaya admin (${fromWallet.wallet_type} → ${toWallet.wallet_type})`, value: adminFee === 0 ? 'Gratis ✓' : `+ ${formatRp(adminFee)}`, color: adminFee === 0 ? '#34d399' : '#f59e0b' },
              { label: 'Total dikurangi dari sumber', value: formatRp(totalDeducted), color: !sufficient ? '#f43f5e' : 'var(--accent-cyan)' },
              { label: 'Saldo sesudah transfer', value: formatRp(Number(fromWallet.balance) - totalDeducted), color: !sufficient ? '#f43f5e' : '#34d399' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{value}</span>
              </div>
            ))}
            {!sufficient && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '8px 10px', borderRadius: 9, background: 'rgba(244,63,94,0.12)' }}>
                <AlertTriangle size={13} style={{ color: '#f43f5e', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#f43f5e' }}>Saldo tidak mencukupi</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Notes */}
        <div>
          <label className="input-label">Catatan (opsional)</label>
          <input className="input-base" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Top up GoPay" />
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <AlertTriangle size={15} style={{ color: '#f43f5e', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#f43f5e' }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn-primary" disabled={saving || !sufficient || !fromId || !toId || !amt} style={{ flex: 1 }}>
            {saving ? 'Memproses...' : '⇄ Transfer Sekarang'}
          </button>
          <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Page ── */
export default function WalletsPage() {
  const { wallets, refetchWallets, setWallets, updateWalletInStore, removeWalletFromStore } = useAppStore();
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState({ ...emptyForm });
  const [addSaving, setAddSaving]     = useState(false);
  const [editWallet, setEditWallet]   = useState<Wallet | null>(null);
  const [editForm, setEditForm]       = useState({ ...emptyForm });
  const [editSaving, setEditSaving]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    setLoading(true);
    refetchWallets().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAddSaving(true);
    try {
      const res = await api.post('/wallets', addForm);
      setWallets([...wallets, res.data]);
      setShowAdd(false); setAddForm({ ...emptyForm });
      toast.success('Wallet added!', { style: { borderLeft: '4px solid var(--accent-emerald)' } });
    } catch { toast.error('Failed to add wallet.'); } finally { setAddSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editWallet) return; setEditSaving(true);
    try {
      const res = await api.put(`/wallets/${editWallet.id}`, editForm);
      updateWalletInStore(res.data); setEditWallet(null);
      toast.success('Wallet updated!', { style: { borderLeft: '4px solid var(--accent-cyan)' } });
    } catch { toast.error('Failed to update.'); } finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/wallets/${deleteTarget.id}`);
      removeWalletFromStore(deleteTarget.id);
      setDeleteTarget(null);
      toast.error('Wallet deleted.', { style: { borderLeft: '4px solid var(--accent-rose)' } });
    } catch { toast.error('Failed to delete.'); } finally { setDeleting(false); }
  };

  const handleTransferSuccess = () => {
    setLoading(true);
    refetchWallets().finally(() => setLoading(false));
  };

  const totalBalance  = wallets.reduce((s, w) => s + Number(w.balance), 0);
  const bankWallets   = wallets.filter((w) => (w.wallet_type ?? 'bank') === 'bank');
  const ewallets      = wallets.filter((w) => (w.wallet_type ?? 'bank') === 'ewallet');

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Wallets</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>
            {bankWallets.length} bank · {ewallets.length} e-wallet
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {wallets.length >= 2 && (
            <button
              onClick={() => setShowTransfer(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(20,184,166,0.15))',
                border: '1px solid rgba(14,165,233,0.35)',
                color: 'var(--accent-cyan)', cursor: 'pointer',
                fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(20,184,166,0.15))'; }}
            >
              <ArrowRightLeft size={16} /> Transfer
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} strokeWidth={2.5} /> Add Wallet
          </button>
        </div>
      </div>

      {/* Total balance hero */}
      {wallets.length > 0 && (
        <div className="card noise animate-fadeup" style={{ padding: '26px 30px', background: 'linear-gradient(135deg, #060d1b 0%, #0d1628 100%)', borderColor: 'var(--border-accent)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: 40, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--grad-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-teal)' }}>
                    <PiggyBank size={18} color="white" strokeWidth={2} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Total Balance — All Wallets</p>
                </div>
                <NumberFlow value={totalBalance} format={{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }}
                  style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <TrendingUp size={13} style={{ color: 'var(--accent-emerald)' }} />
                  <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{wallets.length} active wallet{wallets.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {/* Mini breakdown */}
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { label: 'Bank', walletList: bankWallets, color: '#0ea5e9', icon: <Building2 size={14} /> },
                  { label: 'E-Wallet', walletList: ewallets, color: '#34d399', icon: <Wallet2 size={14} /> },
                ].map(({ label, walletList, color, icon }) => (
                  <div key={label} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginBottom: 4 }}>
                      <span style={{ color, display: 'flex' }}>{icon}</span>
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                    </div>
                    <NumberFlow
                      value={walletList.reduce((s, w) => s + Number(w.balance), 0)}
                      format={{ style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }}
                      style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color, letterSpacing: '-0.02em' }}
                    />
                    <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{walletList.length} wallet{walletList.length !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet cards — grouped by type */}
      {loading ? (
        <div className="cards-grid">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 22 }} />)}
        </div>
      ) : wallets.length === 0 ? (
        <div className="card">
          <EmptyState icon="💳" title="No wallets yet" description="Add your first wallet to start tracking your finances"
            action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add Wallet</button>} />
        </div>
      ) : (
        <>
          {/* Bank section */}
          {bankWallets.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Building2 size={15} style={{ color: '#0ea5e9' }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bank Accounts</p>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>
              <div className="cards-grid">
                {bankWallets.map((w) => (
                  <WalletCard key={w.id} wallet={w}
                    onEdit={() => { setEditWallet(w); setEditForm({ name: w.name, balance: String(w.initial_balance ?? w.balance), currency: w.currency, color: w.color, icon: w.icon ?? '💳', wallet_type: w.wallet_type ?? 'bank' }); }}
                    onDelete={() => setDeleteTarget(w)} />
                ))}
              </div>
            </div>
          )}

          {/* E-Wallet section */}
          {ewallets.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: bankWallets.length > 0 ? 8 : 0 }}>
                <Wallet2 size={15} style={{ color: '#34d399' }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>E-Wallets</p>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>
              <div className="cards-grid">
                {ewallets.map((w) => (
                  <WalletCard key={w.id} wallet={w}
                    onEdit={() => { setEditWallet(w); setEditForm({ name: w.name, balance: String(w.initial_balance ?? w.balance), currency: w.currency, color: w.color, icon: w.icon ?? '💳', wallet_type: w.wallet_type ?? 'bank' }); }}
                    onDelete={() => setDeleteTarget(w)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Wallet" subtitle="Create a new wallet to track your money">
        <WalletForm form={addForm} setForm={setAddForm} onSubmit={handleAdd} saving={addSaving} submitLabel="Save Wallet" onCancel={() => setShowAdd(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editWallet} onClose={() => setEditWallet(null)} title="Edit Wallet">
        <WalletForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} saving={editSaving} submitLabel="Save Changes" onCancel={() => setEditWallet(null)} isEdit />
      </Modal>

      {/* Transfer Modal */}
      <TransferModal wallets={wallets} open={showTransfer} onClose={() => setShowTransfer(false)} onSuccess={handleTransferSuccess} />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Wallet?"
        description="Menghapus wallet ini juga akan menghapus semua transaksi yang terkait. Tindakan ini tidak bisa dibatalkan."
        itemName={deleteTarget?.name}
      />
    </div>
  );
}