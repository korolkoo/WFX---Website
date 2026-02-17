"use client";

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, Suspense, use, useMemo, useRef } from 'react';
import { useTheme } from "next-themes";
import { Moon, Sun, ShoppingBag, Instagram, Mail, Phone, Code, ChevronLeft, ChevronRight, Maximize2, AlertCircle, Menu, X, Ruler, Gem, Layers, Scale, User } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Loader, Environment } from "@react-three/drei";
import * as THREE from 'three';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from "@/store/useCartStore";
import CartSidebar from "@/components/CartSidebar";

// ==============================================================================
// 1. CONFIGURAÇÃO E INTEGRAÇÃO (SUPABASE)
// ==============================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==============================================================================
// 2. DEFINIÇÃO DE TIPOS E INTERFACES
// ==============================================================================
interface Product {
  id: number;
  title: string;
  category: string;
  description?: string;
  usage: 'Prototipagem' | 'Borracha';
  price: number;
  image_url: string;
  file_url?: string;
  glb_url?: string;
  material_config?: any; // Alterado para any para aceitar o JSON da resina
  video_360_url?: string;
  video_real_url?: string;
  size?: string;
  volume?: number;
  stones_info?: string;
}

// ==============================================================================
// 3. CONSTANTES E MATERIAIS 3D
// ==============================================================================
const DENSITIES = {
  brass: 8.5,     // Latão
  silver: 10.0,   // Prata 925
  gold10k: 10.0,  // Ouro 10k
  gold18k: 15.0   // Ouro 18k
};

const MATERIALS = {
  // METAIS
  gold: new THREE.MeshPhysicalMaterial({ color: "#FFD700", metalness: 1.0, roughness: 0.15, clearcoat: 1.0, envMapIntensity: 2.0 }),

  silver: new THREE.MeshPhysicalMaterial({
    color: "#FFFFFF",
    emissive: "#111111",
    metalness: 1.0,
    roughness: 0.0,
    clearcoat: 1.0,
    envMapIntensity: 2.5
  }),

  roseGold: new THREE.MeshPhysicalMaterial({ color: "#B76E79", metalness: 1.0, roughness: 0.15, clearcoat: 1.0, envMapIntensity: 2.0 }),

  // GEMAS
  diamond: new THREE.MeshPhysicalMaterial({
    color: "#ffffff", metalness: 0.1, roughness: 0, transmission: 1, thickness: 10, ior: 2.4,
    envMapIntensity: 5, dispersion: 15
  }),

  // RUBI (Vermelho "Aceso")
  ruby: new THREE.MeshPhysicalMaterial({
    color: "#ff0000", // Vermelho puro
    emissive: "#330000", // Brilho interno vermelho escuro
    metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.76,
    envMapIntensity: 3,
    clearcoat: 1.0,
    attenuationColor: new THREE.Color("#ff0000"), attenuationDistance: 5
  }),

  // SAFIRA (Azul Profundo e Brilhante)
  sapphire: new THREE.MeshPhysicalMaterial({
    color: "#0000ff",
    emissive: "#000033",
    metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.76,
    envMapIntensity: 3,
    clearcoat: 1.0,
    attenuationColor: new THREE.Color("#0000ff"), attenuationDistance: 5
  }),

  // ESMERALDA (Verde Radioativo)
  emerald: new THREE.MeshPhysicalMaterial({
    color: "#00ff00",
    emissive: "#003300",
    metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.57,
    envMapIntensity: 3,
    clearcoat: 1.0,
    attenuationColor: new THREE.Color("#00ff00"), attenuationDistance: 5
  }),

  onyx: new THREE.MeshPhysicalMaterial({ color: "#000000", metalness: 0, roughness: 0, clearcoat: 1.0, envMapIntensity: 2 }),
};

