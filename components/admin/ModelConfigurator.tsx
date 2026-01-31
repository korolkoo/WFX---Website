"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Environment } from "@react-three/drei";
import * as THREE from 'three';
import { X, Layers, MousePointer2, Palette, Droplets, Check, Plus, Eye, EyeOff, Hash } from 'lucide-react';
import { HexColorPicker } from "react-colorful";

// --- MATERIAIS AJUSTADOS PARA BRILHO MÁXIMO ---
const MATERIALS = {
  // METAIS
  gold: new THREE.MeshPhysicalMaterial({ 
    color: "#FFD700", metalness: 1.0, roughness: 0.15, clearcoat: 1.0, envMapIntensity: 2.5 
  }),
  
  // PRATA (CORRIGIDA): Agora com 'emissive' para nunca ficar preta nas sombras
  silver: new THREE.MeshPhysicalMaterial({ 
    color: "#FFFFFF", 
    emissive: "#151515", // Um leve brilho interno cinza para garantir claridade
    metalness: 1.0, 
    roughness: 0.05,     // Quase espelho
    clearcoat: 1.0, 
    envMapIntensity: 3.0 // Reflete muito o ambiente (brilho estourado)
  }),
  
  roseGold: new THREE.MeshPhysicalMaterial({ 
    color: "#B76E79", metalness: 1.0, roughness: 0.15, clearcoat: 1.0, envMapIntensity: 2.5 
  }),

  // GEMAS (Nova abordagem: Menos física realista, mais visual "Joia de Shopping")
  diamond: new THREE.MeshPhysicalMaterial({ 
    color: "#ffffff", metalness: 0.1, roughness: 0, transmission: 1, thickness: 10, ior: 2.4, 
    envMapIntensity: 5, dispersion: 15 
  }),

  ruby: new THREE.MeshPhysicalMaterial({ 
    color: "#ff0000",       // Cor base forte
    emissive: "#440000",    // Luz própria vermelha (O segredo do brilho)
    metalness: 0.4,         // Um pouco de metalness ajuda a refletir brilho branco
    roughness: 0, 
    transmission: 0.5,      // Meio transparente, meio sólido
    thickness: 5, 
    ior: 1.77, 
    envMapIntensity: 3, 
    clearcoat: 1.0
  }),

  sapphire: new THREE.MeshPhysicalMaterial({ 
    color: "#0000ff", 
    emissive: "#000044",    // Luz própria azul
    metalness: 0.4, 
    roughness: 0, 
    transmission: 0.5, 
    thickness: 5, 
    ior: 1.77, 
    envMapIntensity: 3, 
    clearcoat: 1.0
  }),

  emerald: new THREE.MeshPhysicalMaterial({ 
    color: "#00ff00", 
    emissive: "#004400",    // Luz própria verde
    metalness: 0.4, 
    roughness: 0, 
    transmission: 0.5, 
    thickness: 5, 
    ior: 1.57, 
    envMapIntensity: 3, 
    clearcoat: 1.0
  }),

  onyx: new THREE.MeshPhysicalMaterial({ 
    color: "#050505", metalness: 0, roughness: 0, clearcoat: 1.0, envMapIntensity: 2 
  }),
};

