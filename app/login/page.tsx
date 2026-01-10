"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle, Moon, Sun, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from "next-themes";

// Ícone Google Original
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
);

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      }
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setErrorMsg('Email ou senha incorretos.');
            setLoading(false);
        } else {
            router.push('/admin');
            router.refresh();
        }
    } else {
        const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`
            }
        });
        
        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            setSuccessMsg('Cadastro realizado! Verifique seu e-mail para confirmar.');
            setLoading(false);
        }
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex items-center justify-center p-4 relative font-sans transition-colors duration-500 overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-blue-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Botões de Topo (Fixo e com z-index alto para não sobrepor no clique) */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
        <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-wfx-primary transition-all whitespace-nowrap">
          Voltar ao Site
        </Link>
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-full bg-white/50 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-wfx-primary transition-all backdrop-blur-sm shadow-sm"
        >
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Container Principal */}
      {/* pt-20 no mobile para empurrar o conteúdo para baixo da header absoluta */}
      {/* md:pt-0 no desktop para centralizar verticalmente */}
      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center pt-20 md:pt-0">
        
        {/* LOGO */}
        {/* mb-6 (reduzi de mb-10) para aproximar a logo do card */}
        <div className="mb-6 relative group cursor-default">
            {/* Glow */}
            <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-150"></div>
            
            {/* Imagem */}
            <img 
                src="/logo.png" 
                alt="WFX.stl Logo" 
                className="h-28 md:h-32 w-auto relative z-10 drop-shadow-2xl dark:drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-transform duration-300 hover:scale-105" 
            />
        </div>

        <div className="w-full bg-white/80 dark:bg-[#0f172a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl shadow-blue-900/5 dark:shadow-black/50 overflow-hidden relative">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-1 animate-in fade-in slide-in-from-bottom-2">
                {view === 'login' ? 'Bem-vindo(a)' : 'Criar Conta'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-3 delay-75">
                {view === 'login' ? 'Acesse para gerenciar modelos' : 'Preencha os dados abaixo'}
            </p>
          </div>

          <div className="space-y-6">
            
            <form onSubmit={handleAuth} className="space-y-4">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              <div className="space-y-4">
                <div className="group">
                    <input 
                    type="email" 
                    placeholder="Seu E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-wfx-primary focus:ring-1 focus:ring-wfx-primary transition-all"
                    required
                    />
                </div>

                <div className="group">
                    <input 
                    type="password" 
                    placeholder="Sua Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-wfx-primary focus:ring-1 focus:ring-wfx-primary transition-all"
                    required
                    minLength={6}
                    />
                </div>
                
                {view === 'login' && (
                    <div className="flex justify-end">
                        <Link href="#" className="text-[10px] font-bold text-gray-400 hover:text-wfx-primary transition-colors uppercase tracking-wider">
                            Esqueceu a senha?
                        </Link>
                    </div>
                )}
              </div>

              <button 
                disabled={loading}
                className="w-full bg-wfx-primary hover:bg-blue-600 text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-blue-600/20 group"
              >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 
                ) : (
                    <>
                        {view === 'login' ? 'ENTRAR' : 'CADASTRAR'} 
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                    </>
                )}
              </button>
            </form>

            <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                    {view === 'login' ? "Não tem uma conta? " : "Já tem uma conta? "}
                    <button 
                        onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setErrorMsg(null); setSuccessMsg(null); }}
                        className="text-wfx-primary font-bold hover:underline transition-all"
                    >
                        {view === 'login' ? "Cadastre-se" : "Faça Login"}
                    </button>
                </p>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
              <span className="flex-shrink mx-4 text-[9px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest">ou</span>
              <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-700 font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-md border border-gray-200"
            >
              <GoogleIcon />
              <span>{view === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}</span>
            </button>

          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-400 dark:text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
            Ao continuar, você concorda com os <Link href="/termos" className="text-gray-500 dark:text-slate-400 hover:text-wfx-primary underline decoration-dotted">Termos de Uso</Link> e a <Link href="/privacidade" className="text-gray-500 dark:text-slate-400 hover:text-wfx-primary underline decoration-dotted">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  );
}