// ==============================================================================
// 4. COMPONENTE: VISUALIZADOR 3D (R3F) - CORRIGIDO PARA RESINA
// ==============================================================================
function ModelViewer({ url, config }: { url: string, config?: any }) {
  const { scene } = useGLTF(url) as any;

  // Aplica materiais automaticamente com base no nome das meshes ou config do banco
  useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child: any) => {
      if (child.isMesh) {
        let materialToApply = null;

        // --- ALTERAÇÃO AQUI: Lógica híbrida (String ou Objeto de Resina) ---
        const partConfig = config ? config[child.name] : null;

        if (partConfig) {
          // CASO A: Material Padrão (String antiga)
          if (typeof partConfig === 'string' && MATERIALS[partConfig as keyof typeof MATERIALS]) {
            materialToApply = MATERIALS[partConfig as keyof typeof MATERIALS];
          }
          // CASO B: Objeto de Resina (Novo)
          else if (typeof partConfig === 'object' && partConfig.type === 'resin') {
            materialToApply = new THREE.MeshPhysicalMaterial({
              color: partConfig.color,
              metalness: 0.0,
              roughness: 0.1,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
              reflectivity: 0.5,
              ior: 1.5,
              envMapIntensity: 1.2,
              side: THREE.DoubleSide
            });
          }
        }

        // Prioridade 2: Detecção automática pelo nome (Fallback)
        if (!materialToApply) {
          let fullID = child.name.toLowerCase();
          if (fullID.includes("prata") || fullID.includes("silver")) materialToApply = MATERIALS.silver;
          else if (fullID.includes("rubi")) materialToApply = MATERIALS.ruby;
          else if (fullID.includes("esmeralda")) materialToApply = MATERIALS.emerald;
          else if (fullID.includes("diamante") || fullID.includes("pedra")) materialToApply = MATERIALS.diamond;
          else materialToApply = MATERIALS.gold;
        }
        if (materialToApply) child.material = materialToApply;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.children = cloned.children;
  }, [scene, config]);

  return <Stage environment="city" intensity={1} shadows={false} adjustCamera={false}><primitive object={scene} /></Stage>;
}

