"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => setMounted(true), []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        // O Supabase já sabe quem é o usuário porque ele clicou no link autenticado do e-mail
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            setSuccessMsg('Senha atualizada com sucesso! Redirecionando...');
            setTimeout(() => {
                router.push('/'); // Manda pro perfil (ou login) após sucesso
            }, 2000);
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

            <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">

                <div className="mb-6 relative group cursor-default">
                    <img
                        src="/logo.png"
                        alt="WFX.stl Logo"
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        className="h-24 md:h-28 w-auto drop-shadow-2xl dark:drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] pointer-events-none select-none"
                    />
                </div>

                <div className="w-full bg-white/80 dark:bg-[#0f172a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl shadow-blue-900/5 dark:shadow-black/50 relative">

                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                            <Lock size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                            Nova Senha
                        </h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Crie uma nova senha segura
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        {errorMsg && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                                <CheckCircle2 size={16} /> {successMsg}
                            </div>
                        )}

                        <div className="group relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Digite a nova senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 pr-12 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-wfx-primary focus:ring-1 focus:ring-wfx-primary transition-all"
                                required
                                minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-wfx-primary focus:outline-none transition-colors"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-wfx-primary hover:bg-blue-600 text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-blue-600/20 group mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    ATUALIZAR SENHA
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}