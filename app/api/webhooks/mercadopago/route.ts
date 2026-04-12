import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";
import { getEmailTemplate } from "@/lib/emailTemplate";
import crypto from "crypto";

// ─── Clientes ─────────────────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifica assinatura HMAC SHA256 do Mercado Pago.
 * Ref: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function verifyMPSignature(request: Request, body: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // pula verificação se não configurado (dev)

  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? "";

  // Extrai ts e v1 do header x-signature
  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => part.trim().split("=") as [string, string])
  );
  const ts = parts["ts"] ?? "";
  const v1 = parts["v1"] ?? "";

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(v1, "hex")
  );
}

/**
 * Gera Signed URL de 7 dias para arquivos no Supabase Storage.
 * Detecta bucket pelo padrão de URL (/models/ ou /final_products/).
 */
async function generateSignedUrl(
  rawUrl: string,
  productTitle: string
): Promise<string> {
  const sevenDays = 60 * 60 * 24 * 7;

  if (rawUrl.includes("/models/")) {
    const path = rawUrl.split("/models/")[1];
    const extension = rawUrl.split(".").pop()?.split("?")[0] ?? "stl";
    const cleanName = `WFX_${productTitle.replace(/[^a-zA-Z0-9]/g, "_")}.${extension}`;
    const { data } = await supabaseAdmin.storage
      .from("models")
      .createSignedUrl(decodeURIComponent(path), sevenDays, {
        download: cleanName,
      });
    return data?.signedUrl ?? rawUrl;
  }

  if (rawUrl.includes("/final_products/")) {
    const path = rawUrl.split("/final_products/")[1];
    const extension = rawUrl.split(".").pop()?.split("?")[0] ?? "zip";
    const cleanName = `WFX_${productTitle.replace(/[^a-zA-Z0-9]/g, "_")}.${extension}`;
    const { data } = await supabaseAdmin.storage
      .from("final_products")
      .createSignedUrl(decodeURIComponent(path), sevenDays, {
        download: cleanName,
      });
    return data?.signedUrl ?? rawUrl;
  }

  return rawUrl;
}

// ─── POST /api/webhooks/mercadopago ──────────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.text();

  // 1. Verifica assinatura
  if (!verifyMPSignature(request, body)) {
    console.warn("⚠️ Assinatura inválida no webhook do Mercado Pago.");
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  // 2. Filtra apenas notificações de pagamento aprovado
  const isPaymentUpdate =
    event.type === "payment" ||
    event.action === "payment.updated" ||
    event.action === "payment.created";

  if (!isPaymentUpdate) {
    return NextResponse.json({ received: true });
  }

  const paymentId = event.data?.id;
  if (!paymentId) {
    return NextResponse.json({ received: true });
  }

  try {
    // 3. Busca detalhes do pagamento no MP
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
    const mpClient = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status !== "approved") {
      console.log(`ℹ️ Pagamento ${paymentId} com status: ${payment.status} — ignorado.`);
      return NextResponse.json({ received: true });
    }

    const metadata = payment.metadata ?? {};
    const userId: string = metadata.user_id ?? "";
    const productIdsRaw: string = metadata.product_ids ?? "";
    const productIds = productIdsRaw
      .split(",")
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id));

    const customerEmail: string =
      payment.payer?.email ?? "";
    const customerName: string =
      payment.payer?.first_name
        ? `${payment.payer.first_name} ${payment.payer.last_name ?? ""}`.trim()
        : "Cliente";

    if (!customerEmail || productIds.length === 0) {
      console.warn("⚠️ Webhook MP: e-mail ou productIds ausentes no metadata.");
      return NextResponse.json({ received: true });
    }

    // 4. Busca dados dos produtos no Supabase
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, title, file_url, zip_url")
      .in("id", productIds);

    if (productsError || !products) {
      console.error("❌ Erro ao buscar produtos:", productsError);
      return NextResponse.json({ received: true });
    }

    // 5. Gera Signed URLs e monta lista de itens para o e-mail
    const orderItems = await Promise.all(
      products.map(async (product: any) => {
        const rawUrl = product.zip_url ?? product.file_url ?? null;

        if (!rawUrl) {
          return { title: product.title, downloadUrl: null };
        }

        const finalDownloadUrl = await generateSignedUrl(rawUrl, product.title);

        return {
          title: product.title,
          downloadUrl: finalDownloadUrl,
        };
      })
    );

    // 6. Registra compras na tabela `purchases`
    if (userId) {
      const purchaseRecords = productIds.map((productId: number) => ({
        user_id: userId,
        product_id: productId,
        stripe_session_id: `mp_${paymentId}`, // reutiliza campo existente
      }));

      const { error: insertError } = await supabaseAdmin
        .from("purchases")
        .insert(purchaseRecords);

      if (insertError) {
        console.error("❌ Erro ao salvar compras:", insertError);
      }
    }

    // 7. Envia e-mail via Resend
    const orderId = `#MP${String(paymentId).slice(-6).toUpperCase()}`;
    const emailHtml = getEmailTemplate(customerName, orderId, orderItems);

    await resend.emails.send({
      from: "WFX <envios@wfxjoias.com>",
      to: customerEmail,
      subject: `💎 Seu Pedido ${orderId} está pronto!`,
      html: emailHtml,
    });

    console.log(`✅ Webhook MP finalizado para ${customerEmail} | Pedido ${orderId}`);
  } catch (error: any) {
    console.error("❌ Erro no webhook do Mercado Pago:", error?.message || error);
  }

  return NextResponse.json({ received: true });
}
