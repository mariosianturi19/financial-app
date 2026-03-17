'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import api from '@/lib/api';
import { AdvancedAnalytics } from '@/types';
import { formatRupiah } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; }) {
  if (!active || !payload?.length) return null;
  const nameMap: Record<string, string> = { income: 'Income', expense: 'Expenses', savings: 'Savings', rate: 'Rate', net_worth: 'Net Worth', pengeluaran: 'Expenses', avg: 'Avg Spend' };
  return (
    <div style={{ background: 'rgba(14,14,23,0.98)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(16px)', minWidth: 130 }}>
      {label && <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{nameMap[entry.name] ?? entry.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {entry.name === 'rate' ? `${entry.value}%` : formatRupiah(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const formatY = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v);

export default function AnalyticsPage() {
  const [data, setData]       = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/advanced').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 60, borderRadius: 16, maxWidth: 300 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}</div>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 20 }} />)}
    </div>
  );

  if (!data) return <p style={{ color: 'var(--accent-rose)' }}>Failed to load data.</p>;

  const savingsData = data.monthly_data.map((m) => ({ month: m.month.split(' ')[0], savings: m.savings, rate: m.savings_rate }));
  const radarData   = (data.by_day_of_week ?? []).map((d) => ({ day: DAY_SHORT[d.day] ?? d.day, pengeluaran: d.avg }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Analytics" subtitle="Last 12 months" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Avg Income',   value: formatRupiah(data.avg_monthly_income),  gradient: 'var(--grad-emerald)', glow: 'rgba(52,211,153,0.2)',   icon: '📈' },
          { label: 'Avg Expenses', value: formatRupiah(data.avg_monthly_expense), gradient: 'var(--grad-rose)',    glow: 'rgba(251,113,133,0.2)', icon: '📉' },
          { label: 'Avg Savings Rate', value: `${data.avg_savings_rate}%`,        gradient: data.avg_savings_rate >= 20 ? 'var(--grad-emerald)' : data.avg_savings_rate >= 0 ? 'var(--grad-amber)' : 'var(--grad-rose)', glow: 'rgba(251,191,36,0.2)', icon: '💰' },
        ].map(({ label, value, gradient, glow, icon }) => (
          <div key={label} className="card animate-fadeup" style={{ padding: '16px 14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: glow, filter: 'blur(20px)', pointerEvents: 'none' }} />
            <p style={{ fontSize: 20, marginBottom: 8 }}>{icon}</p>
            <p style={{ fontSize: 9.5, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Income vs Expenses */}
      <div className="card animate-fadeup stagger-2" style={{ padding: '20px 10px 14px' }}>
        <div style={{ paddingLeft: 10 }}><SectionTitle title="Income vs Expenses" subtitle="Monthly comparison" /></div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data.monthly_data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.18}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
              <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.18}/><stop offset="95%" stopColor="#fb7185" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatY} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="income"  name="income"  stroke="#34d399" strokeWidth={2} fill="url(#gI)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={1000} />
            <Area type="monotone" dataKey="expense" name="expense" stroke="#fb7185" strokeWidth={2} fill="url(#gE)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={1000} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Rate + Net Worth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card animate-fadeup stagger-3" style={{ padding: '20px 10px 14px' }}>
          <div style={{ paddingLeft: 8 }}><SectionTitle title="Savings Rate" subtitle="%" /></div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={savingsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="rate" name="rate" fill="#7c6ff7" opacity={0.85} radius={[4, 4, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card animate-fadeup stagger-3" style={{ padding: '20px 10px 14px' }}>
          <div style={{ paddingLeft: 8 }}><SectionTitle title="Net Worth" subtitle="Estimated history" /></div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data.net_worth_history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={formatY} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="net_worth" name="net_worth" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Categories */}
      {data.top_categories.length > 0 && (
        <div className="card animate-fadeup stagger-4" style={{ padding: '20px' }}>
          <SectionTitle title="Top Categories (3 mo)" subtitle="Highest spending" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.top_categories.map((tc, i) => {
              const max = data.top_categories[0]?.total ?? 1;
              const pct = Math.round((tc.total / max) * 100);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: (tc.category?.color ?? '#7c6ff7') + '20', border: `1px solid ${(tc.category?.color ?? '#7c6ff7')}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {tc.category?.icon ?? '📂'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tc.category?.name ?? '—'}</p>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{formatRupiah(tc.total)}</p>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: tc.category?.color ?? 'var(--accent-violet)', width: `${pct}%`, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Avg Spend by Day */}
      {radarData.length > 0 && (
        <div className="card animate-fadeup stagger-5" style={{ padding: '20px 10px 14px' }}>
          <div style={{ paddingLeft: 8 }}><SectionTitle title="Avg Spend by Day" subtitle="This quarter" /></div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={radarData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatY} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="pengeluaran" name="pengeluaran" fill="#fb7185" opacity={0.8} radius={[5, 5, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}