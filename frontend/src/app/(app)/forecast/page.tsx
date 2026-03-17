'use client';

import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { ForecastData } from '@/types';
import { formatRupiah } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';

const CONFIDENCE = {
  high:   { label: 'High',   color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  medium: { label: 'Medium', color: 'var(--accent-amber)',   bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)'  },
  low:    { label: 'Low',    color: 'var(--accent-rose)',    bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
};

const TREND = {
  up:     { icon: '📈', label: 'Rising',    color: 'var(--accent-emerald)' },
  down:   { icon: '📉', label: 'Declining', color: 'var(--accent-rose)'   },
  stable: { icon: '➡️', label: 'Stable',   color: 'var(--text-secondary)' },
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; }) {
  if (!active || !payload?.length) return null;
  const nameMap: Record<string, string> = {
    income: 'Income', expense: 'Expenses',
    'Proj. Income': 'Proj. Income', 'Proj. Expenses': 'Proj. Expenses',
  };
  return (
    <div style={{ background: 'rgba(14,14,23,0.98)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(16px)', minWidth: 160 }}>
      {label && <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{nameMap[entry.name] ?? entry.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {formatRupiah(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const formatY = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `${(v / 1_000).toFixed(0)}K`
  : String(v);

export default function ForecastPage() {
  const [data, setData]       = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/forecast').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 60, borderRadius: 16, maxWidth: 300 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
      </div>
      <div className="skeleton" style={{ height: 260, borderRadius: 20 }} />
    </div>
  );

  if (!data) return <p style={{ color: 'var(--accent-rose)' }}>Failed to load forecast data.</p>;

  const incTrend    = TREND[data.income_trend];
  const expTrend    = TREND[data.expense_trend];
  const burnOverrun = data.projected_month_end_expense > data.current_balance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Forecasting" subtitle="Linear regression forecast based on 6 months of data" />

      {/* Trend indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { title: 'Income Trend',  ...incTrend },
          { title: 'Expense Trend', ...expTrend },
        ].map(({ title, icon, label: tLabel, color }) => (
          <div key={title} className="card animate-fadeup" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <div>
              <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{title}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{tLabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Burn rate alert */}
      {burnOverrun && (
        <div className="animate-fadeup" style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-rose)', marginBottom: 2 }}>Projected Deficit</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Estimated month-end expenses of <strong style={{ color: 'var(--accent-rose)' }}>{formatRupiah(data.projected_month_end_expense)}</strong> may exceed your current balance of {formatRupiah(data.current_balance)}.
            </p>
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'Daily Burn Rate',      value: formatRupiah(data.daily_burn_rate),              icon: '🔥' },
          { label: 'Month-end Projection', value: formatRupiah(data.projected_month_end_expense),  icon: '📅' },
          { label: 'Current Balance',      value: formatRupiah(data.current_balance),              icon: '💰' },
        ].map(({ label, value, icon }, i) => (
          <div key={i} className="card animate-fadeup" style={{ padding: '14px 16px', animationDelay: `${i * 60}ms` }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>{icon}</p>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Historical + Projected chart */}
      <div className="card animate-fadeup stagger-3" style={{ padding: '20px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Historical + Projected</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Bars = actual, Lines = projected</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data.chart_data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatY} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="income"  name="income"  fill="#34d399" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name="expense" fill="#fb7185" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
            <Line dataKey="projected_income"  name="Proj. Income"   stroke="#34d399" strokeWidth={2} strokeDasharray="4 3" dot={false} />
            <Line dataKey="projected_expense" name="Proj. Expenses" stroke="#fb7185" strokeWidth={2} strokeDasharray="4 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 3-Month Projection table */}
      <div className="card animate-fadeup stagger-4" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>3-Month Projection</p>
        </div>
        {data.projections.map((proj, i) => {
          const conf = CONFIDENCE[proj.confidence];
          return (
            <div key={i} className="animate-fadeup" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, animationDelay: `${i * 80}ms` }}>
              <div style={{ flex: '0 0 80px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{proj.month}</p>
                <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 99, background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`, fontWeight: 600 }}>
                  {conf.label}
                </span>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[
                  { label: 'Income',   v: proj.projected_income,  c: 'var(--accent-emerald)' },
                  { label: 'Expenses', v: proj.projected_expense, c: 'var(--accent-rose)'    },
                  { label: 'Savings',  v: proj.projected_savings, c: proj.projected_savings >= 0 ? 'var(--accent-violet)' : 'var(--accent-rose)' },
                ].map(({ label, v, c }) => (
                  <div key={label}>
                    <p style={{ fontSize: 9.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 700, color: c, letterSpacing: '-0.01em' }}>{formatRupiah(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}