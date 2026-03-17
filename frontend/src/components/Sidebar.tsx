'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/transactions', label: 'Transaksi', icon: '💳' },
  { href: '/wallets', label: 'Dompet', icon: '👛' },
  { href: '/categories', label: 'Kategori', icon: '🏷️' },
  { href: '/budgets', label: 'Anggaran', icon: '🎯' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-indigo-700 text-white flex flex-col">
      <div className="p-6 border-b border-indigo-600">
        <h1 className="text-xl font-bold">💰 Financial App</h1>
        <p className="text-indigo-200 text-sm mt-1">Manajemen Keuangan</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname.startsWith(item.href)
                ? 'bg-indigo-500 text-white'
                : 'text-indigo-100 hover:bg-indigo-600'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
