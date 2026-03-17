'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Plus, ArrowRight, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { DashboardSummary } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/ui/StatCard';

/* ─── Skeleton ──────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="skeleton" style={{ height: 60, borderRadius: 16, maxWidth: 280 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
      <div className="skeleton" style={{ height: 260, borderRadius: 20 }} />
    </div>
  );
}

/* ─── Custom Tooltip ────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(20,20,30,0.96)',
      border: '1px solid var(--border-default)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: 'var(--shadow-lg)',
      backdropFilter: 'blur(16px)',
      minWidth: 140,
    }}>
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {entry.name === 'income' ? 'Pemasukan' : entry.name === 'expense' ? 'Pengeluaran' : entry.name}
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

/* ─── Stagger container ─────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const staggerItem: any = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Main Component ────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((r) => setSummary(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!summary) return null;

  const net      = summary.total_income - summary.total_expense;
  const netPos   = net >= 0;
  const hour     = new Date().getHours();
  const greeting = hour < 5 ? 'Selamat malam' : hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam';
  const firstName = user?.name?.split(' ')[0] ?? 'Pengguna';

  const formatY = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt`
    : v >= 1_000  ? `${(v / 1_000).toFixed(0)}rb`
    : String(v);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* ── Greeting ── */}
      <motion.div variants={staggerItem}>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 4 }}>
          {greeting} 👋
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}>
            {firstName}
          </h1>
          <Link href="/transactions" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} strokeWidth={2.5} /> Transaksi
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* ── Net Balance Hero Card ── */}
      <motion.div
        variants={staggerItem}
        className="card noise"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #13131f 0%, #181828 100%)',
          border: '1px solid var(--border-accent)',
          boxShadow: '0 0 0 1px rgba(124,111,247,0.08), var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mesh gradient background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--grad-mesh)',
          opacity: 0.7,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>Saldo Bersih Bulan Ini</p>
          <motion.p
            className="stat-value"
            style={{
              fontSize: 32,
              color: netPos ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              lineHeight: 1,
              marginBottom: 6,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {netPos ? '+' : ''}{formatRupiah(net)}
          </motion.p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11.5, color: 'var(--text-tertiary)',
              }}
            >
              <Sparkles size={11} style={{ color: 'var(--accent-violet)' }} />
              {netPos ? 'Keuangan sehat bulan ini' : 'Pengeluaran melebihi pemasukan'}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 Stat Cards ── */}
      <motion.div
        variants={staggerItem}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        <StatCard
          label="Total Saldo"
          value={formatRupiah(summary.total_balance)}
          icon="💰"
          gradient="var(--grad-violet)"
          delay={0.1}
        />
        <StatCard
          label="Pemasukan"
          value={formatRupiah(summary.total_income)}
          icon="📈"
          gradient="var(--grad-emerald)"
          delay={0.15}
        />
        <StatCard
          label="Pengeluaran"
          value={formatRupiah(summary.total_expense)}
          icon="📉"
          gradient="var(--grad-rose)"
          delay={0.2}
        />
        <StatCard
          label="Kategori Aktif"
          value={String(summary.expense_by_category.length)}
          sub="kategori pengeluaran"
          icon="🏷️"
          gradient="var(--grad-amber)"
          delay={0.25}
        />
      </motion.div>

      {/* ── Monthly Trend Chart ── */}
      {summary.monthly_trend.length > 0 && (
        <motion.div variants={staggerItem} className="card" style={{ padding: '20px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 16,
            paddingLeft: 6,
          }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Tren Bulanan
              </p>
              <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>6 bulan terakhir</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Masuk', color: 'var(--accent-emerald)' },
                { label: 'Keluar', color: 'var(--accent-rose)' },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={summary.monthly_trend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                axisLine={false} tickLine={false} dy={4}
                tickFormatter={(v) => v.slice(0, 3)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                axisLine={false} tickLine={false} tickFormatter={formatY}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2}
                fill="url(#gIncome)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#34d399' }}
                animationDuration={1000} animationEasing="ease-out"
              />
              <Area
                type="monotone" dataKey="expense" stroke="#fb7185" strokeWidth={2}
                fill="url(#gExpense)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#fb7185' }}
                animationDuration={1000} animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Expense by Category ── */}
      {summary.expense_by_category.length > 0 && (
        <motion.div variants={staggerItem} className="card" style={{ padding: '20px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 16, paddingLeft: 6,
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Pengeluaran per Kategori
            </p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={summary.expense_by_category.slice(0, 6)}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c6ff7" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="category.name"
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                axisLine={false} tickLine={false} dy={4}
                tickFormatter={(v: string) => v.length > 6 ? v.slice(0, 6) + '…' : v}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                axisLine={false} tickLine={false} tickFormatter={formatY}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="total" fill="url(#gBar)" radius={[6, 6, 0, 0]}
                animationDuration={900} animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Recent Transactions ── */}
      {summary.recent_transactions.length > 0 && (
        <motion.div variants={staggerItem} className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 18px 12px',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Transaksi Terbaru
            </p>
            <Link href="/transactions" style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 3 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 12, color: 'var(--accent-violet)',
                  fontWeight: 500,
                }}
              >
                Lihat semua <ArrowRight size={12} />
              </motion.div>
            </Link>
          </div>

          <div style={{ paddingBottom: 8 }}>
            {summary.recent_transactions.slice(0, 5).map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="tx-row"
                style={{ margin: '0 8px', borderRadius: 12 }}
              >
                {/* Icon */}
                <div className="icon-box" style={{
                  width: 40, height: 40,
                  background: (tx.category?.color ?? '#7c6ff7') + '20',
                  borderRadius: 12,
                  fontSize: 17,
                }}>
                  {tx.category?.icon ?? (tx.type === 'income' ? '📈' : '📉')}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {tx.description || tx.category?.name || '—'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {formatDate(tx.date)} · {tx.wallet?.name ?? ''}
                  </p>
                </div>

                {/* Amount */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {tx.type === 'income'
                    ? <ArrowUpRight size={14} style={{ color: 'var(--accent-emerald)' }} />
                    : <ArrowDownRight size={14} style={{ color: 'var(--accent-rose)' }} />
                  }
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    color: tx.type === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  }}>
                    {formatRupiah(tx.amount)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Quick Actions ── */}
      <motion.div variants={staggerItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { href: '/budgets',   icon: '🎯', label: 'Anggaran', sub: 'Kelola limit bulanan', color: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.2)' },
          { href: '/goals',     icon: '🏆', label: 'Target', sub: 'Capai tujuan keuangan', color: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
          { href: '/analytics', icon: '📊', label: 'Analytics', sub: 'Insight mendalam', color: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
          { href: '/insights',  icon: '💡', label: 'Insights', sub: 'Rekomendasi AI', color: 'rgba(124,111,247,0.12)', border: 'rgba(124,111,247,0.25)' },
        ].map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', damping: 22, stiffness: 350 }}
              style={{
                padding: '16px',
                background: item.color,
                border: `1px solid ${item.border}`,
                borderRadius: 16,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22, display: 'block', marginBottom: 8 }}>{item.icon}</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {item.label}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.sub}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* bottom spacing */}
      <div style={{ height: 8 }} />
    </motion.div>
  );
}