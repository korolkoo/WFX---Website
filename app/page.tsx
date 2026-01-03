"use client";

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from "next-themes";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Moon, Sun, ShoppingBag, Instagram, Mail, Phone, Code, ChevronLeft, ChevronRight, X, Menu, Filter, Search } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import CartSidebar from "@/components/CartSidebar";
import Image from 'next/image';

// Importação Dinâmica do 3D
const Hero3D = dynamic(() => import("@/components/Hero3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-wfx-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ITEMS_PER_PAGE = 9;

interface Product {
  id: number;
  title: string;
  category: string;
  usage: 'Prototipagem' | 'Borracha';
  price: number;
  image_url: string;
  description?: string;
  stones_info?: string; 
  size?: string;         
}

function HomeContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const { totalItems, toggleCart } = useCartStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUsage, setSelectedUsage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categoriesList = ['Anéis', 'Berloques', 'Brincos', 'Escapulários', 'Gargantilhas', 'Pingentes', 'Pulseiras'];

  useEffect(() => {
    setMounted(true);
    async function fetchGlobalTotal() {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      if (count) setGlobalTotal(count);
    }
    fetchGlobalTotal();
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action) {
      if (action === 'lancamentos') {
        setSelectedCategory(null);
        setSelectedUsage(null);
        setSearchTerm('');
        setSortOrder('newest');
        setPage(1);
        setTimeout(() => {
          const section = document.getElementById('catalogo');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
      else if (action === 'sobre') {
        setTimeout(() => {
          const section = document.getElementById('sobre');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      let query = supabase.from('products').select('*', { count: 'exact' });
      if (selectedCategory) query = query.eq('category', selectedCategory);
      if (selectedUsage) query = query.eq('usage', selectedUsage);
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,stones_info.ilike.%${searchTerm}%,size.ilike.%${searchTerm}%,usage.ilike.%${searchTerm}%`);
      }
      if (sortOrder === 'price_asc') query = query.order('price', { ascending: true });
      else if (sortOrder === 'price_desc') query = query.order('price', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) console.error('Erro ao buscar produtos:', error);
      else {
        setProducts(data as Product[]);
        setTotalFiltered(count || 0);
      }
      setLoading(false);
    }
    const timer = setTimeout(() => { fetchProducts(); }, 400);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedUsage, page, sortOrder, searchTerm]);

  const handleCategoryChange = (category: string) => {
    if (selectedCategory === category) setSelectedCategory(null);
    else setSelectedCategory(category);
    setPage(1);
  };

  const handleUsageChange = (usage: string) => {
    if (selectedUsage === usage) setSelectedUsage(null);
    else setSelectedUsage(usage);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedUsage(null);
    setSearchTerm('');
    setSortOrder('newest');
    setPage(1);
  }

  const handleLancamentosClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clearFilters();
    setSortOrder('newest');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const section = document.getElementById('catalogo');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSobreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const section = document.getElementById('sobre');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-wfx-bg text-wfx-text font-sans transition-colors pb-0">
      <CartSidebar />

      <header className="border-b border-wfx-border sticky top-0 bg-wfx-bg/80 backdrop-blur-md z-50 h-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={scrollToTop}>
            <Image src="/logo.png" alt="WFX Logo" width={100} height={40} priority className="object-contain" />
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-wfx-muted">
            <a href="#" className="hover:text-wfx-primary transition-colors">COLEÇÃO 2025</a>
            <a href="#catalogo" onClick={handleLancamentosClick} className="hover:text-wfx-primary transition-colors">LANÇAMENTOS</a>
            <Link href="/atendimento" className="hover:text-wfx-primary transition-colors">ATENDIMENTO EXCLUSIVO</Link>
            <a href="#sobre" onClick={handleSobreClick} className="hover:text-wfx-primary transition-colors">SOBRE</a>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-full hover:bg-wfx-card transition-all text-wfx-muted hover:text-wfx-primary">
              {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button onClick={toggleCart} className="flex items-center gap-2 px-3 py-2 bg-wfx-primary text-white hover:opacity-90 transition-all text-xs md:text-sm font-bold uppercase tracking-wide rounded-sm shadow-lg shadow-blue-500/20">
              <ShoppingBag size={16} />
              <span>Carrinho ({totalItems()})</span>
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-wfx-text hover:bg-wfx-card rounded-md z-50 relative">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-wfx-bg border-b border-wfx-border shadow-2xl animate-in slide-in-from-top-5 z-40 text-wfx-text">
            <nav className="flex flex-col p-6 space-y-4 text-center font-bold text-lg">
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">COLEÇÃO 2025</a>
              <a href="#catalogo" onClick={handleLancamentosClick} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">LANÇAMENTOS</a>
              <Link href="/atendimento" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">ATENDIMENTO EXCLUSIVO</Link>
              <a href="#sobre" onClick={handleSobreClick} className="py-2 hover:text-wfx-primary">SOBRE</a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Banner Hero */}
        <section className="border-b border-wfx-border bg-wfx-card/50 flex items-center py-12 md:py-0 min-h-[calc(100vh-80px)]">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center w-full h-full">
            <div className="space-y-4 md:space-y-6 text-center md:text-left order-2 md:order-1">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-wfx-text">
                Modelagem Técnica <br />
                para <span className="text-wfx-primary">Alta Joalheria</span>.
              </h1>
              <p className="text-wfx-muted text-base md:text-lg max-w-md leading-relaxed mx-auto md:mx-0">
                Arquivos STL validados para Prototipagem e Moldes de Borracha.
              </p>
              <a href="#catalogo" className="inline-block px-8 py-4 bg-wfx-text text-wfx-bg font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity mt-4">Ver Catálogo</a>
            </div>
            <div className="relative w-full h-[350px] md:h-[600px] flex items-center justify-center overflow-visible z-10 order-1 md:order-2">
              <Hero3D />
            </div>
          </div>
        </section>

        {/* Catalogo */}
        <section id="catalogo" className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <aside className="w-full md:w-64 space-y-8 flex-shrink-0 text-wfx-muted">
              {(selectedCategory || selectedUsage || searchTerm) && (
                <button onClick={clearFilters} className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 border border-red-500/20 bg-red-500/10 p-2 rounded-sm hover:bg-red-500 hover:text-white transition-all mb-6">
                  <X size={14} /> Limpar Filtros
                </button>
              )}
              <div>
                <h3 className="font-bold text-sm text-wfx-text uppercase tracking-wider mb-4 border-b border-wfx-border pb-2">Categorias</h3>
                <ul className="space-y-2 font-medium">
                  {categoriesList.map((item) => (
                    <li key={item} onClick={() => handleCategoryChange(item)} className={`flex items-center gap-3 group cursor-pointer transition-colors ${selectedCategory === item ? 'text-wfx-primary font-bold' : 'hover:text-wfx-primary'}`}>
                      <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${selectedCategory === item ? 'border-wfx-primary bg-wfx-primary' : 'border-wfx-border group-hover:border-wfx-primary'}`}>{selectedCategory === item && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm text-wfx-text uppercase tracking-wider mb-4 border-b border-wfx-border pb-2">Finalidade</h3>
                <ul className="space-y-2 font-medium">
                  <li onClick={() => handleUsageChange('Prototipagem')} className={`flex items-center gap-3 group cursor-pointer transition-colors ${selectedUsage === 'Prototipagem' ? 'text-wfx-primary font-bold' : 'hover:text-wfx-primary'}`}>
                    <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${selectedUsage === 'Prototipagem' ? 'border-wfx-primary bg-wfx-primary' : 'border-wfx-border group-hover:border-wfx-primary'}`}>{selectedUsage === 'Prototipagem' && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Prototipagem</span>
                  </li>
                  <li onClick={() => handleUsageChange('Borracha')} className={`flex items-center gap-3 group cursor-pointer transition-colors ${selectedUsage === 'Borracha' ? 'text-wfx-primary font-bold' : 'hover:text-wfx-primary'}`}>
                    <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${selectedUsage === 'Borracha' ? 'border-wfx-primary bg-wfx-primary' : 'border-wfx-border group-hover:border-wfx-primary'}`}>{selectedUsage === 'Borracha' && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Borracha</span>
                  </li>
                </ul>
              </div>
            </aside>

            <div className="flex-1 flex flex-col min-h-[600px]">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-wfx-border pb-4">
                <p className="text-wfx-muted text-sm hidden xl:block">{loading ? 'Carregando...' : <>Mostrando <span className="font-bold text-wfx-text">{totalFiltered}</span> de <span className="font-bold text-wfx-text">{globalTotal}</span> produtos</>}</p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-wfx-muted whitespace-nowrap hidden sm:inline">Pesquisar:</span>
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Buscar peça, pedra, tamanho..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full bg-wfx-card border border-wfx-border text-wfx-text text-sm py-2 pl-3 pr-9 rounded-md focus:outline-none focus:border-wfx-primary placeholder-wfx-muted transition-colors"
                      />
                      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-wfx-muted" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-wfx-muted whitespace-nowrap hidden sm:inline">Ordenar:</span>
                    <div className="relative w-full sm:w-56">
                      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full appearance-none bg-wfx-card border border-wfx-border text-wfx-text text-sm py-2 pl-3 pr-8 rounded-md focus:outline-none focus:border-wfx-primary cursor-pointer transition-colors font-medium">
                        <option value="newest">Mais Recentes</option>
                        <option value="price_asc">Preço: Menor para Maior</option>
                        <option value="price_desc">Preço: Maior para Menor</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-wfx-muted"><Filter size={14} /></div>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-wfx-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                  {products.map((product) => (
                    <Link href={`/produto/${product.id}`} key={product.id} className="group border border-wfx-border hover:border-wfx-primary bg-wfx-card p-3 md:p-4 transition-all duration-300 hover:shadow-xl cursor-pointer block">
                      <div className="aspect-[4/3] bg-wfx-bg mb-4 flex items-center justify-center relative overflow-hidden rounded-sm border border-wfx-border/50">
                        {product.image_url ? <img src={product.image_url} alt={product.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform" /> : <span className="text-4xl">💠</span>}
                        {product.usage === 'Prototipagem' && <span className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 uppercase border border-amber-200 shadow-sm">Prototipagem</span>}
                        {product.usage === 'Borracha' && <span className="absolute top-2 right-2 bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 uppercase border border-slate-300 shadow-sm">Molde Borracha</span>}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-sm md:text-lg leading-tight group-hover:text-wfx-primary transition-colors text-wfx-text line-clamp-2">{product.title}</h3>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 border-t border-wfx-border">
                          <span className="text-[10px] md:text-xs text-wfx-muted uppercase mb-1 md:mb-0">{product.category}</span>
                          <span className="font-black text-xl md:text-2xl text-wfx-primary tracking-tighter">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-wfx-muted py-12">
                  <p className="text-lg">Nenhum produto encontrado.</p>
                  {(searchTerm || selectedCategory || selectedUsage) && (
                    <button onClick={clearFilters} className="text-wfx-primary hover:underline mt-2 text-sm">Limpar busca e filtros</button>
                  )}
                </div>
              )}

              {!loading && totalFiltered > ITEMS_PER_PAGE && (
                <div className="flex justify-center items-center gap-4 mt-12 border-t border-wfx-border pt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-wfx-border rounded-md hover:border-wfx-primary disabled:opacity-30 disabled:hover:border-wfx-border transition-colors"><ChevronLeft size={20} /></button>
                  <span className="font-mono text-sm text-wfx-muted">Página <span className="text-wfx-text font-bold">{page}</span> de {Math.ceil(totalFiltered / ITEMS_PER_PAGE)}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * ITEMS_PER_PAGE >= totalFiltered} className="p-2 border border-wfx-border rounded-md hover:border-wfx-primary disabled:opacity-30 disabled:hover:border-wfx-border transition-colors"><ChevronRight size={20} /></button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER - Otimizado para troca de tema rápida */}
      <footer id="sobre" className="bg-wfx-bg text-wfx-text border-t-2 border-wfx-text/10 dark:border-wfx-text/20 py-16 transition-colors duration-150 ease-out">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="WFX Logo Footer" width={90} height={35} className="object-contain" />
              <div className="w-2 h-2 bg-wfx-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            </div>
            <p className="text-wfx-muted text-sm leading-relaxed max-w-xs">
              Especialistas em modelagem 3D técnica para alta joalheria. Garantindo precisão para prototipagem e moldes de borracha.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-wfx-primary">Contato & Suporte</h4>
            <ul className="space-y-3 text-wfx-muted">
              <li className="flex items-center gap-3">
                <Instagram size={18} />
                <a href="https://instagram.com/WFX" target="_blank" className="hover:text-wfx-primary transition-colors">@WFX</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} />
                <a href="mailto:wfxjoias@gmail.com" className="hover:text-wfx-primary transition-colors">wfxjoias@gmail.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} />
                <a href="https://wa.me/5554996704599" target="_blank" className="hover:text-wfx-primary transition-colors">+55 (54) 99670-4599</a>
              </li>
            </ul>
          </div>

          <div className="md:text-right flex flex-col md:items-end justify-between">
            <div className="hidden md:block"></div>
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-wfx-muted uppercase tracking-[0.2em] block">Design & Development</span>
              <a 
                href="https://instagram.com/yurikorolko" 
                target="_blank" 
                className="inline-flex items-center gap-3 bg-wfx-card border border-wfx-text/20 px-5 py-2.5 rounded-full shadow-sm transition-all duration-150 ease-out transform-gpu hover:shadow-md hover:border-wfx-primary/50 hover:-translate-y-1 active:scale-95 group"
              >
                <div className="p-1 rounded-full bg-wfx-text/5 group-hover:bg-wfx-primary/10 transition-colors duration-150">
                  <Code size={16} className="text-wfx-primary" />
                </div>
                <span className="font-bold text-sm tracking-tight transition-colors duration-150 group-hover:text-wfx-primary">@yurikorolko</span>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t-2 border-wfx-text/10 dark:border-wfx-text/20 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-wfx-muted uppercase tracking-[0.3em]">
          <p>© 2025 WFX - Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0">Brasil / Rio Grande do Sul</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-wfx-bg"></div>}>
      <HomeContent />
    </Suspense>
  );
}