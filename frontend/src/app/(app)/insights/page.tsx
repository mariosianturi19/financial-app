'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { InsightsData, InsightType } from '@/types';
import PageHeader from '@/components/ui/PageHeader';

const TYPE_CONFIG: Record<InsightType, { color: string; border: string; badge: string; label: string }> = {
  danger:  { color: 'var(--accent-rose)',    border: 'rgba(251,113,133,0.2)',  badge: 'rgba(251,113,133,0.12)', label: 'Critical' },
  warning: { color: 'var(--accent-amber)',   border: 'rgba(251,191,36,0.2)',   badge: 'rgba(251,191,36,0.12)',  label: 'Warning'  },
  info:    { color: 'var(--accent-blue)',    border: 'rgba(96,165,250,0.2)',   badge: 'rgba(96,165,250,0.12)',  label: 'Info'     },
  success: { color: 'var(--accent-emerald)', border: 'rgba(52,211,153,0.2)',   badge: 'rgba(52,211,153,0.12)', label: 'Good'     },
};

const PRIORITY_ORDER: InsightType[] = ['danger', 'warning', 'info', 'success'];

function InsightCard({ insight, index }: { insight: InsightsData['insights'][0]; index: number }) {
  const cfg = TYPE_CONFIG[insight.type];
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="animate-fadeup"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 18px', borderRadius: 16,
        background: hov ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
        border: `1px solid ${hov ? cfg.border : 'var(--border-subtle)'}`,
        transition: 'all 0.2s var(--ease-out)',
        animationDelay: `${index * 50}ms`,
        transform: hov ? 'translateX(3px)' : 'none',
        position: 'relative',
      }}
    >
      {/* Severity left-bar */}
      <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, background: cfg.color, borderRadius: '0 3px 3px 0', opacity: 0.8 }} />

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: cfg.badge, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, marginLeft: 6,
        transition: 'transform 0.2s var(--ease-spring)',
        transform: hov ? 'scale(1.08) rotate(-4deg)' : 'none',
      }}>
        {insight.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {insight.title}
          </p>
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
  { key: 'all',     label: 'All',      emoji: '📋' },
  { key: 'danger',  label: 'Critical', emoji: '🚨' },
  { key: 'warning', label: 'Warning',  emoji: '⚠️' },
  { key: 'info',    label: 'Info',     emoji: 'ℹ️' },
  { key: 'success', label: 'Good',     emoji: '✅' },
];

export default function InsightsPage() {
  const [data, setData]           = useState<InsightsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState<InsightType | 'all'>('all');

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

  if (!data) return <p style={{ color: 'var(--accent-rose)' }}>Failed to load insights.</p>;

  const filtered = filter === 'all'
    ? [...data.insights].sort((a, b) => PRIORITY_ORDER.indexOf(a.type) - PRIORITY_ORDER.indexOf(b.type))
    : data.insights.filter((i) => i.type === filter);

  const counts: Record<string, number> = { danger: 0, warning: 0, info: 0, success: 0, all: data.insights.length };
  data.insights.forEach((i) => counts[i.type]++);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Smart Insights"
        subtitle={`${data.total_insights} active insight${data.total_insights !== 1 ? 's' : ''} · Updated in real-time`}
        action={
          <button
            onClick={() => fetchInsights(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
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
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>Your finances are in great shape!</p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No issues that need your attention right now.</p>
        </div>
      ) : (
        <div className="animate-fadeup" style={{ padding: '14px 18px', borderRadius: 14, background: data.has_warnings ? 'rgba(251,191,36,0.07)' : 'rgba(96,165,250,0.07)', border: `1px solid ${data.has_warnings ? 'rgba(251,191,36,0.22)' : 'rgba(96,165,250,0.22)'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{data.has_warnings ? '⚠️' : 'ℹ️'}</span>
          <p style={{ fontSize: 13, color: data.has_warnings ? 'var(--accent-amber)' : 'var(--accent-blue)', fontWeight: 500 }}>
            {data.has_warnings
              ? `There are ${counts.danger + counts.warning} thing${counts.danger + counts.warning !== 1 ? 's' : ''} that need your attention`
              : 'A few informational insights for you'}
          </p>
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
                padding: '6px 12px', borderRadius: 99,
                background: active ? 'var(--accent-violet-dim)' : 'var(--bg-overlay)',
                border: `1px solid ${active ? 'rgba(124,111,247,0.4)' : 'var(--border-subtle)'}`,
                color: active ? 'var(--accent-violet)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 13 }}>{emoji}</span>
              {label}
              {key !== 'all' && count > 0 && (
                <span style={{ background: active ? 'rgba(124,111,247,0.25)' : 'var(--bg-hover)', padding: '1px 6px', borderRadius: 99, fontSize: 10.5 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Insight list */}
      {filtered.length === 0 ? (
        <div style={{ padding: '28px 24px', borderRadius: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No insights in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}