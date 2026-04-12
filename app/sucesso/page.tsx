"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Mail, ArrowRight, Download, HelpCircle, PackageCheck } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

function SuccessContent() {
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  
  const hasClearedCart = useRef(false);

  useEffect(() => {
    if (!hasClearedCart.current) {
      clearCart();
      hasClearedCart.current = true;
    }

    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      setOrderId(`#${sessionId.slice(-6).toUpperCase()}`);
    } else {
      setOrderId(`#${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [clearCart, searchParams]);

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-blue-900/10 border border-gray-100 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-700 w-full max-w-lg relative z-20 transition-colors">
          
      {/* Cabeçalho Verde */}
      <div className="bg-green-50/80 dark:bg-green-500/10 backdrop-blur-sm p-8 flex flex-col items-center text-center border-b border-green-100 dark:border-green-500/20 transition-colors">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-4 shadow-inner transition-colors">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-in zoom-in duration-500">
            <Check className="text-white" size={28} strokeWidth={4} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Pagamento Confirmado!</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Seu pedido <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{orderId}</span> foi processado com sucesso.
        </p>
      </div>

      {/* Corpo do Cartão */}
      <div className="p-8 space-y-8">
        
        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center mb-6">Próximos Passos</h3>
          
          <div className="relative">
            <div className="absolute left-6 top-2 bottom-6 w-0.5 bg-gray-100 dark:bg-slate-800"></div>

            <div className="flex gap-4 items-start relative mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 z-10 transition-colors">
                <Mail className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-sm">Verifique seu E-mail</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Enviamos o recibo e os links de download para o seu e-mail cadastrado.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start relative">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center flex-shrink-0 z-10 transition-colors">
                <Download className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-sm">Acesse seus Arquivos</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Seus arquivos STL já estão liberados na sua área de usuário.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ajuda */}
        <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-lg p-4 flex gap-3 items-start transition-colors">
          <HelpCircle className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" size={18} />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>
              Alguma dúvida? Entre em contato conosco pelo WhatsApp: <a href="https://wa.me/5554996704599" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">+55 (54) 99670-4599</a>.
            </p>
          </div>
        </div>

      </div>

      {/* Ações */}
      <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 grid gap-3 transition-colors">
        {/* BOTÃO PRINCIPAL: MANDA PRO PERFIL AGORA */}
        <Link 
          href="/perfil" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg shadow-blue-500/20 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
        >
          <PackageCheck size={20} />
          <span>MEUS ARQUIVOS</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link 
            href="/"
            className="w-full bg-white dark:bg-transparent border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-semibold py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          Voltar para a Loja
        </Link>
      </div>
    </div>
  );
}

export default function Sucesso() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] font-sans text-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      
      {/* Decoração de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {/* Blurs no Dark Mode (Menos Opacidade) */}
        <div className="hidden dark:block absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="hidden dark:block absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] bg-indigo-500/5 rounded-full blur-[150px]" />

        {/* Blurs no Light Mode */}
        <div className="dark:hidden absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="dark:hidden absolute top-[-10%] left-[-5%] w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="dark:hidden absolute bottom-[-20%] left-[20%] w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* Usamos Suspense porque useSearchParams precisa dele no Next.js App Router */}
        <Suspense fallback={<div className="h-96 w-full bg-white dark:bg-[#0f172a] rounded-2xl animate-pulse shadow-xl"></div>}>
          <SuccessContent />
        </Suspense>

        <div className="text-center mt-8 opacity-40 hover:opacity-100 transition-opacity">
          <Link href="/" className="flex items-center justify-center gap-2">
             <Image 
               src="/logo.png" 
               alt="WFX Logo" 
               width={90}
               height={35} 
               className="object-contain drop-shadow-lg dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
             />
          </Link>
        </div>

      </div>
    </div>
  );
}