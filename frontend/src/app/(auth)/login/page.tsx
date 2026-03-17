'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: TrendingUp, label: 'Smart Analytics',     sub: 'Real-time financial visualisations' },
  { icon: Shield,     label: 'Safe & Encrypted',    sub: 'Your data is always protected' },
  { icon: Zap,        label: 'AI-Powered Insights', sub: 'Automated recommendations' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/login', form);
      setAuth(res.data.user, res.data.token);
      router.push('/dashboard');
    } catch {
      toast.error('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key: string) => ({
    width: '100%',
    background: focused === key ? 'var(--bg-hover)' : 'var(--bg-overlay)',
    border: `1px solid ${focused === key ? 'var(--accent-violet)' : 'var(--border-default)'}`,
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s',
    boxShadow: focused === key ? '0 0 0 3px var(--accent-violet-dim)' : 'none',
    fontFamily: 'var(--font-body)',
  });

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg-base)',
      display: 'flex', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,247,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%',  width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Left panel (desktop) */}
      <div className="auth-left-panel" style={{
        display: 'none', flex: '0 0 42%',
        background: 'linear-gradient(160deg, #0e0e1a 0%, #13131f 50%, #0e0e1a 100%)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '60px 56px',
        flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,247,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: 'var(--shadow-violet)' }}>💎</div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>FinApp</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Personal Finance</p>
            </div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16 }}>
            Take control of your finances
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Track expenses, plan budgets, and gain AI-powered insights — all in one place.
          </p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-violet-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: 'var(--accent-violet)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', position: 'relative', zIndex: 1 }}>
          © 2025 FinApp. Built with care.
        </p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        {/* Mobile logo */}
        <div className="auth-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: 'var(--shadow-violet)' }}>💎</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>FinApp</p>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: focused === 'email' ? 'var(--accent-violet)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, transition: 'color 0.2s' }}>
                Email Address
              </label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                placeholder="you@example.com"
                style={inputStyle('email')}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: focused === 'password' ? 'var(--accent-violet)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, transition: 'color 0.2s' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle('password'), paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px 20px', marginTop: 4,
                background: loading ? 'rgba(124,111,247,0.5)' : 'var(--grad-violet)',
                border: 'none', borderRadius: 12, color: 'white',
                fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(124,111,247,0.4)',
                letterSpacing: '-0.01em',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-tertiary)' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent-violet)', fontWeight: 600, textDecoration: 'none' }}>
              Sign up for free
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