'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Tag, Target,
  RefreshCw, Trophy, Package, Handshake, TrendingUp, Zap, Lightbulb,
  LogOut, ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import toast from 'react-hot-toast';

const sections = [
  {
    label: 'Core',
    items: [
      { href: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
      { href: '/transactions', label: 'Transaksi',    Icon: ArrowLeftRight },
      { href: '/wallets',      label: 'Dompet',       Icon: Wallet },
      { href: '/categories',   label: 'Kategori',     Icon: Tag },
      { href: '/budgets',      label: 'Anggaran',     Icon: Target },
    ],
  },
  {
    label: 'Lanjutan',
    items: [
      { href: '/recurring',     label: 'Transaksi Rutin', Icon: RefreshCw },
      { href: '/goals',         label: 'Target Keuangan', Icon: Trophy },
      { href: '/subscriptions', label: 'Langganan',       Icon: Package },
      { href: '/debts',         label: 'Hutang & Piutang',Icon: Handshake },
    ],
  },
  {
    label: 'Kecerdasan',
    items: [
      { href: '/analytics', label: 'Analytics',    Icon: TrendingUp },
      { href: '/forecast',  label: 'Forecasting',  Icon: Zap },
      { href: '/insights',  label: 'Smart Insights',Icon: Lightbulb },
    ],
  },
];

export default function Sidebar() {
  const pathname            = usePathname();
  const router              = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { resetStore }      = useAppStore();

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch { /* ok */ }
    clearAuth(); resetStore();
    toast.success('Berhasil logout.');
    router.push('/login');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--grad-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: 'var(--shadow-violet)',
          }}>
            💎
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              FinFlow
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Manajemen Keuangan</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '8px 8px 4px',
            }}>
              {section.label}
            </p>
            {section.items.map(({ href, label, Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10, textDecoration: 'none',
                  transition: 'all 0.15s', marginBottom: 1,
                  background: active ? 'var(--accent-violet-dim)' : 'transparent',
                  color: active ? 'var(--accent-violet)' : 'var(--text-secondary)',
                }}>
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>{label}</span>
                  {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px', borderRadius: 12,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--grad-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? 'User'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? ''}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 10px', borderRadius: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500,
          transition: 'color 0.15s, background 0.15s',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-rose)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,113,133,0.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >
          <LogOut size={14} />
          Keluar
        </button>
      </div>
    </aside>
  );
}