"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, LogOut, Package, Menu, X, Send } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    const toastId = toast.loading('Encerrando sessão...');
    await supabase.auth.signOut();
    toast.success('Sessão encerrada com sucesso!', { id: toastId });
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Novo Produto', href: '/admin/products/new', icon: PlusCircle },
    { name: 'Envio Exclusivo', href: '/admin/send', icon: Send }, 
    { name: 'Voltar ao Site', href: '/#catalogo', icon: Package }, 
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex">
      
      {/* Botão Mobile (Hambúrguer) - Aparece só no celular */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-20 p-2 bg-slate-900 border border-slate-800 rounded-md text-slate-300 hover:text-white shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Overlay Escuro Mobile - Clicar fora fecha o menu */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside className={`w-64 border-r border-slate-800 bg-slate-950 flex flex-col fixed h-full z-40 transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Logo / Header da Sidebar */}
        <div className="h-20 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/logo.png" alt="WFX Logo" width={80} height={32} className="object-contain" />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
          </Link>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)} // Fecha o menu mobile ao clicar num link
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

        {/* Botão Sair */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg w-full transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal (Main) */}
      {/* Adiciona margem na esquerda no Desktop (md:ml-64) e padding superior extra no mobile (pt-20) */}
      <main className={`flex-1 transition-all duration-300 md:ml-64 p-6 md:p-8 min-h-screen pt-20 md:pt-8`}>
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}