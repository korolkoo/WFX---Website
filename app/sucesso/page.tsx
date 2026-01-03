"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation"; // Import novo
import { Check, Mail, ArrowRight, ShoppingBag, HelpCircle, Download } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

function SuccessContent() {
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    // 1. Limpa o carrinho
    clearCart();

    // 2. Pega o ID real do Stripe na URL
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      // Formata igual ao e-mail: #ULTIMOS6CARACTERES (Ex: #UIEJXF)
      const formattedId = `#${sessionId.slice(-6).toUpperCase()}`;
      setOrderId(formattedId);
    } else {
      // Fallback caso não venha ID (apenas para não quebrar)
      setOrderId(`#${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [clearCart, searchParams]);

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-700 w-full max-w-lg">
          
      {/* Cabeçalho Verde */}
      <div className="bg-green-50 p-8 flex flex-col items-center text-center border-b border-green-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-in zoom-in duration-500">
            <Check className="text-white" size={28} strokeWidth={4} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h1>
        <p className="text-gray-500 text-sm">
          Seu pedido <span className="font-mono font-bold text-gray-700">{orderId}</span> foi processado.
        </p>
      </div>

      {/* Corpo do Cartão */}
      <div className="p-8 space-y-8">
        
        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider text-center mb-6">Próximos Passos</h3>
          
          <div className="relative">
            <div className="absolute left-6 top-2 bottom-6 w-0.5 bg-gray-100"></div>

            <div className="flex gap-4 items-start relative mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 z-10">
                <Mail className="text-blue-600" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Verifique seu E-mail</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Enviamos o recibo e os links de download para o e-mail cadastrado.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start relative">
              <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0 z-10">
                <Download className="text-purple-600" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Baixe seus arquivos STL</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Seus arquivos já estão prontos para prototipagem.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ajuda */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex gap-3 items-start">
          <HelpCircle className="text-gray-400 mt-0.5" size={18} />
          <div className="text-xs text-gray-500">
            <p>
              Não recebeu o e-mail? Verifique sua caixa de Spam ou entre em contato conosco pelo WhatsApp: +55 (54) 99670-4599.
            </p>
          </div>
        </div>

      </div>

      {/* Ações */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 grid gap-3">
        <Link 
          href="/" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
        >
          <ShoppingBag size={20} />
          <span>COMPRAR NOVAMENTE</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <a 
            href="https://wa.me/5554996704599"
            target="_blank"
            className="w-full bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          Preciso de Ajuda
        </a>
      </div>
    </div>
  );
}

export default function Sucesso() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decoração de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* Usamos Suspense porque useSearchParams precisa dele no Next.js App Router */}
        <Suspense fallback={<div className="h-96 w-full bg-white rounded-2xl animate-pulse"></div>}>
          <SuccessContent />
        </Suspense>

        <div className="text-center mt-8 opacity-40 hover:opacity-100 transition-opacity">
          <Link href="/" className="flex items-center justify-center gap-2">
             <span className="text-xl font-bold tracking-tighter text-gray-600">WFX.stl</span>
          </Link>
        </div>
      </div>
    </div>
  );
}