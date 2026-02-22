"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { createClient } from "@/utils/supabase/client"; 

interface BuyButtonProps {
  produto: {
    id: number;
    title: string;
    price: number;
    image_url: string;
    file_url?: string | null;
    zip_url?: string | null;
  };
}

export default function BuyButton({ produto }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              id: produto.id,
              title: produto.title,
              price: produto.price,
              image_url: produto.image_url,
              file_url: produto.file_url,
              zip_url: produto.zip_url,
            }
          ],
          userId: user.id
        }),
      });

      const data = await response.json();

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