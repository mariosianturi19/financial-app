'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  description,
  itemName,
  loading = false,
}: DeleteConfirmModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile with matchMedia (updates on resize too)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* ── Shared inner content ── */
  const Inner = () => (
    <>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #be123c, #f43f5e)',
        borderRadius: 'inherit',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 180, height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-tertiary)',
          zIndex: 2, transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
      >
        <X size={14} />
      </button>

      <div style={{ position: 'relative', zIndex: 1, padding: '32px 28px 28px' }}>
        {/* Warning icon */}
        <div style={{
          width: 60, height: 60, borderRadius: 20,
          background: 'rgba(244,63,94,0.12)',
          border: '1px solid rgba(244,63,94,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(244,63,94,0.15)',
        }}>
          <AlertTriangle size={28} style={{ color: '#f43f5e' }} />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20, fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          marginBottom: 10,
        }}>
          {title}
        </h2>

        <p style={{
          fontSize: 13.5, color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: itemName ? 18 : 28,
        }}>
          {description ?? 'Tindakan ini tidak bisa dibatalkan. Data yang dihapus tidak bisa dikembalikan.'}
        </p>

        {itemName && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.2)',
            marginBottom: 24,
          }}>
            <Trash2 size={13} style={{ color: '#f43f5e' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f43f5e', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
              {itemName}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 0',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 0',
              background: loading ? 'rgba(244,63,94,0.35)' : 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
              border: 'none', borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700,
              color: 'white',
              fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(244,63,94,0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            {loading
              ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'delete-spin 0.8s linear infinite' }} />
              : <><Trash2 size={15} /> Delete</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes delete-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );

  const cardBase: React.CSSProperties = {
    position: 'relative',
    background: 'var(--bg-elevated)',
    border: '1px solid rgba(244,63,94,0.2)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(244,63,94,0.08)',
    overflow: 'hidden',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="delete-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            /* Center on desktop, align-end on mobile */
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : '16px',
          }}
        >
          {isMobile ? (
            /* ── MOBILE: Bottom Sheet ── */
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                ...cardBase,
                width: '100%',
                borderRadius: '24px 24px 0 0',
                border: '1px solid rgba(244,63,94,0.2)',
                borderBottom: 'none',
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
              </div>
              <Inner />
            </motion.div>
          ) : (
            /* ── DESKTOP: Centered Card ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', damping: 24, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              style={{ ...cardBase, width: '100%', maxWidth: 420, borderRadius: 24 }}
            >
              <Inner />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