// Cena 3D
function ConfiguratorScene({ url, config, onPartClick, selectedPartName, isHighlightVisible }: any) {
  const { scene } = useGLTF(url) as any;
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        let materialToApply = null;

        const partConfig = config[child.name];

        // 1. Configuração Manual (O que você clica no menu)
        if (partConfig) {
          if (typeof partConfig === 'string' && MATERIALS[partConfig as keyof typeof MATERIALS]) {
            materialToApply = MATERIALS[partConfig as keyof typeof MATERIALS];
          } 
          else if (typeof partConfig === 'object' && partConfig.type === 'resin') {
            materialToApply = new THREE.MeshPhysicalMaterial({
              color: partConfig.color,
              metalness: 0.0,
              roughness: 0.15,
              clearcoat: 1.0,
              clearcoatRoughness: 0.02,
              reflectivity: 0.8,
              ior: 1.5,
              envMapIntensity: 1.5,
              side: THREE.DoubleSide
            });
          }
        }

        // 2. Auto-Detecção (O que estava faltando no Admin!)
        // Se não tiver config manual, tenta adivinhar pelo nome
        if (!materialToApply) {
           let fullID = child.name.toLowerCase();
           if (fullID.includes("prata") || fullID.includes("silver")) materialToApply = MATERIALS.silver;
           else if (fullID.includes("rubi") || fullID.includes("ruby")) materialToApply = MATERIALS.ruby;
           else if (fullID.includes("esmeralda") || fullID.includes("emerald")) materialToApply = MATERIALS.emerald;
           else if (fullID.includes("safira") || fullID.includes("sapphire")) materialToApply = MATERIALS.sapphire;
           else if (fullID.includes("diamante") || fullID.includes("diamond") || fullID.includes("pedra")) materialToApply = MATERIALS.diamond;
           else if (fullID.includes("ouro") || fullID.includes("gold")) materialToApply = MATERIALS.gold;
           else materialToApply = MATERIALS.gold; // Fallback final
        }

        // Aplica o material final
        if (materialToApply) {
            // Se estiver selecionado, cria o destaque azul
            if (child.name === selectedPartName && isHighlightVisible) {
                const highlightMat = materialToApply.clone();
                highlightMat.emissive = new THREE.Color("#4444ff"); 
                highlightMat.emissiveIntensity = 0.3;
                child.material = highlightMat;
            } else {
                child.material = materialToApply;
            }
        }
        
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [config, clonedScene, selectedPartName, isHighlightVisible]);

  return <primitive object={clonedScene} onPointerDown={(e: any) => { e.stopPropagation(); if (e.object.isMesh) onPartClick(e.object.name); }} />;
}

