"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, LogOut, Package } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Novo Produto', href: '/admin/products/new', icon: PlusCircle },
    { name: 'Todos Produtos', href: '/#catalogo', icon: Package }, // Link pro site
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="font-bold text-xl tracking-tighter">WFX Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg w-full transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-[#0b0f19]">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}