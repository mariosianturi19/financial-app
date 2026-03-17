import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  gradient: string;
  delay?: number;
}

export default function StatCard({ label, value, sub, icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <div
      className="card noise relative overflow-hidden animate-fadeup"
      style={{ padding: '20px 24px', animationDelay: `${delay}ms` }}
    >
      {/* Gradient glow corner */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: gradient, opacity: 0.15, filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {icon}
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </p>
      <p className="stat-value" style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</p>
      )}
    </div>
  );
}