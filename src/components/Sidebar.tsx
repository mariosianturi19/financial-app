'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Tag, Target,
  TrendingUp, Zap, Lightbulb, LogOut, Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';

const sections = [
  {
    label: 'Core',
    items: [
      { href: '/dashboard',    label: 'Dashboard',     Icon: LayoutDashboard },
      { href: '/transactions', label: 'Transactions',  Icon: ArrowLeftRight  },
      { href: '/wallets',      label: 'Wallets',       Icon: Wallet          },
      { href: '/categories',   label: 'Categories',    Icon: Tag             },
      { href: '/budgets',      label: 'Budgets',       Icon: Target          },
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
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ok */ }
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
      background: 'rgba(10,10,18,0.96)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
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
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Glow behind logo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 80,
          background: 'radial-gradient(ellipse at 30% 0%, rgba(124,111,247,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 13,
            background: 'var(--grad-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 24px rgba(124,111,247,0.5)', flexShrink: 0,
          }}>
            💎
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              FinApp
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, letterSpacing: '0.02em' }}>Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: 9.5, fontWeight: 800, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              padding: '8px 12px 5px',
            }}>
              {section.label}
            </p>
            {section.items.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 11, textDecoration: 'none',
                  marginBottom: 2, position: 'relative',
                  background: active
                    ? 'linear-gradient(135deg, rgba(124,111,247,0.18) 0%, rgba(167,139,250,0.08) 100%)'
                    : 'transparent',
                  color: active ? 'var(--accent-violet-soft)' : 'var(--text-secondary)',
                  border: active ? '1px solid rgba(124,111,247,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s',
                  boxShadow: active ? '0 2px 12px rgba(124,111,247,0.12)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }
                }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 24, background: 'var(--accent-violet)',
                      borderRadius: '0 4px 4px 0',
                      boxShadow: '0 0 8px var(--accent-violet-glow)',
                    }} />
                  )}
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'rgba(124,111,247,0.18)' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 400, letterSpacing: '-0.01em' }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
        background: 'linear-gradient(to top, rgba(10,10,18,0.8), transparent)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 12,
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'var(--grad-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '-0.01em',
            boxShadow: '0 2px 10px rgba(124,111,247,0.4)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {user?.name ?? 'User'}
            </p>
            <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {user?.email ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', padding: 6, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--accent-rose)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(251,113,133,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)';
              (e.currentTarget as HTMLElement).style.background = 'none';
            }}
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}