'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Wallet } from 'lucide-react';
import NumberFlow from '@number-flow/react';

interface SparkPoint { month: string; income: number; expense: number; }

interface HeroBalanceCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyTrend: SparkPoint[];
  userName: string;
}

function Sparkline({ data, width = 120, height = 36, color = '#0ea5e9' }: {
  data: number[]; width?: number; height?: number; color?: string;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const W = width - pad * 2;
  const H = height - pad * 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * W;
    const y = pad + H - ((v - min) / range) * H;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');
  const first = points[0].split(',');
  const last  = points[points.length - 1].split(',');
  const area  = `${polyline} ${last[0]},${pad + H} ${first[0]},${pad + H}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0}    />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(last[0])} cy={parseFloat(last[1])} r={3} fill={color} opacity={0.9} />
    </svg>
  );
}

function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${y * -4}deg) translateZ(0)`;
    };
    const handleLeave = () => {
      el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0)';
    };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [ref]);
}

export default function HeroBalanceCard({
  totalBalance, totalIncome, totalExpense, monthlyTrend, userName,
}: HeroBalanceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useTilt(cardRef);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const net    = totalIncome - totalExpense;
  const netPos = net >= 0;

  const incomeData  = monthlyTrend.map((m) => m.income);
  const expenseData = monthlyTrend.map((m) => m.expense);

  const last        = monthlyTrend[monthlyTrend.length - 1];
  const savingsRate = last && last.income > 0
    ? Math.round(((last.income - last.expense) / last.income) * 100)
    : 0;

  const hour     = new Date().getHours();
  const greeting =
    hour < 5  ? 'Good night'      :
    hour < 12 ? 'Good morning'    :
    hour < 17 ? 'Good afternoon'  :
                'Good evening';

  const firstName = userName.split(' ')[0];

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        padding: '28px 28px 24px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-accent)',
        boxShadow: '0 0 0 1px rgba(14,165,233,0.08), 0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
        transition: 'transform 0.15s var(--ease-out), box-shadow 0.15s ease',
        willChange: 'transform', cursor: 'default',
      }}
    >
      {/* Ambient mesh */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 10% 20%, rgba(14,165,233,0.18) 0%, transparent 55%),
          radial-gradient(ellipse at 90% 80%, rgba(20,184,166,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 10%, rgba(52,211,153,0.06) 0%, transparent 45%)
        `,
      }} />

      {/* Noise texture */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.6,
      }} />

      {/* Surface highlight */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 20, right: 20, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Greeting row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan-soft)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {greeting}, {firstName} 👋
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 400 }}>
              Net worth overview
            </p>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 13,
            background: 'var(--accent-cyan-dim)', border: '1px solid var(--border-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.2)',
          }}>
            <Wallet size={18} style={{ color: 'var(--accent-cyan)' }} />
          </div>
        </div>

        {/* Balance */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 38px)',
            fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.035em', lineHeight: 1,
            display: 'flex', alignItems: 'baseline', gap: 4,
          }}>
            <span style={{ fontSize: '0.45em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Rp</span>
            {mounted ? (
              <NumberFlow
                value={totalBalance}
                format={{ notation: 'standard', minimumFractionDigits: 0, maximumFractionDigits: 0 }}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.035em' }}
              />
            ) : (
              <span>{totalBalance.toLocaleString('id-ID')}</span>
            )}
          </div>

          {/* Net badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
            padding: '4px 10px', borderRadius: 99,
            background: netPos ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
            border: `1px solid ${netPos ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)'}`,
          }}>
            {net === 0 ? (
              <Minus size={12} style={{ color: 'var(--text-tertiary)' }} />
            ) : netPos ? (
              <TrendingUp size={12} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <TrendingDown size={12} style={{ color: 'var(--accent-rose)' }} />
            )}
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: netPos ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
            }}>
              {netPos ? '+' : ''}
              {net.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>this month</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 20 }} />

        {/* Income / Expense sparklines */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                ↑ Income
              </p>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {mounted ? (
                  <NumberFlow
                    value={totalIncome}
                    format={{ notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }}
                    prefix="Rp "
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
                  />
                ) : (
                  <span>Rp {(totalIncome / 1_000_000).toFixed(1)}M</span>
                )}
              </div>
            </div>
            <Sparkline data={incomeData} color="#34d399" width={110} height={32} />
          </div>

          <div>
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-rose)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                ↓ Expenses
              </p>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {mounted ? (
                  <NumberFlow
                    value={totalExpense}
                    format={{ notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }}
                    prefix="Rp "
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
                  />
                ) : (
                  <span>Rp {(totalExpense / 1_000_000).toFixed(1)}M</span>
                )}
              </div>
            </div>
            <Sparkline data={expenseData} color="#fb7185" width={110} height={32} />
          </div>
        </div>

        {/* Savings rate bar */}
        {last && last.income > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>Savings rate this month</p>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em',
                color: savingsRate >= 20 ? 'var(--accent-emerald)' : savingsRate >= 0 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                fontFamily: 'var(--font-display)',
              }}>
                {savingsRate}%
              </span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${Math.max(0, Math.min(100, savingsRate))}%`,
                background: savingsRate >= 20 ? 'var(--grad-emerald)' : savingsRate >= 0 ? 'var(--grad-amber)' : 'var(--grad-rose)',
                transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'progress-fill 1.2s cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: '0.3s',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}