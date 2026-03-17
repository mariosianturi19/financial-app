'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ForecastData } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const CONFIDENCE_CONFIG = {
  high:   { label: 'Tinggi',   color: 'text-emerald-600', bg: 'bg-emerald-100' },
  medium: { label: 'Sedang',   color: 'text-amber-600',   bg: 'bg-amber-100' },
  low:    { label: 'Rendah',   color: 'text-red-600',     bg: 'bg-red-100' },
};

const TREND_CONFIG = {
  up:     { icon: '📈', label: 'Naik',   color: 'text-emerald-600' },
  down:   { icon: '📉', label: 'Turun',  color: 'text-rose-600' },
  stable: { icon: '➡️', label: 'Stabil', color: 'text-gray-600' },
};

export default function ForecastPage() {
  const [data, setData]     = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/forecast').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  if (!data) return <p className="text-red-500">Gagal memuat data forecast.</p>;

  const formatY = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}rb`;
    return String(v);
  };

  const incomeConf = TREND_CONFIG[data.income_trend];
  const expConf    = TREND_CONFIG[data.expense_trend];

  // Siapkan chart data — warna berbeda untuk actual vs forecast
  const chartData = data.chart_data.map((d) => ({
    ...d,
    isForecast: d.type === 'forecast',
  }));

  const projMonthEnd = data.projected_month_end_expense;
  const burnOverrun  = projMonthEnd > data.current_balance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Forecasting Keuangan</h1>
        <p className="text-sm text-gray-400 mt-0.5">Proyeksi berbasis regresi linear dari data historis 6 bulan</p>
      </div>

      {/* Trend Indicators */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Tren Pemasukan</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{incomeConf.icon}</span>
            <span className={`text-lg font-bold ${incomeConf.color}`}>{incomeConf.label}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Berdasarkan 6 bulan terakhir</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Tren Pengeluaran</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{expConf.icon}</span>
            <span className={`text-lg font-bold ${expConf.color}`}>{expConf.label}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Berdasarkan 6 bulan terakhir</p>
        </div>
      </div>

      {/* Burn Rate This Month */}
      <div className={`rounded-2xl border p-5 ${burnOverrun ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Proyeksi Pengeluaran Akhir Bulan Ini</p>
            <p className="text-xs text-gray-400 mt-0.5">Berdasarkan laju {formatRupiah(data.daily_burn_rate)}/hari</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${burnOverrun ? 'text-rose-600' : 'text-gray-800'}`}>
              {formatRupiah(projMonthEnd)}
            </p>
            {burnOverrun && (
              <p className="text-xs text-rose-500 mt-0.5">⚠️ Melebihi saldo saat ini!</p>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="bg-white/70 rounded-xl p-2">
            <p className="text-gray-400">Sudah terpakai</p>
            <p className="font-semibold text-gray-700 mt-0.5">{formatRupiah(data.current_month_expense)}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-2">
            <p className="text-gray-400">Burn rate/hari</p>
            <p className="font-semibold text-gray-700 mt-0.5">{formatRupiah(data.daily_burn_rate)}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-2">
            <p className="text-gray-400">Saldo sekarang</p>
            <p className="font-semibold text-gray-700 mt-0.5">{formatRupiah(data.current_balance)}</p>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
          📊 Aktual + Proyeksi 3 Bulan ke Depan
        </h2>
        <p className="text-xs text-gray-400 mb-4">Area berwarna lebih terang = proyeksi</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis tickFormatter={formatY} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatRupiah(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />

              {/* Actual bars */}
              <Bar dataKey="income" name="Pemasukan Aktual" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Pengeluaran Aktual" fill="#f43f5e" radius={[3, 3, 0, 0]} />

              {/* Forecast bars */}
              <Bar dataKey="projected_income" name="Proyeksi Pemasukan" fill="#10b981" fillOpacity={0.35} radius={[3, 3, 0, 0]} strokeDasharray="4 4" />
              <Bar dataKey="projected_expense" name="Proyeksi Pengeluaran" fill="#f43f5e" fillOpacity={0.35} radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projection Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Proyeksi 3 Bulan ke Depan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.projections.map((proj, i) => {
            const conf      = CONFIDENCE_CONFIG[proj.confidence];
            const isPositive = proj.projected_savings >= 0;
            return (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800">{proj.month}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>
                    Akurasi {conf.label}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pemasukan</span>
                    <span className="font-medium text-emerald-600">{formatRupiah(proj.projected_income)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pengeluaran</span>
                    <span className="font-medium text-rose-600">{formatRupiah(proj.projected_expense)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Tabungan</span>
                    <span className={`font-bold ${isPositive ? 'text-indigo-600' : 'text-rose-600'}`}>
                      {isPositive ? '+' : ''}{formatRupiah(proj.projected_savings)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          ⚠️ Proyeksi didasarkan pada tren historis menggunakan regresi linear. Akurasi bergantung pada konsistensi pola keuangan.
        </p>
      </div>
    </div>
  );
}