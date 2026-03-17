'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

const mainItems = [
  { href: '/dashboard',    label: 'Home',       Icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi',  Icon: ArrowLeftRight },
  { href: '/wallets',      label: 'Dompet',     Icon: Wallet },
  { href: '/budgets',      label: 'Anggaran',   Icon: Target },
];

const moreItems = [
  { href: '/categories',   label: 'Kategori',      emoji: '🏷️' },
  { href: '/recurring',    label: 'Rutin',          emoji: '🔄' },
  { href: '/goals',        label: 'Target',         emoji: '🏆' },
  { href: '/subscriptions',label: 'Langganan',      emoji: '📦' },
  { href: '/debts',        label: 'Hutang',         emoji: '🤝' },
  { href: '/analytics',   label: 'Analytics',      emoji: '📈' },
  { href: '/forecast',     label: 'Forecast',       emoji: '🔮' },
  { href: '/insights',     label: 'Insights',       emoji: '💡' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);
  const isMoreActive = moreItems.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(17,17,24,0.92)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border-subtle)',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        display: 'flex',
      }}>
        <div style={{ display: 'flex', width: '100%', height: 'var(--bottom-nav-height)' }}>
          {mainItems.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                textDecoration: 'none', transition: 'opacity 0.15s',
                position: 'relative',
              }}>
                {active && (
                  <div style={{
                    position: 'absolute', top: 8, width: 32, height: 32,
                    background: 'var(--accent-violet-dim)', borderRadius: 10,
                  }} />
                )}
                <Icon
                  size={20}
                  style={{ color: active ? 'var(--accent-violet)' : 'var(--text-tertiary)', position: 'relative', zIndex: 1 }}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span style={{
                  fontSize: 10, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent-violet)' : 'var(--text-tertiary)',
                  letterSpacing: '0.02em',
                }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative',
            }}
          >
            {isMoreActive && (
              <div style={{
                position: 'absolute', top: 8, width: 32, height: 32,
                background: 'var(--accent-violet-dim)', borderRadius: 10,
              }} />
            )}
            <MoreHorizontal
              size={20}
              style={{ color: isMoreActive ? 'var(--accent-violet)' : 'var(--text-tertiary)', position: 'relative', zIndex: 1 }}
              strokeWidth={1.8}
            />
            <span style={{
              fontSize: 10, fontWeight: isMoreActive ? 600 : 400,
              color: isMoreActive ? 'var(--accent-violet)' : 'var(--text-tertiary)',
            }}>
              Lainnya
            </span>
          </button>
        </div>
      </nav>

      {/* More Drawer */}
      {showMore && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="animate-scalein"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--bg-elevated)',
              borderRadius: '24px 24px 0 0',
              border: '1px solid var(--border-subtle)',
              padding: '16px 24px 32px',
              paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: 'var(--border-strong)', borderRadius: 99, margin: '0 auto 20px' }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Menu Lainnya
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {moreItems.map(({ href, label, emoji }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href} href={href}
                    onClick={() => setShowMore(false)}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 8, padding: '14px 8px',
                      borderRadius: 14, textDecoration: 'none',
                      background: active ? 'var(--accent-violet-dim)' : 'var(--bg-overlay)',
                      border: `1px solid ${active ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 500,
                      color: active ? 'var(--accent-violet)' : 'var(--text-secondary)',
                      textAlign: 'center', lineHeight: 1.3,
                    }}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}