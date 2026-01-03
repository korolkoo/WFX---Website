"use client";

import { useCartStore } from "@/store/useCartStore";
import { X, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

// Inicializa o Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function CartSidebar() {
    const { items, isOpen, toggleCart, removeItem, totalPrice } = useCartStore();

    const handleCheckout = async () => {
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });

            const { url } = await response.json();
            if (url) window.location.href = url;
        } catch (error) {
            console.error("Erro no checkout:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end font-sans">
            {/* Fundo Escuro */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={toggleCart}></div>

            {/* Painel Lateral */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-transparent dark:border-slate-800">

                {/* Cabeçalho */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <ShoppingBag className="text-wfx-primary" size={22} />
                        Seu Carrinho
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({items.length} itens)</span>
                    </h2>
                    <button onClick={toggleCart} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                {/* Lista de Itens */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30 dark:bg-slate-950/30">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 space-y-4">
                            <ShoppingBag size={64} opacity={0.2} />
                            <p className="font-medium text-gray-500 dark:text-slate-500">Seu carrinho está vazio.</p>
                            <button onClick={toggleCart} className="text-wfx-primary font-bold hover:underline flex items-center gap-1">
                                <ArrowLeft size={16} /> Voltar para a loja
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="group bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex gap-4 items-center relative min-h-[110px]">

                                {/* Imagem */}
                                <div className="w-20 h-20 bg-white rounded-lg overflow-hidden border border-gray-100 dark:border-slate-600 flex-shrink-0 relative">
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                                </div>

                                {/* Detalhes */}
                                <div className="flex-1 pr-12 flex flex-col justify-center">
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight mb-2">
                                        {item.title}
                                    </h3>

                                    <div className="flex items-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-extrabold text-lg tracking-tight">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                        </span>
                                    </div>
                                </div>

                                {/* BADGE DE UNIDADE - POSICIONADO NO CANTO SUPERIOR DIREITO */}
                                <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-md transition-colors"
                                        title="Remover item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    
                                    <div className="text-[9px] uppercase font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-sm border border-gray-200 dark:border-slate-600 tracking-wide whitespace-nowrap">
                                        1 UNIDADE
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Rodapé (Totais e Botões) */}
                {items.length > 0 && (
                    <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-gray-500 dark:text-slate-400 font-medium text-lg">Total</span>
                            <span className="font-extrabold text-3xl text-blue-600 dark:text-blue-400 tracking-tight leading-none">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice())}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <button onClick={handleCheckout} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg shadow-lg shadow-green-600/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 group">
                                <span>FINALIZAR COMPRA</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                            </button>

                            <button onClick={toggleCart} className="w-full bg-white dark:bg-transparent border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-[0.98]">
                                Continuar Comprando
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}