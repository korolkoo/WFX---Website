"use client";

import Link from 'next/link';
import { useTheme } from "next-themes";
import { Moon, Sun, ShoppingBag, Instagram, Mail, Phone, Code, X, Menu, ArrowRight, MessageCircle } from "lucide-react";
import { useState } from 'react';
import { useCartStore } from "@/store/useCartStore";
import CartSidebar from "@/components/CartSidebar";

export default function AtendimentoPage() {
    const { theme, setTheme } = useTheme();
    const { totalItems, toggleCart } = useCartStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-wfx-bg text-wfx-text font-sans transition-colors flex flex-col">
            <CartSidebar />
            <header className="border-b border-wfx-border sticky top-0 bg-wfx-bg/80 backdrop-blur-md z-50 h-20">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer"><span className="text-xl md:text-2xl font-bold tracking-tighter">WFX.stl</span><div className="w-2 h-2 bg-wfx-primary rounded-full animate-pulse"></div></Link>
                    <nav className="hidden md:flex gap-8 text-sm font-medium text-wfx-muted">
                        <Link href="/" className="hover:text-wfx-primary transition-colors">COLEÇÃO 2025</Link>
                        <Link href="/?action=lancamentos" className="hover:text-wfx-primary transition-colors">LANÇAMENTOS</Link>
                        <Link href="/atendimento" className="hover:text-wfx-primary transition-colors">ATENDIMENTO EXCLUSIVO</Link>
                        <Link href="/?action=sobre" className="hover:text-wfx-primary transition-colors">SOBRE</Link>
                    </nav>
                    <div className="flex items-center gap-2 md:gap-3">
                        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-full hover:bg-wfx-card transition-all text-wfx-muted hover:text-wfx-primary">{theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}</button>
                        <button onClick={toggleCart} className="flex items-center gap-2 px-3 py-2 bg-wfx-primary text-white hover:opacity-90 transition-all text-xs md:text-sm font-bold uppercase tracking-wide rounded-sm shadow-lg shadow-blue-500/20"><ShoppingBag size={16} /><span>Carrinho ({totalItems()})</span></button>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-wfx-text hover:bg-wfx-card rounded-md">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
                    </div>
                </div>
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-wfx-bg border-b border-wfx-border shadow-2xl animate-in slide-in-from-top-5 z-40 text-wfx-text">
                        <nav className="flex flex-col p-6 space-y-4 text-center font-bold text-lg">
                            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">COLEÇÃO 2025</Link>
                            <Link href="/?action=lancamentos" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">LANÇAMENTOS</Link>
                            <Link href="/atendimento" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">ATENDIMENTO EXCLUSIVO</Link>
                            <Link href="/?action=sobre" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary">SOBRE</Link>
                        </nav>
                    </div>
                )}
            </header>
            <main className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-16 h-1 bg-wfx-primary mx-auto rounded-full"></div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-wfx-text leading-tight">Design Sob Medida <br /><span className="text-wfx-primary">para Você.</span></h1>
                    <p className="text-lg md:text-xl text-wfx-muted leading-relaxed">Não achou o que procurava no catálogo mas gostou do meu trabalho?{' '}<br className="hidden md:block" />Me envie uma mensagem que faço a peça exatamente como você gostaria!</p>
                    <div className="grid gap-4 md:grid-cols-2 pt-8">
                        <a href="https://wa.me/5554996704599" target="_blank" className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-green-600/20 transition-all hover:-translate-y-1"><MessageCircle size={24} /> Conversar no WhatsApp</a>
                        <a href="mailto:wfxjoias@gmail.com" className="flex items-center justify-center gap-3 bg-wfx-card border border-wfx-border hover:border-wfx-primary text-wfx-text font-bold py-4 px-8 rounded-lg transition-all hover:bg-wfx-bg"><Mail size={24} /> Enviar E-mail</a>
                    </div>
                    <div className="pt-12 border-t border-wfx-border mt-12">
                        <p className="text-sm text-wfx-muted mb-4">Ou me acompanhe nas redes:</p>
                        <a href="https://instagram.com/WFX" target="_blank" className="inline-flex items-center gap-2 text-wfx-primary font-bold hover:underline"><Instagram size={20} /> @WFX no Instagram</a>
                    </div>
                </div>
            </main>
            <footer className="bg-[#020617] text-white border-t border-slate-800 py-12"><div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500"><p>© 2025 WFX - Todos os direitos reservados.</p><p>Brasil / Rio Grande do Sul</p></div></footer>
        </div>
    );
}