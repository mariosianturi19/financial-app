'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { ForecastData } from '@/types';
import { formatRupiah } from '@/lib/utils';

const CONFIDENCE = {
  high:   { label: 'High Confidence',   color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  medium: { label: 'Medium Confidence', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)'  },
  low:    { label: 'Low Confidence',    color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
};
const TREND = {
  up:     { icon: '📈', label: 'Rising',    color: '#34d399' },
  down:   { icon: '📉', label: 'Declining', color: '#fb7185' },
  stable: { icon: '➡️', label: 'Stable',   color: 'var(--text-secondary)' },
};

const formatY = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v);

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,10,18,0.98)', border: '1px solid var(--border-default)', borderRadius: 13, padding: '10px 14px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(20px)', minWidth: 160 }}>
      {label && <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{entry.name}</span>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{formatRupiah(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ForecastSkeleton() {
  return (
    <div className="page-root">
      <div className="skeleton" style={{ height: 50, width: 200, borderRadius: 14 }} />
      <div className="content-grid-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 18 }} />)}</div>
      <div className="skeleton" style={{ height: 280, borderRadius: 20 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
    </div>
  );
}

export default function ForecastPage() {
  const [data, setData]       = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/analytics/forecast').then((r) => setData(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <ForecastSkeleton />;
  if (!data)   return <div className="page-root"><p style={{ color: '#fb7185' }}>Failed to load forecast data.</p></div>;

  const incTrend    = TREND[data.income_trend];
  const expTrend    = TREND[data.expense_trend];
  const burnOverrun = data.projected_month_end_expense > data.current_balance;

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Forecasting</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>Linear regression based on 6 months of data</p>
        </div>
      </div>

      {/* Trend + Metrics row */}
      <div className="content-grid-2" style={{ gap: 12 }}>
        {[
          { title: 'Income Trend',  ...incTrend },
          { title: 'Expense Trend', ...expTrend },
        ].map(({ title, icon, label: tLabel, color }) => (
          <motion.div key={title} whileHover={{ y: -2 }} className="card animate-fadeup" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{title}</p>
              <p style={{ fontSize: 17, fontWeight: 700, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{tLabel}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key metrics row */}
      <div className="content-grid-3" style={{ gap: 12 }}>
        {[
          { label: 'Daily Burn Rate',      value: data.daily_burn_rate,             icon: '🔥', color: '#fb7185' },
          { label: 'Month-end Projection', value: data.projected_month_end_expense, icon: '📅', color: '#fbbf24' },
          { label: 'Current Balance',      value: data.current_balance,             icon: '💰', color: '#34d399' },
        ].map(({ label, value, icon, color }, i) => (
          <div key={i} className="card animate-fadeup" style={{ padding: '20px 22px', animationDelay: `${i * 60}ms` }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 10 }}>{icon}</span>
            <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
            <NumberFlow value={value} format={{ style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }} style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1 }} />
          </div>
        ))}
      </div>

      {/* Burn rate alert */}
      {burnOverrun && (
        <div className="animate-fadeup" style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fb7185', marginBottom: 4 }}>Projected Deficit</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Estimated month-end expenses of <strong style={{ color: '#fb7185' }}>{formatRupiah(data.projected_month_end_expense)}</strong> may exceed your balance of {formatRupiah(data.current_balance)}.
            </p>
          </div>
        </div>
      )}

      {/* Historical + Projected chart */}
      <div className="card animate-fadeup" style={{ padding: '22px 8px 16px' }}>
        <div style={{ paddingLeft: 18, paddingRight: 18, marginBottom: 18 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Historical + Projected</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>Bars = actual months · Dashed lines = projections</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data.chart_data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} dy={4} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatY} width={44} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="income"  name="income"  fill="#34d399" fillOpacity={0.65} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="expense" fill="#fb7185" fillOpacity={0.65} radius={[4, 4, 0, 0]} />
            <Line dataKey="projected_income"  name="Proj. Income"   stroke="#34d399" strokeWidth={2.5} strokeDasharray="5 4" dot={false} animationDuration={900} />
            <Line dataKey="projected_expense" name="Proj. Expenses" stroke="#fb7185" strokeWidth={2.5} strokeDasharray="5 4" dot={false} animationDuration={900} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 3-Month Projection table */}
      <div className="card animate-fadeup" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>3-Month Projection</p>
        </div>
        <div>
          {data.projections.map((proj, i) => {
            const conf = CONFIDENCE[proj.confidence];
            return (
              <div key={i} style={{ padding: '16px 22px', borderBottom: i < data.projections.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 110px' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.01em' }}>{proj.month}</p>
                  <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 99, background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`, fontWeight: 600 }}>
                    {conf.label}
                  </span>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { label: 'Income',   v: proj.projected_income,  c: '#34d399' },
                    { label: 'Expenses', v: proj.projected_expense, c: '#fb7185' },
                    { label: 'Savings',  v: proj.projected_savings, c: proj.projected_savings >= 0 ? 'var(--accent-violet-soft)' : '#fb7185' },
                  ].map(({ label, v, c }) => (
                    <div key={label}>
                      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 700 }}>{label}</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, color: c, letterSpacing: '-0.01em' }}>{formatRupiah(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}