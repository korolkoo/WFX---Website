"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Package, LogOut, Download, Clock, User as UserIcon, Code, ArrowLeft, Box, Archive } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    async function loadProfileData() {
      // 1. Verifica se está logado
      const { data: { user } } = await supabase.auth.getUser();

      // CASO 1: Não conectado -> Manda para o Login
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. Verifica se é Admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // CASO 2: É Admin -> Manda direto para o Painel Admin
      if (profileData?.role === 'admin') {
        router.push('/admin');
        return;
      }

      // CASO 3: É Cliente -> Carrega o Histórico
      setUser(user);

      // --- ALTERAÇÃO AQUI: Adicionado o zip_url na consulta ---
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select(`
          id,
          created_at,
          custom_file_url,
          products (
            id,
            title,
            image_url,
            file_url,
            zip_url, 
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (purchasesData) {
        setPurchases(purchasesData);
      }

      setLoading(false);
    }

    loadProfileData();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Tela de Loading enquanto decide para onde redirecionar
  if (loading) {
    return (
      <div className="min-h-screen bg-wfx-bg flex flex-col items-center justify-center text-wfx-muted">
        <div className="w-10 h-10 border-4 border-wfx-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wfx-bg text-wfx-text pb-20 font-sans">

      {/* HEADER */}
      <header className="border-b border-wfx-border bg-wfx-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="WFX Logo" width={100} height={40} className="object-contain" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-bold text-wfx-muted hover:text-wfx-primary transition-colors hidden md:block">
              Voltar para Loja
            </Link>
            <button onClick={handleLogout} className="text-sm font-bold text-slate-500 hover:text-red-500 flex items-center gap-2 transition-colors bg-wfx-card px-4 py-2 rounded-lg border border-wfx-border">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* CABEÇALHO DO PERFIL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-wfx-card border border-wfx-border p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-600/20 rounded-full flex items-center justify-center text-blue-500 shadow-inner">
              <UserIcon size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-wfx-text tracking-tight">Minha Área</h1>
              <p className="text-sm text-wfx-muted mt-1">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* HISTÓRICO DE COMPRAS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-wfx-border">
            <Package className="text-blue-500" />
            <h2 className="text-xl font-bold text-wfx-text tracking-tight">Arquivos Adquiridos</h2>
          </div>

          {purchases.length === 0 ? (
            <div className="bg-wfx-card border border-wfx-border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-500 mb-2">
                <Package size={36} opacity={0.5} />
              </div>
              <div>
                <p className="text-lg font-bold text-wfx-text mb-2">Nenhum arquivo na sua biblioteca ainda.</p>
                <p className="text-sm text-wfx-muted max-w-md mx-auto leading-relaxed">
                  Seus arquivos 3D (STL ou ZIP) parecerão aqui automaticamente após a confirmação do pagamento.
                </p>
              </div>
              <Link href="/" className="mt-6 px-8 py-3 bg-wfx-primary text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2">
                <ArrowLeft size={16} /> Explorar Catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {purchases.map((purchase) => {
                const product = purchase.products;
                if (!product) return null;

                const fileToDownload = purchase.custom_file_url || product.zip_url || product.file_url;

                const isExternal = fileToDownload && !fileToDownload.includes('/models/');

                const isPackage = !!product.zip_url || (fileToDownload && (fileToDownload.includes('.zip') || fileToDownload.includes('.rar')));

                // 4. Define visual do botão
                const buttonText = purchase.custom_file_url
                  ? 'BAIXAR ARQUIVO EXCLUSIVO'
                  : (isPackage ? 'BAIXAR PACOTE COMPLETO' : 'BAIXAR ARQUIVO STL');

                const ButtonIcon = isPackage ? Archive : Download;

                return (
                  <div key={purchase.id} className="bg-wfx-card border border-wfx-border rounded-xl p-5 flex gap-5 hover:border-wfx-primary/50 transition-colors shadow-sm group">
                    {/* Imagem do Produto */}
                    <div className="w-28 h-28 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <Box size={32} className="text-slate-700" />
                      )}
                    </div>

                    {/* Detalhes */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {product.category || 'Modelo 3D'}
                          </span>

                          {purchase.custom_file_url && (
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                              ★ Personalizado
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-wfx-text leading-tight line-clamp-2">
                          {product.title}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
                          <Clock size={12} /> Comprado em {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Botão de Download */}
                      {fileToDownload ? (
                        <button
                          onClick={async () => {
                            if (isExternal) {
                              window.open(fileToDownload, '_blank');
                              return;
                            }

                            try {
                              const path = fileToDownload.split('/models/')[1];
                              const extension = fileToDownload.split('.').pop()?.split('?')[0] || 'stl';
                              const isCustom = purchase.custom_file_url ? '_Exclusivo' : '';

                              const cleanFileName = `WFX_${product.title.replace(/[^a-zA-Z0-9]/g, '_')}${isCustom}.${extension}`;

                              const { data } = await supabase.storage
                                .from('models')
                                .createSignedUrl(decodeURIComponent(path), 60, {
                                  download: cleanFileName
                                });

                              if (data?.signedUrl) {
                                const link = document.createElement('a');
                                link.href = data.signedUrl;
                                link.download = cleanFileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else {
                                alert("Erro ao gerar link de download. Tente novamente.");
                              }
                            } catch (e) {
                              console.error(e);
                              alert("Erro ao acessar o arquivo. Contate o suporte.");
                            }
                          }}
                          className={`mt-4 inline-flex items-center justify-center gap-2 text-white py-2.5 px-4 rounded-lg text-[10px] font-bold transition-all w-max shadow-md active:scale-95 ${isPackage
                              ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                            }`}
                        >
                          <ButtonIcon size={14} />
                          {buttonText}
                        </button>
                      ) : (
                        <span className="mt-4 inline-flex items-center gap-2 text-slate-400 text-xs font-bold py-2.5 px-4 bg-slate-800/50 border border-slate-700 rounded-lg w-max cursor-not-allowed">
                          <Code size={14} /> ARQUIVO INDISPONÍVEL
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}