export default function ModelConfigurator({ fileUrl, initialConfig, onConfigChange }: any) {
  const [config, setConfig] = useState(initialConfig || {});
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [showHighlight, setShowHighlight] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("#000000");

  useEffect(() => {
    const saved = localStorage.getItem('wfx_resin_colors');
    if (saved) {
      setSavedColors(JSON.parse(saved));
    } else {
      setSavedColors(['#000000', '#FFFFFF', '#D32F2F', '#1976D2']);
    }
  }, []);

  const handlePartClick = (partName: string) => {
    setSelectedPart(partName);
    setShowHighlight(true);
    setShowColorPicker(false);
  };

  const handleMaterialSelect = (matKey: string) => {
    if (!selectedPart) return alert("Selecione uma peça primeiro!");
    const newConfig = { ...config, [selectedPart]: matKey };
    setConfig(newConfig);
    onConfigChange(newConfig);
    setShowColorPicker(false);
  };

  const handleResinSelect = (color: string) => {
    if (!selectedPart) return alert("Selecione uma peça primeiro!");
    setCustomColor(color);
    setShowHighlight(false);
    const newConfig = { ...config, [selectedPart]: { type: 'resin', color: color } };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const saveCurrentColor = () => {
    if (!savedColors.includes(customColor)) {
      const newColors = [...savedColors, customColor];
      setSavedColors(newColors);
      localStorage.setItem('wfx_resin_colors', JSON.stringify(newColors));
    }
  };

  const deleteColor = (colorToDelete: string) => {
    const newColors = savedColors.filter(c => c !== colorToDelete);
    setSavedColors(newColors);
    localStorage.setItem('wfx_resin_colors', JSON.stringify(newColors));
  };

  const getCurrentResinColor = () => {
    if (!selectedPart) return null;
    const current = config[selectedPart];
    if (typeof current === 'object' && current.type === 'resin') return current.color;
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row h-[700px] border border-slate-800 rounded-xl overflow-hidden bg-[#0b0f19] shadow-2xl">
      
      {/* Área 3D */}
      <div className="flex-1 relative cursor-crosshair bg-gradient-to-b from-slate-900 to-[#050505]">
        <Canvas 
          dpr={[1, 2]} 
          camera={{ position: [10, 10, 10], fov: 45 }}
          onPointerMissed={() => setSelectedPart(null)}
          shadows
        >
          {/* AMBIENTE NEUTRO E CLARO */}
          <Environment preset="city" background={false} blur={0.8} />
          
          <ambientLight intensity={0.6} color="#ffffff" />
          <spotLight position={[10, 15, 10]} angle={0.2} penumbra={1} intensity={2.5} castShadow color="#ffffff" />
          <pointLight position={[-10, 5, -10]} intensity={1.5} color="#e6f0ff" />
          <pointLight position={[0, -10, 5]} intensity={1} color="#ffeebb" />

          <ConfiguratorScene 
            url={fileUrl} 
            config={config} 
            onPartClick={handlePartClick} 
            selectedPartName={selectedPart} 
            isHighlightVisible={showHighlight} 
          />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
        </Canvas>
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none select-none">
          <div className="bg-black/40 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-white/5 text-xs flex items-center gap-2">
            <MousePointer2 size={14} className="text-blue-400" />
            <span>Clique para selecionar</span>
          </div>
        </div>
      </div>

      {/* Painel Lateral */}
      <div className="w-full lg:w-80 bg-[#0f1420] border-l border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2"><Layers size={18} className="text-blue-500" />Editor de Materiais</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {selectedPart ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Peça Ativa</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowHighlight(!showHighlight)} className={`p-1.5 rounded-md transition-colors ${showHighlight ? 'text-blue-400 bg-blue-500/20' : 'text-slate-500 hover:text-white'}`}><Eye size={14} /></button>
                    <button type="button" onClick={() => setSelectedPart(null)} className="text-slate-400 hover:text-white bg-slate-800/50 p-1.5 rounded-md"><X size={14} /></button>
                  </div>
                </div>
                <p className="text-sm font-mono text-white break-all line-clamp-1">{selectedPart}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Metais</p>
                <div className="grid grid-cols-3 gap-3">
                  {[{ id: 'gold', name: 'Ouro 18k', color: '#FFD700', border: '#B8860B' }, { id: 'silver', name: 'Prata 950', color: '#E0E0E0', border: '#A0A0A0' }, { id: 'roseGold', name: 'Ouro Rosé', color: '#B76E79', border: '#8B4513' }].map((m) => (
                    <button key={m.id} type="button" onClick={() => handleMaterialSelect(m.id)} className="group flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50">
                      <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: m.color, border: `2px solid ${m.border}` }}></div>
                      <span className="text-[10px] text-slate-400 font-medium">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span> Resina</p></div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                          <input type="text" value={customColor} onChange={(e) => handleResinSelect(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-xs text-white font-mono uppercase" maxLength={7}/>
                      </div>
                      <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="w-10 h-10 rounded-lg border flex items-center justify-center transition-colors border-slate-700 hover:border-white" style={{ backgroundColor: customColor }}><Palette size={16} className="text-white drop-shadow-md mix-blend-difference" /></button>
                      <button type="button" onClick={saveCurrentColor} className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-green-400"><Plus size={18} /></button>
                  </div>
                  {showColorPicker && (<div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex justify-center"><HexColorPicker color={customColor} onChange={handleResinSelect} style={{ width: '100%' }} /></div>)}
                  {savedColors.length > 0 && (
                      <div className="grid grid-cols-5 gap-2">
                        {savedColors.map((color, idx) => (
                            <div key={`${color}-${idx}`} className="relative group/item">
                                <button type="button" onClick={() => handleResinSelect(color)} className="w-full aspect-square rounded-md border border-slate-700 hover:border-slate-500" style={{ backgroundColor: color }}>{getCurrentResinColor() === color && <Check size={14} className="text-white drop-shadow-md mix-blend-difference m-auto" />}</button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); deleteColor(color); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/item:opacity-100 hover:scale-110"><X size={8} /></button>
                            </div>
                        ))}
                      </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span> Gemas</p>
                <div className="grid grid-cols-4 gap-2">
                  {[{ id: 'diamond', name: 'Diamante', color: '#ffffff' }, { id: 'ruby', name: 'Rubi', color: '#ff0040' }, { id: 'sapphire', name: 'Safira', color: '#0f52ba' }, { id: 'emerald', name: 'Esmeralda', color: '#00a846' }, { id: 'onyx', name: 'Ônix', color: '#1a1a1a' }].map((m) => (
                    <button key={m.id} type="button" onClick={() => handleMaterialSelect(m.id)} className="group flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-800/50">
                      <div className="w-8 h-8 rounded-full border border-slate-600 shadow-lg" style={{ backgroundColor: m.color }}></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-4 opacity-40 select-none"><div className="w-20 h-20 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]"><Droplets size={24} /></div><div><p className="text-sm font-medium text-slate-400">Selecione uma peça</p><p className="text-xs">Clique no modelo para editar.</p></div></div>
          )}
        </div>
      </div>
    </div>
  );
}