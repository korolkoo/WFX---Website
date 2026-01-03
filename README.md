WFX.stl - Modelagem Técnica para Alta Joalheria
O WFX.stl é uma plataforma de e-commerce de alta performance especializada na venda de arquivos digitais (STL e 3DM) para a indústria de joias. O projeto combina uma experiência visual imersiva em 3D com um fluxo de compra otimizado e seguro.

🚀 Tecnologias Utilizadas
Framework: Next.js 15+ (App Router)
Linguagem: TypeScript
Estilização: Tailwind CSS e Lucide React (Ícones)
Banco de Dados & Auth: Supabase (PostgreSQL)
Visualização 3D: Three.js via @react-three/fiber e @react-three/drei
Gerenciamento de Estado: Zustand (Carrinho de compras)
Pagamentos: Stripe API

✨ Funcionalidades Principais
💎 Experiência do Produto
Visualizador 3D em Tempo Real: Visualização de modelos GLB/STL com troca dinâmica de materiais (Ouro, Prata, Pedras) diretamente no navegador.
Galeria Multimídia: Suporte para vídeos 360°, vídeos reais e fotos em alta resolução.
Cálculo de Peso Automático: Sistema inteligente que calcula o peso estimado da peça final em diferentes metais (Latão, Prata, Ouro 10k e 18k) baseado no volume do arquivo digital.

🛒 E-commerce & Filtros
Busca Global Inteligente: Campo de busca que varre títulos, descrições, especificações de pedras e tamanhos.
Filtros Avançados: Filtragem por categorias (Anéis, Brincos, etc.) e finalidade (Prototipagem ou Molde de Borracha).
Carrinho Persistente: Gerenciamento de itens via Zustand com sincronização local.

🔐 Segurança e LGPD
Arquitetura Serverless: Segurança nas transações e proteção de dados sensíveis.
Conformidade: Estrutura preparada para LGPD com termos de uso específicos para propriedade intelectual de arquivos digitais.

🛠️ Estrutura do Banco de Dados (Supabase)
A tabela principal products contém os seguintes campos:

title, description, category, price
image_url, file_url, glb_url
usage: (Enum: Prototipagem / Borracha)
stones_info: (String formatada para listagem de gemas)
volume: (Float para cálculo de peso)
size: (String de dimensões)

Desenvolvido por Yuri Korolko.
Ideias de Gustavo Lamonatto Postal.
Design da logo de Vithoria Bertoncelli.
