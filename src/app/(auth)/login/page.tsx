'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.errors?.email?.[0] ?? data?.message ?? 'Invalid email or password.');
        return;
      }
      setAuth(data.user);
      router.push('/dashboard');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key: string): React.CSSProperties => ({
    width: '100%',
    background: focused === key ? 'rgba(124,111,247,0.06)' : 'var(--bg-overlay)',
    border: `1px solid ${focused === key ? 'var(--accent-violet)' : 'var(--border-default)'}`,
    borderRadius: 14,
    padding: '13px 16px',
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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '24px 16px',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '-20%', right: '5%',  width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,247,0.14) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
          background: 'rgba(12,12,20,0.85)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--border-default)',
          borderRadius: 28,
          padding: '44px 40px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, boxShadow: '0 4px 24px rgba(124,111,247,0.5)', flexShrink: 0 }}>
            💎
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>FinApp</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Personal Finance</p>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.2 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>Sign in to your account to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: focused === 'email' ? 'var(--accent-violet-soft)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, transition: 'color 0.2s' }}>
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: focused === 'password' ? 'var(--accent-violet-soft)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, transition: 'color 0.2s' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                placeholder="Enter your password"
                style={{ ...inputStyle('password'), paddingRight: 48 }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit" disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: '100%', padding: '14px 20px', marginTop: 4,
              background: loading ? 'rgba(124,111,247,0.5)' : 'var(--grad-violet)',
              border: 'none', borderRadius: 14, color: 'white',
              fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-body)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
              boxShadow: loading ? 'none' : '0 6px 28px rgba(124,111,247,0.45)',
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
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: 'var(--text-tertiary)' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-violet-soft)', fontWeight: 700, textDecoration: 'none' }}>
            Sign up for free
          </Link>
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}