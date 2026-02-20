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
    // Recebemos os dados lá da tela do Gustavo
    const { email, productId, notes, customFileUrl } = body;

    // 1. Verifica se o usuário já existe na plataforma
    const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw userError;

    const targetUser = usersData.users.find((u: any) => u.email === email);

    if (!targetUser) {
        return NextResponse.json({ error: 'Cliente não encontrado. Ele precisa fazer login no site uma vez antes.' }, { status: 404 });
    }

    // 2. Busca o Produto Base (para pegar o título)
    const { data: product, error: productError } = await supabaseAdmin
        .from('products').select('*').eq('id', productId).single();
    
    if (productError || !product) throw new Error('Produto base não encontrado');

    // 3. Salva na sua tabela "purchases"
    const fakeSessionId = `manual_send_${Date.now()}`;
    
    const { error: dbError } = await supabaseAdmin.from('purchases').insert({
        user_id: targetUser.id,
        product_id: product.id,
        stripe_session_id: fakeSessionId,
        custom_file_url: customFileUrl // Salvamos o arquivo exclusivo aqui!
    });

    if (dbError) throw dbError;

    // 4. Gera Link de Download Seguro do arquivo que o Gustavo acabou de subir
    const path = customFileUrl.split('/models/')[1];
    const { data: fileData, error: fileError } = await supabaseAdmin
        .storage.from('models').createSignedUrl(decodeURIComponent(path), 60 * 60 * 24 * 7);

    if (fileError) throw fileError;

    // 5. Prepara os dados para a SUA função de E-mail
    const orderId = `#${fakeSessionId.slice(-6).toUpperCase()}`;
    const finalTitle = notes ? `${product.title} (Personalizado: ${notes})` : `${product.title} (Personalizado)`;
    
    // O seu template espera um array com title e downloadUrl
    const orderItems = [{
        title: finalTitle,
        downloadUrl: fileData.signedUrl
    }];

    const emailHtml = getEmailTemplate('Cliente VIP', orderId, orderItems);

    // 6. Dispara o E-mail pelo Resend
    await resend.emails.send({
      from: 'WFX <envios@wfxjoias.com>', // Quando você tiver um domínio verificado no Resend, troque para envio@wfxjoias.com
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