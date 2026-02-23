"use client";

import { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, Lock, Database, CalendarClock, Moon, Sun, Eye, History, Cloud, Phone, Mail, Instagram } from 'lucide-react';

export default function PrivacidadePage() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] text-gray-800 dark:text-gray-200 font-sans transition-colors duration-500 flex flex-col">

            {/* --- HEADER --- */}
            <header className="sticky top-0 w-full z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-24 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex items-center justify-between h-full">

                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center cursor-pointer">
                            <Link href="/" className="group py-2">
                                <Image
                                    src="/logo.png"
                                    alt="WFX Logo"
                                    width={80}
                                    height={32}
                                    className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                />
                            </Link>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="p-2.5 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-all"
                            >
                                {theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
                            </button>

                            <Link
                                href="/"
                                className="hidden md:flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-white/10 rounded-full hover:border-blue-600 dark:hover:border-white transition-all shadow-sm"
                            >
                                <ArrowLeft size={16} />
                                Voltar
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="flex-grow max-w-4xl mx-auto px-6 pt-12 md:pt-16 pb-24 w-full">

                {/* Cabeçalho */}
                <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider w-fit">
                            <ShieldCheck size={14} /> Lei Geral de Proteção de Dados
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-xs font-medium bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/5">
                            <CalendarClock size={14} />
                            <span>Última atualização: <strong>19 de Janeiro de 2026</strong></span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                        Política de Privacidade
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                        Sua privacidade é séria. Entenda como a WFX coleta, protege e utiliza seus dados em conformidade com a LGPD.
                    </p>
                </div>

                {/* Cards de Destaque */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-blue-500/30 transition-all shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-wfx-primary mb-4">
                            <Lock size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Dados Protegidos</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-6">
                            Utilizamos criptografia de ponta a ponta. Não armazenamos números de cartão de crédito; o processamento é exclusivo via Stripe/Gateway Seguro.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-green-500/30 transition-all shadow-sm">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                            <Database size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Coleta Mínima</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-6">
                            Coletamos apenas o essencial para a prestação do serviço: seu E-mail (login/envio) e Nome (identificação), respeitando o princípio da necessidade da LGPD.
                        </p>
                    </div>
                </div>

                <div className="space-y-12">

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            1. Coleta de Dados
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-7 mb-4">
                            Coletamos informações quando você se cadastra em nosso site, faz um pedido ou entra em contato conosco. As informações coletadas incluem seu nome e endereço de e-mail fornecidos via Google Auth ou cadastro direto.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            2. Uso das Informações
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-7 mb-4">
                            Qualquer informação que coletamos de você pode ser usada para:
                        </p>
                        <ul className="grid md:grid-cols-2 gap-3">
                            <li className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-lg text-sm text-gray-700 dark:text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                Personalizar sua experiência no site.
                            </li>
                            <li className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-lg text-sm text-gray-700 dark:text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                Processar transações de forma segura.
                            </li>
                            <li className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-lg text-sm text-gray-700 dark:text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                Enviar e-mails com links de download.
                            </li>
                            <li className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-lg text-sm text-gray-700 dark:text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                Administrar histórico de compras.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            3. Armazenamento de Dados e Histórico
                        </h2>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                            <p className="text-sm text-gray-600 dark:text-slate-300 leading-7 mb-6">
                                Transparência total sobre onde seus dados ficam. Não utilizamos rastreadores de publicidade de terceiros.
                            </p>

                            <div className="space-y-6">
                                {/* Bloco Nuvem */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                                        <Cloud size={14} /> Armazenamento em Nuvem (Seguro)
                                    </h4>
                                    <ul className="space-y-3 text-sm text-gray-600 dark:text-slate-300">
                                        <li className="flex items-start gap-3 bg-white dark:bg-black/20 p-3 rounded-lg border border-blue-100 dark:border-white/5">
                                            <History size={18} className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                            <div>
                                                <span className="block font-bold text-gray-900 dark:text-white text-xs uppercase mb-1">Histórico de Vendas Vitalício</span>
                                                <span className="text-xs leading-relaxed">
                                                    Armazenamos permanentemente seu histórico de pedidos em nosso banco de dados seguro (Supabase) para garantir que você tenha <strong>acesso vitalício aos downloads</strong> dos arquivos STL adquiridos.
                                                </span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                {/* Bloco Local */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                                        <Eye size={14} /> No seu Dispositivo (Cookies Locais)
                                    </h4>
                                    <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-slate-300">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                            <span><strong>Sessão:</strong> Mantém você logado.</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                            <span><strong>Carrinho:</strong> Salva itens temporariamente.</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                            <span><strong>Tema:</strong> Salva preferência (Dark/Light).</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            4. Seus Direitos e Contato
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-7 mb-8">
                            Você tem o direito de solicitar o acesso, retificação ou exclusão (Direito ao Esquecimento) de seus dados a qualquer momento. Para exercer seus direitos LGPD ou tirar dúvidas, entre em contato através dos canais abaixo.
                        </p>

                        {/* GRID DE CONTATO (Igual ao Termos) */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <a href="https://wa.me/5554996704599" target="_blank" className="group flex flex-col items-center justify-center bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-md cursor-pointer">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-3 group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm">WhatsApp</span>
                                <span className="text-xs text-gray-500 mt-1">Suporte Rápido</span>
                            </a>

                            <a href="mailto:wfxjoias@gmail.com" className="group flex flex-col items-center justify-center bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md cursor-pointer">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                                    <Mail size={20} />
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm">E-mail</span>
                                <span className="text-xs text-gray-500 mt-1">Questões LGPD</span>
                            </a>

                            <a href="https://instagram.com/wfx.joias" target="_blank" className="group flex flex-col items-center justify-center bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-pink-500 dark:hover:border-pink-500 transition-all hover:shadow-md cursor-pointer">
                                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 mb-3 group-hover:scale-110 transition-transform">
                                    <Instagram size={20} />
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm">Instagram</span>
                                <span className="text-xs text-gray-500 mt-1">Acompanhe Novidades</span>
                            </a>
                        </div>
                    </section>

                </div>

            </main>

            {/* --- FOOTER --- */}
            <footer className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#020617] py-10 shrink-0 transition-colors">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px]">

                    {/* Lado Esquerdo: Marca & Dados Legais */}
                    <div className="flex flex-col gap-4 md:text-left text-center">

                        {/* Linha Logo + Copyright (Corrigido: Mais nítido) */}
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="opacity-60 hover:opacity-100 transition-opacity">
                                <Image
                                    src="/logo.png"
                                    alt="WFX"
                                    width={50}
                                    height={20}
                                    className="object-contain"
                                />
                            </div>
                            {/* Separador Vertical (só no desktop) */}
                            <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-white/10"></div>

                            <p className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                                © 2026 WFX - Todos os direitos reservados.
                            </p>
                        </div>

                        {/* Bloco de Dados Fiscais (Sem contatos) */}
                        <div className="text-gray-400 dark:text-gray-500 font-medium leading-relaxed opacity-80">
                            <p>
                                Gustavo Lamonatto Postal | CNPJ: 64.248.071/0001-90
                            </p>
                            <p className="mt-1">
                                Rua Rodrigues Alves, 162 - Bairro São José, Guaporé - RS
                            </p>
                        </div>
                    </div>

                    {/* Lado Direito: Localização (Corrigido: Mais nítido) */}
                    <div className="text-center md:text-right">
                        <p className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                            Brasil / Rio Grande do Sul
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}