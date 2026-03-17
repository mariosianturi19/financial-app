'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AdvancedAnalytics } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const DAY_SHORT: Record<string, string> = {
  Monday: 'Sen', Tuesday: 'Sel', Wednesday: 'Rab', Thursday: 'Kam',
  Friday: 'Jum', Saturday: 'Sab', Sunday: 'Min',
};

export default function AnalyticsPage() {
  const [data, setData]     = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/advanced').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  if (!data) return <p className="text-red-500">Gagal memuat data analitik.</p>;

  const formatY = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}rb`;
    return String(v);
  };

  const savingsRateData = data.monthly_data.map((m) => ({
    month: m.month.split(' ')[0],
    'Saving Rate (%)': m.savings_rate,
  }));

  const radarData = (data.by_day_of_week ?? []).map((d) => ({
    day: DAY_SHORT[d.day] ?? d.day,
    amount: d.avg,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Advanced Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Data 12 bulan terakhir</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Rata-rata Pemasukan', value: formatRupiah(data.avg_monthly_income), icon: '⬆️', color: 'from-emerald-500 to-emerald-600' },
          { label: 'Rata-rata Pengeluaran', value: formatRupiah(data.avg_monthly_expense), icon: '⬇️', color: 'from-rose-500 to-rose-600' },
          { label: 'Rata-rata Saving Rate', value: `${data.avg_savings_rate}%`, icon: '💰', color: data.avg_savings_rate >= 20 ? 'from-indigo-500 to-indigo-600' : 'from-amber-500 to-amber-600' },
        ].map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-5`}>
            <span className="text-2xl">{card.icon}</span>
            <p className="text-xs opacity-80 mt-2 uppercase tracking-wide font-medium">{card.label}</p>
            <p className="text-xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Net Worth Trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">📈 Tren Net Worth</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.net_worth_history} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis tickFormatter={formatY} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatRupiah(Number(v))} />
              <Line type="monotone" dataKey="net_worth" name="Net Worth" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Income vs Expense + Savings Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">💰 Pemasukan vs Pengeluaran (12 Bulan)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(' ')[0]} />
                <YAxis tickFormatter={formatY} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">📊 Saving Rate (%)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsRateData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <ReferenceLine y={20} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 20%', position: 'insideTopRight', fontSize: 10, fill: '#10b981' }} />
                <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Saving Rate (%)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Categories + Spend by Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Categories */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">🏆 Top Pengeluaran (3 Bulan)</h2>
          {data.top_categories.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {data.top_categories.map((item, i) => {
                const maxTotal = data.top_categories[0].total;
                const pct      = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                const colors   = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.category?.icon ?? '📂'}</span>
                        <span className="text-sm font-medium text-gray-700">{item.category?.name ?? 'Lainnya'}</span>
                        <span className="text-xs text-gray-400">{item.count}x</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-800">{formatRupiah(item.total)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: colors[i] ?? '#6366f1' }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Rata-rata {formatRupiah(item.avg_per_tx)}/transaksi</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spend by Day of Week */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">📅 Pola Pengeluaran per Hari</h2>
          {radarData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada data</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <Radar name="Rata-rata" dataKey="amount" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Savings Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">💹 Tabungan Bersih per Bulan</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly_data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis tickFormatter={formatY} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatRupiah(Number(v))} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="savings" name="Tabungan Bersih" radius={[4, 4, 0, 0]}>
                {data.monthly_data.map((entry, i) => (
                  <Cell key={i} fill={entry.savings >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}