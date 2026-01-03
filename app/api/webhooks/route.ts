import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { Resend } from "resend";
import { getEmailTemplate } from "@/lib/emailTemplate"; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const resend = new Resend(process.env.RESEND_API_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) return NextResponse.json({ error: "No signature" }, { status: 400 });
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || "Cliente";
    
    if (customerEmail) {
      try {
        // 1. Buscamos os itens EXPANDINDO os dados do produto para pegar o metadata
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'], 
        });
        
        // 2. Mapeamos os itens pegando o link que salvamos no passo anterior
        const orderItems = lineItems.data.map((item: any) => ({
          title: item.description || "Produto Digital",
          // O link está dentro de price -> product -> metadata
          downloadUrl: item.price.product.metadata.file_url || null
        }));

        const orderId = `#${session.id.slice(-6).toUpperCase()}`;

        // 3. Geramos o e-mail (Note que removi o "downloadLink" único)
        const emailHtml = getEmailTemplate(
          customerName,
          orderId,
          orderItems
        );

        await resend.emails.send({
          from: 'WFX STL <onboarding@resend.dev>',
          to: customerEmail,
          subject: `💎 Seu Pedido ${orderId} está pronto!`,
          html: emailHtml,
        });

        console.log(`✅ E-mail enviado para ${customerEmail}`);
      } catch (emailError) {
        console.error("❌ Erro ao enviar e-mail:", emailError);
      }
    }
  }

  return NextResponse.json({ received: true });
}