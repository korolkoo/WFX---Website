"use client";

import { useCartStore } from "@/store/useCartStore";
import { X, Trash2, ShoppingBag, ArrowLeft, Tag } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from "next/navigation";

export default function CartSidebar() {
    const { items, isOpen, toggleCart, removeItem, cartTotal, discountAmount, finalTotal } = useCartStore();
    const router = useRouter();

    const handleCheckout = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toggleCart();
                router.push('/login');
                return;
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items,
                    userId: user.id 
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Erro na resposta do checkout:", data);
                alert("Ocorreu um erro ao gerar o pagamento. Tente novamente.");
            }
        } catch (error) {
            console.error("Erro no checkout:", error);
            alert("Erro de conexão. Verifique sua internet.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end font-sans">
            {/* Fundo Escuro */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={toggleCart}></div>

            {/* Painel Lateral com as cores originais da WFX */}
            <div className="relative w-full max-w-md bg-wfx-bg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-wfx-border">

                {/* Cabeçalho */}
                <div className="p-6 border-b border-wfx-border flex justify-between items-center bg-wfx-card/50">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-wfx-text">
                        <ShoppingBag className="text-wfx-primary" size={22} />
                        Seu Carrinho
                        <span className="text-sm font-normal text-wfx-muted ml-1">({items.length})</span>
                    </h2>
                    <button onClick={toggleCart} className="p-2 hover:bg-wfx-card rounded-full transition-colors text-wfx-muted hover:text-wfx-primary">
                        <X size={24} />
                    </button>
                </div>

                {/* Lista de Itens (Ocupa o meio da tela) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-wfx-muted space-y-4">
                            <ShoppingBag size={64} className="opacity-20" />
                            <p className="font-medium">Seu carrinho está vazio.</p>
                            <button onClick={toggleCart} className="text-wfx-primary font-bold hover:underline flex items-center gap-2 mt-2">
                                <ArrowLeft size={16} /> Voltar para a loja
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="group bg-wfx-card p-4 rounded-lg border border-wfx-border shadow-sm hover:border-wfx-primary/50 transition-all flex gap-4 items-center relative">

                                {/* Imagem */}
                                <div className="w-20 h-20 bg-wfx-bg rounded-md overflow-hidden border border-wfx-border/50 flex-shrink-0">
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                </div>

                                {/* Detalhes */}
                                <div className="flex-1 pr-8">
                                    <h3 className="font-bold text-wfx-text text-sm line-clamp-2 leading-tight mb-2">
                                        {item.title}
                                    </h3>
                                    <div className="text-wfx-primary font-black text-lg tracking-tight">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="absolute top-4 right-4 flex flex-col items-end gap-3">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-wfx-muted hover:text-red-500 transition-colors"
                                        title="Remover item"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="text-[10px] uppercase font-bold text-wfx-muted bg-wfx-bg px-2 py-1 rounded border border-wfx-border whitespace-nowrap">
                                        1 UN
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ======================================================= */}
                {/* RODAPÉ 1: CARRINHO VAZIO (Promoção no fundo da tela)    */}
                {/* ======================================================= */}
                {items.length === 0 && (
                    <div className="p-6 border-t border-wfx-border bg-wfx-card flex flex-col gap-5">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 text-center shadow-inner">
                            <div className="flex justify-center mb-2">
                                <Tag className="text-emerald-500" size={20} />
                            </div>
                            <h4 className="text-emerald-500 font-black text-xs uppercase tracking-wider mb-1.5">Leve 4, Pague 3</h4>
                            <p className="text-[11px] text-wfx-muted leading-tight">
                                Adicione 4 arquivos no carrinho e a peça de menor valor sairá <strong>totalmente de graça!</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* ======================================================= */}
                {/* RODAPÉ 2: CARRINHO CHEIO (Totais e Botão de Comprar)    */}
                {/* ======================================================= */}
                {items.length > 0 && (
                    <div className="p-6 border-t border-wfx-border bg-wfx-card flex flex-col gap-5">

                        {/* ALERTA DA PROMOÇÃO (VOLTOU A SER CONDICIONAL: AZUL -> VERDE) */}
                        <div className={`p-3 rounded-lg text-xs font-bold text-center border transition-colors ${(items.length % 4 === 0)
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' // Verde se atingiu a meta
                                : 'bg-wfx-primary/10 border-wfx-primary/30 text-wfx-primary' // Azul se ainda falta
                            }`}>
                            {items.length % 4 === 0
                                ? '🎉 Parabéns! Você ganhou a peça de menor valor de GRAÇA!'
                                : `Faltam ${4 - (items.length % 4)} peças para ganhar 1 GRÁTIS!`
                            }
                        </div>

                        {/* RESUMO DOS VALORES */}
                        <div className="space-y-3 text-sm font-medium">
                            <div className="flex justify-between text-wfx-muted">
                                <span>Subtotal ({items.length} itens)</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal())}</span>
                            </div>

                            {discountAmount() > 0 && (
                                <div className="flex justify-between text-emerald-500 font-bold">
                                    <span>Desconto (Leve 4, Pague 3)</span>
                                    <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount())}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xl font-black text-wfx-text pt-3 border-t border-wfx-border/50">
                                <span>Total</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal())}</span>
                            </div>
                        </div>

                        {/* BOTÃO RESTAURADO AO AZUL PADRÃO WFX */}
                        <button onClick={handleCheckout} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-blue-600/25 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            FINALIZAR COMPRA &rarr;
                        </button>
                        
                        <button onClick={toggleCart} className="w-full text-wfx-muted hover:text-wfx-primary text-xs font-bold uppercase tracking-wider transition-colors text-center">
                            Continuar Comprando
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}