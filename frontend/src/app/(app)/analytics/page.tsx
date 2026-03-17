// ═══════════════════════════════════════════════
// analytics/page.tsx
// ═══════════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AdvancedAnalytics, InsightsData, InsightType, ForecastData } from '@/types';
import { formatRupiah } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const DAY_SHORT: Record<string, string> = {
  Monday: 'Sen', Tuesday: 'Sel', Wednesday: 'Rab', Thursday: 'Kam',
  Friday: 'Jum', Saturday: 'Sab', Sunday: 'Min',
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(20,20,30,0.96)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(16px)', minWidth: 140 }}>
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: e.color }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              {e.name === 'income' ? 'Pemasukan' : e.name === 'expense' ? 'Pengeluaran' : e.name === 'savings' ? 'Tabungan' : e.name}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {typeof e.value === 'number' && e.value > 1000 ? formatRupiah(e.value) : e.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/analytics/advanced').then((r) => setData(r.data)).finally(() => setLoading(false)); }, []);

  const formatY = (v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${(v/1_000).toFixed(0)}rb` : String(v);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 60, borderRadius: 16, maxWidth: 300 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 20 }} />)}
    </div>
  );

  if (!data) return <p style={{ color: 'var(--accent-rose)' }}>Gagal memuat data.</p>;

  const savingsData = data.monthly_data.map((m) => ({ month: m.month.split(' ')[0], savings: m.savings, rate: m.savings_rate }));
  const radarData   = (data.by_day_of_week ?? []).map((d) => ({ day: DAY_SHORT[d.day] ?? d.day, pengeluaran: d.avg }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Analytics" subtitle="Data 12 bulan terakhir" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Avg Pemasukan', value: formatRupiah(data.avg_monthly_income), gradient: 'var(--grad-emerald)', glow: 'rgba(52,211,153,0.2)', icon: '📈' },
          { label: 'Avg Pengeluaran', value: formatRupiah(data.avg_monthly_expense), gradient: 'var(--grad-rose)', glow: 'rgba(251,113,133,0.2)', icon: '📉' },
          { label: 'Avg Saving Rate', value: `${data.avg_savings_rate}%`, gradient: data.avg_savings_rate >= 20 ? 'var(--grad-emerald)' : 'var(--grad-amber)', glow: 'rgba(251,191,36,0.2)', icon: '💰' },
        ].map(({ label, value, gradient, glow, icon }, i) => (
          <div key={i} className="card noise animate-fadeup" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden', animationDelay: `${i * 60}ms` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: gradient }} />
            <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: glow, filter: 'blur(20px)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly income/expense trend */}
      <div className="card animate-fadeup stagger-2" style={{ padding: '20px 16px' }}>
        <SectionTitle title="Tren Pemasukan & Pengeluaran" subtitle="12 bulan terakhir" />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.monthly_data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.18}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
              <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.18}/><stop offset="95%" stopColor="#fb7185" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatY} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="income" name="income" stroke="#34d399" strokeWidth={2} fill="url(#gI)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={1000} />
            <Area type="monotone" dataKey="expense" name="expense" stroke="#fb7185" strokeWidth={2} fill="url(#gE)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={1000} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Savings + Net worth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card animate-fadeup stagger-3" style={{ padding: '20px 16px' }}>
          <SectionTitle title="Saving Rate" subtitle="%" />
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={savingsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="rate" name="Rate (%)" fill="#7c6ff7" radius={[4,4,0,0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {radarData.length > 0 && (
          <div className="card animate-fadeup stagger-4" style={{ padding: '20px 16px' }}>
            <SectionTitle title="Pola Harian" subtitle="Avg pengeluaran/hari" />
            <ResponsiveContainer width="100%" height={140}>
              <RadarChart data={radarData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                <Radar name="Pengeluaran" dataKey="pengeluaran" stroke="#7c6ff7" fill="#7c6ff7" fillOpacity={0.15} animationDuration={800} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top categories */}
      {data.top_categories.length > 0 && (
        <div className="card animate-fadeup stagger-5" style={{ padding: '20px 20px' }}>
          <SectionTitle title="Top Kategori Pengeluaran" subtitle="3 bulan terakhir" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.top_categories.map((tc, i) => {
              const max = data.top_categories[0].total;
              const pct = max > 0 ? (tc.total / max) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: (tc.category?.color ?? '#7c6ff7') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {tc.category?.icon ?? '📂'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{tc.category?.name ?? '—'}</p>
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
    </div>
  );
}