import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            title, category, price, usage, description, size, volume, 
            image_url, glb_url, file_url, zip_url, video_360_url, video_real_url, 
            material_config, stones_info 
        } = body;

        if (!title || !price) {
            return NextResponse.json({ error: 'Título e preço são obrigatórios' }, { status: 400 });
        }

        const priceInCents = Math.round(parseFloat(price) * 100);

        // 1. Cria o Produto no Stripe (Iniciamos com metadados básicos)
        const stripeProduct = await stripe.products.create({
            name: title,
            description: description || `Categoria: ${category}`,
            images: image_url ? [image_url] : [],
            metadata: {
                category: category,
                usage: usage
                // O db_id e as URLs entram no passo 4
            }
        });

        // 2. Cria o Preço no Stripe
        const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceInCents,
            currency: 'brl',
        });

        // 3. Salva no Banco de Dados (Supabase)
        const { data: dbProduct, error } = await supabase.from('products').insert({
            title, category, price: parseFloat(price), usage, description, size,
            volume, image_url, glb_url, file_url, zip_url,
            video_360_url, video_real_url, material_config, stones_info,
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id
        }).select().single();

        if (error) throw error;

        // 4. O AJUSTE PARA O WEBHOOK:
        // Agora que temos o ID do banco (dbProduct.id), atualizamos o Stripe
        // Isso garante que o Webhook saiba exatamente o que entregar!
        await stripe.products.update(stripeProduct.id, {
            metadata: {
                db_id: dbProduct.id.toString(),
                zip_url: zip_url || "",
                file_url: file_url || ""
            }
        });

        return NextResponse.json({ success: true, product: dbProduct }, { status: 201 });

    } catch (error: any) {
        console.error('Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}