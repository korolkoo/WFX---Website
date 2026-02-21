import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getEmailTemplate } from '@/lib/emailTemplate';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, productId, notes, customFileUrl } = body;

        const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) throw userError;

        const targetUser = usersData.users.find((u: any) => u.email === email);

        if (!targetUser) {
            return NextResponse.json({ error: 'Cliente não encontrado. Ele precisa fazer login no site uma vez antes.' }, { status: 404 });
        }

        const { data: product, error: productError } = await supabaseAdmin
            .from('products').select('*').eq('id', productId).single();
        
        if (productError || !product) throw new Error('Produto base não encontrado');

        const fakeSessionId = `manual_send_${Date.now()}`;
        
        const { error: dbError } = await supabaseAdmin.from('purchases').insert({
            user_id: targetUser.id,
            product_id: product.id,
            stripe_session_id: fakeSessionId,
            custom_file_url: customFileUrl 
        });

        if (dbError) throw dbError;

        // ==============================================
        // 4. GERA O LINK (SUPABASE OU DRIVE)
        // ==============================================
        let finalDownloadUrl = customFileUrl; // Assumimos que é o Drive por padrão

        // Se for uma URL do nosso próprio banco, geramos o link temporário limpo
        if (customFileUrl.includes('/models/')) {
            const path = customFileUrl.split('/models/')[1];
            const extension = customFileUrl.split('.').pop() || 'stl';
            const cleanFileName = `WFX_${product.title.replace(/[^a-zA-Z0-9]/g, '_')}_Exclusivo.${extension}`;

            const { data: fileData, error: fileError } = await supabaseAdmin
                .storage.from('models').createSignedUrl(decodeURIComponent(path), 60 * 60 * 24 * 7, {
                    download: cleanFileName
                });

            if (fileError) throw fileError;
            finalDownloadUrl = fileData.signedUrl;
        }

        const orderId = `#${fakeSessionId.slice(-6).toUpperCase()}`;
        const finalTitle = notes ? `${product.title} (Personalizado: ${notes})` : `${product.title} (Personalizado)`;
        
        const orderItems = [{
            title: finalTitle,
            downloadUrl: finalDownloadUrl
        }];

        const emailHtml = getEmailTemplate('Cliente VIP', orderId, orderItems);

        await resend.emails.send({
            from: 'WFX <envios@wfxjoias.com>', 
            to: email,
            subject: `💎 Seu Pedido Exclusivo ${orderId} está pronto!`,
            html: emailHtml,
        });

        return NextResponse.json({ success: true, message: 'Arquivo enviado com sucesso!' });

    } catch (error: any) {
        console.error("Erro no envio manual:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}