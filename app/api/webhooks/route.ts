import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { Resend } from "resend";
import { getEmailTemplate } from "@/lib/emailTemplate"; 
import { createClient } from "@supabase/supabase-js"; // IMPORTANTE: Importando o Supabase

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover" as any,
});

const resend = new Resend(process.env.RESEND_API_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// CRIA O CLIENTE ADMIN (Usando a Service Role que colocamos no .env)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

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
    
    // PUXA O ID DO USUÁRIO QUE SALVAMOS LÁ NO CHECKOUT
    const userId = session.metadata?.userId; 
    
    if (customerEmail) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'], 
        });
        
        const orderItems = lineItems.data.map((item: any) => ({
          title: item.description || "Produto Digital",
          downloadUrl: item.price.product.metadata.file_url || null
        }));

        // ==============================================
        // MÁGICA: SALVANDO A COMPRA NO BANCO DE DADOS
        // ==============================================
        if (userId) {
          const purchasesToInsert = lineItems.data.map((item: any) => {
            const dbId = item.price.product.metadata.db_id;
            return {
              user_id: userId,
              product_id: dbId ? parseInt(dbId) : null,
              stripe_session_id: session.id
            };
          }).filter((p: any) => p.product_id !== null); // Garante que tem ID válido

          if (purchasesToInsert.length > 0) {
            const { error: dbError } = await supabaseAdmin.from('purchases').insert(purchasesToInsert);
            if (dbError) {
                console.error("❌ Erro ao salvar no Supabase:", dbError);
            } else {
                console.log("✅ Compra salva no Supabase com sucesso!");
            }
          }
        }

        // ==============================================
        // ENVIO DO E-MAIL
        // ==============================================
        const orderId = `#${session.id.slice(-6).toUpperCase()}`;
        const emailHtml = getEmailTemplate(customerName, orderId, orderItems);

        await resend.emails.send({
          from: 'WFX STL <onboarding@resend.dev>',
          to: customerEmail,
          subject: `💎 Seu Pedido ${orderId} está pronto!`,
          html: emailHtml,
        });

        console.log(`✅ E-mail enviado para ${customerEmail}`);
      } catch (error) {
        console.error("❌ Erro no processamento pós-compra:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}