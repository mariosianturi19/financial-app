import { Toaster } from 'sonner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" theme="dark" toastOptions={{
        style: {
          background: 'var(--bg-elevated)', color: 'var(--text-primary)',
          border: '1px solid var(--border-default)', borderRadius: 14, fontSize: 13,
          fontFamily: 'var(--font-body)', boxShadow: 'var(--shadow-lg)',
        },
      }} />
    </>
  );
}