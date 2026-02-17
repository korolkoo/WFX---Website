import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover" as any, 
});

export async function POST(request: Request) {
  try {
    // AGORA RECEBE O userId TAMBÉM
    const { items, userId } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.title,
          images: item.image_url ? [item.image_url] : [],
          metadata: {
             file_url: item.file_url || "",
             // SALVA O ID DO PRODUTO AQUI
             db_id: item.id.toString() 
          }
        },
        unit_amount: Math.round(item.price * 100), 
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      
      // ASSOCIA A SESSÃO AO USUÁRIO LOGADO
      metadata: {
        userId: userId || "", 
      },
      
      success_url: `${request.headers.get("origin")}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/`,
    });

    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error("Erro no Stripe:", error);
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 });
  }
}