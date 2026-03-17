'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: TrendingUp, label: 'Analytics Cerdas', sub: 'Visualisasi keuangan real-time' },
  { icon: Shield,     label: 'Aman & Terenkripsi', sub: 'Data kamu selalu terlindungi' },
  { icon: Zap,        label: 'Insight Otomatis', sub: 'Rekomendasi berbasis AI' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/login', form);
      setAuth(res.data.user, res.data.token);
      router.push('/dashboard');
    } catch {
      toast.error('Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Ambient light orbs ── */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,247,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Left panel — decorative (desktop only) ── */}
      <div className="auth-left-panel" style={{
        display: 'none',
        flex: '0 0 42%',
        background: 'linear-gradient(160deg, #0e0e1a 0%, #13131f 50%, #0e0e1a 100%)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '60px 56px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px)`,
          pointerEvents: 'none',
        }} />

        {/* Glow center */}
        <div style={{
          position: 'absolute', top: '35%', left: '30%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,111,247,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13,
              background: 'var(--grad-violet)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 8px 32px rgba(124,111,247,0.4)',
            }}>💎</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              FinApp
            </span>
          </div>

          {/* Hero text */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-violet)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              Manajemen Keuangan Modern
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 18 }}>
              Kendalikan<br />
              <span style={{ background: 'var(--grad-violet)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                keuangan kamu
              </span><br />
              sekarang.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 320 }}>
              Platform all-in-one untuk melacak, menganalisis, dan mengoptimalkan kondisi keuangan pribadimu.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(124,111,247,0.1)',
                  border: '1px solid rgba(124,111,247,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color: 'var(--accent-violet)' }} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{label}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)', marginBottom: 20 }} />
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, fontStyle: 'italic' }}>
            "Financial freedom is available to those who learn about it and work for it."
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, opacity: 0.6 }}>— Robert Kiyosaki</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Mobile logo */}
        <div className="auth-mobile-logo" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--grad-violet)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, marginBottom: 16,
            boxShadow: '0 8px 32px rgba(124,111,247,0.35)',
          }}>💎</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            FinApp
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }} className="animate-fadeup">
          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 6 }}>
              Selamat datang kembali
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Masuk ke akun FinApp kamu</p>
          </div>

          {/* Form card */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Top shimmer line */}
            <div style={{
              position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(124,111,247,0.4), transparent)',
            }} />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Email */}
              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: focused === 'email' ? 'var(--accent-violet)' : 'var(--text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
                  transition: 'color 0.2s',
                }}>
                  Alamat Email
                </label>
                <input
                  ref={emailRef}
                  type="email" required autoFocus
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="nama@email.com"
                  style={{
                    width: '100%',
                    background: focused === 'email' ? 'var(--bg-hover)' : 'var(--bg-overlay)',
                    border: `1px solid ${focused === 'email' ? 'var(--accent-violet)' : 'var(--border-default)'}`,
                    borderRadius: 12,
                    padding: '11px 14px',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: focused === 'email' ? '0 0 0 3px rgba(124,111,247,0.12)' : 'none',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: focused === 'password' ? 'var(--accent-violet)' : 'var(--text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
                  transition: 'color 0.2s',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'} required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      background: focused === 'password' ? 'var(--bg-hover)' : 'var(--bg-overlay)',
                      border: `1px solid ${focused === 'password' ? 'var(--accent-violet)' : 'var(--border-default)'}`,
                      borderRadius: 12,
                      padding: '11px 44px 11px 14px',
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxShadow: focused === 'password' ? '0 0 0 3px rgba(124,111,247,0.12)' : 'none',
                      fontFamily: 'var(--font-body)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-tertiary)', padding: 4, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'color 0.15s',
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: loading ? 'rgba(124,111,247,0.5)' : 'var(--grad-violet)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 24px rgba(124,111,247,0.4)',
                  marginTop: 4,
                  letterSpacing: '-0.01em',
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Masuk...
                  </>
                ) : (
                  <>Masuk ke Dashboard <ArrowRight size={15} strokeWidth={2.5} /></>
                )}
              </button>
            </form>
          </div>

          {/* Register link */}
          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-tertiary)' }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: 'var(--accent-violet)', fontWeight: 600, textDecoration: 'none' }}>
              Daftar gratis
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .auth-left-panel  { display: flex !important; }
          .auth-mobile-logo { display: none  !important; }
        }
      `}</style>
    </div>
  );
}