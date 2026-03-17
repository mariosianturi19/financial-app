'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Sparkles, Target, TrendingUp, Lightbulb } from 'lucide-react';
import api from '@/lib/api';
import { DashboardSummary } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import HeroBalanceCard from '@/components/ui/HeroBalanceCard';

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 260, borderRadius: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 20 }} />)}
      </div>
      <div className="skeleton" style={{ height: 210, borderRadius: 20 }} />
      <div className="skeleton" style={{ height: 280, borderRadius: 20 }} />
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(14,14,23,0.98)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '10px 14px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(20px)', minWidth: 150 }}>
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {entry.name === 'income' ? 'Income' : entry.name === 'expense' ? 'Expenses' : entry.name}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
            {formatRupiah(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{ background: 'rgba(14,14,23,0.98)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '8px 12px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: item.payload.color, flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{item.name}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: 4, letterSpacing: '-0.01em' }}>
        {formatRupiah(item.value)}
      </p>
    </div>
  );
}

const container: any = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
  const item: any = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } };

const formatY = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M`
  : v >= 1_000   ? `${(v / 1_000).toFixed(0)}K`
  : String(v);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary]         = useState<DashboardSummary | null>(null);
  const [loading, setLoading]         = useState(true);
  const [activeDonut, setActiveDonut] = useState<number | null>(null);

  useEffect(() => {
    api.get('/dashboard').then((r) => setSummary(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!summary) return null;

  const donutData = summary.expense_by_category.slice(0, 6).map((e) => ({
    name:  e.category?.name  ?? 'Other',
    value: e.total,
    icon:  e.category?.icon  ?? '📂',
    color: e.category?.color ?? '#7c6ff7',
  }));
  const totalExpensePie = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero Balance Card */}
      <motion.div variants={item}>
        <HeroBalanceCard
          totalBalance={summary.total_balance}
          totalIncome={summary.total_income}
          totalExpense={summary.total_expense}
          monthlyTrend={summary.monthly_trend}
          userName={user?.name ?? 'User'}
        />
      </motion.div>

      {/* Quick stat pills */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Income',   value: formatRupiah(summary.total_income),  icon: '📈', color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.2)',   sub: 'this month' },
          { label: 'Expenses', value: formatRupiah(summary.total_expense), icon: '📉', color: 'var(--accent-rose)',    bg: 'rgba(251,113,133,0.08)',  border: 'rgba(251,113,133,0.2)', sub: 'this month' },
        ].map(({ label, value, icon, color, bg, border, sub }) => (
          <div key={label} style={{ padding: '16px 18px', borderRadius: 18, background: bg, border: `1px solid ${border}`, position: 'relative', overflow: 'hidden' }}>
            <p style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>{icon}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>{sub}</p>
          </div>
        ))}
      </motion.div>

      {/* 6-month trend chart */}
      {summary.monthly_trend.some((m) => m.income > 0 || m.expense > 0) && (
        <motion.div variants={item} className="card" style={{ padding: '20px 6px 12px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', paddingLeft: 18, marginBottom: 16 }}>
            6-Month Trend
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={summary.monthly_trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#fb7185" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} dy={4} tickFormatter={(v: string) => v.slice(0, 3)} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} tickFormatter={formatY} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="income" name="income" stroke="#34d399" strokeWidth={2} fill="url(#gIncome)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#34d399' }} animationDuration={1200} animationEasing="ease-out" />
              <Area type="monotone" dataKey="expense" name="expense" stroke="#fb7185" strokeWidth={2} fill="url(#gExpense)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#fb7185' }} animationDuration={1200} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Expense donut */}
      {donutData.length > 0 && (
        <motion.div variants={item} className="card" style={{ padding: '20px 20px 22px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Expenses by Category
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0 }}>
              <PieChart width={130} height={130}>
                <Pie data={donutData} cx={65} cy={65} innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value" animationBegin={200} animationDuration={900} onMouseEnter={(_, idx) => setActiveDonut(idx)} onMouseLeave={() => setActiveDonut(null)}>
                  {donutData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} opacity={activeDonut === null || activeDonut === idx ? 1 : 0.3} stroke="transparent" style={{ transition: 'opacity 0.2s', cursor: 'default' }} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </div>
            <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {donutData.map((d, idx) => {
                const pct = totalExpensePie > 0 ? Math.round((d.value / totalExpensePie) * 100) : 0;
                return (
                  <div key={idx} onMouseEnter={() => setActiveDonut(idx)} onMouseLeave={() => setActiveDonut(null)} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: activeDonut === null || activeDonut === idx ? 1 : 0.4, transition: 'opacity 0.2s', cursor: 'default' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: d.color + '20', border: `1px solid ${d.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{d.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{d.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 3, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: d.color, width: `${pct}%`, transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent transactions */}
      {summary.recent_transactions.length > 0 && (
        <motion.div variants={item} className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Transactions</p>
            <Link href="/transactions" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ x: 3 }} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--accent-violet)', fontWeight: 600 }}>
                View all <ArrowRight size={12} />
              </motion.div>
            </Link>
          </div>
          <div style={{ paddingBottom: 10 }}>
            {summary.recent_transactions.slice(0, 5).map((tx, i) => {
              const isIncome = tx.type === 'income';
              return (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="tx-row" style={{ margin: '0 10px', borderRadius: 12, padding: '11px 12px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: (tx.category?.color ?? '#7c6ff7') + '20', border: `1px solid ${(tx.category?.color ?? '#7c6ff7')}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                    {tx.category?.icon ?? (isIncome ? '📈' : '📉')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || tx.category?.name || '—'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {formatDate(tx.date)}{tx.wallet ? ` · ${tx.wallet.name}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {isIncome ? <ArrowUpRight size={13} style={{ color: 'var(--accent-emerald)' }} /> : <ArrowDownRight size={13} style={{ color: 'var(--accent-rose)' }} />}
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: isIncome ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {formatRupiah(tx.amount)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick action grid */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { href: '/budgets',   icon: '🎯', label: 'Budgets',   color: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.2)'  },
          { href: '/analytics', icon: '📊', label: 'Analytics', color: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)'  },
          { href: '/insights',  icon: '💡', label: 'Insights',  color: 'rgba(124,111,247,0.1)',  border: 'rgba(124,111,247,0.22)'},
        ].map(({ href, icon, label, color, border }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', damping: 22, stiffness: 350 }} style={{ padding: '16px 14px', background: color, border: `1px solid ${border}`, borderRadius: 16, cursor: 'pointer', textAlign: 'center' }}>
              <span style={{ fontSize: 22, display: 'block', marginBottom: 6 }}>{icon}</span>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* AI promo banner */}
      <motion.div variants={item}>
        <Link href="/insights" style={{ textDecoration: 'none' }}>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(124,111,247,0.12) 0%, rgba(167,139,250,0.08) 100%)', border: '1px solid rgba(124,111,247,0.25)', cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-violet)', flexShrink: 0 }}>
              <Sparkles size={16} style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Smart Insights active</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>View AI-powered recommendations for your finances</p>
            </div>
            <ArrowRight size={15} style={{ color: 'var(--accent-violet)', flexShrink: 0 }} />
          </motion.div>
        </Link>
      </motion.div>

      <div style={{ height: 80 }} />
    </motion.div>
  );
}