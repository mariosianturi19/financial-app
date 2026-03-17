'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, MoreHorizontal, X } from 'lucide-react';
import { useState } from 'react';

const mainItems = [
  { href: '/dashboard',    label: 'Home',         Icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', Icon: ArrowLeftRight  },
  { href: '/wallets',      label: 'Wallets',      Icon: Wallet          },
  { href: '/budgets',      label: 'Budgets',      Icon: Target          },
];

const moreItems = [
  { href: '/categories', label: 'Categories', emoji: '🏷️' },
  { href: '/analytics',  label: 'Analytics',  emoji: '📈' },
  { href: '/forecast',   label: 'Forecast',   emoji: '🔮' },
  { href: '/insights',   label: 'Insights',   emoji: '💡' },
];

export default function BottomNav() {
  const pathname    = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive     = (href: string) => pathname.startsWith(href);
  const isMoreActive = moreItems.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <>
          <div
            onClick={() => setShowMore(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 48,
              background: 'rgba(4,4,10,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 'var(--bottom-nav-height)',
            left: 0, right: 0,
            zIndex: 49,
            background: 'rgba(14,14,23,0.98)',
            borderTop: '1px solid var(--border-default)',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            backdropFilter: 'blur(20px)',
          }}>
            {moreItems.map(({ href, label, emoji }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href} href={href}
                  onClick={() => setShowMore(false)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '12px 8px', borderRadius: 14, textDecoration: 'none',
                    background: active ? 'var(--accent-violet-dim)' : 'var(--bg-overlay)',
                    border: `1px solid ${active ? 'rgba(124,111,247,0.3)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{emoji}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: active ? 'var(--accent-violet)' : 'var(--text-tertiary)' }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Main nav bar */}
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
                textDecoration: 'none', position: 'relative',
              }}>
                {active && (
                  <div style={{
                    position: 'absolute', top: 8,
                    width: 32, height: 32,
                    background: 'var(--accent-violet-dim)', borderRadius: 10,
                  }} />
                )}
                <Icon
                  size={20} strokeWidth={active ? 2.2 : 1.8}
                  style={{ color: active ? 'var(--accent-violet)' : 'var(--text-tertiary)', position: 'relative', zIndex: 1 }}
                />
                <span style={{
                  fontSize: 10, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent-violet)' : 'var(--text-tertiary)',
                  position: 'relative', zIndex: 1,
                }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative',
            }}
          >
            {isMoreActive && !showMore && (
              <div style={{
                position: 'absolute', top: 8,
                width: 32, height: 32,
                background: 'var(--accent-violet-dim)', borderRadius: 10,
              }} />
            )}
            {showMore
              ? <X size={20} style={{ color: 'var(--accent-violet)', position: 'relative', zIndex: 1 }} />
              : <MoreHorizontal size={20} strokeWidth={1.8} style={{ color: isMoreActive ? 'var(--accent-violet)' : 'var(--text-tertiary)', position: 'relative', zIndex: 1 }} />
            }
            <span style={{
              fontSize: 10, fontWeight: (isMoreActive || showMore) ? 600 : 400,
              color: (isMoreActive || showMore) ? 'var(--accent-violet)' : 'var(--text-tertiary)',
              position: 'relative', zIndex: 1,
            }}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}