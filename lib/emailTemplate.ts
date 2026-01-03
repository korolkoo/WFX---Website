export const getEmailTemplate = (
  customerName: string, 
  orderId: string, 
  items: any[]
) => {
  
  // Agora cada item da lista tem seu próprio botão de download
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 14px; color: #374151; font-weight: bold; display: block;">${item.title}</span>
        <span style="font-size: 12px; color: #9ca3af;">Licença de uso individual</span>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${item.downloadUrl ? `
          <a href="${item.downloadUrl}" style="background-color: #2563EB; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
            ⬇ BAIXAR
          </a>
        ` : `
          <span style="color: #ef4444; font-size: 12px;">Link indisponível</span>
        `}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Seu Pedido WFX.stl</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 40px 0;">
    <tr>
      <td align="center">
        
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
          
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #f3f4f6; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: -1px; color: #111827;">
                WFX.stl<span style="color: #2563EB;">.</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #111827; text-align: center;">Pagamento Confirmado! 🎉</h1>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #4b5563; text-align: center;">
                Olá, <strong>${customerName}</strong>. Seu pedido <strong style="color: #2563EB;">${orderId}</strong> foi processado. Seus arquivos estão listados abaixo.
              </p>

              <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 16px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700;">Seus Arquivos para Download</h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  ${itemsHtml}
                </table>

                <p style="margin-top: 20px; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
                  * Ao baixar, você concorda com nossos termos de uso.<br>
                  Links válidos por tempo indeterminado.
                </p>
              </div>

            </td>
          </tr>

          <tr>
            <td style="background-color: #020617; padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #94a3b8;">Obrigado por confiar na WFX.stl</p>
              <p style="margin: 0; font-size: 12px; color: #475569;">© 2025 WFX.stl - Todos os direitos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;
};