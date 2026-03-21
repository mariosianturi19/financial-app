'use client';

import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      {/* Floating icon container */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 80, height: 80,
          borderRadius: 24,
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          marginBottom: 20,
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        {icon}
        {/* Subtle glow */}
        <div style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(14,165,233,0.08), transparent)',
          pointerEvents: 'none',
        }} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </motion.p>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            fontSize: 13,
            color: 'var(--text-tertiary)',
            maxWidth: 300,
            lineHeight: 1.65,
          }}
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: 22 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}