'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FAB from '@/components/FAB';
import CursorGlow from '@/components/CursorGlow';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import TxForm, { TxFormData } from '@/components/ui/TxForm';
import api from '@/lib/api';
import { toast } from 'sonner';
import { LayoutDashboard, ArrowLeftRight, Wallet, Tag, Target, TrendingUp, Zap, Lightbulb } from 'lucide-react';

/* ── Mobile page title map ──────────────────────────────────── */
const PAGE_TITLES: Record<string, { label: string; icon: React.ElementType }> = {
  '/dashboard':    { label: 'Dashboard',     icon: LayoutDashboard },
  '/transactions': { label: 'Transactions',  icon: ArrowLeftRight  },
  '/wallets':      { label: 'Wallets',       icon: Wallet          },
  '/categories':   { label: 'Categories',    icon: Tag             },
  '/budgets':      { label: 'Budgets',       icon: Target          },
  '/analytics':    { label: 'Analytics',     icon: TrendingUp      },
  '/forecast':     { label: 'Forecasting',   icon: Zap             },
  '/insights':     { label: 'Smart Insights',icon: Lightbulb       },
};

/* ── Empty form factory ─────────────────────────────────────── */
const makeEmptyForm = (): TxFormData => ({
  wallet_id: '', category_id: '', type: 'expense',
  amount: '', description: '',
  date: new Date().toISOString().split('T')[0],
});

/* ── Page transition ────────────────────────────────────────── */
function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── App Layout ─────────────────────────────────────────────── */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitializing, initFromStorage } = useAuthStore();
  const { wallets, walletsLoaded, fetchWallets, categories, categoriesLoaded, fetchCategories, refetchWallets } = useAppStore();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm]       = useState<TxFormData>(makeEmptyForm());
  const [saving, setSaving]             = useState(false);

  useEffect(() => { initFromStorage(); }, [initFromStorage]);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) router.replace('/login');
  }, [isInitializing, isAuthenticated, router]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      if (!walletsLoaded)    fetchWallets();
      if (!categoriesLoaded) fetchCategories();
    }
  }, [isInitializing, isAuthenticated, walletsLoaded, categoriesLoaded, fetchWallets, fetchCategories]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/transactions', quickForm);
      toast.success('Transaction saved!');
      setShowQuickAdd(false);
      setQuickForm(makeEmptyForm());
      refetchWallets();
    } catch {
      toast.error('Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenQuickAdd = useCallback(() => {
    setQuickForm(makeEmptyForm());
    setShowQuickAdd(true);
  }, []);

  if (isInitializing || !isAuthenticated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--bg-base)',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2.5px solid var(--border-default)',
          borderTopColor: 'var(--accent-violet)',
          animation: 'spin 0.7s linear infinite',
        }} />
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Loading...</p>
      </div>
    );
  }

  /* Current page info for mobile topbar */
  const currentPage = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key));
  const PageIcon = currentPage?.[1]?.icon;
  const pageLabel = currentPage?.[1]?.label ?? 'FinApp';

  return (
    <>
      <CursorGlow />

      {/* Sonner Toast */}
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 14,
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />

      {/* Ambient background orbs */}
      <div className="orb orb-violet" />
      <div className="orb orb-emerald" />

      {/* App shell */}
      <div style={{
        display: 'flex', minHeight: '100dvh',
        background: 'var(--bg-base)', position: 'relative',
      }}>
        {/* Sidebar (desktop) */}
        <div className="hide-mobile">
          <Sidebar />
        </div>

        {/* Main content area — FULL WIDTH, no maxWidth constraint */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden auto' }}>
          {/* Mobile topbar */}
          <div className="mobile-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {PageIcon && <PageIcon size={17} style={{ color: 'var(--accent-violet)' }} />}
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {pageLabel}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                💎
              </div>
            </div>
          </div>

          {/* Page content */}
          <PageTransition>{children}</PageTransition>
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <div className="show-mobile">
        <BottomNav />
      </div>

      {/* FAB */}
      <FAB onAddTransaction={handleOpenQuickAdd} />

      {/* Global quick-add modal */}
      <Modal
        open={showQuickAdd}
        onClose={() => { setShowQuickAdd(false); setQuickForm(makeEmptyForm()); }}
        title="Add Transaction"
        subtitle="Quick-add from anywhere"
      >
        <TxForm
          form={quickForm}
          setForm={setQuickForm}
          wallets={wallets}
          categories={categories}
          onSubmit={handleQuickAdd}
          saving={saving}
          submitLabel="Save Transaction"
          onCancel={() => { setShowQuickAdd(false); setQuickForm(makeEmptyForm()); }}
        />
      </Modal>

      {/* Responsive helpers */}
      <style>{`
        .hide-mobile { display: flex; }
        .show-mobile { display: none;  }
        @media (max-width: 767px) {
          .hide-mobile { display: none;  }
          .show-mobile { display: block; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}