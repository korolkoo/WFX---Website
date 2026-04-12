import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

// GET /api/checkout/pix/status?payment_id=123456
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("payment_id");

  if (!paymentId) {
    return NextResponse.json({ error: "payment_id obrigatório." }, { status: 400 });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Gateway não configurado." }, { status: 503 });
  }

  try {
    const mpClient = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    // Retorna somente o status — não expõe outros dados do pagamento
    return NextResponse.json({ status: payment.status ?? "pending" });
  } catch (error: any) {
    console.error("❌ Erro ao consultar status PIX:", error?.message || error);
    return NextResponse.json({ status: "pending" }); // fallback seguro
  }
}
