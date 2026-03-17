'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Plus } from 'lucide-react';
import api from '@/lib/api';
import { DashboardSummary } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((r) => setSummary(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />
      ))}
    </div>
  );

  if (!summary) return null;

  const net = summary.total_income - summary.total_expense;
  const formatY = (v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}jt` : v >= 1_000 ? `${(v/1_000).toFixed(0)}rb` : String(v);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Greeting */}
      <div className="animate-fadeup">
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 4 }}>{greeting} 👋</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {user?.name?.split(' ')[0] ?? 'User'}
        </h1>
      </div>

      {/* Hero Balance Card */}
      <div className="animate-fadeup noise" style={{
        animationDelay: '60ms',
        background: 'linear-gradient(135deg, #2a1f6e 0%, #1a1040 40%, var(--bg-elevated) 100%)',
        border: '1px solid rgba(124,111,247,0.3)',
        borderRadius: 24, padding: '28px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'var(--accent-violet)', opacity: 0.1, filter: 'blur(40px)', pointerEvents: 'none' }} />
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Saldo</p>
        <p className="stat-value" style={{ fontSize: 36, color: 'white', marginBottom: 4, letterSpacing: '-0.03em' }}>
          {formatRupiah(summary.total_balance)}
        </p>
        <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <ArrowUpRight size={12} style={{ color: 'var(--accent-emerald)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Pemasukan</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-emerald)' }}>{formatRupiah(summary.total_income)}</p>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <ArrowDownRight size={12} style={{ color: 'var(--accent-rose)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Pengeluaran</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-rose)' }}>{formatRupiah(summary.total_expense)}</p>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <TrendingUp size={12} style={{ color: net >= 0 ? 'var(--accent-amber)' : 'var(--accent-rose)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Tabungan</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: net >= 0 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{formatRupiah(net)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fadeup" style={{ animationDelay: '120ms', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { href: '/transactions', label: 'Tambah Transaksi', icon: <Plus size={18} />, grad: 'var(--grad-violet)' },
          { href: '/wallets', label: 'Dompet', icon: '👛', grad: 'var(--grad-emerald)' },
          { href: '/budgets', label: 'Anggaran', icon: '🎯', grad: 'var(--grad-amber)' },
        ].map(({ href, label, icon, grad }) => (
          <Link key={href} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            padding: '16px 8px', textDecoration: 'none',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: 16, transition: 'all 0.2s',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Area Chart - Trend */}
      <div className="card animate-fadeup" style={{ animationDelay: '160ms', padding: '20px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingInline: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tren 6 Bulan</p>
        </div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.monthly_trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(v) => v.split(' ')[0]} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatY} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatRupiah(Number(v))} />
              <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#34d399" fill="url(#gIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#fb7185" fill="url(#gExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense by Category */}
      {summary.expense_by_category.length > 0 && (
        <div className="card animate-fadeup" style={{ animationDelay: '200ms', padding: '20px 16px 12px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, paddingInline: 8 }}>
            Pengeluaran per Kategori
          </p>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.expense_by_category.map((i) => ({ name: i.category?.name ?? '?', value: Number(i.total), color: i.category?.color ?? '#7c6ff7' }))} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={formatY} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {summary.expense_by_category.map((item, i) => (
                    <Cell key={i} fill={item.category?.color ?? '#7c6ff7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card animate-fadeup" style={{ animationDelay: '240ms', padding: '20px 20px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaksi Terbaru</p>
          <Link href="/transactions" style={{ fontSize: 12, color: 'var(--accent-violet)', textDecoration: 'none', fontWeight: 600 }}>Lihat semua →</Link>
        </div>
        {summary.recent_transactions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>Belum ada transaksi</p>
        ) : (
          <div>
            {summary.recent_transactions.map((tx, i) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: i < summary.recent_transactions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: (tx.category?.color ?? '#7c6ff7') + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                }}>
                  {tx.category?.icon ?? '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || tx.category?.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                    {formatDate(tx.date)} · {tx.wallet?.name}
                  </p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, flexShrink: 0, color: tx.type === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {tx.type === 'income' ? '+' : '−'}{formatRupiah(Number(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}