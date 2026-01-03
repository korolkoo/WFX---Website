import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Ou a versão que você estiver usando
});

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // Prepara os itens para o Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.title,
          images: item.image_url ? [item.image_url] : [],
          // Passamos o link do arquivo aqui para recuperar no Webhook depois
          metadata: {
             file_url: item.file_url || "" 
          }
        },
        unit_amount: Math.round(item.price * 100), 
      },
      quantity: item.quantity,
    }));

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      
      // --- A CORREÇÃO ESTÁ AQUI EMBAIXO ---
      // O trecho `?session_id={CHECKOUT_SESSION_ID}` é OBRIGATÓRIO
      // O Stripe substitui isso automaticamente pelo ID real da transação
      success_url: `${request.headers.get("origin")}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      
      cancel_url: `${request.headers.get("origin")}/`,
    });

    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error("Erro no Stripe:", error);
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 });
  }
}