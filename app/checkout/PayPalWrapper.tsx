"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import toast from "react-hot-toast";

interface PayPalWrapperProps {
  items: Array<{ id: number; quantity?: number }>;
  userId: string;
  onSuccess: () => void;
  onError: () => void;
}

export default function PayPalWrapper({
  items,
  userId,
  onSuccess,
  onError,
}: PayPalWrapperProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="text-center text-slate-500 text-sm py-4">
        PayPal não configurado neste ambiente.
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "BRL",
        intent: "capture",
      }}
    >
      <div className="w-full">
        <PayPalButtons
          fundingSource="paypal"
          style={{
            layout: "horizontal",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 48,
          }}
          // 1. Cria a Order no servidor (Zero-Trust: preços vêm do banco)
          createOrder={async () => {
            const loadingToast = toast.loading("Criando pedido PayPal...");
            try {
              const res = await fetch("/api/checkout/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, userId }),
              });

              const data = await res.json();
              toast.dismiss(loadingToast);

              if (!res.ok || !data.orderId) {
                toast.error(data.error || "Erro ao criar pedido PayPal.");
                throw new Error(data.error || "Falha na criação da order");
              }

              return data.orderId as string;
            } catch (err) {
              toast.dismiss(loadingToast);
              throw err;
            }
          }}
          // 2. Captura a Order após aprovação do usuário
          onApprove={async (data) => {
            const loadingToast = toast.loading("Confirmando pagamento...");
            try {
              const res = await fetch("/api/checkout/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID, userId }),
              });

              const result = await res.json();
              toast.dismiss(loadingToast);

              if (!res.ok || !result.success) {
                toast.error(result.error || "Erro ao confirmar pagamento.");
                onError();
                return;
              }

              toast.success("Pagamento aprovado! Verifique seu e-mail. 🎉");
              onSuccess();
            } catch (err) {
              toast.dismiss(loadingToast);
              toast.error("Erro ao capturar pagamento.");
              onError();
            }
          }}
          onError={() => {
            toast.error("Ocorreu um erro no PayPal. Tente novamente.");
            onError();
          }}
          onCancel={() => {
            toast("Pagamento PayPal cancelado.", { icon: "ℹ️" });
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
