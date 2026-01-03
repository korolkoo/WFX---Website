import Link from "next/link";

interface ProductCardProps {
  id: number;
  titulo: string;
  preco: string;
  descricao: string;
  imagem?: string;
}

export default function ProductCard({ id, titulo, preco, descricao, imagem }: ProductCardProps) {
  return (
    // 1. O Link vira o "Pai" de tudo.
    // O href é montado dinamicamente: "/produto/" + o ID do produto (ex: /produto/1)
    <Link href={`/produto/${id}`} className="group block h-full">
      
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition h-full flex flex-col justify-between">
        
        {/* Bloco de cima: Imagem e Textos */}
        <div>
            {/* Área da Imagem */}
            <div className="h-48 bg-gray-700 rounded mb-4 overflow-hidden relative">
              {imagem ? (
                  <img 
                    src={imagem} 
                    alt={titulo} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300" 
                  />
              ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                      [Sem Imagem]
                  </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{titulo}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{descricao}</p>
        </div>
        
        {/* Bloco de baixo: Preço e Botão */}
        <div className="flex justify-between items-center mt-auto">
          <span className="text-lg font-bold text-green-400">{preco}</span>
          <span className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 py-1 rounded cursor-pointer">
            Comprar
          </span>
        </div>

      </div>
    </Link>
  );
}