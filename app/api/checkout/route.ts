import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { items, userId } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    const itemIds = items.map((item: any) => item.id);

    if (userId) {
      const { data: existingPurchases, error } = await supabaseAdmin
        .from('purchases')
        .select('product_id')
        .eq('user_id', userId)
        .in('product_id', itemIds);

      if (existingPurchases && existingPurchases.length > 0) {
        return NextResponse.json({
          error: "DUPLICATED_ITEMS",
          message: "O usuário já possui itens deste carrinho."
        }, { status: 400 });
      }
    }

    // =================================================================
    // TRAVA 3: RECALCULAR PREÇOS NO SERVIDOR (BLINDAGEM CONTRA FRAUDE)
    // =================================================================
    // Busca os produtos oficiais no banco de dados com base nos IDs
    const { data: officialProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title, price, image_url, file_url, zip_url')
      .in('id', itemIds);

    if (productsError || !officialProducts || officialProducts.length === 0) {
      return NextResponse.json({ error: "Produtos não encontrados no sistema." }, { status: 404 });
    }

    // Mapeia os produtos oficiais encontrados para um dicionário para busca rápida
    const officialProductsMap = officialProducts.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {} as Record<string, any>);

    // RECALCULA O DESCONTO NO BACKEND (COM PREÇOS OFICIAIS)
    const prices: number[] = [];

    // Varre os itens que o frontend pediu e cruza com os dados oficiais
    items.forEach((itemRequest: any) => {
      const officialProduct = officialProductsMap[itemRequest.id];

      if (officialProduct) {
        const qty = itemRequest.quantity || 1;
        for (let i = 0; i < qty; i++) {
          prices.push(officialProduct.price || 0);
        }
      }
    });

    prices.sort((a, b) => a - b);
    const freeItemsCount = Math.floor(prices.length / 4);

    let discountTotal = 0;
    for (let i = 0; i < freeItemsCount; i++) {
      discountTotal += prices[i];
    }

    const lineItems = items.map((itemRequest: any) => {
      const officialProduct = officialProductsMap[itemRequest.id];

      if (!officialProduct) return null;

      const hasFullImageUrl = officialProduct.image_url && officialProduct.image_url.startsWith('http');

      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: officialProduct.title || "Produto WFX",
            images: hasFullImageUrl ? [officialProduct.image_url] : [],
            metadata: {
              db_id: officialProduct.id ? officialProduct.id.toString() : '',
              file_url: officialProduct.file_url || '',
              zip_url: officialProduct.zip_url || ''
            },
          },
          unit_amount: Math.round((officialProduct.price || 0) * 100),
        },
        quantity: itemRequest.quantity || 1,
      };
    }).filter((item: any) => item !== null);

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Nenhum item válido no carrinho." }, { status: 400 });
    }

    const stripeDiscounts = [];

    if (discountTotal > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountTotal * 100),
        currency: 'brl',
        duration: 'once',
        name: 'Promoção: Leve 4, Pague 3'
      });

      stripeDiscounts.push({ coupon: coupon.id });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems as Stripe.Checkout.SessionCreateParams.LineItem[],
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