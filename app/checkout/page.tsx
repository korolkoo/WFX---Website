"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Loader2,
  Lock,
  ShieldCheck,
  ChevronDown,
  Tag,
  Phone,
  Mail,
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

const PayPalWrapper = dynamic(() => import("./PayPalWrapper"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="animate-spin text-slate-500" size={22} />
    </div>
  ),
});

type PaymentMethod = "card" | "pix" | "paypal" | null;

interface PixData {
  qr_code: string;
  qr_code_base64: string;
  payment_id: string;
}

const currencyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// ─── Ícone Cartão SVG ────────────────────────────────────────────────────────
const CardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

// ─── Ícone PIX ───────────────────────────────────────────────────────────────
const PixIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156"/>
  </svg>
);

// ─── Ícone PayPal ────────────────────────────────────────────────────────────
const PayPalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
  </svg>
);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartTotal, discountAmount, finalTotal, clearCart } = useCartStore();

  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [paid, setPaid] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("wfxjoias@gmail.com");
    setEmailCopied(true);
    toast.success("E-mail copiado para a área de transferência!");
    setTimeout(() => setEmailCopied(false), 3000);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login?next=checkout"); return; }
      setUserId(user.id);
    };
    getUser();
  }, [router]);

  useEffect(() => {
    if (isMounted && items.length === 0 && !paid) router.push("/");
  }, [items, router, paid, isMounted]);

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-500" size={32} />
      </main>
    );
  }

  const handleStripeCheckout = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, userId }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { toast.error(data.message || "Erro ao gerar pagamento."); setIsLoading(false); }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handlePixCheckout = async () => {
    if (!userId) return;
    setIsLoading(true);
    setPixData(null);
    try {
      const res = await fetch("/api/checkout/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, items: items.map((i) => ({ id: i.id, quantity: i.quantity || 1 })) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { toast.error(data.error || "Erro ao gerar PIX."); setIsLoading(false); return; }
      setPixData(data);
    } catch { toast.error("Erro ao gerar PIX."); }
    finally { setIsLoading(false); }
  };

  const selectMethod = (method: PaymentMethod) => {
    setActiveMethod(method);
    setPixData(null);
    setCopiedPix(false);
    setIsLoading(false);
    if (method === "pix") handlePixCheckout();
  };

  const copyPix = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.qr_code);
    setCopiedPix(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handlePayPalSuccess = () => { setPaid(true); clearCart(); router.push("/sucesso?method=paypal"); };

  const discount = discountAmount();
  const subtotal = cartTotal();
  const total = finalTotal();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-slate-100 selection:bg-blue-600/30">

      <header className="border-b border-slate-200 dark:border-white/[0.06] backdrop-blur-md bg-white/80 dark:bg-[#0a0a0f]/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-sm"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="WFX"
              className="h-12 w-auto object-contain"
              draggable={false}
            />
            <span className="hidden sm:block w-px h-5 bg-slate-300 dark:bg-white/10" />
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.25em] hidden sm:inline pt-0.5">
              Checkout
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">Pagamento seguro</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-5 py-8 sm:py-14 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 lg:gap-10 lg:items-stretch items-start">

          <aside className="order-1 lg:order-1 h-full">
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.07] shadow-sm dark:shadow-none rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col h-full">

              {items[coverIndex]?.image_url && (
                <div className="relative w-full flex-1 min-h-[160px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <Image
                    src={items[coverIndex].image_url}
                    alt={items[coverIndex].title}
                    fill
                    className="object-cover transition-all duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                    <p className="text-white font-bold text-sm line-clamp-2 drop-shadow-lg">{items[coverIndex].title}</p>
                    {items.length > 1 && (
                      <p className="text-slate-500 dark:text-slate-300 dark:text-slate-400 text-xs mt-0.5">{coverIndex + 1} de {items.length} peças</p>
                    )}
                  </div>
                </div>
              )}

              {items.length > 1 && (
                <div className="flex gap-2 px-3 py-3 overflow-x-auto scrollbar-hide border-b border-slate-100 dark:border-white/[0.05]">
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => setCoverIndex(i)}
                      title={item.title}
                      className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200
                        ${coverIndex === i
                          ? "border-blue-500 scale-105 shadow-lg shadow-blue-500/30"
                          : "border-transparent opacity-50 hover:opacity-80 hover:border-slate-400 dark:hover:border-slate-600"
                        }`}
                    >
                      <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-[130px] overflow-y-auto scrollbar-hide">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => setCoverIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${coverIndex === i ? "bg-slate-50 dark:bg-white/[0.04]" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"}`}
                  >
                    <div className={`w-9 h-9 rounded-lg border overflow-hidden flex-shrink-0 bg-slate-800 transition-colors
                      ${coverIndex === i ? "border-blue-500/60" : "border-white/10"}`}>
                      <Image src={item.image_url} alt={item.title} width={36} height={36} className="w-full h-full object-cover" />
                    </div>
                    <p className="flex-1 text-slate-700 dark:text-slate-300 text-sm font-medium line-clamp-1">{item.title}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-bold flex-shrink-0">{currencyBRL(item.price)}</p>
                  </button>
                ))}
              </div>

              <div className="px-4 py-4 border-t border-slate-200 dark:border-white/[0.07] space-y-2.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>{currencyBRL(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 text-sm font-semibold">
                    <span className="flex items-center gap-1"><Tag size={12} />Leve 4, Pague 3</span>
                    <span>– {currencyBRL(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/[0.07]">
                  <span className="text-slate-900 dark:text-slate-100 font-black">Total</span>
                  <span className="text-slate-900 dark:text-slate-100 font-black text-xl">{currencyBRL(total)}</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="order-2 lg:order-2 space-y-3 flex flex-col h-full">

            <div className="flex items-center pt-2 pb-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.18em]">
                Como você quer pagar?
              </p>
            </div>

            <div className="space-y-3 flex-none">
            <PaymentOption
              id="card"
              active={activeMethod === "card"}
              onClick={() => setActiveMethod(activeMethod === "card" ? null : "card")}
              icon={<CardIcon />}
              label="Cartão de Crédito ou Débito"
              badge={null}
              color="blue"
            >
              <div className="pt-1 pb-2 space-y-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Continue para o ambiente de pagamento seguro. Aceitamos todas as bandeiras.
                </p>
                <button
                  onClick={handleStripeCheckout}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Pagar {currencyBRL(total)}</>}
                </button>
              </div>
            </PaymentOption>

            <PaymentOption
              id="pix"
              active={activeMethod === "pix"}
              onClick={() => selectMethod(activeMethod === "pix" ? null : "pix")}
              icon={<PixIcon />}
              label="PIX"
              badge="Aprovação instantânea"
              color="emerald"
            >
              <div className="pt-1 pb-2">
                {isLoading && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 size={28} className="animate-spin text-emerald-500" />
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Gerando QR Code...</p>
                  </div>
                )}
                {!isLoading && !pixData && (
                  <p className="text-slate-600 dark:text-slate-500 text-sm text-center py-4">
                    Não foi possível gerar o PIX.{" "}
                    <button onClick={handlePixCheckout} className="text-emerald-400 hover:underline">Tentar novamente</button>
                  </p>
                )}
                {!isLoading && pixData && (
                  <div className="space-y-5">
                    <div className="flex justify-center">
                      <div className="bg-white rounded-2xl p-4 shadow-2xl shadow-black/40">
                        {pixData.qr_code_base64 ? (
                          <Image src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" width={180} height={180} className="w-44 h-44" />
                        ) : (
                          <div className="w-44 h-44 bg-slate-100 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs">Indisponível</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-2 text-center font-medium">Ou use o código abaixo:</p>
                      <div className="flex gap-2">
                        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-300 text-xs font-mono">
                          <p className="truncate">{pixData.qr_code}</p>
                        </div>
                        <button
                          onClick={copyPix}
                          className={`flex-shrink-0 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                            copiedPix ? "bg-emerald-600 text-white border-emerald-600" : "bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                          }`}
                        >
                          {copiedPix ? <><CheckCircle size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                        </button>
                      </div>
                    </div>
                    <p className="text-center text-slate-500 text-xs">Após o pagamento, enviaremos os arquivos por e-mail em instantes. ⚡</p>
                  </div>
                )}
              </div>
            </PaymentOption>

            <PaymentOption
              id="paypal"
              active={activeMethod === "paypal"}
              onClick={() => setActiveMethod(activeMethod === "paypal" ? null : "paypal")}
              icon={<PayPalIcon />}
              label="PayPal"
              badge={null}
              color="yellow"
            >
              <div className="pt-1 pb-2 space-y-3">
                <p className="text-slate-600 dark:text-slate-400 text-sm">Pague com sua conta PayPal ou cartão cadastrado.</p>
                {userId && (
                  <PayPalWrapper
                    items={items.map((i) => ({ id: i.id, quantity: i.quantity || 1 }))}
                    userId={userId}
                    onSuccess={handlePayPalSuccess}
                    onError={() => { }}
                  />
                )}
              </div>
            </PaymentOption>
            </div>

            {/* Gap expansível para centralizar verticalmente o cadeado */}
            <div className="flex-1 min-h-[16px] flex flex-col justify-center items-center py-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-600 text-xs text-center">
                <Lock size={11} className="flex-shrink-0" />
                <span>Transação encriptada e protegida</span>
              </div>
            </div>

            {/* ── CARD DE SUPORTE ───────────────────────────────────────────── */}
            <div className="flex-none">
              <div className="rounded-2xl border border-white/[0.07] bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm dark:shadow-none backdrop-blur-sm">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.05]">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.18em]">Precisa de ajuda?</p>
                </div>
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-900/40">
                    G
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-slate-200 font-bold text-sm">Gustavo</p>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                      Suporte WFX · Responde em minutos
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 space-y-2">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/5554996704599"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-100 dark:hover:bg-emerald-600/20 transition-all group"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-400 flex-shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                      +55 (54) 99670-4599
                    </span>
                  </a>

                  {/* E-mail (com funcionalidade de copiar) */}
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all group text-left"
                  >
                    {emailCopied ? (
                      <CheckCircle size={17} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Mail size={17} className="text-slate-600 dark:text-slate-400 flex-shrink-0 group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-colors" />
                    )}
                    <span className={`font-medium text-sm transition-colors truncate ${emailCopied ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-900 dark:hover:text-slate-200"}`}>
                      {emailCopied ? "Copiado!" : "wfxjoias@gmail.com"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

          </section>



        </div>
      </div>
    </main>
  );
}

// ─── Componente reutilizável: opção de pagamento colapsável ──────────────────
interface PaymentOptionProps {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge: string | null;
  color: "blue" | "emerald" | "yellow";
  children: React.ReactNode;
}

const colorMap = {
  blue: {
    border: "border-blue-500/50",
    icon: "bg-blue-600 text-white",
    hover: "hover:border-slate-700",
  },
  emerald: {
    border: "border-emerald-500/50",
    icon: "bg-emerald-600 text-white",
    hover: "hover:border-slate-700",
  },
  yellow: {
    border: "border-yellow-500/50",
    icon: "bg-yellow-500 text-slate-900",
    hover: "hover:border-slate-700",
  },
};

function PaymentOption({ id, active, onClick, icon, label, badge, color, children }: PaymentOptionProps) {
  const c = colorMap[color];
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden
        ${active ? c.border + " bg-slate-50 dark:bg-slate-900" : "border-slate-200 dark:border-white/[0.07] bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none " + c.hover}`}
    >
      {/* Cabeçalho clicável */}
      <button
        id={`payment-option-${id}`}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        onClick={onClick}
        aria-expanded={active}
      >
        {/* Ícone */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
          ${active ? c.icon : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
          {icon}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm transition-colors ${active ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
            {label}
          </p>
          {badge && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">{badge}</p>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={`text-slate-400 dark:text-slate-500 transition-transform flex-shrink-0 ${active ? "rotate-180" : ""}`}
        />
      </button>

      {/* Conteúdo expansível */}
      <div 
        className={`grid transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">
            <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}