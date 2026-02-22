import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { Resend } from "resend";
import { getEmailTemplate } from "@/lib/emailTemplate"; 
import { createClient } from "@supabase/supabase-js"; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover" as any,
});

const resend = new Resend(process.env.RESEND_API_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || "Cliente";
    const userId = session.metadata?.userId; 
    
    if (customerEmail) {
      try {
        // Buscamos os itens comprados e expandimos o produto para ver os metadados
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'], 
        });

        const orderItems = await Promise.all(lineItems.data.map(async (item: any) => {
            // Puxamos os dados do Stripe
            const productMetadata = item.price?.product?.metadata || {};
            const dbId = productMetadata.db_id;
            const productTitle = item.description || "Produto Digital";
            
            // 1. TENTATIVA: Pegar o link direto dos metadados do Stripe
            let rawUrl = productMetadata.zip_url || productMetadata.file_url || null;

            console.log(`🔍 Processando: ${productTitle}`);
            console.log(`   - Link no Stripe: ${rawUrl ? 'Encontrado' : 'VAZIO'}`);

            // 2. TENTATIVA: Se o Stripe falhou, busca no Banco de Dados (Igual ao Envio Exclusivo)
            if (!rawUrl && dbId) {
                console.log(`   - Buscando ID ${dbId} no Supabase...`);
                const { data: dbProduct } = await supabaseAdmin
                    .from('products')
                    .select('file_url, zip_url')
                    .eq('id', parseInt(dbId))
                    .maybeSingle();
                
                if (dbProduct) {
                    rawUrl = dbProduct.zip_url || dbProduct.file_url;
                    console.log(`   - Link recuperado do Banco: ${rawUrl ? 'Sucesso' : 'Falha'}`);
                }
            }

            let finalDownloadUrl = rawUrl;

            if (rawUrl && rawUrl.includes('/models/')) {
                const path = rawUrl.split('/models/')[1];
                const extension = rawUrl.split('.').pop()?.split('?')[0] || 'stl';
                const cleanFileName = `WFX_${productTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;

                const { data } = await supabaseAdmin.storage
                    .from('models')
                    .createSignedUrl(decodeURIComponent(path), 60 * 60 * 24 * 7, {
                        download: cleanFileName 
                    });
                
                finalDownloadUrl = data?.signedUrl || rawUrl;
            }

            return {
                title: productTitle,
                downloadUrl: finalDownloadUrl
            };
        }));

        // REGISTRO NO BANCO DE DADOS
        if (userId) {
            const purchases = lineItems.data
                .map((item: any) => ({
                    user_id: userId,
                    product_id: item.price?.product?.metadata?.db_id ? parseInt(item.price.product.metadata.db_id) : null,
                    stripe_session_id: session.id
                }))
                .filter(p => p.product_id !== null);

            if (purchases.length > 0) {
                await supabaseAdmin.from('purchases').insert(purchases);
            }
        }

        // ENVIO DO E-MAIL
        const orderId = `#${session.id.slice(-6).toUpperCase()}`;
        const emailHtml = getEmailTemplate(customerName, orderId, orderItems);

        await resend.emails.send({
          from: 'WFX <envios@wfxjoias.com>',
          to: customerEmail,
          subject: `💎 Seu Pedido ${orderId} está pronto!`,
          html: emailHtml,
        });

        console.log(`✅ Fluxo finalizado para ${customerEmail}`);
      } catch (error) {
        console.error("❌ Erro no processamento:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}