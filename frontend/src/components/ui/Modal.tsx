'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Custom footer, rendered below children */
  footer?: React.ReactNode;
}

const widths = { sm: 420, md: 540, lg: 700 };

// Spring configuration — feels premium and physical
const springConfig = { type: 'spring', damping: 32, stiffness: 380, mass: 0.9 } as const;

export default function Modal({
  open, onClose, title, subtitle, children, size = 'md', footer,
}: ModalProps) {
  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [open]);

  // Escape key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(4, 4, 10, 0.8)',
              backdropFilter: 'blur(12px) saturate(160%)',
              WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            }}
          />

          {/* ── Panel — Mobile: bottom sheet, Desktop: centered modal ── */}
          <motion.div
            key="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            /* Mobile: slides up from bottom */
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={springConfig}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 201,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderBottom: 'none',
              borderRadius: '24px 24px 0 0',
              maxHeight: '92dvh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
            }}
            className="surface-highlight"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 12,
              paddingBottom: 4,
              flexShrink: 0,
            }}>
              <div style={{
                width: 36,
                height: 4,
                background: 'var(--border-strong)',
                borderRadius: 99,
                opacity: 0.6,
              }} />
            </div>

            {/* Desktop override: centered panel */}
            <style>{`
              @media (min-width: 640px) {
                [data-modal-panel] {
                  top: 50% !important;
                  bottom: auto !important;
                  left: 50% !important;
                  right: auto !important;
                  width: ${widths[size]}px !important;
                  max-width: calc(100vw - 32px) !important;
                  transform: translate(-50%, -50%) !important;
                  border-radius: 24px !important;
                  border-bottom: 1px solid var(--border-default) !important;
                }
              }
            `}</style>

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '8px 24px 16px',
              flexShrink: 0,
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}>
                  {title}
                </h2>
                {subtitle && (
                  <p style={{
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                    marginTop: 3,
                  }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.08, background: 'var(--bg-hover)' }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  flexShrink: 0,
                  marginLeft: 12,
                  marginTop: 2,
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Scrollable content */}
            <div style={{
              overflowY: 'auto',
              padding: '20px 24px',
              flex: 1,
              minHeight: 0,
            }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{
                padding: '16px 24px',
                paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
                borderTop: '1px solid var(--border-subtle)',
                flexShrink: 0,
                background: 'var(--bg-elevated)',
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}