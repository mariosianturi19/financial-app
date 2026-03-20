'use client';

import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import api from '@/lib/api';
import { AdvancedAnalytics } from '@/types';
import { formatRupiah } from '@/lib/utils';

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

const formatY = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v);

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const nameMap: Record<string, string> = { income: 'Income', expense: 'Expenses', savings: 'Savings', rate: 'Rate', net_worth: 'Net Worth', pengeluaran: 'Expenses', avg: 'Avg Spend' };
  return (
    <div style={{ background: 'rgba(10,10,18,0.98)', border: '1px solid var(--border-default)', borderRadius: 13, padding: '10px 14px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(20px)', minWidth: 130 }}>
      {label && <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{nameMap[entry.name] ?? entry.name}</span>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
            {entry.name === 'rate' ? `${entry.value}%` : formatRupiah(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '22px 8px 16px' }}>
      <div style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 18 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="page-root">
      <div className="skeleton" style={{ height: 40, width: 180, borderRadius: 12, marginBottom: 4 }} />
      <div className="content-grid-3">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />)}
      </div>
      <div className="bento-grid">
        <div className="col-12 skeleton" style={{ height: 240, borderRadius: 20 }} />
        <div className="col-6 skeleton" style={{ height: 200, borderRadius: 20 }} />
        <div className="col-6 skeleton" style={{ height: 200, borderRadius: 20 }} />
      </div>
    </div>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } };
const fadeUp: Variants    = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function AnalyticsPage() {
  const [data, setData]       = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/analytics/advanced').then((r) => setData(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <AnalyticsSkeleton />;
  if (!data)   return <div className="page-root"><p style={{ color: '#fb7185' }}>Failed to load analytics.</p></div>;

  const savingsData = data.monthly_data.map((m) => ({ month: m.month.split(' ')[0], savings: m.savings, rate: m.savings_rate }));
  const radarData   = (data.by_day_of_week ?? []).map((d) => ({ day: DAY_SHORT[d.day] ?? d.day, pengeluaran: d.avg }));

  const kpis = [
    { label: 'Avg Monthly Income',   value: data.avg_monthly_income,  format: 'currency', gradient: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.2)',  color: '#34d399', icon: '📈', raw: false },
    { label: 'Avg Monthly Expenses', value: data.avg_monthly_expense, format: 'currency', gradient: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.2)', color: '#fb7185', icon: '📉', raw: false },
    { label: 'Avg Savings Rate',     value: data.avg_savings_rate,    format: 'percent',  gradient: 'rgba(124,111,247,0.12)', border: 'rgba(124,111,247,0.2)', color: 'var(--accent-violet-soft)', icon: '💰', raw: true },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="page-root">
      {/* Header */}
      <motion.div variants={fadeUp} className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>Last 12 months of financial data</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeUp} className="content-grid-3">
        {kpis.map(({ label, value, format, gradient, border, color, icon, raw }) => (
          <div key={label} className="card" style={{ padding: '22px 22px', background: gradient, borderColor: border, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: border, filter: 'blur(24px)', pointerEvents: 'none' }} />
            <span style={{ fontSize: 26, display: 'block', marginBottom: 10 }}>{icon}</span>
            <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
            {raw
              ? <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}%</div>
              : <NumberFlow value={value as number} format={{ style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }} style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }} />
            }
          </div>
        ))}
      </motion.div>

      {/* Income vs Expenses — full width */}
      <motion.div variants={fadeUp}>
        <ChartCard title="Income vs Expenses" subtitle="Monthly comparison over 12 months">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.monthly_data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="aI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.22}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                <linearGradient id="aE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.22}/><stop offset="95%" stopColor="#fb7185" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} dy={4} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatY} width={44} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="income"  name="income"  stroke="#34d399" strokeWidth={2.5} fill="url(#aI)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1200} />
              <Area type="monotone" dataKey="expense" name="expense" stroke="#fb7185" strokeWidth={2.5} fill="url(#aE)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Savings Rate + Net Worth side by side */}
      <motion.div variants={fadeUp} className="content-grid-2">
        <ChartCard title="Savings Rate" subtitle="Monthly %">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={savingsData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="rate" name="rate" fill="#7c6ff7" opacity={0.85} radius={[5, 5, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Net Worth History" subtitle="Estimated over 12 months">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.net_worth_history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatY} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="net_worth" name="net_worth" stroke="#34d399" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Top categories + Day of week side by side */}
      <motion.div variants={fadeUp} className="content-grid-2">
        {data.top_categories.length > 0 && (
          <div className="card" style={{ padding: '22px 22px 24px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, letterSpacing: '-0.02em' }}>Top Spending Categories</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.top_categories.slice(0, 5).map((tc, i) => {
                const max = data.top_categories[0]?.total ?? 1;
                const pct = Math.round((tc.total / max) * 100);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: (tc.category?.color ?? '#7c6ff7') + '20', border: `1px solid ${(tc.category?.color ?? '#7c6ff7')}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                      {tc.category?.icon ?? '📂'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tc.category?.name ?? '—'}</p>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', flexShrink: 0, marginLeft: 8 }}>{formatRupiah(tc.total)}</p>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.08 }} style={{ height: '100%', borderRadius: 99, background: tc.category?.color ?? 'var(--accent-violet)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {radarData.length > 0 && (
          <ChartCard title="Avg Spend by Day" subtitle="This quarter">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={radarData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatY} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="pengeluaran" name="pengeluaran" fill="#fb7185" opacity={0.8} radius={[5, 5, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </motion.div>
    </motion.div>
  );
}