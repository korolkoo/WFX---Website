"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Edit, Trash2, Plus, Search, Box, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  image_url: string;
  usage: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  // Função para buscar produtos
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Erro ao buscar:', error);
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const executeDelete = async (id: number) => {
    const toastId = toast.loading('Processando exclusão...');

    try {
      // 1. Busca as URLs
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('image_url, file_url, glb_url, video_360_url, video_real_url')
        .eq('id', id)
        .single();

      if (fetchError) throw new Error('Falha ao localizar os arquivos do produto.');

      // 2. Tenta apagar no banco
      const { error: deleteError } = await supabase.from('products').delete().eq('id', id);

      if (deleteError) {
        if (deleteError.code === '23503') {
          throw new Error('Este produto já possui vendas atreladas e não pode ser excluído.');
        }
        throw new Error('Não foi possível excluir o produto no momento.');
      }

      // 3. Apaga os arquivos do Storage
      const deleteFile = async (url: string | null | undefined, bucket: string) => {
        if (!url) return;
        const urlParts = url.split(`/public/${bucket}/`);
        if (urlParts.length === 2) {
          await supabase.storage.from(bucket).remove([decodeURIComponent(urlParts[1])]);
        }
      };

      await Promise.all([
        deleteFile(product.image_url, 'images'),
        deleteFile(product.file_url, 'models'),
        deleteFile(product.glb_url, 'models'),
        deleteFile(product.video_360_url, 'videos'),
        deleteFile(product.video_real_url, 'videos')
      ]);

      // 4. Remove da tela
      setProducts(products.filter(p => p.id !== id));
      toast.success('Produto e arquivos excluídos!', { id: toastId });

    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  // Função de Deletar
  const handleDelete = (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-bold text-white text-base mb-1">Confirmar Exclusão?</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Isso apagará o produto, imagens e o 3D do servidor <b>para sempre</b>.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id); // Fecha o aviso
              executeDelete(id);   // Roda a exclusão
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-colors shadow-lg shadow-red-900/20"
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    ), {
      duration: Infinity, // Faz o aviso ficar na tela até ele clicar em algo
      style: {
        background: '#0f172a',
        border: '1px solid #334155',
        minWidth: '300px',
      }
    });
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400">Gerencie seu catálogo de alta joalheria.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <Plus size={20} /> Novo Produto
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
        <Search className="text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou categoria..."
          className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-bold tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-2"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                    Carregando catálogo...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Box size={48} className="mx-auto mb-3 opacity-20" />
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-medium text-white group-hover:text-blue-400 transition-colors">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </td>
                    <td className="px-6 py-4">
                      {product.usage === 'Prototipagem' ? (
                        <span className="text-amber-500 text-xs font-bold uppercase">Prototipagem</span>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold uppercase">Borracha</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2 hover:bg-blue-600/20 text-slate-500 hover:text-blue-500 rounded transition-colors"
                          title="Editar Produto"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-600/20 text-slate-500 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}