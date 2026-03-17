'use client';

import Sidebar from '@/components/Sidebar';
import { Toaster } from 'react-hot-toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}
