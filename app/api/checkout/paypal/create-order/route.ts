import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Clientes ─────────────────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Obtém token de acesso do PayPal ─────────────────────────────────────────
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const base = process.env.PAYPAL_BASE_URL ?? "https://api-m.paypal.com";

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`PayPal auth falhou: ${error}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ─── Função auxiliar: recalcula desconto "Leve 4, Pague 3" ──────────────────
function calcDiscount(prices: number[]): number {
  const sorted = [...prices].sort((a, b) => a - b);
  const freeCount = Math.floor(sorted.length / 4);
  return sorted.slice(0, freeCount).reduce((sum, p) => sum + p, 0);
}

// ─── POST /api/checkout/paypal/create-order ───────────────────────────────────
export async function POST(request: Request) {
  try {
    const { userId, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Gateway PayPal não configurado." },
        { status: 503 }
      );
    }

    // ── ZERO-TRUST: busca preços oficiais no Supabase ─────────────────────────
    const itemIds: number[] = items.map((i: any) => i.id);

    // ── TRAVA ANTI-DUPLICATA ──────────────────────────────────────────────────
    if (userId) {
      const { data: existingPurchases } = await supabaseAdmin
        .from("purchases")
        .select("product_id")
        .eq("user_id", userId)
        .in("product_id", itemIds);

      if (existingPurchases && existingPurchases.length > 0) {
        return NextResponse.json(
          { error: "DUPLICATED_ITEMS", message: "Você já possui um ou mais itens deste carrinho." },
          { status: 400 }
        );
      }
    }

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, title, price")
      .in("id", itemIds);

    if (productsError || !products || products.length === 0) {
      return NextResponse.json(
        { error: "Produtos não encontrados." },
        { status: 404 }
      );
    }

    const productMap: Record<number, { title: string; price: number }> =
      products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

    // ── Calcula totais com preços oficiais ────────────────────────────────────
    const prices: number[] = [];
    const breakdown: Array<{ title: string; unitPrice: number; quantity: number }> = [];

    items.forEach((item: any) => {
      const official = productMap[item.id];
      if (!official) return;
      const qty = item.quantity || 1;
      for (let i = 0; i < qty; i++) prices.push(official.price);
      breakdown.push({ title: official.title, unitPrice: official.price, quantity: qty });
    });

    if (prices.length === 0) {
      return NextResponse.json({ error: "Nenhum item válido." }, { status: 400 });
    }

    const discount = calcDiscount(prices);
    const subtotal = prices.reduce((sum, p) => sum + p, 0);
    const total = Math.max(subtotal - discount, 0);
    const fmt = (n: number) => n.toFixed(2);

    // ── Cria Order no PayPal ───────────────────────────────────────────────────
    const accessToken = await getPayPalAccessToken();
    const base = process.env.PAYPAL_BASE_URL ?? "https://api-m.paypal.com";

    const orderPayload: any = {
      intent: "CAPTURE",
      purchase_units: [
        {
          description: `WFX – ${breakdown.length} arquivo(s)`,
          amount: {
            currency_code: "BRL",
            value: fmt(total),
            breakdown: {
              item_total: { currency_code: "BRL", value: fmt(subtotal) },
              discount: { currency_code: "BRL", value: fmt(discount) },
            },
          },
          items: breakdown.map((b) => ({
            name: b.title.substring(0, 127), // PayPal limita 127 chars
            unit_amount: { currency_code: "BRL", value: fmt(b.unitPrice) },
            quantity: String(b.quantity),
            category: "DIGITAL_GOODS",
          })),
          custom_id: JSON.stringify({ userId: userId ?? "", productIds: itemIds }),
        },
      ],
    };

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "PayPal-Request-Id": `WFX-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error("❌ PayPal create-order falhou:", errText);
      return NextResponse.json(
        { error: "Erro ao criar pedido no PayPal." },
        { status: 500 }
      );
    }

    const order = await orderRes.json();

    // ── Salva order pendente no Supabase para o capture verificar ─────────────
    await supabaseAdmin.from("pending_orders").insert({
      paypal_order_id: order.id,
      user_id: userId ?? null,
      product_ids: itemIds,
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error: any) {
    console.error("❌ Erro create-order PayPal:", error?.message || error);
    return NextResponse.json(
      { error: "Erro interno ao processar PayPal." },
      { status: 500 }
    );
  }
}
