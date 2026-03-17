'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { InsightsData, Insight, InsightType } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import { RefreshCw } from 'lucide-react';

const TYPE_CONFIG: Record<InsightType, { bg: string; border: string; color: string; badge: string; icon: string; label: string }> = {
  danger:  { bg: 'rgba(251,113,133,0.07)', border: 'rgba(251,113,133,0.22)', color: 'var(--accent-rose)',    badge: 'rgba(251,113,133,0.15)', icon: '🚨', label: 'Kritis' },
  warning: { bg: 'rgba(251,191,36,0.07)',  border: 'rgba(251,191,36,0.22)',  color: 'var(--accent-amber)',   badge: 'rgba(251,191,36,0.15)',  icon: '⚠️', label: 'Perhatian' },
  info:    { bg: 'rgba(96,165,250,0.07)',  border: 'rgba(96,165,250,0.22)',  color: 'var(--accent-blue)',    badge: 'rgba(96,165,250,0.15)',  icon: 'ℹ️', label: 'Info' },
  success: { bg: 'rgba(52,211,153,0.07)', border: 'rgba(52,211,153,0.22)', color: 'var(--accent-emerald)', badge: 'rgba(52,211,153,0.15)', icon: '✅', label: 'Bagus' },
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const cfg = TYPE_CONFIG[insight.type];
  const [hov, setHov] = useState(false);

  return (
    <div
      className="animate-fadeup"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '18px 20px',
        borderRadius: 16,
        background: hov ? cfg.bg.replace('0.07', '0.11') : cfg.bg,
        border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'flex-start', gap: 14,
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 8px 24px ${cfg.border}` : 'none',
        transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
        animationDelay: `${index * 70}ms`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: '0 3px 3px 0', background: cfg.color, opacity: 0.6 }} />

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: cfg.badge, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, transition: 'transform 0.2s',
        transform: hov ? 'scale(1.08) rotate(-4deg)' : 'none',
      }}>
        {insight.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{insight.title}</p>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
            background: cfg.badge, color: cfg.color, border: `1px solid ${cfg.border}`,
            textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
          }}>
            {TYPE_CONFIG[insight.type].label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{insight.message}</p>
      </div>
    </div>
  );
}

const FILTER_OPTIONS: { key: InsightType | 'all'; label: string; emoji: string }[] = [
  { key: 'all',     label: 'Semua',     emoji: '📋' },
  { key: 'danger',  label: 'Kritis',    emoji: '🚨' },
  { key: 'warning', label: 'Perhatian', emoji: '⚠️' },
  { key: 'info',    label: 'Info',      emoji: 'ℹ️' },
  { key: 'success', label: 'Bagus',     emoji: '✅' },
];

export default function InsightsPage() {
  const [data, setData]       = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]   = useState<InsightType | 'all'>('all');

  const fetchInsights = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try { const res = await api.get('/analytics/insights'); setData(res.data); }
    catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchInsights(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="skeleton" style={{ height: 60, borderRadius: 16, maxWidth: 280 }} />
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
    </div>
  );

  if (!data) return <p style={{ color: 'var(--accent-rose)' }}>Gagal memuat insights.</p>;

  const filtered = filter === 'all' ? data.insights : data.insights.filter((i) => i.type === filter);
  const counts: Record<string, number> = { danger: 0, warning: 0, info: 0, success: 0, all: data.insights.length };
  data.insights.forEach((i) => counts[i.type]++);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Smart Insights"
        subtitle={`${data.total_insights} insight aktif · Diperbarui real-time`}
        action={
          <button onClick={() => fetchInsights(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--bg-hover)';(e.currentTarget as HTMLElement).style.color='var(--text-primary)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='var(--bg-overlay)';(e.currentTarget as HTMLElement).style.color='var(--text-secondary)';}}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        }
      />

      {/* Summary banner */}
      {data.total_insights === 0 ? (
        <div className="animate-fadeup" style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🎉</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>Keuangan kamu dalam kondisi baik!</p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Tidak ada perhatian khusus yang perlu ditindaklanjuti saat ini.</p>
        </div>
      ) : (
        <div className="animate-fadeup" style={{ padding: '14px 18px', borderRadius: 14, background: data.has_warnings ? 'rgba(251,191,36,0.07)' : 'rgba(96,165,250,0.07)', border: `1px solid ${data.has_warnings ? 'rgba(251,191,36,0.22)' : 'rgba(96,165,250,0.22)'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{data.has_warnings ? '⚠️' : 'ℹ️'}</span>
          <p style={{ fontSize: 13, color: data.has_warnings ? 'var(--accent-amber)' : 'var(--accent-blue)', fontWeight: 500 }}>
            {data.has_warnings ? `Ada ${counts.danger + counts.warning} hal yang perlu perhatian kamu` : 'Beberapa insight informatif untuk kamu'}
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map(({ key, label, emoji }) => {
          const count = counts[key] ?? 0;
          const active = filter === key;
          const cfg = key !== 'all' ? TYPE_CONFIG[key as InsightType] : null;
          return (
            <button key={key} onClick={() => setFilter(key as typeof filter)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
                border: `1px solid ${active && cfg ? cfg.border : 'var(--border-subtle)'}`,
                background: active ? (cfg ? cfg.bg : 'var(--accent-violet-dim)') : 'var(--bg-overlay)',
                color: active ? (cfg ? cfg.color : 'var(--accent-violet)') : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}>
              <span>{emoji}</span>
              {label}
              {count > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, background: 'rgba(255,255,255,0.12)', padding: '1px 6px', borderRadius: 99 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Insight cards */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 28, marginBottom: 10 }}>✨</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tidak ada insight untuk filter ini.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((insight, i) => <InsightCard key={i} insight={insight} index={i} />)}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}