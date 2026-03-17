'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FAB from '@/components/FAB';
import CursorGlow from '@/components/CursorGlow';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import TxForm, { TxFormData } from '@/components/ui/TxForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';

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

/* ── App Layout ─────────────────────────────────────────────── */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, initFromStorage } = useAuthStore();
  const { wallets, walletsLoaded, fetchWallets, categories, categoriesLoaded, fetchCategories, refetchWallets } = useAppStore();

  const [checked, setChecked]         = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm]       = useState<TxFormData>(makeEmptyForm());
  const [saving, setSaving]             = useState(false);

  useEffect(() => { initFromStorage(); setChecked(true); }, [initFromStorage]);
  useEffect(() => { if (checked && !isAuthenticated) router.replace('/login'); }, [checked, isAuthenticated, router]);

  /* Pre-load wallets & categories when layout mounts (authenticated) */
  useEffect(() => {
    if (checked && isAuthenticated) {
      if (!walletsLoaded)   fetchWallets();
      if (!categoriesLoaded) fetchCategories();
    }
  }, [checked, isAuthenticated, walletsLoaded, categoriesLoaded, fetchWallets, fetchCategories]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/transactions', quickForm);
      toast.success('Transaction saved!');
      setShowQuickAdd(false);
      setQuickForm(makeEmptyForm());
      // Refresh wallet balances
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

  if (!checked || !isAuthenticated) {
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

  return (
    <>
      {/* Cursor glow — desktop only */}
      <CursorGlow />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
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
          success: { iconTheme: { primary: '#34d399', secondary: 'var(--bg-elevated)' } },
          error:   { iconTheme: { primary: '#fb7185', secondary: 'var(--bg-elevated)' } },
        }}
      />

      {/* App shell */}
      <div style={{
        display: 'flex', minHeight: '100dvh',
        background: 'var(--bg-base)', position: 'relative',
      }}>
        {/* Sidebar (desktop) */}
        <div className="hide-mobile">
          <Sidebar />
        </div>

        {/* Main content */}
        <main style={{
          flex: 1, minWidth: 0,
          padding: '24px 20px',
          paddingBottom: 'calc(var(--bottom-nav-height) + 32px)',
          maxWidth: 680, margin: '0 auto', width: '100%',
          position: 'relative', zIndex: 1,
        }}>
          <PageTransition>{children}</PageTransition>
        </main>
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