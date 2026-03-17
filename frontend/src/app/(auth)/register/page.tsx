'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'name',                  label: 'Nama Lengkap',      type: 'text',     placeholder: 'Nama kamu' },
  { key: 'email',                 label: 'Alamat Email',       type: 'email',    placeholder: 'nama@email.com' },
  { key: 'password',              label: 'Password',          type: 'password', placeholder: 'Min. 8 karakter' },
  { key: 'password_confirmation', label: 'Konfirmasi Password', type: 'password', placeholder: 'Ulangi password' },
] as const;

const STRENGTHS = [
  { test: (p: string) => p.length >= 8,         label: 'Min. 8 karakter' },
  { test: (p: string) => /[A-Z]/.test(p),       label: 'Huruf besar' },
  { test: (p: string) => /[0-9]/.test(p),       label: 'Angka' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Password tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/register', form);
      setAuth(res.data.user, res.data.token);
      toast.success('Akun berhasil dibuat!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (errors) toast.error(Object.values(errors)[0]?.[0] ?? 'Registrasi gagal.');
      else toast.error('Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = STRENGTHS.filter(s => s.test(form.password));
  const strengthPct = (pwStrength.length / STRENGTHS.length) * 100;
  const strengthColor = strengthPct < 40 ? 'var(--accent-rose)' : strengthPct < 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)';

  const inputStyle = (key: string) => ({
    width: '100%',
    background: focused === key ? 'var(--bg-hover)' : 'var(--bg-overlay)',
    border: `1px solid ${focused === key ? 'var(--accent-violet)' : 'var(--border-default)'}`,
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s',
    boxShadow: focused === key ? '0 0 0 3px rgba(124,111,247,0.12)' : 'none',
    fontFamily: 'var(--font-body)',
  });

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Orbs */}
      <div style={{
        position: 'fixed', top: '-15%', left: '-5%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,247,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%',
        width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }} className="animate-fadeup">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 15,
            background: 'var(--grad-violet)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 14,
            boxShadow: '0 8px 32px rgba(124,111,247,0.35)',
          }}>💎</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 5 }}>
            Buat akun baru
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>Mulai perjalanan finansial yang lebih cerdas</p>
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
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(124,111,247,0.4), transparent)',
          }} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FIELDS.map(({ key, label, type, placeholder }) => {
              const isPasswordField = key === 'password' || key === 'password_confirmation';
              const showToggle = isPasswordField;
              const isVisible = key === 'password' ? showPw : showConfirm;

              return (
                <div key={key}>
                  <label style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    color: focused === key ? 'var(--accent-violet)' : 'var(--text-tertiary)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
                    transition: 'color 0.2s',
                  }}>
                    {label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showToggle ? (isVisible ? 'text' : 'password') : type}
                      required
                      minLength={key === 'password' ? 8 : undefined}
                      autoFocus={key === 'name'}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      onFocus={() => setFocused(key)}
                      onBlur={() => setFocused(null)}
                      placeholder={placeholder}
                      style={{ ...inputStyle(key), paddingRight: showToggle ? 44 : 14 }}
                    />
                    {showToggle && (
                      <button type="button"
                        onClick={() => key === 'password' ? setShowPw(!showPw) : setShowConfirm(!showConfirm)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-tertiary)', padding: 4, borderRadius: 6,
                          display: 'flex', alignItems: 'center',
                        }}>
                        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>

                  {/* Password strength indicator */}
                  {key === 'password' && form.password.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ height: 3, background: 'var(--bg-overlay)', borderRadius: 99, marginBottom: 8, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          background: strengthColor,
                          width: `${strengthPct}%`,
                          transition: 'width 0.4s, background 0.3s',
                        }} />
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {STRENGTHS.map((s) => {
                          const passed = s.test(form.password);
                          return (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: passed ? 'var(--accent-emerald)' : 'var(--bg-overlay)',
                                border: `1px solid ${passed ? 'var(--accent-emerald)' : 'var(--border-default)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', flexShrink: 0,
                              }}>
                                {passed && <Check size={8} color="white" strokeWidth={3} />}
                              </div>
                              <span style={{ fontSize: 10.5, color: passed ? 'var(--accent-emerald)' : 'var(--text-tertiary)', transition: 'color 0.2s' }}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Confirm match indicator */}
                  {key === 'password_confirmation' && form.password_confirmation.length > 0 && (
                    <div style={{
                      marginTop: 7, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5,
                      color: form.password === form.password_confirmation ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      transition: 'color 0.2s',
                    }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        background: form.password === form.password_confirmation ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Check size={8} color="white" strokeWidth={3} />
                      </div>
                      {form.password === form.password_confirmation ? 'Password cocok' : 'Password tidak cocok'}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 20px', marginTop: 4,
                background: loading ? 'rgba(124,111,247,0.5)' : 'var(--grad-violet)',
                border: 'none', borderRadius: 12,
                color: 'white', fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(124,111,247,0.4)',
                letterSpacing: '-0.01em',
              }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                  Membuat akun...
                </>
              ) : (
                <>Buat Akun <ArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-tertiary)' }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: 'var(--accent-violet)', fontWeight: 600, textDecoration: 'none' }}>
            Masuk di sini
          </Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}