// ==============================================================================
// 5. COMPONENTE PRINCIPAL: PÁGINA DO PRODUTO
// ==============================================================================
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem, totalItems, toggleCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const { theme, setTheme } = useTheme();

  // Estados de Interface
  const [mediaIndex, setMediaIndex] = useState(0);
  const [availableMedia, setAvailableMedia] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- BUSCA DE DADOS ---
  useEffect(() => {
    setMounted(true);
    async function fetchProduct() {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        setProduct(data as Product);
        // Monta array de mídia disponível na ordem de prioridade
        const media = [];
        if (data.glb_url || data.file_url) media.push({ type: '3d', label: 'Visualização 3D' });
        if (data.video_360_url) media.push({ type: 'video360', label: 'Vídeo 360°', url: data.video_360_url });
        if (data.video_real_url) media.push({ type: 'videoReal', label: 'Vídeo Real', url: data.video_real_url });
        media.push({ type: 'image', label: 'Foto', url: data.image_url });
        setAvailableMedia(media);
      }
      if (error) console.error("Erro:", error);
    }
    fetchProduct();

    // Listener para tecla ESC ou mudança de estado nativa do Fullscreen
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [id]);

  // --- PROCESSAMENTO DE LISTA DE PEDRAS ---
  const stonesList = useMemo(() => {
    if (!product?.stones_info) return null;
    return product.stones_info.split('+').map((stoneStr, idx) => {
      const cleanStr = stoneStr.trim();
      const match = cleanStr.match(/^(\?|\d+)\s*un\.\s*(.+)\s*\(Total:\s*([\d\.]+)g\)/i);
      if (match) {
        return (
          <div key={idx} className="px-4 py-3 flex items-center gap-3 text-sm">
            <span className="bg-wfx-primary/10 text-wfx-primary border border-wfx-primary/20 px-2 py-0.5 rounded-full text-xs font-bold">{match[1]}x</span>
            <span className="text-wfx-text/80 leading-tight">{match[2]}</span>
          </div>
        )
      }
      return <div key={idx} className="px-4 py-3 text-xs text-wfx-muted">{cleanStr}</div>
    });
  }, [product?.stones_info]);

  // Loading State
  if (!mounted || !product) return <div className="min-h-screen bg-wfx-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-wfx-primary border-t-transparent rounded-full animate-spin"></div></div>;

  // Helpers de Mídia e Controle
  const currentMedia = availableMedia[mediaIndex] || { type: 'image' };
  const handleNextMedia = () => setMediaIndex((prev) => (prev + 1) % availableMedia.length);
  const handlePrevMedia = () => setMediaIndex((prev) => (prev - 1 + availableMedia.length) % availableMedia.length);

  const toggleFullscreen = () => {
    if (!mediaContainerRef.current) return;
    if (!document.fullscreenElement) mediaContainerRef.current.requestFullscreen().catch(err => console.error(err));
    else document.exitFullscreen();
  };

  // Helpers de Cálculo de Peso
  const getStoneWeight = (infoString?: string) => {
    if (!infoString) return 0;
    try {
      const regex = /Total:\s*(\d+(?:\.\d+)?)/g;
      let total = 0;
      let match;
      while ((match = regex.exec(infoString)) !== null) {
        if (match[1]) total += parseFloat(match[1]);
      }
      return total;
    } catch (e) { return 0; }
  };
  const stonesTotalWeight = getStoneWeight(product.stones_info);

  const calculateMetalWeight = (density: number) => {
    if (!product.volume) return 0;
    return (product.volume * density);
  };

  const calculateTotalWeight = (density: number) => {
    return (calculateMetalWeight(density) + stonesTotalWeight).toFixed(2);
  };

  // Scroll Suave
  const handleSobreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const section = document.getElementById('sobre');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const viewerUrl = product.glb_url || product.file_url;

  return (
    <div className="min-h-screen bg-wfx-bg text-wfx-text font-sans transition-colors pb-0 flex flex-col">
      <CartSidebar />

      {/* --- HEADER --- */}
      <header className="border-b border-wfx-border sticky top-0 bg-wfx-bg/80 backdrop-blur-md z-50 h-20 shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Image src="/logo.png" alt="WFX Logo" width={100} height={40} priority className="object-contain" />
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-wfx-muted">
            <Link href="/" className="hover:text-wfx-primary transition-colors">COLEÇÃO 2026</Link>
            <Link href="/?action=lancamentos" className="hover:text-wfx-primary transition-colors">LANÇAMENTOS</Link>
            <Link href="/atendimento" className="hover:text-wfx-primary transition-colors">ATENDIMENTO EXCLUSIVO</Link>
            <a href="#sobre" onClick={handleSobreClick} className="hover:text-wfx-primary transition-colors">SOBRE</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-full hover:bg-wfx-card transition-all text-wfx-muted hover:text-wfx-primary">{theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}</button>
            <Link href="/perfil" className="p-2 rounded-full hover:bg-wfx-card transition-all text-wfx-muted hover:text-wfx-primary" title="Minha Conta">
              <User size={20} />
            </Link>
            <button onClick={toggleCart} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-wfx-primary text-white hover:opacity-90 transition-all text-xs md:text-sm font-bold uppercase tracking-wide rounded-sm shadow-lg shadow-blue-500/20"><ShoppingBag size={16} /><span>Carrinho ({totalItems()})</span></button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-wfx-text hover:bg-wfx-card rounded-md">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-wfx-bg border-b border-wfx-border shadow-2xl animate-in slide-in-from-top-5 z-40 text-wfx-text">
            <nav className="flex flex-col p-6 space-y-4 text-center font-bold text-lg">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">COLEÇÃO 2026</Link>
              <Link href="/?action=lancamentos" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">LANÇAMENTOS</Link>
              <Link href="/atendimento" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-wfx-primary border-b border-wfx-border/50">ATENDIMENTO EXCLUSIVO</Link>
              <a href="#sobre" onClick={handleSobreClick} className="py-2 hover:text-wfx-primary">SOBRE</a>
            </nav>
          </div>
        )}
      </header>

      {/* --- ÁREA PRINCIPAL (MAIN) --- */}
      <main className="flex-1 min-h-[calc(100vh-80px)] flex flex-col justify-center max-w-7xl mx-auto px-6 py-6 w-full">

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">

          {/* === COLUNA ESQUERDA (Mídia + Dots + Contato) === */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full">

            {/* WRAPPER MÍDIA E DOTS */}
            <div className="flex flex-col gap-4 flex-1 min-h-0">

              {/* CONTAINER VISUALIZADOR 3D / FOTO / VÍDEO */}
              <div ref={mediaContainerRef} className={`relative flex-1 min-h-[550px] lg:min-h-[300px] w-full bg-wfx-bg border border-wfx-border rounded-lg overflow-hidden shadow-inner group flex items-center justify-center transition-all ${isFullscreen ? 'fixed inset-0 z-[100] h-screen border-none rounded-none' : ''}`}>

                {/* Fallback de altura mínima e conteúdo */}
                <div className="absolute inset-0">
                  {currentMedia.type === '3d' && viewerUrl && (
                    <>
                      <Canvas dpr={[1, 2]} camera={{ position: [25, 25, 25], fov: 40 }} className="h-full w-full cursor-grab active:cursor-grabbing" shadows>
                        <Environment preset="city" background={false} blur={0.8} />

                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow color="#ffffff" />
                        <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />

                        <Suspense fallback={null}>
                          <ModelViewer url={viewerUrl} config={product.material_config} />
                        </Suspense>
                        <OrbitControls autoRotate autoRotateSpeed={2} makeDefault />
                      </Canvas>
                      <Loader dataInterpolation={(p) => `Carregando ${p.toFixed(0)}%`} containerStyles={{ background: 'transparent' }} innerStyles={{ backgroundColor: 'rgba(0,0,0,0.1)', width: '200px' }} barStyles={{ backgroundColor: '#0044cc' }} dataStyles={{ color: '#0044cc', fontSize: '12px', fontWeight: 'bold' }} />
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 z-20 pointer-events-none text-center w-max max-w-[90%]">
                        <AlertCircle size={14} className="text-yellow-400 shrink-0" />
                        <span className="text-white/90 text-[10px] md:text-xs font-medium leading-tight">Qualidade visual reduzida para web.</span>
                      </div>
                    </>
                  )}
                  {currentMedia.type === 'video360' && (<video src={currentMedia.url} className="w-full h-full object-contain bg-black" autoPlay loop muted playsInline controls />)}
                  {currentMedia.type === 'videoReal' && (<video src={currentMedia.url} className="w-full h-full object-contain bg-black" autoPlay loop muted playsInline controls />)}
                  {currentMedia.type === 'image' && (<img src={product.image_url} alt={product.title} className="w-full h-full object-contain p-8" />)}
                </div>

                {/* Botões de Controle (Dentro da imagem) */}
                <button onClick={toggleFullscreen} className="absolute top-4 right-4 bg-wfx-card/80 hover:bg-wfx-primary hover:text-white p-2 rounded-lg backdrop-blur-sm transition-all shadow-lg z-30"><Maximize2 size={20} /></button>
                {availableMedia.length > 1 && (
                  <>
                    <button onClick={handlePrevMedia} className="absolute left-4 top-1/2 -translate-y-1/2 bg-wfx-bg/80 hover:bg-wfx-primary hover:text-white p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"><ChevronLeft size={28} /></button>
                    <button onClick={handleNextMedia} className="absolute right-4 top-1/2 -translate-y-1/2 bg-wfx-bg/80 hover:bg-wfx-primary hover:text-white p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"><ChevronRight size={28} /></button>
                  </>
                )}
                {currentMedia.type !== '3d' && (
                  <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold backdrop-blur-sm z-10">{currentMedia.label}</div>
                )}
              </div>

              {/* DOTS DE NAVEGAÇÃO - FORA DO CARD*/}
              <div className="flex justify-center gap-2 w-full">
                {availableMedia.map((media, idx) => (
                  <button key={idx} onClick={() => setMediaIndex(idx)} className={`h-1.5 rounded-full transition-all ${mediaIndex === idx ? 'w-8 bg-wfx-primary' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-wfx-primary/50'}`} />
                ))}
              </div>
            </div>

            {/* CARD DE CONTATO */}
            <div className="bg-wfx-card border border-wfx-border rounded-lg p-6 text-center shadow-sm shrink-0">
              <p className="font-bold text-sm text-wfx-primary mb-2">Não gostou de algo na peça? Tem alguma dúvida?</p>
              <p className="text-sm text-wfx-muted mb-4">Entre em contato comigo para ajustes personalizados antes da compra:</p>
              <div className="flex justify-center gap-6 text-sm font-bold text-wfx-text">
                <a href="https://instagram.com/WFX" target="_blank" className="hover:text-wfx-primary transition-colors flex items-center gap-2 px-4 py-2 bg-wfx-bg rounded border border-wfx-border/50"><Instagram size={16} /> @WFX</a>
                <a href="https://wa.me/5554996704599" target="_blank" className="hover:text-wfx-primary transition-colors flex items-center gap-2 px-4 py-2 bg-wfx-bg rounded border border-wfx-border/50"><Phone size={16} /> +55 (54) 99670-4599</a>
              </div>
            </div>

          </div>

          {/* === COLUNA DIREITA (Detalhes) === */}
          <div className="lg:col-span-4 h-full flex flex-col">

            {/* --- ALTERAÇÃO AQUI: Adicionado relative e overflow-hidden --- */}
            <div className="bg-wfx-card border border-wfx-border p-5 rounded-lg shadow-xl flex flex-col h-full relative overflow-hidden">

              {/* --- ALTERAÇÃO AQUI: A barra colorida no topo --- */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

              {/* SEÇÃO SUPERIOR (Título, Preço) */}
              <div>
                <div className="pb-3 border-b border-wfx-border/50">
                  <span className="text-xs text-wfx-primary font-bold uppercase tracking-widest mb-1 block">{product.category}</span>
                  <div className="flex justify-between items-start gap-4">
                    <h1 className="text-2xl font-extrabold text-wfx-text leading-tight flex-1">{product.title}</h1>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-400 dark:text-slate-600 text-2xl font-light hidden sm:block">|</span>
                      <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-wfx-muted leading-relaxed mt-2 mb-3">{product.description || "Sem descrição adicional."}</p>

                  <div className="flex gap-2 flex-wrap">
                    {product.usage === 'Prototipagem' && (<div className="flex items-center gap-2 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-600 text-[10px] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Prototipagem</div>)}
                    {product.usage === 'Borracha' && (<div className="flex items-center gap-2 px-2 py-1 bg-slate-500/10 border border-slate-500/20 rounded text-slate-600 text-[10px] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Molde Borracha</div>)}
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-600 text-[10px] font-bold uppercase"><Code size={10} /> STL</div>
                  </div>
                </div>
              </div>

              {/* Especificações */}
              <div className="flex-1 flex flex-col pt-6">
                <h3 className="text-xs font-bold text-wfx-text uppercase tracking-wider mb-5 flex items-center gap-2"><Layers size={14} /> Especificações</h3>

                <div className="flex flex-col gap-6 flex-1">

                  {/* Dimensões */}
                  {product.size && (
                    <div className="border border-wfx-border/50 rounded-lg overflow-hidden flex items-center justify-between px-4 py-4 bg-wfx-muted/5">
                      <div className="flex items-center gap-2">
                        <Ruler size={14} className="text-wfx-muted" />
                        <span className="text-[10px] font-bold text-wfx-muted uppercase tracking-wider">Dimensões</span>
                      </div>
                      <span className="text-sm font-mono font-bold text-wfx-text">{product.size}</span>
                    </div>
                  )}

                  {/* Pedras */}
                  {product.stones_info && (
                    <div className="border border-wfx-border/50 rounded-lg overflow-hidden">
                      <div className="bg-wfx-muted/5 px-4 py-2 border-b border-wfx-border/50 flex items-center gap-2">
                        <Gem size={12} className="text-wfx-muted" />
                        <span className="text-[10px] font-bold text-wfx-muted uppercase tracking-wider">Configuração de Pedras</span>
                      </div>
                      <div className="divide-y divide-wfx-border/30">
                        {stonesList}
                      </div>
                    </div>
                  )}

                  {/* Peso Final */}
                  {product.volume && product.volume > 0 && (
                    <div className="border border-wfx-border/50 rounded-lg overflow-hidden">
                      <div className="bg-wfx-muted/5 px-4 py-2 border-b border-wfx-border/50 flex items-center gap-2">
                        <Scale size={12} className="text-wfx-muted" />
                        <span className="text-[10px] font-bold text-wfx-muted uppercase tracking-wider">
                          Peso Final Aproximado
                          <span className="text-[9px] opacity-70 normal-case ml-1 font-semibold tracking-normal text-wfx-primary/80">(FUNDIÇÃO + PEDRAS)</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 divide-x divide-y divide-wfx-border/30 bg-wfx-bg">
                        <div className="p-3 flex justify-between items-center hover:bg-wfx-muted/5 transition-colors">
                          <div className="flex items-center gap-2 border-l-2 border-amber-600 pl-2 h-4">
                            <span className="text-wfx-muted text-[10px] uppercase font-bold tracking-wider">Latão</span>
                          </div>
                          <span className="font-mono font-bold text-sm text-wfx-text">{calculateTotalWeight(DENSITIES.brass)}g</span>
                        </div>

                        <div className="p-3 flex justify-between items-center hover:bg-wfx-muted/5 transition-colors">
                          <div className="flex items-center gap-2 border-l-2 border-slate-300 pl-2 h-4">
                            <span className="text-wfx-muted text-[10px] uppercase font-bold tracking-wider">Prata</span>
                          </div>
                          <span className="font-mono font-bold text-sm text-wfx-text">{calculateTotalWeight(DENSITIES.silver)}g</span>
                        </div>

                        <div className="p-3 flex justify-between items-center hover:bg-wfx-muted/5 transition-colors border-t border-wfx-border/30">
                          <div className="flex items-center gap-2 border-l-2 border-yellow-500 pl-2 h-4">
                            <span className="text-wfx-muted text-[10px] uppercase font-bold tracking-wider">Ouro 10k</span>
                          </div>
                          <span className="font-mono font-bold text-sm text-wfx-text">{calculateTotalWeight(DENSITIES.gold10k)}g</span>
                        </div>

                        <div className="p-3 flex justify-between items-center hover:bg-wfx-muted/5 transition-colors border-t border-wfx-border/30">
                          <div className="flex items-center gap-2 border-l-2 border-yellow-400 pl-2 h-4">
                            <span className="text-wfx-muted text-[10px] uppercase font-bold tracking-wider">Ouro 18k</span>
                          </div>
                          <span className="font-mono font-bold text-sm text-wfx-text">{calculateTotalWeight(DENSITIES.gold18k)}g</span>
                        </div>
                      </div>

                      <div className="bg-wfx-muted/5 px-3 py-2 border-t border-wfx-border/50">
                        <p className="text-[9px] text-wfx-muted italic text-center">
                          * Peso da peça real estimado com base no peso do arquivo digital.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO INFERIOR - BOTÃO DE CARRINHO */}
              <div className="mt-auto pt-6 border-t border-wfx-border/50">
                <button onClick={() => addItem(product)} className="w-full bg-wfx-primary hover:bg-blue-600 text-white font-bold py-4 px-6 rounded shadow-lg shadow-blue-500/20 transform active:scale-95 transition-all flex items-center justify-center gap-3">
                  <ShoppingBag size={20} /> ADICIONAR AO CARRINHO
                </button>
                <p className="text-xs text-wfx-muted text-center mt-3">Download imediato após pagamento.</p>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer id="sobre" className="bg-wfx-bg text-wfx-text border-t border-wfx-text/10 dark:border-slate-800/50 py-10 transition-colors duration-150 ease-out text-center md:text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-4">

          {/* COLUNA 1: MARCA */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Image
                src="/logo.png"
                alt="WFX Logo Footer"
                width={80}
                height={30}
                className="object-contain"
              />
              <div className="w-1.5 h-1.5 bg-wfx-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            </div>
            <p className="text-wfx-muted text-xs md:text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
              Especialista em modelagem 3D técnica para alta joalheria. Garantindo precisão para prototipagem e moldes de borracha.
            </p>
          </div>

          {/* COLUNA 2: CONTATO */}
          <div className="md:col-span-3 space-y-4 md:pl-8">
            <h4 className="font-bold text-xs uppercase tracking-widest text-wfx-primary">Contato</h4>
            <ul className="space-y-3 text-sm text-wfx-muted">
              <li className="flex items-center justify-center md:justify-start gap-3 group">
                <Instagram size={16} className="shrink-0 group-hover:text-wfx-primary transition-colors" />
                <a href="https://instagram.com/wfx.joias" target="_blank" className="hover:text-wfx-primary transition-colors">@wfx.joias</a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 group">
                <Mail size={16} className="shrink-0 group-hover:text-wfx-primary transition-colors" />
                <a href="mailto:wfxjoias@gmail.com" className="hover:text-wfx-primary transition-colors truncate">wfxjoias@gmail.com</a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 group">
                <Phone size={16} className="shrink-0 group-hover:text-wfx-primary transition-colors" />
                <a href="https://wa.me/5554996704599" target="_blank" className="hover:text-wfx-primary transition-colors whitespace-nowrap">+55 (54) 99670-4599</a>
              </li>
            </ul>
          </div>

          {/* COLUNA 3: INSTITUCIONAL */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest text-wfx-primary">Institucional</h4>
            <ul className="space-y-3 text-sm text-wfx-muted">
              <li>
                <Link href="/termos" className="hover:text-wfx-primary transition-colors flex items-center justify-center md:justify-start gap-2 group">
                  <span className="w-1 h-1 bg-wfx-muted rounded-full group-hover:bg-wfx-primary transition-colors"></span>
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-wfx-primary transition-colors flex items-center justify-center md:justify-start gap-2 group">
                  <span className="w-1 h-1 bg-wfx-muted rounded-full group-hover:bg-wfx-primary transition-colors"></span>
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/atendimento" className="hover:text-wfx-primary transition-colors flex items-center justify-center md:justify-start gap-2 group">
                  <span className="w-1 h-1 bg-wfx-muted rounded-full group-hover:bg-wfx-primary transition-colors"></span>
                  Atendimento Exclusivo
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUNA 4: DEV */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end justify-start space-y-4">
            <span className="text-[10px] font-bold text-wfx-muted uppercase tracking-[0.2em]">Design & Development</span>
            <a
              href="https://instagram.com/yurikorolko"
              target="_blank"
              className="inline-flex items-center gap-3 bg-wfx-card border border-wfx-text/10 px-4 py-2 rounded-full shadow-sm transition-all duration-150 ease-out transform-gpu hover:shadow-md hover:border-wfx-primary/50 hover:-translate-y-1 active:scale-95 group"
            >
              <div className="p-1 rounded-full bg-wfx-text/5 group-hover:bg-wfx-primary/10 transition-colors duration-150">
                <Code size={14} className="text-wfx-primary" />
              </div>
              <span className="font-bold text-xs tracking-tight transition-colors duration-150 group-hover:text-wfx-primary">@yurikorolko</span>
            </a>
          </div>
        </div>

        {/* --- RODAPÉ INFERIOR --- */}
        <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-wfx-text/10 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 text-[10px]">

          {/* Lado Esquerdo: Dados Legais */}
          <div className="text-wfx-muted font-medium leading-relaxed text-center md:text-left">
            <p className="font-black uppercase tracking-[0.2em] mb-1 text-wfx-muted opacity-60">
              © 2026 WFX - Todos os direitos reservados.
            </p>
            <p className="opacity-70 dark:opacity-50 mt-1">
              Gustavo Lamonatto Postal | CNPJ: 64.248.071/0001-90 <span className="hidden md:inline mx-1">•</span> <br className="md:hidden" />
              Rua Rodrigues Alves, 162 - Bairro São José, Guaporé - RS
            </p>
          </div>

          {/* Lado Direito: Localização */}
          <div className="font-black text-wfx-muted uppercase tracking-[0.3em] whitespace-nowrap opacity-60">
            Brasil / Rio Grande do Sul
          </div>
        </div>
      </footer>
    </div>
  );
}