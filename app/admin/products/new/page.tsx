"use client";

import { useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Save, Box, FileBox, Image as ImageIcon, Video, Gem, Scale, Info, Calculator, Ruler, Plus, Trash2, Archive, Link as LinkIcon, AlertCircle } from 'lucide-react';
import ModelConfigurator from '@/components/admin/ModelConfigurator';
import { toast } from 'react-hot-toast';

const DENSITIES = { brass: 8.5, silver: 10.0, gold10k: 10.0, gold18k: 15.0 };

export default function NewProductPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', category: 'Anéis', price: '', usage: 'Prototipagem', description: '', size: '', volume: '',      
  });

  const [stoneRows, setStoneRows] = useState([{ qty: '', name: '', weight: '' }]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null); 
  const [externalLink, setExternalLink] = useState('');

  const [video360File, setVideo360File] = useState<File | null>(null);
  const [videoRealFile, setVideoRealFile] = useState<File | null>(null);
  const [glbPreviewUrl, setGlbPreviewUrl] = useState<string | null>(null);
  const [materialConfig, setMaterialConfig] = useState({});

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

  const uploadFile = async (bucket: string, file: File) => {
    const path = `products/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const calculationData = useMemo(() => {
    const volCm3 = parseFloat(formData.volume) || 0; 
    let totalStoneWeight = 0;
    stoneRows.forEach(row => { totalStoneWeight += Number(row.weight) || 0; });
    return {
      stonesTotal: totalStoneWeight,
      brass: (volCm3 * DENSITIES.brass) + totalStoneWeight,
      silver: (volCm3 * DENSITIES.silver) + totalStoneWeight,
      gold10k: (volCm3 * DENSITIES.gold10k) + totalStoneWeight,
      gold18k: (volCm3 * DENSITIES.gold18k) + totalStoneWeight,
    };
  }, [formData.volume, stoneRows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.title.trim() === '') return toast.error("O Título não pode ficar vazio.");
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) return toast.error("Insira um preço válido maior que zero.");
    
    // VERIFICAÇÃO CONDICIONAL: Se for prototipagem, exige o arquivo final.
    if (formData.usage === 'Prototipagem' && !deliveryFile && !externalLink) {
        return toast.error("Para Prototipagem, precisa enviar o Arquivo Final ou o Link Externo.");
    }

    if (!imageFile || !glbFile) {
      return toast.error("Você precisa enviar Imagem e o arquivo GLB.");
    }
    
    setLoading(true);
    const toastId = toast.loading("Sincronizando com Stripe...");

    let imageUrl, deliveryUrl, glbUrl, video360Url, videoRealUrl;

    try {
      imageUrl = await uploadFile('images', imageFile);
      glbUrl = await uploadFile('models', glbFile);
      
      if (video360File) video360Url = await uploadFile('videos', video360File);
      if (videoRealFile) videoRealUrl = await uploadFile('videos', videoRealFile);

      // Só faz o upload do arquivo final se ele existir (e o uso não o proibir)
      if (deliveryFile && formData.usage === 'Prototipagem') {
          deliveryUrl = await uploadFile('models', deliveryFile);
      } else if (externalLink && formData.usage === 'Prototipagem') {
          deliveryUrl = externalLink; 
      }

      const stonesSummary = stoneRows.filter(row => row.qty || row.name).map(row => `${row.qty || '?'} un. ${row.name || 'Pedra'} (Total: ${row.weight ? `${row.weight}g` : '0g'})`).join(' + ');

      // --- ALTERAÇÃO STRIPE ---
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          price: formData.price,
          usage: formData.usage,
          description: formData.description,
          size: formData.size,
          volume: formData.volume ? parseFloat(formData.volume) : null,
          image_url: imageUrl,
          glb_url: glbUrl,
          file_url: (formData.usage === 'Prototipagem' && deliveryFile) ? deliveryUrl : null, 
          zip_url: (formData.usage === 'Prototipagem' && !deliveryFile) ? deliveryUrl : null,  
          video_360_url: video360Url,
          video_real_url: videoRealUrl,
          material_config: materialConfig,
          stones_info: stonesSummary || 'Sem pedras' 
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success("Produto cadastrado no site e no Stripe!", { id: toastId });
      router.push('/admin');

    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message, { id: toastId });
      // Limpeza de arquivos em caso de erro no Stripe
      const deleteFile = async (url: string | undefined, bucket: string) => {
        if (!url || url.includes('drive.google') || url.includes('mega.nz')) return;
        const urlParts = url.split(`/public/${bucket}/`);
        if (urlParts.length === 2) await supabase.storage.from(bucket).remove([decodeURIComponent(urlParts[1])]);
      };
      await Promise.all([deleteFile(imageUrl, 'images'), deleteFile(glbUrl, 'models'), deleteFile(deliveryUrl, 'models')]);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryIcon = () => {
      if (!deliveryFile) return <FileBox size={24} />;
      const name = deliveryFile.name.toLowerCase();
      if (name.endsWith('.zip') || name.endsWith('.rar')) return <Archive size={24} />;
      return <FileBox size={24} />;
  }

  // Define se o upload de arquivo de entrega deve estar bloqueado
  const isDeliveryDisabled = formData.usage === 'Borracha';

  return (
    <div className="space-y-8 pb-20 text-white">
      <div><h1 className="text-3xl font-bold mb-2">Novo Produto</h1><p className="text-slate-400">Cadastre a ficha técnica.</p></div>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Box className="text-blue-500" /> Arquivos de Entrega</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8 items-stretch">
            <div className="flex flex-col h-full">
              <label className="text-xs font-bold uppercase text-slate-500 mb-2 shrink-0">Visualizador (GLB)*</label>
              <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors flex-1 flex flex-col items-center justify-center ${glbFile ? 'border-blue-500 bg-blue-900/10' : 'border-slate-700 hover:border-blue-500 bg-slate-950'}`}>
                <input type="file" accept=".glb,.gltf" onChange={(e) => { if (e.target.files && e.target.files[0]) { setGlbFile(e.target.files[0]); setGlbPreviewUrl(URL.createObjectURL(e.target.files[0])); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Box size={24} className="text-slate-500 group-hover:text-blue-400 mb-2"/>
                <span className="text-xs font-medium truncate w-full px-2 text-slate-500 group-hover:text-blue-400">{glbFile ? glbFile.name : "Arraste o GLB"}</span>
              </div>
            </div>

            <div className="flex flex-col h-full">
              <label className="text-xs font-bold uppercase text-slate-500 mb-2 shrink-0">
                  Arquivo Final {isDeliveryDisabled ? '(Opcional)' : '*'}
              </label>
              <div className={`flex-1 flex flex-col justify-between transition-opacity duration-300 ${isDeliveryDisabled ? 'opacity-40' : ''}`}>
                  <div className={`relative border-2 border-dashed rounded-lg p-4 text-center group transition-colors flex-1 flex flex-col items-center justify-center min-h-[80px] ${deliveryFile ? 'border-amber-500 bg-amber-900/10' : 'border-slate-700 bg-slate-950'} ${(!isDeliveryDisabled && !externalLink) ? 'cursor-pointer hover:border-amber-500' : ''}`}>
                    
                    {/* Input só é ativo se não for Borracha e se não tiver link externo */}
                    <input 
                        type="file" 
                        accept=".stl,.3dm,.obj,.zip,.rar,.7z" 
                        onChange={(e) => { if (e.target.files && e.target.files[0]) { setDeliveryFile(e.target.files[0]); setExternalLink(''); } }} 
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                        disabled={isDeliveryDisabled || !!externalLink} 
                    />
                    
                    <div className={`flex flex-col items-center gap-1 text-slate-500 ${!isDeliveryDisabled && !externalLink ? 'group-hover:text-amber-400' : ''}`}>
                      {isDeliveryDisabled ? <AlertCircle size={24} className="text-amber-500/70" /> : getDeliveryIcon()}
                      <span className="text-xs font-medium truncate w-full px-2">
                          {isDeliveryDisabled ? "Não é necessário para Borracha" : (deliveryFile ? deliveryFile.name : "Fazer Upload do Arquivo STL")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 my-2 justify-center shrink-0">
                      <span className="h-px w-full bg-slate-800"></span><span className="text-[10px] text-slate-500 font-bold">OU</span><span className="h-px w-full bg-slate-800"></span>
                  </div>

                  <div className={`relative shrink-0`}>
                      <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                          type="url" 
                          placeholder="Link do Google Drive (Anéis)" 
                          value={externalLink}
                          onChange={(e) => { setExternalLink(e.target.value); setDeliveryFile(null); }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:border-blue-500 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-900"
                          disabled={isDeliveryDisabled || !!deliveryFile}
                      />
                  </div>
              </div>
            </div>

            <div className="flex flex-col h-full">
              <label className="text-xs font-bold uppercase text-slate-500 mb-2 shrink-0">Imagem de Capa*</label>
              <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors flex-1 flex flex-col items-center justify-center ${imageFile ? 'border-green-500 bg-green-900/10' : 'border-slate-700 hover:border-green-500 bg-slate-950'}`}>
                <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer" />
                <ImageIcon size={24} className="text-slate-500 group-hover:text-green-400 mb-2"/>
                <span className="text-xs font-medium truncate w-full px-2 text-slate-500 group-hover:text-green-400">{imageFile ? imageFile.name : "Arraste a Imagem"}</span>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
            <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Video size={14}/> Vídeo 360°</label><div className={`relative border-2 border-dashed rounded-lg p-4 text-center group cursor-pointer transition-colors ${video360File ? 'border-purple-500 bg-purple-900/10' : 'border-slate-700 hover:border-purple-500 bg-slate-950'}`}><input type="file" accept="video/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setVideo360File(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="text-xs text-slate-500 group-hover:text-purple-400">{video360File ? video360File.name : "Selecionar Vídeo"}</span></div></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Video size={14}/> Vídeo Real</label><div className={`relative border-2 border-dashed rounded-lg p-4 text-center group cursor-pointer transition-colors ${videoRealFile ? 'border-pink-500 bg-pink-900/10' : 'border-slate-700 hover:border-pink-500 bg-slate-950'}`}><input type="file" accept="video/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setVideoRealFile(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="text-xs text-slate-500 group-hover:text-pink-400">{videoRealFile ? videoRealFile.name : "Selecionar Vídeo"}</span></div></div>
          </div>

          {glbPreviewUrl && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-bold text-blue-400 uppercase">Pintura Digital</h3></div>
              <ModelConfigurator fileUrl={glbPreviewUrl} initialConfig={materialConfig} onConfigChange={setMaterialConfig} />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Info className="text-blue-500" /> Informações</h2>
            <div><label className="block text-sm font-medium text-slate-400 mb-1">Título</label><input type="text" value={formData.title} onChange={handleTitleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none placeholder:text-slate-600" placeholder="Ex: Anel Solitário" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-400 mb-1">Preço (R$)</label><input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none placeholder:text-slate-600" placeholder="Ex: 150.00" /></div>
              <div><label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none cursor-pointer">{['Anéis', 'Berloques', 'Brincos', 'Escapulários', 'Gargantilhas', 'Pingentes', 'Pulseiras', 'Relicários', 'Acessórios'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2"><Ruler size={16}/> Tamanho / Dimensões</label><input type="text" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none placeholder:text-slate-600" placeholder="Ex: Aro 18 ou 20x20mm" /></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label><textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none placeholder:text-slate-600" placeholder="Ex: Pingente de Jesus escrito 'Nosso Salvador'..." /></div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Finalidade</label>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border flex-1 transition-colors ${formData.usage === 'Prototipagem' ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}>
                  <input type="radio" name="usage" value="Prototipagem" checked={formData.usage === 'Prototipagem'} onChange={e => setFormData({...formData, usage: e.target.value as any})} className="text-blue-500 focus:ring-0" />
                  <span className="text-sm text-white">Prototipagem</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border flex-1 transition-colors ${formData.usage === 'Borracha' ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}>
                  <input type="radio" name="usage" value="Borracha" checked={formData.usage === 'Borracha'} onChange={e => {
                      setFormData({...formData, usage: e.target.value as any});
                      // Limpa os arquivos de entrega ao mudar para Borracha
                      setDeliveryFile(null);
                      setExternalLink('');
                  }} className="text-blue-500 focus:ring-0" />
                  <span className="text-sm text-white">Molde Borracha</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Calculator className="text-amber-500" /> Calculadora de Peso</h2>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800"><label className="text-sm font-bold text-blue-400 mb-2 block flex items-center gap-2"><Scale size={16}/> Volume do 3D (cm³)</label><input type="number" step="0.001" value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono text-lg placeholder:text-slate-600" placeholder="Ex: 0.142" /></div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800"><label className="text-sm font-bold text-purple-400 mb-4 block flex items-center gap-2"><Gem size={16}/> Pedras</label>
              <div className="flex flex-col gap-3">{stoneRows.map((row, index) => (<div key={index} className="grid grid-cols-12 gap-2 items-end relative group"><div className="col-span-3"><label className="text-[10px] text-slate-400 block mb-1">Qtd</label><input type="number" value={row.qty} onChange={(e) => updateStoneRow(index, 'qty', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs placeholder:text-slate-600" placeholder="Ex: 10" /></div><div className="col-span-5"><label className="text-[10px] text-slate-400 block mb-1">Descrição</label><input type="text" value={row.name} onChange={(e) => updateStoneRow(index, 'name', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs placeholder:text-slate-600" placeholder="Ex: Zircônia 1mm" /></div><div className="col-span-3"><label className="text-[10px] text-slate-400 block mb-1 text-right">Peso (g)</label><input type="number" step="0.001" value={row.weight} onChange={(e) => updateStoneRow(index, 'weight', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs text-right font-bold text-amber-200 placeholder:text-slate-600" placeholder="Ex: 0.002" /></div><div className="col-span-1 flex justify-center pb-2">{stoneRows.length > 1 && (<button type="button" onClick={() => removeStoneRow(index)} className="text-slate-600 hover:text-red-500"><Trash2 size={16} /></button>)}</div></div>))}</div>
              <button type="button" onClick={addStoneRow} className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"><Plus size={14} /> Adicionar Pedra</button>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Estimativa</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-yellow-900/20 p-3 rounded border border-yellow-800/50 flex justify-between items-center"><span className="text-xs text-yellow-500 font-bold uppercase">Latão</span><span className="font-mono font-bold text-white">{calculationData.brass.toFixed(2)} g</span></div>
                <div className="bg-slate-800/50 p-3 rounded border border-slate-600/50 flex justify-between items-center"><span className="text-xs text-slate-400 font-bold uppercase">Prata</span><span className="font-mono font-bold text-white">{calculationData.silver.toFixed(2)} g</span></div>
                <div className="bg-amber-900/20 p-3 rounded border border-amber-600/30 flex justify-between items-center"><span className="text-xs text-amber-500 font-bold uppercase">Ouro 10k</span><span className="font-mono font-bold text-amber-200">{calculationData.gold10k.toFixed(2)} g</span></div>
                <div className="bg-amber-500/10 p-3 rounded border border-amber-400/50 flex justify-between items-center"><span className="text-xs text-amber-400 font-bold uppercase">Ouro 18k</span><span className="font-mono font-bold text-amber-400">{calculationData.gold18k.toFixed(2)} g</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-lg shadow-lg active:scale-95 disabled:opacity-50">
            {loading ? "Salvando..." : <><Save size={20} /> Cadastrar Produto</>}
          </button>
        </div>
      </form>
    </div>
  );
}