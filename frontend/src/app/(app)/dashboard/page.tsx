'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { DashboardSummary } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }
  if (!summary) return <p className="text-red-500">Gagal memuat data.</p>;

  const net = summary.total_income - summary.total_expense;

  const cards = [
    { label: 'Total Saldo', value: formatRupiah(summary.total_balance), bg: 'from-indigo-500 to-indigo-600', icon: '💰' },
    { label: 'Pemasukan Bulan Ini', value: formatRupiah(summary.total_income), bg: 'from-emerald-500 to-emerald-600', icon: '⬆️' },
    { label: 'Pengeluaran Bulan Ini', value: formatRupiah(summary.total_expense), bg: 'from-rose-500 to-rose-600', icon: '⬇️' },
    {
      label: 'Tabungan Bersih',
      value: formatRupiah(net),
      bg: net >= 0 ? 'from-teal-500 to-teal-600' : 'from-orange-500 to-orange-600',
      icon: net >= 0 ? '📈' : '📉',
    },
  ];

  const pieData = summary.expense_by_category.map((item, i) => ({
    name: item.category?.name ?? 'Lainnya',
    value: Number(item.total),
    color: item.category?.color ?? PIE_COLORS[i % PIE_COLORS.length],
  }));

  const formatYAxis = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
    return String(v);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.bg} text-white rounded-2xl p-5 shadow-sm`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="text-xs opacity-80 font-medium uppercase tracking-wide">{card.label}</p>
            <p className="text-xl font-bold mt-1 truncate">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart - Monthly Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Tren 6 Bulan Terakhir</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthly_trend} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val) => formatRupiah(Number(val))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Expense by Category */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Pengeluaran per Kategori</h2>
          {pieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-sm">Belum ada data pengeluaran bulan ini</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatRupiah(Number(val))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Transaksi Terbaru</h2>
          <Link href="/transactions" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Lihat semua →
          </Link>
        </div>
        {summary.recent_transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada transaksi.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {summary.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: (tx.category?.color ?? '#6366f1') + '25', color: tx.category?.color ?? '#6366f1' }}
                  >
                    {tx.category?.icon ?? '💳'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{tx.description || tx.category?.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)} · {tx.wallet?.name}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '−'}{formatRupiah(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
