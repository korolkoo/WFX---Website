"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, User, Box, DollarSign, FileText, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ManualSendPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    
    // Formulário
    const [email, setEmail] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [notes, setNotes] = useState('');
    const [customStlFile, setCustomStlFile] = useState<File | null>(null);

    useEffect(() => {
        const loadProducts = async () => {
            const { data } = await supabase.from('products').select('id, title, usage, price').order('title');
            if (data) setProducts(data);
        };
        loadProducts();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !selectedProductId || !customStlFile) {
            toast.error('Preencha o e-mail, selecione o produto base e envie o STL modificado.');
            return;
        }

        const toastId = toast.loading('Iniciando processo de envio...');
        setLoading(true);

        try {
            // 1. UPLOAD DO ARQUIVO MODIFICADO (Direto do Frontend)
            toast.loading('Fazendo upload do arquivo exclusivo...', { id: toastId });
            
            // Usa um caminho seguro para não sobrescrever arquivos
            const path = `custom_orders/${Date.now()}_${customStlFile.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await supabase.storage.from('models').upload(path, customStlFile);
            
            if (uploadError) throw new Error('Falha ao fazer upload do STL modificado.');
            
            const customFileUrl = supabase.storage.from('models').getPublicUrl(path).data.publicUrl;

            // 2. CHAMA A API PARA SALVAR A VENDA E DISPARAR O E-MAIL
            toast.loading('Registrando venda e disparando e-mail...', { id: toastId });

            const response = await fetch('/api/admin-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    productId: selectedProductId,
                    customPrice: customPrice ? parseFloat(customPrice) : null,
                    notes,
                    customFileUrl // Mandamos a URL do arquivo modificado pra API!
                })
            });

            const result = await response.json();

            if (!response.ok) {
                // Se der erro, fazemos rollback do arquivo que acabou de subir
                await supabase.storage.from('models').remove([path]);
                throw new Error(result.error || 'Erro desconhecido ao enviar');
            }

            toast.success('Arquivo personalizado enviado com sucesso!', { id: toastId });
            
            // Limpa o formulário
            setEmail('');
            setSelectedProductId('');
            setCustomPrice('');
            setNotes('');
            setCustomStlFile(null);

        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">Envio Exclusivo</h1>
                <p className="text-slate-400">Faça o upload do STL modificado para entregar ao cliente.</p>
            </div>

            <form onSubmit={handleSend} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
                
                {/* Email do Cliente */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <User size={16} className="text-blue-500"/> E-mail do Cliente
                    </label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cliente@gmail.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Seleção do Produto Base */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Box size={16} className="text-amber-500"/> Produto Base (Para foto e título)
                    </label>
                    <select 
                        required
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    >
                        <option value="">Selecione de qual modelo essa alteração derivou...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                [{p.usage}] {p.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* UPLOAD DO ARQUIVO MODIFICADO */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <UploadCloud size={16} className="text-green-500"/> Arquivo STL Modificado
                    </label>
                    <div className={`relative border-2 border-dashed rounded-lg p-6 text-center group cursor-pointer transition-colors ${customStlFile ? 'border-green-500 bg-green-900/10' : 'border-slate-800 hover:border-green-500 bg-slate-950'}`}>
                        <input 
                            type="file" 
                            accept=".stl,.3dm,.obj" 
                            required
                            onChange={(e) => e.target.files && setCustomStlFile(e.target.files[0])} 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-green-400">
                            <UploadCloud size={24} />
                            <span className="text-xs font-medium truncate w-full">
                                {customStlFile ? customStlFile.name : "Clique ou arraste o STL exclusivo aqui"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Preço Negociado */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <DollarSign size={16} className="text-yellow-500"/> Preço Final do PIX (Opcional)
                    </label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="Ex: 250.00"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Notas */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <FileText size={16} className="text-purple-500"/> Detalhes da Alteração
                    </label>
                    <textarea 
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Borracha ajustada com 2 canais extras e garra reforçada."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none"
                    />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Enviando...' : <><Send size={18} /> Entregar Arquivo</>}
                    </button>
                </div>
            </form>
        </div>
    );
}