'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ArrowLeftRight, Target, TrendingUp,
  MoreHorizontal, Wallet, Tag, Zap, Lightbulb, X,
} from 'lucide-react';

const PRIMARY_NAV = [
  { href: '/dashboard',    Icon: LayoutDashboard, label: 'Home'    },
  { href: '/transactions', Icon: ArrowLeftRight,  label: 'Txns'    },
  { href: '/wallets',      Icon: Wallet,          label: 'Wallets' },
  { href: '/budgets',      Icon: Target,          label: 'Budgets' },
];

const MORE_NAV = [
  { href: '/analytics',  Icon: TrendingUp,label: 'Analytics',    color: '#34d399' },
  { href: '/categories', Icon: Tag,       label: 'Categories',   color: '#fbbf24' },
  { href: '/forecast',   Icon: Zap,       label: 'Forecasting',  color: '#0ea5e9' },
  { href: '/insights',   Icon: Lightbulb, label: 'Smart Insights', color: '#fb7185' },
];

export default function BottomNav() {
  const pathname   = usePathname();
  const isActive   = (href: string) => pathname.startsWith(href);
  const [open, setOpen] = useState(false);

  // Check if current path is one of the "more" items
  const moreActive = MORE_NAV.some(item => isActive(item.href));

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.18s ease',
          }}
        />
      )}

      {/* More drawer sheet */}
      <div style={{
        position: 'fixed', bottom: 'var(--bottom-nav-height)', left: 0, right: 0,
        zIndex: 50,
        background: 'rgba(6,11,22,0.98)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        borderTop: '1px solid var(--border-default)',
        borderRadius: '22px 22px 0 0',
        padding: '6px 0 12px',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.6)',
      }}>
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-default)', margin: '8px auto 18px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
          {MORE_NAV.map(({ href, Icon, label, color }) => {
            const active = isActive(href);
            return (
              <Link
                key={href} href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 16, textDecoration: 'none',
                  background: active ? `${color}18` : 'var(--bg-overlay)',
                  border: `1px solid ${active ? `${color}40` : 'var(--border-subtle)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${color}20`,
                }}>
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} style={{ color }} />
                </div>
                <span style={{
                  fontSize: 13.5, fontWeight: active ? 700 : 500,
                  color: active ? color : 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => setOpen(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: 'calc(100% - 32px)', margin: '14px 16px 0',
            padding: '12px', borderRadius: 14,
            background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          <X size={14} strokeWidth={2.5} /> Close
        </button>
      </div>

      {/* Bottom nav bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,10,21,0.92)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'stretch',
        height: 'var(--bottom-nav-height)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)',
      }}>
        {PRIMARY_NAV.map(({ href, Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4, textDecoration: 'none',
              color: active ? 'var(--accent-cyan-soft)' : 'var(--text-tertiary)',
              transition: 'color 0.15s',
              position: 'relative',
              paddingTop: 8,
            }}>
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 32, height: 2,
                  background: 'var(--grad-cyan)',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: '0 0 12px rgba(14,165,233,0.6)',
                }} />
              )}
              <div style={{
                width: 36, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 9,
                background: active ? 'rgba(14,165,233,0.15)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: active ? 700 : 500,
                letterSpacing: '0.02em', textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* More tab */}
        <button
          onClick={() => setOpen(!open)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4, background: 'none', border: 'none', cursor: 'pointer',
            color: (moreActive || open) ? 'var(--accent-cyan-soft)' : 'var(--text-tertiary)',
            transition: 'color 0.15s',
            position: 'relative',
            paddingTop: 8,
            fontFamily: 'var(--font-body)',
          }}
        >
          {(moreActive || open) && (
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 32, height: 2,
              background: 'var(--grad-cyan)',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 0 12px rgba(14,165,233,0.6)',
            }} />
          )}
          <div style={{
            width: 36, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 9,
            background: (moreActive || open) ? 'rgba(14,165,233,0.15)' : 'transparent',
            transition: 'background 0.15s, transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>
            <MoreHorizontal size={17} strokeWidth={(moreActive || open) ? 2.2 : 1.8} />
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: (moreActive || open) ? 700 : 500,
            letterSpacing: '0.02em', textTransform: 'uppercase',
          }}>
            More
          </span>
        </button>
      </nav>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}