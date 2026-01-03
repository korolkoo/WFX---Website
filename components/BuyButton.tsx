"use client"; // Isso avisa ao Next.js: "Esse código roda no navegador, não no servidor"

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

// Carrega o Stripe com a chave PÚBLICA (aquela pk_test_...)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface BuyButtonProps {
  produto: {
    titulo: string;
    preco: string;
    imagemUrl: string;
  };
}

export default function BuyButton({ produto }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);

    try {
      // 1. Chama nossa API (aquela que você criou no route.ts)
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: produto.titulo,
          preco: produto.preco,
          imagemUrl: produto.imagemUrl,
        }),
      });

      const data = await response.json();

      // 2. Se a API devolveu a URL, redireciona o usuário pra lá
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro ao iniciar pagamento");
      }
    } catch (error) {
      console.error(error);
      alert("Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`w-full font-bold text-xl py-4 rounded-xl transition transform hover:scale-105 ${
        loading
          ? "bg-gray-600 cursor-not-allowed text-gray-400"
          : "bg-green-500 hover:bg-green-600 text-black"
      }`}
    >
      {loading ? "Processando..." : "Comprar Agora"}
    </button>
  );
}