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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const productId = params.id;
        const body = await req.json();
        const { 
            title, price, description, image_url, stripe_product_id, ...rest 
        } = body;

        // 1. Buscar o produto atual no banco para comparar o preço
        const { data: currentProduct } = await supabase
            .from('products')
            .select('price, stripe_price_id, stripe_product_id')
            .eq('id', productId)
            .single();

        let newStripePriceId = currentProduct?.stripe_price_id;

        // 2. Se o preço mudou, criamos um novo no Stripe
        if (parseFloat(price) !== currentProduct?.price) {
            const priceInCents = Math.round(parseFloat(price) * 100);
            const stripePrice = await stripe.prices.create({
                product: stripe_product_id,
                unit_amount: priceInCents,
                currency: 'brl',
            });
            newStripePriceId = stripePrice.id;
        }

        // 3. Atualizar dados básicos do produto no Stripe
        await stripe.products.update(stripe_product_id, {
            name: title,
            description: description || undefined,
            images: image_url ? [image_url] : [],
        });

        // 4. Salvar tudo no Supabase
        const { data, error } = await supabase
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