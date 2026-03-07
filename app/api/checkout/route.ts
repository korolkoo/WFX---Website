import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover" as any, 
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { items, userId } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // =================================================================
    // TRAVA 2: VERIFICAÇÃO DE SEGURANÇA BACKEND (Bloqueio Definitivo)
    // =================================================================
    if (userId) {
      const itemIds = items.map((item: any) => item.id);
      
      const { data: existingPurchases, error } = await supabase
        .from('purchases')
        .select('product_id')
        .eq('user_id', userId)
        .in('product_id', itemIds);

      // Se encontrar alguma peça que ele já comprou, cancela o checkout!
      if (existingPurchases && existingPurchases.length > 0) {
        return NextResponse.json({ 
          error: "DUPLICATED_ITEMS",
          message: "O usuário já possui itens deste carrinho." 
        }, { status: 400 });
      }
    }

    // ==========================================
    // 1. RECALCULA O DESCONTO NO BACKEND 
    // ==========================================
    const prices: number[] = [];
    items.forEach((item: any) => {
      const qty = item.quantity || 1;
      for (let i = 0; i < qty; i++) {
        prices.push(item.price || 0);
      }
    });

    prices.sort((a, b) => a - b);
    const freeItemsCount = Math.floor(prices.length / 4);
    
    let discountTotal = 0;
    for (let i = 0; i < freeItemsCount; i++) {
      discountTotal += prices[i];
    }

    // ==========================================
    // 2. MONTA OS ITENS PARA O STRIPE
    // ==========================================
    const lineItems = items.map((item: any) => {
      const hasFullImageUrl = item.image_url && item.image_url.startsWith('http');
      
      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: item.title || "Produto WFX",
            images: hasFullImageUrl ? [item.image_url] : [], 
            metadata: {
              db_id: item.id ? item.id.toString() : '',
              file_url: item.file_url || '',
              zip_url: item.zip_url || ''
            },
          },
          unit_amount: Math.round((item.price || 0) * 100), 
        },
        quantity: 1, 
      };
    });

    // ==========================================
    // 3. CRIA O CUPOM DO STRIPE SE HOUVER DESCONTO
    // ==========================================
    const stripeDiscounts = [];
    
    if (discountTotal > 0) {
      // Cria um cupom dinâmico e descartável direto no Stripe!
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountTotal * 100), 
        currency: 'brl',
        duration: 'once',
        name: 'Promoção: Leve 4, Pague 3'
      });
      
      stripeDiscounts.push({ coupon: coupon.id });
    }

    // ==========================================
    // 4. GERA A SESSÃO DE CHECKOUT
    // ==========================================
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], 
      line_items: lineItems,
      mode: "payment",
      discounts: stripeDiscounts.length > 0 ? stripeDiscounts : undefined, 
      metadata: {
        userId: userId || "", 
      },
      success_url: `${request.headers.get("origin")}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/`,
    });

    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("❌ ERRO DETALHADO DO STRIPE:", error.message);
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 });
  }
}