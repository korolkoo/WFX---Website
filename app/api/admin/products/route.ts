import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = ['korolkoyuri@gmail.com', 'wfxjoias@gmail.com'];

export async function POST(req: Request) {
    try {
        // ==============================================
        // BARREIRA DE SEGURANÇA
        // ==============================================
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
            return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
        }

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

        const stripeProduct = await stripe.products.create({
            name: title,
            description: description || `Categoria: ${category}`,
            images: image_url ? [image_url] : [],
            metadata: {
                category: category,
                usage: usage
            }
        });

        const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceInCents,
            currency: 'brl',
        });

        const { data: dbProduct, error } = await supabaseAdmin.from('products').insert({
            title, category, price: parseFloat(price), usage, description, size,
            volume, image_url, glb_url, file_url, zip_url,
            video_360_url, video_real_url, material_config, stones_info,
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id
        }).select().single();

        if (error) throw error;

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