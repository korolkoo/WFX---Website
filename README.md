# WFX - Modelagem Técnica para Alta Joalheria

O WFX é uma plataforma de e-commerce de alta performance especializada na venda de arquivos digitais (STL) para a indústria de joias. O projeto combina uma experiência visual imersiva em 3D com um fluxo de compra otimizado e seguro.

## 🚀 Tecnologias Utilizadas
* **Framework:** Next.js 15+ (App Router)
* **Linguagem:** TypeScript
* **Estilização:** Tailwind CSS e Lucide React (Ícones)
* **Banco de Dados & Auth:** Supabase (PostgreSQL)
* **Visualização 3D:** Three.js via @react-three/fiber e @react-three/drei
* **Gerenciamento de Estado:** Zustand (Carrinho de compras)
* **Pagamentos:** Stripe API
* **E-mails Transacionais:** Resend API (Geração de templates HTML dinâmicos para entrega de produtos)

## ✨ Funcionalidades Principais

### 💎 Experiência do Produto
* **Visualizador 3D em Tempo Real:** Visualização de modelos GLB/STL com troca dinâmica de materiais (Ouro, Prata, Pedras) diretamente no navegador.
* **Galeria Multimídia:** Suporte para vídeos 360°, vídeos reais e fotos em alta resolução.
* **Cálculo de Peso Automático:** Sistema inteligente que calcula o peso estimado da peça final em diferentes metais (Latão, Prata, Ouro 10k e 18k) baseado no volume do arquivo digital.

### 🛒 E-commerce & Filtros
* **Busca Global Inteligente:** Campo de busca que varre títulos, descrições, especificações de pedras e tamanhos.
* **Filtros Avançados:** Filtragem por categorias (Anéis, Brincos, etc.) e finalidade (Prototipagem ou Molde de Borracha).
* **Carrinho Persistente:** Gerenciamento de itens via Zustand com sincronização local.

## 🔐 Segurança, Infraestrutura e LGPD
* **Zero-Trust Checkout:** Proteção contra *tampering* (falsificação) de carrinho. O backend recalcula e valida todos os preços oficiais diretamente no banco de dados antes de gerar as sessões de pagamento na Stripe.
* **Entrega Segura (Signed URLs):** O download dos arquivos comprados é feito exclusivamente via Webhooks da Stripe, que disparam e-mails automáticos (via Resend) contendo links temporários assinados criptograficamente, expirando em 7 dias.
* **Middleware de Autenticação:** Rotas de administração e APIs de mutação de dados protegidas por verificação de sessão (`supabase.auth.getUser()`) e validação de Role-Based Access Control (RBAC).
* **Conformidade LGPD:** Estrutura preparada com termos de uso específicos para propriedade intelectual de arquivos digitais.

## 🛠️ Estrutura do Banco de Dados (Supabase)
A tabela principal `products` contém os seguintes campos estruturais:
* `title`, `description`, `category`, `price`
* `image_url`, `file_url` (STL), `zip_url`, `glb_url` (Visualizador)
* `video_360_url`, `video_real_url`
* `usage`: (Enum: Prototipagem / Borracha)
* `stones_info`: (String formatada para listagem de gemas)
* `volume` e `size`: (Cálculo de peso e dimensões paramétricas)
* `material_config`: (JSONB armazenando as cores e texturas da pintura digital)
* `stripe_product_id` e `stripe_price_id`: (Sincronização bidirecional com o gateway de pagamento)

---

**Desenvolvido por Yuri Korolko.**
**Ideias de Gustavo Lamonatto Postal.**
**Design da logo de Vithória Bertoncelli.**
