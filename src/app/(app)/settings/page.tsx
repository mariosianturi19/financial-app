'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Check, MessageSquare, Copy, ExternalLink, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Display-only format: 0812-3456-7890
  let normalized = digits;
  if (normalized.startsWith('62')) normalized = '0' + normalized.slice(2);
  return normalized.replace(/(\d{4})(\d{4})(\d{4,})/, '$1-$2-$3');
};

export default function SettingsPage() {
  const [profile, setProfile]       = useState<{ email: string; name: string; phone_number: string | null } | null>(null);
  const [phone, setPhone]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    api.get('/profile').then((res) => {
      setProfile(res.data);
      const stored = res.data.phone_number ?? '';
      // Convert 628xxx → 08xxx for display in input
      const display = stored.startsWith('62') ? '0' + stored.slice(2) : stored;
      setPhone(display);
      setPhoneVerified(!!stored);
    }).finally(() => setLoading(false));
  }, []);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile', { phone_number: phone });
      setPhoneVerified(!!phone.trim());
      toast.success(phone.trim() ? 'Nomor WA berhasil disimpan!' : 'Nomor WA dihapus.', {
        style: { borderLeft: '4px solid var(--accent-emerald)' },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menyimpan.';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const BOT_NUMBER = process.env.NEXT_PUBLIC_WA_BOT_NUMBER ?? '(belum dikonfigurasi)';

  const commands = [
    { cmd: 'out 15k jajan bca',          desc: 'Untuk Pengeluaran nominal bisa pakai "k" (ribu) atau "jt" (juta)' },
    { cmd: 'in 15k gaji bca',          desc: 'Untuk Pemasukan nominal bisa pakai "k" (ribu) atau "jt" (juta)' },
    { cmd: '!saldo',                 desc: 'Lihat saldo semua wallet kamu' },
    { cmd: '!kategori',              desc: 'Lihat semua kategori yang tersedia' },
    { cmd: '!help',                  desc: 'Tampilkan panduan lengkap perintah bot' },
  ];

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Settings
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>Kelola profil dan integrasi WhatsApp Bot</p>
        </div>
      </div>

      {loading ? (
        <div className="card"><div className="skeleton" style={{ height: 200, borderRadius: 16 }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Profil Info */}
          <div className="card animate-fadeup" style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Informasi Akun</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Nama',  value: profile?.name  ?? '-' },
                { label: 'Email', value: profile?.email ?? '-' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Bot Integration */}
          <motion.div className="card noise animate-fadeup" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(37,211,102,0.06) 0%, rgba(14,165,233,0.06) 100%)', borderColor: 'rgba(37,211,102,0.25)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} style={{ color: '#25d366' }} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>WhatsApp Bot</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Catat transaksi langsung dari chat WA</p>
              </div>
              {phoneVerified && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <Check size={11} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>Terhubung</span>
                </div>
              )}
            </div>

            {/* Phone form */}
            <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={12} /> Nomor WA Kamu
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>🇮🇩</span>
                    <input
                      className="input-base"
                      style={{ paddingLeft: 40 }}
                      type="tel"
                      placeholder="08123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ whiteSpace: 'nowrap', paddingLeft: 18, paddingRight: 18 }}>
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  Format: 08xxx atau 628xxx · Nomor ini dipakai bot WA untuk mengenali identitasmu.
                </p>
              </div>
            </form>

            {/* Bot number info */}
            {BOT_NUMBER !== '(belum dikonfigurasi)' && (
              <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Nomor Bot FinApp</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#25d366', fontFamily: 'var(--font-display)', letterSpacing: '0.01em', flex: 1 }}>{BOT_NUMBER}</p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(BOT_NUMBER); toast.success('Nomor disalin!'); }}
                    style={{ padding: '6px 12px', borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <Copy size={12} /> Salin
                  </button>
                  <a href={`https://api.whatsapp.com/send?phone=${BOT_NUMBER.replace(/\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer"
                    style={{ padding: '6px 12px', borderRadius: 9, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                    <ExternalLink size={12} /> Chat
                  </a>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>Save nomor ini ke kontak HP kamu, lalu langsung chat.</p>
              </div>
            )}
          </motion.div>

          {/* Command Guide */}
          <div className="card animate-fadeup" style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              📖 Panduan Perintah Bot
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {commands.map(({ cmd, desc }) => (
                <div key={cmd} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
                  <code style={{ fontSize: 12.5, color: 'var(--accent-cyan)', background: 'rgba(14,165,233,0.1)', padding: '2px 8px', borderRadius: 7, whiteSpace: 'nowrap', fontFamily: 'monospace', flexShrink: 0 }}>{cmd}</code>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', paddingTop: 2 }}>{desc}</span>
                </div>
              ))}
            </div>

            {/* Security note */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <Shield size={14} style={{ color: '#fbbf24', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Bot hanya akan merespon pesan dari <strong style={{ color: 'var(--text-primary)' }}>nomor WA yang kamu daftarkan</strong> di atas. Pesan dari nomor lain akan diabaikan sepenuhnya.
              </p>
            </div>
          </div>

          {/* Warning kalau BOT_NUMBER belum dikonfigurasi */}
          {BOT_NUMBER === '(belum dikonfigurasi)' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 14, background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)' }}>
              <AlertTriangle size={15} style={{ color: '#fb7185', marginTop: 1, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fb7185' }}>Bot belum aktif</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  Untuk mengaktifkan bot, jalankan script <code style={{ background: 'var(--bg-overlay)', padding: '1px 6px', borderRadius: 5 }}>finapp-wa-bot</code> dan isi variabel <code style={{ background: 'var(--bg-overlay)', padding: '1px 6px', borderRadius: 5 }}>NEXT_PUBLIC_WA_BOT_NUMBER</code> di file <code style={{ background: 'var(--bg-overlay)', padding: '1px 6px', borderRadius: 5 }}>.env.local</code>.
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
