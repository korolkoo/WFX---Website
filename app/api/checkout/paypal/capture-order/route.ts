import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getEmailTemplate } from "@/lib/emailTemplate";

// ─── Clientes ─────────────────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

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

// ─── Gera Signed URL de 7 dias (idêntico ao webhook Stripe / MP) ─────────────
async function generateSignedUrl(rawUrl: string, productTitle: string): Promise<string> {
  const sevenDays = 60 * 60 * 24 * 7;

  if (rawUrl.includes("/models/")) {
    const path = rawUrl.split("/models/")[1];
    const extension = rawUrl.split(".").pop()?.split("?")[0] ?? "stl";
    const cleanName = `WFX_${productTitle.replace(/[^a-zA-Z0-9]/g, "_")}.${extension}`;
    const { data } = await supabaseAdmin.storage
      .from("models")
      .createSignedUrl(decodeURIComponent(path), sevenDays, { download: cleanName });
    return data?.signedUrl ?? rawUrl;
  }

  if (rawUrl.includes("/final_products/")) {
    const path = rawUrl.split("/final_products/")[1];
    const extension = rawUrl.split(".").pop()?.split("?")[0] ?? "zip";
    const cleanName = `WFX_${productTitle.replace(/[^a-zA-Z0-9]/g, "_")}.${extension}`;
    const { data } = await supabaseAdmin.storage
      .from("final_products")
      .createSignedUrl(decodeURIComponent(path), sevenDays, { download: cleanName });
    return data?.signedUrl ?? rawUrl;
  }

  return rawUrl;
}

// ─── POST /api/checkout/paypal/capture-order ──────────────────────────────────
export async function POST(request: Request) {
  try {
    const { orderId, userId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId obrigatório." }, { status: 400 });
    }

    // ── 1. Captura a order no PayPal ──────────────────────────────────────────
    const accessToken = await getPayPalAccessToken();
    const base = process.env.PAYPAL_BASE_URL ?? "https://api-m.paypal.com";

    const captureRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!captureRes.ok) {
      const errText = await captureRes.text();
      console.error("❌ PayPal capture falhou:", errText);
      return NextResponse.json(
        { error: "Falha ao capturar pagamento PayPal." },
        { status: 400 }
      );
    }

    const captureData = await captureRes.json();

    if (captureData.status !== "COMPLETED") {
      console.warn("⚠️ PayPal capture status:", captureData.status);
      return NextResponse.json(
        { error: `Pagamento não concluído. Status: ${captureData.status}` },
        { status: 400 }
      );
    }

    // ── 2. Recupera dados da pending_order no Supabase ────────────────────────
    const { data: pendingOrder, error: pendingError } = await supabaseAdmin
      .from("pending_orders")
      .select("user_id, product_ids")
      .eq("paypal_order_id", orderId)
      .maybeSingle();

    if (pendingError || !pendingOrder) {
      console.error("❌ pending_order não encontrada para orderId:", orderId);
      return NextResponse.json(
        { error: "Pedido pendente não encontrado." },
        { status: 404 }
      );
    }

    const productIds: number[] = pendingOrder.product_ids;
    const resolvedUserId: string = pendingOrder.user_id ?? userId ?? "";

    // ── 3. Busca dados dos produtos no Supabase ───────────────────────────────
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, title, file_url, zip_url")
      .in("id", productIds);

    if (productsError || !products) {
      console.error("❌ Erro ao buscar produtos:", productsError);
      return NextResponse.json(
        { error: "Erro ao recuperar produtos." },
        { status: 500 }
      );
    }

    // ── 4. Gera Signed URLs de 7 dias ─────────────────────────────────────────
    const orderItems = await Promise.all(
      products.map(async (product: any) => {
        const rawUrl = product.zip_url ?? product.file_url ?? null;
        if (!rawUrl) return { title: product.title, downloadUrl: null };
        const downloadUrl = await generateSignedUrl(rawUrl, product.title);
        return { title: product.title, downloadUrl };
      })
    );

    // ── 5. Extrai e-mail e nome do comprador da resposta do PayPal ─────────────
    const payer = captureData.payer ?? {};
    const customerEmail: string = payer.email_address ?? "";
    const customerName: string = payer.name?.given_name
      ? `${payer.name.given_name} ${payer.name.surname ?? ""}`.trim()
      : "Cliente";

    // ── 6. Registra compras na tabela `purchases` ─────────────────────────────
    if (resolvedUserId) {
      const purchaseRecords = productIds.map((productId) => ({
        user_id: resolvedUserId,
        product_id: productId,
        stripe_session_id: `pp_${orderId}`, // reutiliza campo existente
      }));

      const { error: insertError } = await supabaseAdmin
        .from("purchases")
        .insert(purchaseRecords);

      if (insertError) {
        console.error("❌ Erro ao registrar compras:", insertError);
      }
    }

    // ── 7. Envia e-mail com links de download ─────────────────────────────────
    if (customerEmail) {
      const ordRefId = `#PP${String(orderId).slice(-6).toUpperCase()}`;
      const emailHtml = getEmailTemplate(customerName, ordRefId, orderItems);

      await resend.emails.send({
        from: "WFX <envios@wfxjoias.com>",
        to: customerEmail,
        subject: `💎 Seu Pedido ${ordRefId} está pronto!`,
        html: emailHtml,
      });

      console.log(`✅ PayPal capture finalizado para ${customerEmail} | Order ${orderId}`);
    }

    // ── 8. Remove pending_order (cleanup) ─────────────────────────────────────
    await supabaseAdmin
      .from("pending_orders")
      .delete()
      .eq("paypal_order_id", orderId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Erro capture-order PayPal:", error?.message || error);
    return NextResponse.json(
      { error: "Erro interno ao finalizar pagamento." },
      { status: 500 }
    );
  }
}
