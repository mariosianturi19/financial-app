'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Sparkles, Wallet, TrendingUp } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import api from '@/lib/api';
import { DashboardSummary } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import HeroBalanceCard from '@/components/ui/HeroBalanceCard';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
const formatY = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
  : String(v);

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } } } as any;
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: 'easeOut' } } } as any;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,10,18,0.97)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '10px 14px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(20px)', minWidth: 160 }}>
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: i < payload.length - 1 ? 5 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: entry.color }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {entry.name === 'income' ? 'Income' : 'Expenses'}
            </span>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{ background: 'rgba(10,10,18,0.97)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '8px 12px', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: item.payload.color }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{item.name}</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: 4, letterSpacing: '-0.02em' }}>
        {formatCurrency(item.value)}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page-root">
      <div className="bento-grid">
        <div className="col-12 skeleton" style={{ height: 220, borderRadius: 24 }} />
        <div className="col-7 skeleton" style={{ height: 300, borderRadius: 20 }} />
        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
        </div>
        <div className="col-6 skeleton" style={{ height: 220, borderRadius: 20 }} />
        <div className="col-6 skeleton" style={{ height: 220, borderRadius: 20 }} />
      </div>
    </div>
  );
}

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
    color: e.category?.color ?? '#0ea5e9',
  }));
  const totalExpensePie = donutData.reduce((s, d) => s + d.value, 0);
  const netSavings = summary.total_income - summary.total_expense;
  const savingsRate = summary.total_income > 0 ? Math.round((netSavings / summary.total_income) * 100) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="page-root">

      {/* ── Row 1: Hero Balance Card (full width) ── */}
      <motion.div variants={fadeUp} className="col-12">
        <HeroBalanceCard
          totalBalance={summary.total_balance}
          totalIncome={summary.total_income}
          totalExpense={summary.total_expense}
          monthlyTrend={summary.monthly_trend}
          userName={user?.name ?? 'User'}
        />
      </motion.div>

      {/* ── Row 2: Bento grid ── */}
      <div className="bento-grid">

        {/* Left: 6-month trend chart */}
        <motion.div variants={fadeUp} className="col-7 card" style={{ padding: '24px 8px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 16, marginBottom: 20 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>6-Month Trend</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>Income vs expenses over time</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[{ color: '#34d399', label: 'Income' }, { color: '#fb7185', label: 'Expense' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={summary.monthly_trend} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#fb7185" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} dy={6} tickFormatter={(v: string) => v.slice(0, 3)} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} tickFormatter={formatY} width={44} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="income" name="income" stroke="#34d399" strokeWidth={2.5} fill="url(#gIncome)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#34d399' }} animationDuration={1200} />
              <Area type="monotone" dataKey="expense" name="expense" stroke="#fb7185" strokeWidth={2.5} fill="url(#gExpense)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#fb7185' }} animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Right: Stats stack */}
        <motion.div variants={fadeUp} className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Income */}
          <div className="card" style={{ padding: '20px 22px', background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(52,211,153,0.04) 100%)', borderColor: 'rgba(52,211,153,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={16} style={{ color: '#34d399' }} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Income</span>
            </div>
            <NumberFlow value={summary.total_income} format={{ style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }} style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em', lineHeight: 1 }} />
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>this month</p>
          </div>

          {/* Expense */}
          <div className="card" style={{ padding: '20px 22px', background: 'linear-gradient(135deg, rgba(251,113,133,0.1) 0%, rgba(251,113,133,0.04) 100%)', borderColor: 'rgba(251,113,133,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(251,113,133,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownRight size={16} style={{ color: '#fb7185' }} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expenses</span>
            </div>
            <NumberFlow value={summary.total_expense} format={{ style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }} style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#fb7185', letterSpacing: '-0.03em', lineHeight: 1 }} />
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>this month</p>
          </div>

          {/* Savings rate */}
          <div className="card" style={{ padding: '20px 22px', background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(14,165,233,0.04) 100%)', borderColor: 'rgba(14,165,233,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={15} style={{ color: 'var(--accent-cyan-soft)' }} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent-cyan-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Savings Rate</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: savingsRate >= 0 ? 'var(--accent-cyan-soft)' : '#f43f5e', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {savingsRate}%
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>
              {netSavings >= 0 ? `${formatCurrency(netSavings)} saved` : `${formatCurrency(Math.abs(netSavings))} deficit`}
            </p>
          </div>
        </motion.div>

        {/* Bottom Left: Expense by category donut */}
        {donutData.length > 0 && (
          <motion.div variants={fadeUp} className="col-6 card" style={{ padding: '24px 24px 26px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, letterSpacing: '-0.02em' }}>Expenses by Category</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <PieChart width={160} height={160}>
                  <Pie data={donutData} cx={80} cy={80} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" animationBegin={200} animationDuration={900} onMouseEnter={(_, idx) => setActiveDonut(idx)} onMouseLeave={() => setActiveDonut(null)}>
                    {donutData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} opacity={activeDonut === null || activeDonut === idx ? 1 : 0.3} stroke="transparent" style={{ transition: 'opacity 0.2s', cursor: 'default' }} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </div>
              <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {donutData.map((d, idx) => {
                  const pct = totalExpensePie > 0 ? Math.round((d.value / totalExpensePie) * 100) : 0;
                  return (
                    <div key={idx} onMouseEnter={() => setActiveDonut(idx)} onMouseLeave={() => setActiveDonut(null)} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: activeDonut === null || activeDonut === idx ? 1 : 0.4, transition: 'opacity 0.2s', cursor: 'default' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: d.color + '20', border: `1px solid ${d.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{d.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{d.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700, flexShrink: 0 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden' }}>
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

        {/* Bottom Right: Recent transactions */}
        {summary.recent_transactions.length > 0 && (
          <motion.div variants={fadeUp} className={donutData.length > 0 ? 'col-6 card' : 'col-12 card'} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 22px 14px' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Recent Transactions</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>Last 5 activities</p>
              </div>
              <Link href="/transactions" style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ x: 3 }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  View all <ArrowRight size={13} />
                </motion.div>
              </Link>
            </div>
            <div style={{ paddingBottom: 12 }}>
              {summary.recent_transactions.slice(0, 5).map((tx, i) => {
                const isIncome = tx.type === 'income';
                return (
                  <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }} className="tx-row" style={{ margin: '0 12px', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: (tx.category?.color ?? '#0ea5e9') + '20', border: `1px solid ${(tx.category?.color ?? '#0ea5e9')}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      {isIncome ? <ArrowUpRight size={13} style={{ color: '#34d399' }} /> : <ArrowDownRight size={13} style={{ color: '#fb7185' }} />}
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: isIncome ? '#34d399' : '#fb7185' }}>
                        {formatCurrency(Number(tx.amount))}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div variants={fadeUp} className="col-12">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { href: '/wallets',   icon: '💳', label: 'Wallets',   color: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.2)',  text: 'var(--accent-cyan-soft)' },
              { href: '/budgets',   icon: '🎯', label: 'Budgets',   color: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  text: 'var(--accent-amber)' },
              { href: '/analytics', icon: '📊', label: 'Analytics', color: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.2)',  text: 'var(--accent-teal)' },
              { href: '/insights',  icon: '💡', label: 'Insights',  color: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  text: 'var(--accent-emerald-soft)' },
            ].map(({ href, icon, label, color, border, text }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', damping: 20, stiffness: 400 }} style={{ padding: '18px 16px', background: color, border: `1px solid ${border}`, borderRadius: 18, cursor: 'pointer', textAlign: 'center' }}>
                  <span style={{ fontSize: 26, display: 'block', marginBottom: 8 }}>{icon}</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: text }}>{label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* AI Banner */}
        <motion.div variants={fadeUp} className="col-12">
          <Link href="/insights" style={{ textDecoration: 'none' }}>
            <motion.div whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.99 }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(20,184,166,0.06) 100%)', border: '1px solid rgba(14,165,233,0.25)', cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--grad-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-teal)', flexShrink: 0 }}>
                <Sparkles size={20} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, letterSpacing: '-0.01em' }}>Smart Insights active</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>View AI-powered financial recommendations tailored to your data</p>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            </motion.div>
          </Link>
        </motion.div>

      </div>
    </motion.div>
  );
}