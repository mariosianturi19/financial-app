'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, User, Lock, Mail, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

/* ── Shared input style ── */
const mkInput = (focused: boolean): React.CSSProperties => ({
  width: '100%',
  background: focused ? 'rgba(14,165,233,0.06)' : 'rgba(15,23,42,0.85)',
  border: `1px solid ${focused ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 14,
  padding: '13px 16px 13px 44px',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'all 0.2s',
  boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
  fontFamily: 'var(--font-body)',
});

const iconWrap: React.CSSProperties = {
  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
  color: 'var(--text-tertiary)', pointerEvents: 'none', display: 'flex',
};

const submitBtn = (loading: boolean): React.CSSProperties => ({
  width: '100%', padding: '14px 20px', marginTop: 4,
  background: loading ? 'rgba(14,165,233,0.45)' : 'var(--grad-finapp)',
  border: 'none', borderRadius: 14, color: 'white',
  fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-body)',
  cursor: loading ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  transition: 'all 0.2s',
  boxShadow: loading ? 'none' : '0 6px 28px rgba(14,165,233,0.4)',
  letterSpacing: '-0.01em',
});

function Spinner() {
  return (
    <>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'auth-spin 0.8s linear infinite' }} />
      <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
      <img src="/logo-finapp.png" alt="FinApp" width={44} height={44} style={{ borderRadius: 14, boxShadow: '0 4px 24px rgba(14,165,233,0.4)', flexShrink: 0 }} />
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>FinApp</p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Personal Finance</p>
      </div>
    </div>
  );
}

/* ══════════════════════════
   LOGIN FORM
══════════════════════════ */
function LoginForm({ onFlip }: { onFlip: () => void }) {
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
      const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.message ?? 'Invalid email or password.'); return; }
      setAuth(data.user);
      router.push('/dashboard');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Logo />
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>Welcome back 👋</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Sign in to manage your finances</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="input-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <div style={iconWrap}><Mail size={15} /></div>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              placeholder="you@example.com" style={mkInput(focused === 'email')} autoComplete="email" />
          </div>
        </div>

        <div>
          <label className="input-label">Password</label>
          <div style={{ position: 'relative' }}>
            <div style={iconWrap}><Lock size={15} /></div>
            <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              placeholder="Enter your password" style={{ ...mkInput(focused === 'password'), paddingRight: 48 }} autoComplete="current-password" />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }} style={submitBtn(loading)}>
          {loading ? <><Spinner /> Signing in...</> : <>Sign In <ArrowRight size={15} strokeWidth={2.5} /></>}
        </motion.button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: 'var(--text-secondary)' }}>
        Don&apos;t have an account?{' '}
        <button onClick={onFlip} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>
          <span style={{ color: 'var(--accent-cyan-soft)', fontWeight: 700 }}>Sign up for free</span>
        </button>
      </p>
    </div>
  );
}

/* ══════════════════════════
   REGISTER FORM
══════════════════════════ */
function RegisterForm({ onFlip }: { onFlip: () => void }) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm]       = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.message ?? 'Registration failed. Please try again.'); return; }
      setAuth(data.user);
      router.push('/dashboard');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Logo />
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 }}>Create account ✨</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Start managing your finances today</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {([
          { key: 'name',  label: 'Full Name',        type: 'text',     placeholder: 'Your name',        icon: <User size={15} /> },
          { key: 'email', label: 'Email Address',     type: 'email',    placeholder: 'you@example.com',  icon: <Mail size={15} /> },
          { key: 'password',              label: 'Password',         type: showPw ? 'text' : 'password', placeholder: 'Min. 8 characters', icon: <Lock size={15} /> },
          { key: 'password_confirmation', label: 'Confirm Password', type: showPw ? 'text' : 'password', placeholder: 'Repeat password',  icon: <CheckCircle size={15} /> },
        ] as const).map(({ key, label, type, placeholder, icon }) => (
          <div key={key}>
            <label className="input-label">{label}</label>
            <div style={{ position: 'relative' }}>
              <div style={iconWrap}>{icon}</div>
              <input type={type} required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                onFocus={() => setFocused(key)} onBlur={() => setFocused(null)}
                placeholder={placeholder} style={mkInput(focused === key)} autoComplete={key === 'email' ? 'email' : key === 'name' ? 'name' : 'new-password'} />
            </div>
          </div>
        ))}

        <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }} style={{ ...submitBtn(loading), marginTop: 2 }}>
          {loading ? <><Spinner /> Creating account...</> : <>Create Account <ArrowRight size={15} strokeWidth={2.5} /></>}
        </motion.button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <button onClick={onFlip} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>
          <span style={{ color: 'var(--accent-cyan-soft)', fontWeight: 700 }}>Sign in</span>
        </button>
      </p>
    </div>
  );
}

/* ══════════════════════════
   MAIN AUTH PAGE
══════════════════════════ */
export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);

  const cardStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(10,17,35,0.92)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 28,
    padding: '44px 40px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(14,165,233,0.06) inset',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 16px',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '-15%', right: '0%',  width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.14) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.10) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Card wrapper — fixed width */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>

        {/* ── 3D Flip Card ── */}
        <div
          style={{
            perspective: '1200px',
            width: '100%',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isRegister ? 'rotateY(180deg)' : 'rotateY(0deg)',
              /* Height trick: show the taller side */
              minHeight: isRegister ? 620 : 490,
            }}
          >
            {/* ── FRONT: Login ── */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                position: isRegister ? 'absolute' : 'relative',
                top: 0, left: 0,
                width: '100%',
              }}
            >
              <div style={cardStyle}>
                {/* top accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--grad-cyan)', borderRadius: '28px 28px 0 0' }} />
                <LoginForm onFlip={() => setIsRegister(true)} />
              </div>
            </div>

            {/* ── BACK: Register ── */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                position: 'absolute',
                top: 0, left: 0,
                width: '100%',
              }}
            >
              <div style={{ ...cardStyle, padding: '36px 40px' }}>
                {/* top accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--grad-teal)', borderRadius: '28px 28px 0 0' }} />
                <RegisterForm onFlip={() => setIsRegister(false)} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}