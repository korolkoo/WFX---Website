"use client";

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Save, Box, FileBox, Image as ImageIcon, Video, Gem, Scale, Info, Calculator, Ruler, Plus, Trash2, ArrowLeft, Film } from 'lucide-react';
import Link from 'next/link';
// Ajuste o import conforme sua estrutura
import ModelConfigurator from '@/components/admin/ModelConfigurator';

const DENSITIES = {
    brass: 8.5,
    silver: 10.0,
    gold10k: 10.0,
    gold18k: 15.0
};

export default function EditProductPage() {
    const supabase = createClient();
    const router = useRouter();
    const params = useParams();
    const productId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Dados do Produto
    const [formData, setFormData] = useState({
        title: '',
        category: 'Anéis',
        price: '',
        usage: 'Prototipagem',
        description: '',
        size: '',
        volume: '',
    });

    const [existingUrls, setExistingUrls] = useState<{
        image: string | null;
        stl: string | null;
        glb: string | null;
        video360: string | null;
        videoReal: string | null;
    }>({
        image: null, stl: null, glb: null, video360: null, videoReal: null
    });

    const [stoneRows, setStoneRows] = useState([
        { qty: '', name: '', weight: '' }
    ]);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [stlFile, setStlFile] = useState<File | null>(null);
    const [glbFile, setGlbFile] = useState<File | null>(null);
    const [video360File, setVideo360File] = useState<File | null>(null);
    const [videoRealFile, setVideoRealFile] = useState<File | null>(null);

    const [glbPreviewUrl, setGlbPreviewUrl] = useState<string | null>(null);
    const [materialConfig, setMaterialConfig] = useState({});

    // --- FUNÇÃO MÁGICA: Converte o Texto de volta para Lista ---
    const parseStonesInfo = (infoString: string) => {
        if (!infoString) return [{ qty: '', name: '', weight: '' }];

        try {
            // Separa por " + " (ex: "10 un. A... + 5 un. B...")
            const parts = infoString.split(' + ');
            
            const parsedRows = parts.map(part => {
                // Tenta extrair os dados usando Regex
                // Padrão esperado: "10 un. Nome da Pedra (Total: 0.5g)"
                const regex = /^(\d+)\s*un\.\s*(.+?)\s*\(Total:\s*([\d\.]+)[g]?\)$/i;
                const match = part.match(regex);

                if (match) {
                    return {
                        qty: match[1],   // Grupo 1: Quantidade
                        name: match[2],  // Grupo 2: Nome
                        weight: match[3] // Grupo 3: Peso
                    };
                } else {
                    // Se o formato estiver estranho, devolve o texto inteiro no nome pra não perder
                    return { qty: '1', name: part, weight: '0' };
                }
            });

            return parsedRows.length > 0 ? parsedRows : [{ qty: '', name: '', weight: '' }];
        } catch (e) {
            console.error("Erro ao converter pedras:", e);
            return [{ qty: '', name: '', weight: '' }];
        }
    };

    // --- BUSCAR DADOS DO PRODUTO ---
    useEffect(() => {
        const fetchProduct = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) {
                alert('Erro ao carregar produto.');
                router.push('/admin');
                return;
            }

            setFormData({
                title: data.title,
                category: data.category,
                price: data.price.toString(),
                usage: data.usage,
                description: data.description || '',
                size: data.size || '',
                volume: data.volume ? data.volume.toString() : '',
            });

            setExistingUrls({
                image: data.image_url,
                stl: data.file_url,
                glb: data.glb_url,
                video360: data.video_360_url,
                videoReal: data.video_real_url
            });

            if (data.material_config) setMaterialConfig(data.material_config);
            if (data.glb_url) setGlbPreviewUrl(data.glb_url);

            // --- AQUI A MÁGICA ACONTECE ---
            // Ignora JSON, pega o TEXTO (stones_info) e transforma em linhas
            if (data.stones_info) {
                const rows = parseStonesInfo(data.stones_info);
                setStoneRows(rows);
            }

            setLoading(false);
        };

        if (productId) fetchProduct();
    }, [productId, supabase, router]);

    // --- HANDLERS ---
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = e.target.value.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setFormData({ ...formData, title: formatted });
    };

    const handleGlbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setGlbFile(file);
            setGlbPreviewUrl(URL.createObjectURL(file));
        }
    };

    const updateStoneRow = (index: number, field: string, value: string) => {
        const newRows = [...stoneRows];
        // @ts-ignore
        newRows[index][field] = value;
        setStoneRows(newRows);
    };

    const addStoneRow = () => setStoneRows([...stoneRows, { qty: '', name: '', weight: '' }]);
    const removeStoneRow = (index: number) => setStoneRows(stoneRows.filter((_, i) => i !== index));

    // --- CÁLCULOS ---
    const calculationData = useMemo(() => {
        const volCm3 = parseFloat(formData.volume) || 0;
        let totalStoneWeight = 0;
        stoneRows.forEach(row => {
            const w = Number(row.weight) || 0;
            totalStoneWeight += w;
        });

        return {
            stonesTotal: totalStoneWeight,
            brass: (volCm3 * DENSITIES.brass) + totalStoneWeight,
            silver: (volCm3 * DENSITIES.silver) + totalStoneWeight,
            gold10k: (volCm3 * DENSITIES.gold10k) + totalStoneWeight,
            gold18k: (volCm3 * DENSITIES.gold18k) + totalStoneWeight,
        };
    }, [formData.volume, stoneRows]);

    const uploadFile = async (bucket: string, file: File) => {
        const path = `products/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) throw error;
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    };

    // --- SALVAR EDIÇÃO ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let imageUrl: string | null = existingUrls.image;
            let stlUrl: string | null = existingUrls.stl;
            let glbUrl: string | null = existingUrls.glb;
            let video360Url: string | null = existingUrls.video360;
            let videoRealUrl: string | null = existingUrls.videoReal;

            if (imageFile) imageUrl = await uploadFile('images', imageFile);
            if (stlFile) stlUrl = await uploadFile('models', stlFile);
            if (glbFile) glbUrl = await uploadFile('models', glbFile);
            if (video360File) video360Url = await uploadFile('videos', video360File);
            if (videoRealFile) videoRealUrl = await uploadFile('videos', videoRealFile);

            // GERA O TEXTO A PARTIR DA LISTA
            const hasStoneData = stoneRows.some(r => r.qty || r.name || r.weight);
            let stonesSummary = null;

            if (hasStoneData) {
                stonesSummary = stoneRows
                    .filter(row => row.qty || row.name)
                    .map(row => {
                        const w = row.weight ? `${row.weight}g` : '0g';
                        // IMPORTANTE: Manter esse formato exato para o parser funcionar depois
                        return `${row.qty || '?'} un. ${row.name || 'Pedra'} (Total: ${w})`;
                    })
                    .join(' + ');
            }

            const updates: any = {
                title: formData.title,
                category: formData.category,
                price: parseFloat(formData.price),
                usage: formData.usage,
                description: formData.description,
                size: formData.size,
                volume: formData.volume ? parseFloat(formData.volume) : null,
                image_url: imageUrl,
                file_url: stlUrl,
                glb_url: glbUrl,
                video_360_url: video360Url,
                video_real_url: videoRealUrl,
                material_config: materialConfig,
                stones_info: stonesSummary // Salva apenas o texto!
            };

            const { error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', productId);

            if (error) throw error;

            alert("Produto atualizado com sucesso!");
            router.push('/admin');

        } catch (error: any) {
            console.error(error);
            alert("Erro ao atualizar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Carregando dados do produto...</div>;

    return (
        <div className="space-y-8 pb-20 text-white">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold mb-1">Editar Produto</h1>
                    <p className="text-slate-400">Atualize as informações ou arquivos.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* --- ARQUIVOS --- */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Box className="text-blue-500" />
                        Arquivos (Envie apenas para substituir)
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {/* GLB */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 flex justify-between">
                                Arquivo GLB
                                {existingUrls.glb && <span className="text-green-500 text-[10px] ml-2">(JÁ POSSUI)</span>}
                            </label>
                            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors ${glbFile ? 'border-blue-500 bg-blue-900/10' : 'border-slate-700 hover:border-blue-500 bg-slate-950'}`}>
                                <input type="file" accept=".glb,.gltf" onChange={handleGlbSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-blue-400">
                                    <Box size={24} />
                                    <span className="text-xs font-medium truncate w-full">
                                        {glbFile ? glbFile.name : (existingUrls.glb ? "Manter arquivo atual" : "Substituir GLB")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* STL */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 flex justify-between">
                                Arquivo STL
                                {existingUrls.stl && <span className="text-green-500 text-[10px] ml-2">(JÁ POSSUI)</span>}
                            </label>
                            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors ${stlFile ? 'border-amber-500 bg-amber-900/10' : 'border-slate-700 hover:border-amber-500 bg-slate-950'}`}>
                                <input type="file" accept=".stl,.3dm,.obj" onChange={(e) => e.target.files && setStlFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-amber-400">
                                    <FileBox size={24} />
                                    <span className="text-xs font-medium truncate w-full">
                                        {stlFile ? stlFile.name : (existingUrls.stl ? "Manter arquivo atual" : "Substituir STL")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* IMAGEM */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 flex justify-between">
                                Imagem de Capa
                                {existingUrls.image && <span className="text-green-500 text-[10px] ml-2">(JÁ POSSUI)</span>}
                            </label>
                            <div
                                className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors ${imageFile ? 'border-green-500 bg-green-900/10' : 'border-slate-700 hover:border-green-500 bg-slate-950'}`}
                                style={!imageFile && existingUrls.image ? { backgroundImage: `url(${existingUrls.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                            >
                                {!imageFile && existingUrls.image && <div className="absolute inset-0 bg-black/60 rounded-lg"></div>}
                                <input type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <div className="relative z-20 flex flex-col items-center gap-2 text-slate-500 group-hover:text-green-400">
                                    <ImageIcon size={24} />
                                    <span className="text-xs font-medium truncate w-full drop-shadow-md">
                                        {imageFile ? imageFile.name : (existingUrls.image ? "Trocar Imagem Atual" : "Enviar Imagem")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VÍDEOS */}
                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 flex justify-between">
                                <div className="flex items-center gap-2"><Video size={14} /> Vídeo 360°</div>
                                {existingUrls.video360 && <span className="text-green-500 text-[10px]">(JÁ POSSUI)</span>}
                            </label>
                            <div className={`relative border-2 border-dashed rounded-lg p-4 text-center group cursor-pointer transition-colors ${video360File ? 'border-purple-500 bg-purple-900/10' : 'border-slate-700 hover:border-purple-500 bg-slate-950'}`}>
                                <input type="file" accept="video/*" onChange={(e) => e.target.files && setVideo360File(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="flex items-center justify-center gap-2 text-slate-500 group-hover:text-purple-400">
                                    <Film size={18} />
                                    <span className="text-xs font-medium truncate">
                                        {video360File ? video360File.name : (existingUrls.video360 ? "Trocar Vídeo 360" : "Selecionar Vídeo")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 flex justify-between">
                                <div className="flex items-center gap-2"><Video size={14} /> Vídeo Real</div>
                                {existingUrls.videoReal && <span className="text-green-500 text-[10px]">(JÁ POSSUI)</span>}
                            </label>
                            <div className={`relative border-2 border-dashed rounded-lg p-4 text-center group cursor-pointer transition-colors ${videoRealFile ? 'border-pink-500 bg-pink-900/10' : 'border-slate-700 hover:border-pink-500 bg-slate-950'}`}>
                                <input type="file" accept="video/*" onChange={(e) => e.target.files && setVideoRealFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="flex items-center justify-center gap-2 text-slate-500 group-hover:text-pink-400">
                                    <Film size={18} />
                                    <span className="text-xs font-medium truncate">
                                        {videoRealFile ? videoRealFile.name : (existingUrls.videoReal ? "Trocar Vídeo Real" : "Selecionar Vídeo")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VISUALIZADOR 3D */}
                    {glbPreviewUrl && (
                        <div className="mt-8">
                            <div className="mb-2 flex items-center gap-2">
                                <h3 className="text-sm font-bold text-blue-400 uppercase">Configuração de Cores</h3>
                            </div>
                            <ModelConfigurator
                                fileUrl={glbPreviewUrl}
                                initialConfig={materialConfig}
                                onConfigChange={setMaterialConfig}
                            />
                        </div>
                    )}
                </div>

                {/* --- DADOS TEXTUAIS & CALCULADORA --- */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Info Básica */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Info className="text-blue-500" /> Informações</h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                            <input type="text" value={formData.title} onChange={handleTitleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Preço (R$)</label>
                                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none cursor-pointer">
                                    {['Anéis', 'Berloques', 'Brincos', 'Escapulários', 'Gargantilhas', 'Pingentes', 'Pulseiras'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2"><Ruler size={16} /> Tamanho / Dimensões</label>
                            <input type="text" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                            <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Finalidade</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-blue-500 flex-1 transition-all">
                                    <input type="radio" name="usage" value="Prototipagem" checked={formData.usage === 'Prototipagem'} onChange={e => setFormData({ ...formData, usage: e.target.value as any })} className="text-blue-500 focus:ring-0" />
                                    <span className="text-sm text-white">Prototipagem</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-blue-500 flex-1 transition-all">
                                    <input type="radio" name="usage" value="Borracha" checked={formData.usage === 'Borracha'} onChange={e => setFormData({ ...formData, usage: e.target.value as any })} className="text-blue-500 focus:ring-0" />
                                    <span className="text-sm text-white">Molde Borracha</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Calculadora */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Calculator className="text-amber-500" /> Calculadora de Peso</h2>
                            <div className="text-[10px] text-amber-500 bg-amber-900/20 px-2 py-1 rounded border border-amber-900">
                                Atenção: Recalcule se houve mudanças
                            </div>
                        </div>

                        {/* Input Volume */}
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <label className="text-sm font-bold text-blue-400 mb-2 block flex items-center gap-2"><Scale size={16} /> Volume do 3D (cm³)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={formData.volume}
                                onChange={e => setFormData({ ...formData, volume: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-lg placeholder:text-slate-600"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Insira o volume em cm³.</p>
                        </div>

                        {/* Lista de Pedras */}
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <label className="text-sm font-bold text-purple-400 mb-4 block flex items-center gap-2"><Gem size={16} /> Pedras (Soma Direta no Peso Final)</label>

                            <div className="flex flex-col gap-3">
                                {stoneRows.map((row, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-3">
                                            <label className="text-[10px] text-slate-400 block mb-1">Qtd</label>
                                            <input
                                                type="number"
                                                value={row.qty}
                                                onChange={(e) => updateStoneRow(index, 'qty', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                                placeholder="Ex: 10"
                                            />
                                        </div>
                                        <div className="col-span-5">
                                            <label className="text-[10px] text-slate-400 block mb-1">Descrição</label>
                                            <input
                                                type="text"
                                                value={row.name}
                                                onChange={(e) => updateStoneRow(index, 'name', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"
                                                placeholder="Ex: Zircônia 1mm"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="text-[10px] text-slate-400 block mb-1 text-right">Peso (g)</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={row.weight}
                                                onChange={(e) => updateStoneRow(index, 'weight', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs text-right font-bold text-amber-200"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center pb-2">
                                            <button type="button" onClick={() => removeStoneRow(index)} className="text-slate-600 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button type="button" onClick={addStoneRow} className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                <Plus size={14} /> Adicionar Pedra
                            </button>

                            {calculationData.stonesTotal > 0 && (
                                <div className="mt-3 text-right text-xs text-slate-400 border-t border-slate-800 pt-2">
                                    Peso Somado das Pedras: <span className="text-white font-mono font-bold">{calculationData.stonesTotal.toFixed(3)}g</span>
                                </div>
                            )}
                        </div>

                        {/* Resultado Estimado */}
                        <div className="space-y-3 pt-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimativa (Metal + Pedras Somadas)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-yellow-900/20 p-3 rounded border border-yellow-800/50 flex justify-between items-center">
                                    <span className="text-xs text-yellow-500 font-bold uppercase">Latão</span>
                                    <span className="font-mono font-bold text-white">{calculationData.brass.toFixed(2)} g</span>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded border border-slate-600/50 flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold uppercase">Prata 925</span>
                                    <span className="font-mono font-bold text-white">{calculationData.silver.toFixed(2)} g</span>
                                </div>
                                <div className="bg-amber-900/20 p-3 rounded border border-amber-600/30 flex justify-between items-center">
                                    <span className="text-xs text-amber-500 font-bold uppercase">Ouro 10k</span>
                                    <span className="font-mono font-bold text-amber-200">{calculationData.gold10k.toFixed(2)} g</span>
                                </div>
                                <div className="bg-amber-500/10 p-3 rounded border border-amber-400/50 flex justify-between items-center">
                                    <span className="text-xs text-amber-400 font-bold uppercase">Ouro 18k</span>
                                    <span className="font-mono font-bold text-amber-400">{calculationData.gold18k.toFixed(2)} g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-lg shadow-lg active:scale-95 disabled:opacity-50">
                        {saving ? "Salvando..." : <><Save size={20} /> Salvar Alterações</>}
                    </button>
                </div>
            </form>
        </div>
    );
}