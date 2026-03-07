"use client";

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Save, Box, FileBox, Image as ImageIcon, Video, Gem, Scale, Info, Calculator, Ruler, Plus, Trash2, ArrowLeft, Film, Archive, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import ModelConfigurator from '@/components/admin/ModelConfigurator';
import { toast } from 'react-hot-toast';

const DENSITIES = { brass: 8.5, silver: 10.0, gold10k: 10.0, gold18k: 15.0 };

export default function EditProductPage() {
    const supabase = createClient();
    const router = useRouter();
    const params = useParams();
    const productId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '', category: 'Anéis', price: '', usage: 'Prototipagem', description: '', size: '', volume: '',
    });

    const [existingUrls, setExistingUrls] = useState<{
        image: string | null;
        stl: string | null;
        zip: string | null; 
        glb: string | null;
        video360: string | null;
        videoReal: string | null;
        stripe_product_id: string | null; // --- ADICIONADO PARA O STRIPE ---
    }>({ image: null, stl: null, zip: null, glb: null, video360: null, videoReal: null, stripe_product_id: null });

    const [stoneRows, setStoneRows] = useState([{ qty: '', name: '', weight: '' }]);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [glbFile, setGlbFile] = useState<File | null>(null);
    const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
    const [externalLink, setExternalLink] = useState('');

    const [video360File, setVideo360File] = useState<File | null>(null);
    const [videoRealFile, setVideoRealFile] = useState<File | null>(null);
    const [glbPreviewUrl, setGlbPreviewUrl] = useState<string | null>(null);
    const [materialConfig, setMaterialConfig] = useState({});

    const parseStonesInfo = (infoString: string) => {
        if (!infoString) return [{ qty: '', name: '', weight: '' }];
        try {
            const parts = infoString.split(' + ');
            const parsedRows = parts.map(part => {
                const regex = /^(\d+)\s*un\.\s*(.+?)\s*\(Total:\s*([\d\.]+)[g]?\)$/i;
                const match = part.match(regex);
                if (match) return { qty: match[1], name: match[2], weight: match[3] };
                else return { qty: '1', name: part, weight: '0' };
            });
            return parsedRows.length > 0 ? parsedRows : [{ qty: '', name: '', weight: '' }];
        } catch (e) { return [{ qty: '', name: '', weight: '' }]; }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
            if (error) { alert('Erro ao carregar produto.'); router.push('/admin'); return; }

            setFormData({
                title: data.title, category: data.category, price: data.price.toString(), usage: data.usage,
                description: data.description || '', size: data.size || '', volume: data.volume ? data.volume.toString() : '',
            });

            setExistingUrls({
                image: data.image_url, stl: data.file_url, zip: data.zip_url, glb: data.glb_url,
                video360: data.video_360_url, videoReal: data.video_real_url,
                stripe_product_id: data.stripe_product_id // --- CARREGANDO O ID DO STRIPE ---
            });
            
            if (data.zip_url && (data.zip_url.includes('drive.google') || data.zip_url.includes('mega.nz'))) {
                setExternalLink(data.zip_url);
            }

            if (data.material_config) setMaterialConfig(data.material_config);
            if (data.glb_url) setGlbPreviewUrl(data.glb_url);
            if (data.stones_info) setStoneRows(parseStonesInfo(data.stones_info));
            
            setLoading(false);
        };
        if (productId) fetchProduct();
    }, [productId, supabase, router]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = e.target.value.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setFormData({ ...formData, title: formatted });
    };

    const updateStoneRow = (index: number, field: string, value: string) => {
        const newRows = [...stoneRows];
        // @ts-ignore
        newRows[index][field] = value;
        setStoneRows(newRows);
    };

    const addStoneRow = () => setStoneRows([...stoneRows, { qty: '', name: '', weight: '' }]);
    const removeStoneRow = (index: number) => setStoneRows(stoneRows.filter((_, i) => i !== index));

    const calculationData = useMemo(() => {
        const volCm3 = parseFloat(formData.volume) || 0;
        let totalStoneWeight = 0;
        stoneRows.forEach(row => { totalStoneWeight += Number(row.weight) || 0; });
        return {
            stonesTotal: totalStoneWeight, brass: (volCm3 * DENSITIES.brass) + totalStoneWeight,
            silver: (volCm3 * DENSITIES.silver) + totalStoneWeight, gold10k: (volCm3 * DENSITIES.gold10k) + totalStoneWeight,
            gold18k: (volCm3 * DENSITIES.gold18k) + totalStoneWeight,
        };
    }, [formData.volume, stoneRows]);

    const uploadFile = async (bucket: string, file: File) => {
        const path = `products/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) throw error;
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || formData.title.trim() === '') return toast.error("O Título não pode ficar vazio.");
        if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) return toast.error("Insira um preço válido.");

        setSaving(true);
        const toastId = toast.loading("Atualizando no Stripe...");

        const oldUrls = { image: existingUrls.image, stl: existingUrls.stl, zip: existingUrls.zip, glb: existingUrls.glb, video360: existingUrls.video360, videoReal: existingUrls.videoReal };
        let finalUrls = { ...oldUrls };

        try {
            if (imageFile) finalUrls.image = await uploadFile('images', imageFile);
            if (glbFile) finalUrls.glb = await uploadFile('models', glbFile);
            if (video360File) finalUrls.video360 = await uploadFile('videos', video360File);
            if (videoRealFile) finalUrls.videoReal = await uploadFile('videos', videoRealFile);

            if (deliveryFile) {
                const uploadedUrl = await uploadFile('models', deliveryFile);
                const fileName = deliveryFile.name.toLowerCase();
                if (fileName.endsWith('.zip') || fileName.endsWith('.rar')) {
                    finalUrls.zip = uploadedUrl; finalUrls.stl = null;
                } else {
                    finalUrls.stl = uploadedUrl; finalUrls.zip = null;
                }
            } else if (externalLink && externalLink !== existingUrls.zip) {
                finalUrls.zip = externalLink; finalUrls.stl = null; 
            }

            const stonesSummary = stoneRows.filter(row => row.qty || row.name).map(row => `${row.qty || '?'} un. ${row.name || 'Pedra'} (Total: ${row.weight ? `${row.weight}g` : '0g'})`).join(' + ');

            // --- ALTERAÇÃO STRIPE ---
            const response = await fetch(`/api/admin/products/${productId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: formData.title,
                category: formData.category,
                price: formData.price,
                usage: formData.usage,
                description: formData.description,
                size: formData.size,
                volume: formData.volume ? parseFloat(formData.volume) : null,
                image_url: finalUrls.image,
                file_url: finalUrls.stl,
                zip_url: finalUrls.zip,
                glb_url: finalUrls.glb,
                video_360_url: finalUrls.video360,
                video_real_url: finalUrls.videoReal,
                material_config: materialConfig,
                stones_info: stonesSummary,
                stripe_product_id: existingUrls.stripe_product_id // --- ENVIANDO O ID PARA A API ---
              }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            // Limpeza de arquivos antigos (Sua lógica original)
            const deleteOldFile = async (oldUrl: string | null, newUrl: string | null, bucket: string) => {
                if (oldUrl && oldUrl !== newUrl && !oldUrl.includes('drive.google') && !oldUrl.includes('mega.nz')) {
                    const urlParts = oldUrl.split(`/public/${bucket}/`);
                    if (urlParts.length === 2) await supabase.storage.from(bucket).remove([decodeURIComponent(urlParts[1])]);
                }
            };

            await Promise.all([
                deleteOldFile(oldUrls.image, finalUrls.image, 'images'), deleteOldFile(oldUrls.stl, finalUrls.stl, 'models'),
                deleteOldFile(oldUrls.zip, finalUrls.zip, 'models'), deleteOldFile(oldUrls.glb, finalUrls.glb, 'models')
            ]);

            toast.success("Produto atualizado com sucesso!", { id: toastId });
            router.push('/admin');

        } catch (error: any) {
            toast.error("Erro ao atualizar: " + error.message, { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const getDeliveryIcon = () => {
        if (deliveryFile) return <FileBox size={24} />;
        if (existingUrls.zip && !existingUrls.zip.includes('drive')) return <Archive size={24} />;
        if (existingUrls.zip && existingUrls.zip.includes('drive')) return <LinkIcon size={24} />;
        return <FileBox size={24} />;
    }

    const getDeliveryText = () => {
        if (deliveryFile) return deliveryFile.name;
        if (externalLink) return "Link cadastrado.";
        if (existingUrls.zip && existingUrls.zip.includes('drive')) return "Link Atual.";
        if (existingUrls.zip) return "Manter ZIP atual";
        if (existingUrls.stl) return "Manter STL atual";
        return "Nenhum arquivo.";
    }

    if (loading) return <div className="p-8 text-white">Carregando dados do produto...</div>;

    return (
        <div className="space-y-8 pb-20 text-white">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"><ArrowLeft size={20} /></Link>
                <div><h1 className="text-3xl font-bold mb-1">Editar Produto</h1><p className="text-slate-400">Atualize as informações ou arquivos.</p></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Box className="text-blue-500" /> Arquivos (Envie para substituir)</h2>

                    <div className="grid md:grid-cols-3 gap-6 mb-8 items-stretch">
                        <div className="flex flex-col h-full">
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 shrink-0 flex justify-between">Arquivo GLB{existingUrls.glb && <span className="text-green-500 text-[10px] ml-2">(JÁ POSSUI)</span>}</label>
                            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors flex-1 flex flex-col items-center justify-center ${glbFile ? 'border-blue-500 bg-blue-900/10' : 'border-slate-700 hover:border-blue-500 bg-slate-950'}`}>
                                <input type="file" accept=".glb,.gltf" onChange={(e) => { if (e.target.files && e.target.files[0]) setGlbFile(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <Box size={24} className="text-slate-500 group-hover:text-blue-400 mb-2"/>
                                <span className="text-xs font-medium truncate w-full px-2 text-slate-500 group-hover:text-blue-400">{glbFile ? glbFile.name : (existingUrls.glb ? "Manter arquivo atual" : "Substituir GLB")}</span>
                            </div>
                        </div>

                        <div className="flex flex-col h-full">
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 shrink-0 flex justify-between">Arquivo Final{(existingUrls.stl || existingUrls.zip) && <span className="text-green-500 text-[10px] ml-2">(JÁ POSSUI)</span>}</label>
                            <div className="flex-1 flex flex-col justify-between bg-slate-950 border border-slate-800 p-4 rounded-lg">
                                <div className={`relative border-2 border-dashed rounded-lg p-3 text-center group cursor-pointer transition-colors flex-1 flex flex-col items-center justify-center min-h-[70px] ${deliveryFile ? 'border-amber-500 bg-amber-900/10' : 'border-slate-700 hover:border-amber-500'} ${externalLink ? 'opacity-30 pointer-events-none' : ''}`}>
                                    <input type="file" accept=".stl,.3dm,.obj,.zip,.rar" onChange={(e) => { if(e.target.files && e.target.files[0]) { setDeliveryFile(e.target.files[0]); setExternalLink(''); } }} className="absolute inset-0 opacity-0 cursor-pointer" disabled={!!externalLink} />
                                    {getDeliveryIcon()}
                                    <span className="text-[10px] font-medium truncate px-2 mt-1 text-slate-500 group-hover:text-amber-400">{getDeliveryText()}</span>
                                </div>
                                <div className="flex items-center gap-2 my-2 justify-center shrink-0"><span className="h-px w-full bg-slate-800"></span><span className="text-[10px] text-slate-500 font-bold">OU</span><span className="h-px w-full bg-slate-800"></span></div>
                                <div className={`relative shrink-0 ${deliveryFile ? 'opacity-30 pointer-events-none' : ''}`}>
                                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input type="url" placeholder="Link do Google Drive (Anéis)" value={externalLink} onChange={(e) => { setExternalLink(e.target.value); setDeliveryFile(null); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:border-blue-500 outline-none placeholder:text-slate-600" disabled={!!deliveryFile} />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col h-full">
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 shrink-0 flex justify-between">Imagem de Capa{existingUrls.image && <span className="text-green-500 text-[10px] ml-2">(JÁ POSSUI)</span>}</label>
                            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors flex-1 flex flex-col items-center justify-center ${imageFile ? 'border-green-500 bg-green-900/10' : 'border-slate-700 hover:border-green-500 bg-slate-950'}`} style={!imageFile && existingUrls.image ? { backgroundImage: `url(${existingUrls.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                                {!imageFile && existingUrls.image && <div className="absolute inset-0 bg-black/60 rounded-lg"></div>}
                                <input type="file" accept="image/*" onChange={(e) => { if(e.target.files && e.target.files[0]) setImageFile(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <ImageIcon size={24} className="text-slate-500 group-hover:text-green-400 mb-2 relative z-20"/>
                                <span className="text-xs font-medium truncate w-full px-2 drop-shadow-md text-slate-500 group-hover:text-green-400 relative z-20">{imageFile ? imageFile.name : (existingUrls.image ? "Trocar Imagem" : "Enviar Imagem")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Info className="text-blue-500" /> Informações</h2>
                        <div><label className="block text-sm font-medium text-slate-400 mb-1">Título</label><input type="text" value={formData.title} onChange={handleTitleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" /></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-400 mb-1">Preço (R$)</label><input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" /></div><div><label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white">{['Anéis', 'Berloques', 'Brincos', 'Escapulários', 'Gargantilhas', 'Pingentes', 'Pulseiras', 'Relicários', 'Acessórios'].map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
                        <div><label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label><textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" /></div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Calculator className="text-amber-500" /> Calculadora de Peso</h2>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800"><label className="text-sm font-bold text-blue-400 mb-2 block flex items-center gap-2"><Scale size={16} /> Volume (cm³)</label><input type="number" step="0.001" value={formData.volume} onChange={e => setFormData({ ...formData, volume: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono" /></div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-lg shadow-lg">
                        {saving ? "Salvando..." : <><Save size={20} /> Salvar Alterações</>}
                    </button>
                </div>
            </form>
        </div>
    );
}