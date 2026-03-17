'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Optional colored accent chip rendered next to title */
  badge?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action, badge }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-tertiary)',
            marginTop: 4,
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ flexShrink: 0 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}