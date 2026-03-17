'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, initFromStorage } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    initFromStorage();
    setChecked(true);
  }, [initFromStorage]);

  useEffect(() => {
    if (checked && !isAuthenticated) router.replace('/login');
  }, [checked, isAuthenticated, router]);

  if (!checked || !isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: 'var(--bg-base)',
        flexDirection: 'column',
        gap: 16,
      }}>
        {/* Animated loading state */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 44, height: 44,
            borderRadius: 13,
            background: 'var(--grad-violet)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            boxShadow: 'var(--shadow-violet)',
          }}
        >
          💎
        </motion.div>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      position: 'relative',
    }}>
      {/* ── Ambient background orbs (desktop only) ── */}
      <div className="orb orb-violet" style={{ display: 'none' }} aria-hidden="true" />
      <div className="orb orb-emerald" style={{ display: 'none' }} aria-hidden="true" />

      {/* ── Desktop Sidebar ── */}
      <div className="lg-sidebar" style={{ display: 'none' }}>
        <Sidebar />
      </div>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        minWidth: 0,
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div
          className="page-pb main-content"
          style={{
            maxWidth: 980,
            margin: '0 auto',
            width: '100%',
            padding: '28px 20px 0',
            flex: 1,
          }}
        >
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <div className="mobile-bottom-nav">
        <BottomNav />
      </div>

      {/* ── Toast Notifications ── */}
      <Toaster
        position="top-center"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 14,
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            padding: '12px 16px',
            backdropFilter: 'blur(16px)',
            maxWidth: 380,
          },
          success: {
            iconTheme: {
              primary: 'var(--accent-emerald)',
              secondary: 'var(--bg-elevated)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--accent-rose)',
              secondary: 'var(--bg-elevated)',
            },
          },
        }}
      />

      {/* ── Responsive styles ── */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar          { display: block !important; }
          .mobile-bottom-nav   { display: none  !important; }
          .main-content        { padding: 36px 44px 0 !important; }
          .orb                 { display: block !important; }
        }
        @media (max-width: 1023px) {
          .mobile-bottom-nav   { display: block !important; }
        }
      `}</style>
    </div>
  );
}