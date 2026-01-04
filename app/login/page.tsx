"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // Importando do arquivo que criamos acima
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Login com sucesso -> Manda para o painel
      router.push('/admin');
      router.refresh();
      
    } catch (error: any) {
      console.error('Erro de login:', error);
      setErrorMsg('Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 text-white">
      
      {/* Link para voltar para Home */}
      <Link href="/" className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
        ← Voltar ao Site
      </Link>

      <div className="w-full max-w-md">
        
        {/* Cabeçalho do Card */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-full mb-6 ring-1 ring-blue-500/50">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Área Restrita</h1>
          <p className="text-slate-400">Acesso exclusivo para administração WFX.</p>
        </div>

        {/* Formulário */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Mensagem de Erro */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Email Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="admin@wfx.com"
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Senha de Acesso</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                required 
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Acessar Painel <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Sistema protegido por criptografia de ponta a ponta.
          <br />
          © 2026 WFX Systems.
        </p>

      </div>
    </div>
  );
}