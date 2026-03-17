'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Tag, Target,
  TrendingUp, Zap, Lightbulb, LogOut, ChevronRight,
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
      { href: '/transactions', label: 'Transactions', Icon: ArrowLeftRight  },
      { href: '/wallets',      label: 'Wallets',      Icon: Wallet          },
      { href: '/categories',   label: 'Categories',   Icon: Tag             },
      { href: '/budgets',      label: 'Budgets',      Icon: Target          },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/analytics', label: 'Analytics',     Icon: TrendingUp },
      { href: '/forecast',  label: 'Forecasting',   Icon: Zap        },
      { href: '/insights',  label: 'Smart Insights', Icon: Lightbulb },
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
    clearAuth();
    resetStore();
    toast.success('Logged out successfully.');
    router.push('/login');
  };

  const isActive = (href: string) => pathname.startsWith(href);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

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
      <div style={{ padding: '22px 16px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'var(--grad-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: 'var(--shadow-violet)', flexShrink: 0,
          }}>
            💎
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              FinApp
            </p>
            <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.09em',
              padding: '6px 10px 4px',
            }}>
              {section.label}
            </p>
            {section.items.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 10, textDecoration: 'none',
                  marginBottom: 1, position: 'relative',
                  background: active ? 'var(--accent-violet-dim)' : 'transparent',
                  color: active ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  transition: 'background 0.15s, color 0.15s',
                }}>
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, background: 'var(--accent-violet)',
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{label}</span>
                  {active && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 10px', borderRadius: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'var(--grad-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '-0.01em',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? 'User'}
            </p>
            <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--accent-rose)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)')}
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}