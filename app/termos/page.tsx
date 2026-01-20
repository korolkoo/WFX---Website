"use client";

import { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ScrollText, AlertTriangle, CheckCircle2, Moon, Sun, Mail, Phone, Instagram, CalendarClock } from 'lucide-react';

export default function TermosPage() {
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

                        {/* Logo Aumentada */}
                        <div className="flex-shrink-0 flex items-center cursor-pointer">
                            <Link href="/" className="group py-2">
                                <img
                                    src="/logo.png"
                                    alt="WFX Logo"
                                    // Aumentei de h-12 para h-16 (mobile) e h-20 (desktop)
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

                {/* Cabeçalho do Documento */}
                <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider w-fit">
                            <ScrollText size={14} /> Documento Legal
                        </div>

                        {/* Data de Atualização Profissional */}
                        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-xs font-medium bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/5">
                            <CalendarClock size={14} />
                            <span>Última atualização: <strong>19 de Janeiro de 2026</strong></span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                        Termos de Uso
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                        Ao adquirir arquivos digitais na WFX, você concorda com as condições de licenciamento e propriedade intelectual descritas abaixo.
                    </p>
                </div>

                <div className="space-y-10">

                    {/* Seção 1 */}
                    <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            1. Licença de Uso (O que você pode fazer)
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-7 mb-4">
                            Ao comprar um arquivo digital (STL) neste site, a WFX concede a você uma licença <strong>não exclusiva e intransferível</strong> para:
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                                <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                <span>Utilizar o arquivo para prototipagem 3D e fundição de joias físicas.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                                <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                <span>Produzir e vender as <strong>joias físicas</strong> resultantes do arquivo em escala comercial.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                                <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                <span>Editar o arquivo para ajustes de tamanho ou peso conforme sua necessidade de produção.</span>
                            </li>
                        </ul>
                    </section>

                    {/* Seção 2 */}
                    <section className="bg-red-50/50 dark:bg-red-900/10 p-8 rounded-2xl border border-red-100 dark:border-red-500/20">
                        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                            <AlertTriangle size={20} /> 2. Restrições (O que é proibido)
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-7 mb-4">
                            É estritamente proibido, sob pena da Lei de Direitos Autorais (Lei nº 9.610/98):
                        </p>
                        <ul className="space-y-3 list-disc list-inside text-sm text-gray-600 dark:text-slate-300 marker:text-red-500">
                            <li><strong>Revender, doar, compartilhar ou distribuir</strong> o arquivo digital (STL) original ou modificado.</li>
                            <li>Fazer upload do arquivo em sites de compartilhamento (Thingiverse, Cults3D, grupos de Telegram/WhatsApp, etc.).</li>
                            <li>Utilizar as imagens renderizadas da WFX para comercializar o arquivo digital em outras plataformas.</li>
                        </ul>
                    </section>

                    {/* Seção 3 */}
                    <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-gray-100 dark:border-white/5">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Política de Reembolso</h2>
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-7">
                            Devido à natureza irrevogável dos bens digitais, <strong>não realizamos reembolsos</strong> após o download do arquivo ter sido efetuado, exceto em casos de defeito técnico comprovado.
                        </p>
                    </section>

                    {/* Seção 4 + Contato Bonito */}
                    <section className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-white/5 p-8 rounded-2xl border border-blue-100 dark:border-white/10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Suporte e Garantia</h2>
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-7 mb-8">
                            Garantimos que nossos arquivos são modelados tecnicamente para fundição. Caso encontre dificuldades técnicas, nossa equipe de design está pronta para ajudar.
                        </p>

                        {/* Grid de Contato */}
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
                                <span className="text-xs text-gray-500 mt-1">Questões Técnicas</span>
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