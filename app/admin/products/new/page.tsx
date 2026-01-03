"use client";

import { useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Save, Box, FileBox, Image as ImageIcon, Video, Gem, Scale, Info, Calculator, Ruler, Plus, Trash2 } from 'lucide-react';
import ModelConfigurator from '@/components/admin/ModelConfigurator';

// --- DENSIDADES (Fatores de Multiplicação) ---
const DENSITIES = {
  brass: 8.5,     // Latão
  silver: 10.0,   // Prata 925
  gold10k: 10.0,  // Ouro 10k
  gold18k: 15.0   // Ouro 18k
};

export default function NewProductPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  
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

  // --- CONFIGURAÇÃO DAS PEDRAS (DINÂMICO) ---
  const [stoneRows, setStoneRows] = useState([
    { qty: '', name: '', weight: '' } // Começa com 1 linha
  ]);

  // Arquivos
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [video360File, setVideo360File] = useState<File | null>(null);
  const [videoRealFile, setVideoRealFile] = useState<File | null>(null);
  
  // Visualização
  const [glbPreviewUrl, setGlbPreviewUrl] = useState<string | null>(null);
  const [materialConfig, setMaterialConfig] = useState({});

  // Handlers
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

  // Atualiza uma linha específica
  const updateStoneRow = (index: number, field: string, value: string) => {
    const newRows = [...stoneRows];
    // @ts-ignore
    newRows[index][field] = value;
    setStoneRows(newRows);
  };

  // Adiciona nova linha
  const addStoneRow = () => {
    setStoneRows([...stoneRows, { qty: '', name: '', weight: '' }]);
  };

  // Remove uma linha
  const removeStoneRow = (index: number) => {
    const newRows = stoneRows.filter((_, i) => i !== index);
    setStoneRows(newRows);
  };

  const uploadFile = async (bucket: string, file: File) => {
    const path = `products/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  // --- CALCULADORA DE PESO ---
  const calculationData = useMemo(() => {
    // Volume JÁ É em cm³ (ex: 0.142)
    const volCm3 = parseFloat(formData.volume) || 0; 
    
    // Soma direta dos pesos das pedras
    let totalStoneWeight = 0;
    stoneRows.forEach(row => {
        const w = Number(row.weight) || 0; 
        totalStoneWeight += w;
    });

    // Cálculos por metal (Volume * Densidade + PesoPedras)
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
    if (!imageFile || !stlFile || !glbFile) {
      alert("Por favor, envie Imagem, STL e GLB.");
      return;
    }
    setLoading(true);

    try {
      // Uploads
      const imageUrl = await uploadFile('images', imageFile);
      const stlUrl = await uploadFile('models', stlFile);
      const glbUrl = await uploadFile('models', glbFile);
      
      let video360Url = null;
      let videoRealUrl = null;
      if (video360File) video360Url = await uploadFile('videos', video360File);
      if (videoRealFile) videoRealUrl = await uploadFile('videos', videoRealFile);

      // Monta string formatada (Texto Resumo)
      const stonesSummary = stoneRows
        .filter(row => row.qty || row.name) 
        .map(row => {
            const w = row.weight ? `${row.weight}g` : '0g';
            return `${row.qty || '?'} un. ${row.name || 'Pedra'} (Total: ${w})`;
        })
        .join(' + ');

      // Salva no Banco
      const { error } = await supabase.from('products').insert({
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
        
        // --- AQUI ESTÁ A CORREÇÃO ---
        stones_info: stonesSummary, // Salva o texto legível
        stones: stoneRows           // Salva o JSON estruturado para edição futura
      });

      if (error) throw error;

      alert("Produto cadastrado com sucesso!");
      router.push('/admin');

    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-white">
      <div>
        <h1 className="text-3xl font-bold mb-2">Novo Produto</h1>
        <p className="text-slate-400">Cadastre a ficha técnica e calcule os pesos finais.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* --- ARQUIVOS --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Box className="text-blue-500" />
            Arquivos & Visualização
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* GLB */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Arquivo GLB</label>
              <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors ${glbFile ? 'border-blue-500 bg-blue-900/10' : 'border-slate-700 hover:border-blue-500 bg-slate-950'}`}>
                <input type="file" accept=".glb,.gltf" onChange={handleGlbSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-blue-400">
                  <Box size={24} />
                  <span className="text-xs font-medium truncate w-full">{glbFile ? glbFile.name : "Arraste o GLB"}</span>
                </div>
              </div>
            </div>

            {/* STL */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Arquivo STL</label>
              <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors ${stlFile ? 'border-amber-500 bg-amber-900/10' : 'border-slate-700 hover:border-amber-500 bg-slate-950'}`}>
                <input type="file" accept=".stl,.3dm,.obj" onChange={(e) => e.target.files && setStlFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-amber-400">
                  <FileBox size={24} />
                  <span className="text-xs font-medium truncate w-full">{stlFile ? stlFile.name : "Arraste o STL"}</span>
                </div>
              </div>
            </div>

            {/* IMAGEM */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Imagem de Capa</label>
              <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors ${imageFile ? 'border-green-500 bg-green-900/10' : 'border-slate-700 hover:border-green-500 bg-slate-950'}`}>
                <input type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-green-400">
                  <ImageIcon size={24} />
                  <span className="text-xs font-medium truncate w-full">{imageFile ? imageFile.name : "Arraste a Imagem"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
            {/* VÍDEO 360 */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Video size={14}/> Vídeo 360°</label>
              <div className={`relative border-2 border-dashed rounded-lg p-4 text-center group cursor-pointer transition-colors ${video360File ? 'border-purple-500 bg-purple-900/10' : 'border-slate-700 hover:border-purple-500 bg-slate-950'}`}>
                <input type="file" accept="video/*" onChange={(e) => e.target.files && setVideo360File(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-xs text-slate-500 group-hover:text-purple-400">{video360File ? video360File.name : "Selecionar Vídeo"}</span>
              </div>
            </div>
            {/* VÍDEO REAL */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Video size={14}/> Vídeo Real</label>
              <div className={`relative border-2 border-dashed rounded-lg p-4 text-center group cursor-pointer transition-colors ${videoRealFile ? 'border-pink-500 bg-pink-900/10' : 'border-slate-700 hover:border-pink-500 bg-slate-950'}`}>
                <input type="file" accept="video/*" onChange={(e) => e.target.files && setVideoRealFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-xs text-slate-500 group-hover:text-pink-400">{videoRealFile ? videoRealFile.name : "Selecionar Vídeo"}</span>
              </div>
            </div>
          </div>

          {/* VISUALIZADOR 3D */}
          {glbPreviewUrl && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-bold text-blue-400 uppercase">Pintura Digital</h3>
              </div>
              <ModelConfigurator 
                fileUrl={glbPreviewUrl} 
                initialConfig={{}} 
                onConfigChange={setMaterialConfig} 
              />
            </div>
          )}
        </div>

        {/* --- DADOS & CALCULADORA --- */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Dados Gerais */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Info className="text-blue-500" /> Informações</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
              <input type="text" value={formData.title} onChange={handleTitleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none placeholder:text-slate-600" placeholder="Ex: Anel Solitário" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Preço (R$)</label>
                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none placeholder:text-slate-600" placeholder="Ex: 150.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none cursor-pointer">
                  {['Anéis', 'Berloques', 'Brincos', 'Escapulários', 'Gargantilhas', 'Pingentes', 'Pulseiras'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2"><Ruler size={16}/> Tamanho / Dimensões</label>
              <input type="text" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none placeholder:text-slate-600" placeholder="Ex: Aro 18 ou 20x20mm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
              <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none placeholder:text-slate-600" placeholder="Ex: Pingente de Jesus escrito 'Nosso Salvador'..." />
            </div>
            
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Finalidade</label>
               <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-blue-500 flex-1 transition-all">
                    <input type="radio" name="usage" value="Prototipagem" checked={formData.usage === 'Prototipagem'} onChange={e => setFormData({...formData, usage: e.target.value as any})} className="text-blue-500 focus:ring-0" />
                    <span className="text-sm text-white">Prototipagem</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-blue-500 flex-1 transition-all">
                    <input type="radio" name="usage" value="Borracha" checked={formData.usage === 'Borracha'} onChange={e => setFormData({...formData, usage: e.target.value as any})} className="text-blue-500 focus:ring-0" />
                    <span className="text-sm text-white">Molde Borracha</span>
                  </label>
               </div>
            </div>
          </div>

          {/* Calculadora Técnica */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Calculator className="text-amber-500" /> Calculadora de Peso</h2>
            
            {/* Input Volume */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <label className="text-sm font-bold text-blue-400 mb-2 block flex items-center gap-2"><Scale size={16}/> Volume do 3D (cm³)</label>
              <input 
                type="number" 
                step="0.001" 
                value={formData.volume} 
                onChange={e => setFormData({...formData, volume: e.target.value})} 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono text-lg placeholder:text-slate-600" 
                placeholder="Ex: 0.142" 
              />
              <p className="text-[10px] text-slate-500 mt-1">Insira o volume em cm³.</p>
            </div>

            {/* Lista de Pedras (Dinâmico) */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <label className="text-sm font-bold text-purple-400 mb-4 block flex items-center gap-2"><Gem size={16}/> Pedras (Soma Direta no Peso Final)</label>
              
              <div className="flex flex-col gap-3">
                {stoneRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end relative group">
                        <div className="col-span-3">
                            <label className="text-[10px] text-slate-400 block mb-1">Qtd</label>
                            <input 
                                type="number" 
                                value={row.qty} 
                                onChange={(e) => updateStoneRow(index, 'qty', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs placeholder:text-slate-600"
                                placeholder="Ex: 10"
                            />
                        </div>
                        <div className="col-span-5">
                            <label className="text-[10px] text-slate-400 block mb-1">Descrição</label>
                            <input 
                                type="text" 
                                value={row.name}
                                onChange={(e) => updateStoneRow(index, 'name', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs placeholder:text-slate-600"
                                placeholder="Ex: Zircônia 1mm"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="text-[10px] text-slate-400 block mb-1 text-right">Peso TOTAL (g)</label>
                            <input 
                                type="number" 
                                step="0.001"
                                value={row.weight}
                                onChange={(e) => updateStoneRow(index, 'weight', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs placeholder:text-slate-600 text-right font-bold text-amber-200"
                                placeholder="Ex: 0.002"
                            />
                        </div>
                        
                        {/* Botão de Remover Linha */}
                        <div className="col-span-1 flex justify-center pb-2">
                            {stoneRows.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={() => removeStoneRow(index)}
                                    className="text-slate-600 hover:text-red-500 transition-colors"
                                    title="Remover pedra"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
              </div>

              {/* Botão Adicionar Pedra */}
              <button 
                type="button" 
                onClick={addStoneRow} 
                className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
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
                {/* Latão - 8.5x */}
                <div className="bg-yellow-900/20 p-3 rounded border border-yellow-800/50 flex justify-between items-center">
                  <span className="text-xs text-yellow-500 font-bold uppercase">Latão</span>
                  <span className="font-mono font-bold text-white">{calculationData.brass.toFixed(2)} g</span>
                </div>

                {/* Prata - 10x */}
                <div className="bg-slate-800/50 p-3 rounded border border-slate-600/50 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">Prata 925</span>
                  <span className="font-mono font-bold text-white">{calculationData.silver.toFixed(2)} g</span>
                </div>

                {/* Ouro 10k - 10x */}
                <div className="bg-amber-900/20 p-3 rounded border border-amber-600/30 flex justify-between items-center">
                  <span className="text-xs text-amber-500 font-bold uppercase">Ouro 10k</span>
                  <span className="font-mono font-bold text-amber-200">{calculationData.gold10k.toFixed(2)} g</span>
                </div>

                {/* Ouro 18k - 15x */}
                <div className="bg-amber-500/10 p-3 rounded border border-amber-400/50 flex justify-between items-center">
                  <span className="text-xs text-amber-400 font-bold uppercase">Ouro 18k</span>
                  <span className="font-mono font-bold text-amber-400">{calculationData.gold18k.toFixed(2)} g</span>
                </div>
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