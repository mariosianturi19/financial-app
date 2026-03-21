'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowLeftRight, Wallet, Target } from 'lucide-react';

interface SpeedDialItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
  bg: string;
}

interface FABProps {
  onAddTransaction: () => void;
  onAddWallet?: () => void;
  onAddBudget?: () => void;
}

const HIDDEN_ROUTES = ['/login', '/register'];

export default function FAB({ onAddTransaction, onAddWallet, onAddBudget }: FABProps) {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const items: SpeedDialItem[] = [
    {
      icon: <ArrowLeftRight size={17} />,
      label: 'Add Transaction',
      onClick: () => { setOpen(false); onAddTransaction(); },
      color: '#0ea5e9',
      bg:    'rgba(14,165,233,0.15)',
    },
    ...(onAddWallet ? [{
      icon: <Wallet size={17} />,
      label: 'Add Wallet',
      onClick: () => { setOpen(false); onAddWallet!(); },
      color: '#34d399',
      bg:    'rgba(52,211,153,0.15)',
    }] : []),
    ...(onAddBudget ? [{
      icon: <Target size={17} />,
      label: 'Set Budget',
      onClick: () => { setOpen(false); onAddBudget!(); },
      color: '#fbbf24',
      bg:    'rgba(251,191,36,0.15)',
    }] : []),
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 45,
              background: 'rgba(4,4,10,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>

      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height) + 16px)',
        right: 20, zIndex: 46,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      }}>
        <AnimatePresence>
          {open && items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.85 }}
              transition={{ duration: 0.22, delay: open ? (items.length - 1 - i) * 0.05 : i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <motion.span
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                transition={{ delay: open ? (items.length - 1 - i) * 0.05 + 0.05 : 0 }}
                style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                  background: 'rgba(14,14,23,0.95)', border: '1px solid var(--border-default)',
                  padding: '5px 12px', borderRadius: 99, whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-md)', backdropFilter: 'blur(12px)', fontFamily: 'var(--font-body)',
                }}
              >
                {it.label}
              </motion.span>
              <button
                onClick={it.onClick}
                style={{
                  width: 46, height: 46, borderRadius: 14, border: `1px solid ${it.color}44`,
                  background: it.bg, color: it.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: `0 4px 20px ${it.color}30`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
              >
                {it.icon}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
          style={{
            width: 54, height: 54, borderRadius: 17, border: 'none',
            background: open ? 'var(--bg-overlay)' : 'var(--grad-finapp)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: open ? 'var(--shadow-md)' : '0 8px 28px rgba(14,165,233,0.45)',
            transition: 'background 0.2s, box-shadow 0.2s',
            zIndex: 47, outline: 'none',
          }}
          aria-label={open ? 'Close' : 'Add new'}
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ type: 'spring', damping: 22, stiffness: 350 }}>
            {open ? <X size={22} /> : <Plus size={22} />}
          </motion.div>
        </motion.button>
      </div>

      <style>{`
        @media (min-width: 768px) {
          [data-fab-wrap] { bottom: 28px !important; }
        }
      `}</style>
    </>
  );
}