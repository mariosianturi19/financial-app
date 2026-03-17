'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { InsightsData, Insight, InsightType } from '@/types';

const TYPE_STYLE: Record<InsightType, { border: string; bg: string; badge: string; badgeText: string; label: string }> = {
  danger:  { border: 'border-rose-200',   bg: 'bg-rose-50',    badge: 'bg-rose-100',    badgeText: 'text-rose-700',   label: 'Kritis' },
  warning: { border: 'border-amber-200',  bg: 'bg-amber-50',   badge: 'bg-amber-100',   badgeText: 'text-amber-700',  label: 'Perhatian' },
  info:    { border: 'border-blue-200',   bg: 'bg-blue-50',    badge: 'bg-blue-100',    badgeText: 'text-blue-700',   label: 'Info' },
  success: { border: 'border-emerald-200',bg: 'bg-emerald-50', badge: 'bg-emerald-100', badgeText: 'text-emerald-700',label: 'Bagus' },
};

function InsightCard({ insight }: { insight: Insight }) {
  const style = TYPE_STYLE[insight.type];
  return (
    <div className={`rounded-2xl border p-5 ${style.border} ${style.bg}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-semibold text-gray-800 text-sm">{insight.title}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge} ${style.badgeText}`}>
              {style.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{insight.message}</p>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData]       = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<InsightType | 'all'>('all');

  const fetchInsights = () => {
    setLoading(true);
    api.get('/analytics/insights').then((r) => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchInsights(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  if (!data) return <p className="text-red-500">Gagal memuat insights.</p>;

  const filtered = filter === 'all'
    ? data.insights
    : data.insights.filter((i) => i.type === filter);

  const counts = {
    danger:  data.insights.filter((i) => i.type === 'danger').length,
    warning: data.insights.filter((i) => i.type === 'warning').length,
    info:    data.insights.filter((i) => i.type === 'info').length,
    success: data.insights.filter((i) => i.type === 'success').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Smart Insights</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data.total_insights} insight ditemukan · Diperbarui real-time
          </p>
        </div>
        <button onClick={fetchInsights}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition">
          🔄 Refresh
        </button>
      </div>

      {/* Summary Banner */}
      {data.total_insights === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-emerald-800 font-semibold">Keuangan kamu dalam kondisi baik!</p>
          <p className="text-emerald-600 text-sm mt-1">Tidak ada perhatian khusus yang perlu ditindaklanjuti saat ini.</p>
        </div>
      ) : (
        <div className={`rounded-2xl border p-4 ${
          data.has_warnings ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{data.has_warnings ? '⚠️' : 'ℹ️'}</span>
            <div>
              <p className={`font-semibold text-sm ${data.has_warnings ? 'text-amber-800' : 'text-blue-800'}`}>
                {data.has_warnings
                  ? `Ada ${counts.danger + counts.warning} hal yang perlu perhatian kamu`
                  : 'Beberapa insight informatif untuk kamu'}
              </p>
              <p className={`text-xs mt-0.5 ${data.has_warnings ? 'text-amber-600' : 'text-blue-600'}`}>
                {counts.danger > 0 && `${counts.danger} kritis · `}
                {counts.warning > 0 && `${counts.warning} peringatan · `}
                {counts.info > 0 && `${counts.info} info · `}
                {counts.success > 0 && `${counts.success} positif`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {data.total_insights > 0 && (
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'all',     label: `Semua (${data.total_insights})` },
            { key: 'danger',  label: `Kritis (${counts.danger})` },
            { key: 'warning', label: `Peringatan (${counts.warning})` },
            { key: 'info',    label: `Info (${counts.info})` },
            { key: 'success', label: `Positif (${counts.success})` },
          ] as { key: InsightType | 'all'; label: string }[])
            .filter((t) => t.key === 'all' || counts[t.key as InsightType] > 0)
            .map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                  filter === tab.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {tab.label}
              </button>
            ))}
        </div>
      )}

      {/* Insight Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Tidak ada insight untuk filter ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      )}

      {/* Methodology note */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>📋 Metodologi:</strong> Smart Insights menganalisis data transaksi, anggaran, hutang/piutang, dan langganan kamu secara real-time menggunakan rules-based engine. Insight diperbarui setiap kali kamu membuka halaman ini. Tidak ada data yang dikirim ke server eksternal — semua analisis dilakukan di server kamu sendiri.
        </p>
      </div>
    </div>
  );
}