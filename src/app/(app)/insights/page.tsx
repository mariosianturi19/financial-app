'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { InsightsData, InsightType } from '@/types';

const TYPE_CONFIG: Record<InsightType, { color: string; border: string; badge: string; label: string; dot: string }> = {
  danger:  { color: '#fb7185',  border: 'rgba(251,113,133,0.25)', badge: 'rgba(251,113,133,0.12)', label: 'Critical', dot: '#fb7185' },
  warning: { color: '#fbbf24',  border: 'rgba(251,191,36,0.25)',  badge: 'rgba(251,191,36,0.12)',  label: 'Warning',  dot: '#fbbf24' },
  info:    { color: '#60a5fa',  border: 'rgba(96,165,250,0.25)',  badge: 'rgba(96,165,250,0.12)',  label: 'Info',     dot: '#60a5fa' },
  success: { color: '#34d399',  border: 'rgba(52,211,153,0.25)',  badge: 'rgba(52,211,153,0.12)',  label: 'Good',     dot: '#34d399' },
};
const PRIORITY_ORDER: InsightType[] = ['danger', 'warning', 'info', 'success'];

function InsightCard({ insight, index }: { insight: InsightsData['insights'][0]; index: number }) {
  const cfg = TYPE_CONFIG[insight.type];
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.38, ease: 'easeOut' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '18px 18px 18px 22px', borderRadius: 18,
        background: hov ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
        border: `1px solid ${hov ? cfg.border : 'var(--border-subtle)'}`,
        transition: 'all 0.22s var(--ease-out)',
        transform: hov ? 'translateX(4px)' : 'none',
        position: 'relative', overflow: 'hidden',
        boxShadow: hov ? `inset 0 0 0 1px ${cfg.border}` : 'none',
        cursor: 'default',
      }}
    >
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: cfg.color, borderRadius: '18px 0 0 18px', opacity: hov ? 1 : 0.6, transition: 'opacity 0.2s' }} />

      {/* Glow */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: `linear-gradient(to right, ${cfg.badge}, transparent)`, pointerEvents: 'none' }} />

      {/* Icon */}
      <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: cfg.badge, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'transform 0.2s var(--ease-spring)', transform: hov ? 'scale(1.1) rotate(-5deg)' : 'scale(1)', position: 'relative', zIndex: 1 }}>
        {insight.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{insight.title}</p>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: cfg.badge, color: cfg.color, border: `1px solid ${cfg.border}`, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, marginTop: 2 }}>
            {cfg.label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{insight.message}</p>
      </div>
    </motion.div>
  );
}

const FILTER_OPTIONS: { key: InsightType | 'all'; label: string; emoji: string }[] = [
  { key: 'all',     label: 'All',      emoji: '📋' },
  { key: 'danger',  label: 'Critical', emoji: '🚨' },
  { key: 'warning', label: 'Warning',  emoji: '⚠️' },
  { key: 'info',    label: 'Info',     emoji: 'ℹ️' },
  { key: 'success', label: 'Good',     emoji: '✅' },
];

export default function InsightsPage() {
  const [data, setData]             = useState<InsightsData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<InsightType | 'all'>('all');

  const fetchInsights = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try { const res = await api.get('/analytics/insights'); setData(res.data); }
    catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchInsights(); }, []);

  if (loading) return (
    <div className="page-root">
      <div className="skeleton" style={{ height: 50, width: 200, borderRadius: 14 }} />
      <div className="content-grid-2">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 18 }} />)}
      </div>
    </div>
  );
  if (!data) return <div className="page-root"><p style={{ color: '#fb7185' }}>Failed to load insights.</p></div>;

  const filtered = filter === 'all'
    ? [...data.insights].sort((a, b) => PRIORITY_ORDER.indexOf(a.type) - PRIORITY_ORDER.indexOf(b.type))
    : data.insights.filter((i) => i.type === filter);

  const counts: Record<string, number> = { danger: 0, warning: 0, info: 0, success: 0, all: data.insights.length };
  data.insights.forEach((i) => counts[i.type]++);

  const urgentCount = (counts.danger ?? 0) + (counts.warning ?? 0);

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Smart Insights</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 5 }}>
            {data.total_insights} insight{data.total_insights !== 1 ? 's' : ''} · Updated in real-time
          </p>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 11, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Summary banner */}
      {data.total_insights === 0 ? (
        <div style={{ padding: '36px 24px', borderRadius: 22, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: 42, marginBottom: 14 }}>🎉</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#34d399', marginBottom: 8, letterSpacing: '-0.02em' }}>Your finances are in great shape!</p>
          <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>No issues that need your attention right now.</p>
        </div>
      ) : urgentCount > 0 ? (
        <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.22)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <p style={{ fontSize: 13.5, color: '#fbbf24', fontWeight: 500 }}>
            {urgentCount} thing{urgentCount !== 1 ? 's' : ''} that need your attention
          </p>
        </div>
      ) : (
        <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>ℹ️</span>
          <p style={{ fontSize: 13.5, color: '#60a5fa', fontWeight: 500 }}>A few informational insights for you</p>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map(({ key, label, emoji }) => {
          const count  = counts[key] ?? 0;
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 99,
                background: active ? 'var(--accent-violet-dim)' : 'var(--bg-overlay)',
                border: `1px solid ${active ? 'rgba(124,111,247,0.4)' : 'var(--border-subtle)'}`,
                color: active ? 'var(--accent-violet-soft)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 13 }}>{emoji}</span>
              {label}
              {key !== 'all' && count > 0 && (
                <span style={{ background: active ? 'rgba(124,111,247,0.25)' : 'var(--bg-hover)', padding: '1px 7px', borderRadius: 99, fontSize: 10.5 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2-column insight grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: '32px 24px', borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>No insights in this category.</p>
        </div>
      ) : (
        <div className="content-grid-2">
          {filtered.map((insight, i) => <InsightCard key={i} insight={insight} index={i} />)}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}