import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";

// ─── Clientes ────────────────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Função auxiliar: recalcula desconto "Leve 4, Pague 3" ──────────────────
function calcDiscount(prices: number[]): number {
  const sorted = [...prices].sort((a, b) => a - b);
  const freeCount = Math.floor(sorted.length / 4);
  return sorted.slice(0, freeCount).reduce((sum, p) => sum + p, 0);
}

// ─── POST /api/checkout/pix ──────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { userId, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Gateway PIX não configurado." },
        { status: 503 }
      );
    }

    // ── Busca e-mail real do usuário no Supabase Auth ────────────────────────
    let payerEmail = "cliente@wfxjoias.com"; // fallback
    if (userId) {
      const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.email) payerEmail = authUser.email;
    }

    // ── ZERO-TRUST: busca preços oficiais no Supabase ────────────────────────
    const itemIds = items.map((i: any) => i.id);

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

    // ── Monta array de preços (respeitando quantity) e calcula total ──────────
    const prices: number[] = [];
    const mpItems: any[] = [];

    items.forEach((item: any) => {
      const official = productMap[item.id];
      if (!official) return;

      const qty = item.quantity || 1;
      for (let i = 0; i < qty; i++) prices.push(official.price);

      mpItems.push({
        id: String(item.id),
        title: official.title,
        quantity: qty,
        unit_price: official.price,
        currency_id: "BRL",
      });
    });

    if (prices.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item válido no carrinho." },
        { status: 400 }
      );
    }

    const discount = calcDiscount(prices);
    const subtotal = prices.reduce((sum, p) => sum + p, 0);
    const total = Math.max(subtotal - discount, 0);

    // ── Cria pagamento PIX no Mercado Pago ───────────────────────────────────
    const mpClient = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(mpClient);

    const paymentData = {
      transaction_amount: Math.round(total * 100) / 100,
      description: `Pedido WFX – ${mpItems.length} arquivo(s)`,
      payment_method_id: "pix" as const,
      payer: {
        email: payerEmail,
      },
      metadata: {
        user_id: userId || "",
        product_ids: itemIds.join(","),
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    };

    const payment = await paymentClient.create({ body: paymentData });

    const pixInfo = payment.point_of_interaction?.transaction_data;

    if (!pixInfo?.qr_code) {
      console.error("❌ Mercado Pago não retornou QR Code:", payment);
      return NextResponse.json(
        { error: "Erro ao gerar QR Code PIX." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payment_id: payment.id,
      qr_code: pixInfo.qr_code,
      qr_code_base64: pixInfo.qr_code_base64 ?? "",
      total,
    });
  } catch (error: any) {
    console.error("❌ Erro PIX:", error?.message || error);
    return NextResponse.json(
      { error: "Erro interno ao gerar PIX." },
      { status: 500 }
    );
  }
}
