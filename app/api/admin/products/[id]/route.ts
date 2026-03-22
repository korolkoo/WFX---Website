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

export async function PATCH(
    req: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ==============================================
        // BARREIRA DE SEGURANÇA
        // ==============================================
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
            return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
        }

        const { id } = await params;
        const productId = id;
        
        const body = await req.json();
        const { 
            title, price, description, image_url, stripe_product_id, ...rest 
        } = body;

        const { data: currentProduct } = await supabaseAdmin
            .from('products')
            .select('price, stripe_price_id, stripe_product_id')
            .eq('id', productId)
            .single();

        let newStripePriceId = currentProduct?.stripe_price_id;

        if (parseFloat(price) !== currentProduct?.price) {
            const priceInCents = Math.round(parseFloat(price) * 100);
            const stripePrice = await stripe.prices.create({
                product: stripe_product_id,
                unit_amount: priceInCents,
                currency: 'brl',
            });
            newStripePriceId = stripePrice.id;
        }

        await stripe.products.update(stripe_product_id, {
            name: title,
            description: description || undefined,
            images: image_url ? [image_url] : [],
        });

        const { data, error } = await supabaseAdmin
            .from('products')
            .update({
                ...body,
                price: parseFloat(price),
                stripe_price_id: newStripePriceId
            })
            .eq('id', productId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, product: data });

    } catch (error: any) {
        console.error('Erro na atualização:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}