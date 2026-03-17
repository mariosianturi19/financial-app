'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '2px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-violet)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none' }} className="lg-sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '32px 24px',
          paddingBottom: 0,
        }}
          className="page-pb main-content"
        >
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav">
        <BottomNav />
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            boxShadow: 'var(--shadow-md)',
          },
        }}
      />

      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { display: block !important; }
          .mobile-bottom-nav { display: none !important; }
          .main-content { padding: 32px 40px !important; }
        }
      `}</style>
    </div>
  );
}