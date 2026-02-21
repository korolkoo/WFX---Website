"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
// --- ADICIONADOS ÍCONES Search E ChevronDown ---
import { Send, User, Box, DollarSign, FileText, UploadCloud, Link as LinkIcon, Search, ChevronDown } from 'lucide-react';
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

    // --- OPÇÕES HÍBRIDAS ---
    const [customFile, setCustomFile] = useState<File | null>(null);
    const [externalLink, setExternalLink] = useState('');

    // --- ESTADOS DO NOVO DROPDOWN COM PESQUISA ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadProducts = async () => {
            const { data } = await supabase.from('products').select('id, title, usage, price').order('title');
            if (data) setProducts(data);
        };
        loadProducts();
    }, [supabase]);

    // --- FUNÇÃO PARA FILTRAR OS PRODUTOS ---
    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.usage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !selectedProductId || (!customFile && !externalLink)) {
            toast.error('Preencha e-mail, produto base e o arquivo (Upload ou Link).');
            return;
        }

        const toastId = toast.loading('Iniciando processo de envio...');
        setLoading(true);

        try {
            let finalUrl = '';

            if (customFile) {
                toast.loading('Fazendo upload do arquivo exclusivo...', { id: toastId });
                const path = `custom_orders/${Date.now()}_${customFile.name.replace(/\s/g, '_')}`;
                const { error: uploadError } = await supabase.storage.from('models').upload(path, customFile);

                if (uploadError) throw new Error('Falha ao fazer upload do arquivo.');
                finalUrl = supabase.storage.from('models').getPublicUrl(path).data.publicUrl;
            } else {
                finalUrl = externalLink;
            }

            toast.loading('Registrando venda e disparando e-mail...', { id: toastId });

            const response = await fetch('/api/admin-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    productId: selectedProductId,
                    customPrice: customPrice ? parseFloat(customPrice) : null,
                    notes,
                    customFileUrl: finalUrl
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (customFile) {
                    const path = finalUrl.split('/models/')[1];
                    await supabase.storage.from('models').remove([decodeURIComponent(path)]);
                }
                throw new Error(result.error || 'Erro desconhecido ao enviar');
            }

            toast.success('Arquivo personalizado enviado com sucesso!', { id: toastId });

            setEmail('');
            setSelectedProductId('');
            setCustomPrice('');
            setNotes('');
            setCustomFile(null);
            setExternalLink('');

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
                <p className="text-slate-400">Faça o upload do STL ou cole o link do pacote ZIP (Drive) modificado.</p>
            </div>

            <form onSubmit={handleSend} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2"><User size={16} className="text-blue-500" /> E-mail do Cliente</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@gmail.com" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                </div>

                {/* --- NOVO DROPDOWN COM PESQUISA --- */}
                <div className="space-y-2 relative">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Box size={16} className="text-amber-500" /> Produto Base (Para foto e título)
                    </label>

                    {/* Botão que abre o menu */}
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full bg-slate-950 border ${isDropdownOpen ? 'border-blue-500' : 'border-slate-800'} rounded-lg p-3 text-white cursor-pointer flex justify-between items-center transition-colors hover:border-blue-500`}
                    >
                        <span className={selectedProductId ? 'text-white' : 'text-slate-500'}>
                            {selectedProductId
                                ? products.find(p => p.id.toString() === selectedProductId)?.title
                                : "Selecione ou pesquise o modelo..."}
                        </span>
                        <ChevronDown size={18} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Menu Suspensa (Dropdown) */}
                    {isDropdownOpen && (
                        <>
                            {/* Fundo invisível para fechar ao clicar fora */}
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>

                            <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                                {/* Barra de Pesquisa Fixa no topo */}
                                <div className="p-3 border-b border-slate-800 bg-slate-900">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Buscar pelo nome ou finalidade..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pl-10 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                {/* Lista de Resultados */}
                                <ul className="max-h-64 overflow-y-auto py-2">
                                    {filteredProducts.map(p => (
                                        <li
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedProductId(p.id.toString());
                                                setIsDropdownOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className="px-4 py-3 text-sm text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-800/50 last:border-0"
                                        >
                                            <span className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded border ${p.usage === 'Borracha'
                                                    ? 'text-slate-400 bg-slate-800/50 border-slate-700'
                                                    : 'text-amber-400 bg-amber-900/30 border-amber-800/50'
                                                }`}>
                                                {p.usage}
                                            </span>
                                            <span className="font-medium truncate">{p.title}</span>
                                        </li>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <li className="px-4 py-6 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
                                            <Box size={24} className="opacity-50" />
                                            Nenhum produto encontrado com "{searchQuery}"
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                <div className="space-y-2 bg-slate-950 border border-slate-800 p-5 rounded-lg">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2"><UploadCloud size={16} className="text-green-500" /> Arquivo Final (Escolha Uma Opção)</label>

                    <div className={`relative border-2 border-dashed rounded-lg p-4 text-center group cursor-pointer transition-colors mt-3 ${customFile ? 'border-green-500 bg-green-900/10' : 'border-slate-800 hover:border-green-500'} ${externalLink ? 'opacity-30 pointer-events-none' : ''}`}>
                        <input type="file" accept=".stl,.3dm,.obj,.zip,.rar,.7z" onChange={(e) => { e.target.files && setCustomFile(e.target.files[0]); setExternalLink(''); }} className="absolute inset-0 opacity-0 cursor-pointer" disabled={!!externalLink} />
                        <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-green-400">
                            <UploadCloud size={24} />
                            <span className="text-xs font-medium truncate w-full px-4">{customFile ? customFile.name : "Clique ou arraste o STL exclusivo"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 my-4 justify-center">
                        <span className="h-px w-full bg-slate-800"></span><span className="text-xs text-slate-500 font-bold">OU</span><span className="h-px w-full bg-slate-800"></span>
                    </div>

                    <div className={`relative ${customFile ? 'opacity-30 pointer-events-none' : ''}`}>
                        <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="url"
                            placeholder="Cole o link do Google Drive aqui..."
                            value={externalLink}
                            onChange={(e) => { setExternalLink(e.target.value); setCustomFile(null); }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600"
                            disabled={!!customFile}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2"><DollarSign size={16} className="text-yellow-500" /> Preço Final do PIX (Opcional)</label>
                    <input type="number" step="0.01" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="Ex: 250.00" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2"><FileText size={16} className="text-purple-500" /> Detalhes da Alteração</label>
                    <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Pacote com garra reforçada." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none" />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50">
                        {loading ? 'Enviando...' : <><Send size={18} /> Entregar Arquivo</>}
                    </button>
                </div>
            </form>
        </div>
    );
}