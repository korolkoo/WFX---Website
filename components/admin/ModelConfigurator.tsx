"use client";

import { useState, useMemo, useEffect } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import * as THREE from 'three';
import { X, Layers, MousePointer2, Palette } from 'lucide-react'; // Ícones novos para visual pro

// Materiais Profissionais
const MATERIALS = {
  gold: new THREE.MeshPhysicalMaterial({ color: "#FFD700", metalness: 1.0, roughness: 0.15, clearcoat: 1.0 }),
  silver: new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", metalness: 1.0, roughness: 0.05, clearcoat: 1.0 }),
  roseGold: new THREE.MeshPhysicalMaterial({ color: "#B76E79", metalness: 1.0, roughness: 0.15, clearcoat: 1.0 }),
  diamond: new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: 0, transmission: 1, thickness: 8, ior: 2.4, envMapIntensity: 2 }),
  ruby: new THREE.MeshPhysicalMaterial({ color: "#ff0040", metalness: 0, roughness: 0, transmission: 0.8, thickness: 5, ior: 1.7 }),
  sapphire: new THREE.MeshPhysicalMaterial({ color: "#0f52ba", metalness: 0, roughness: 0, transmission: 0.8, thickness: 5, ior: 1.7 }),
  emerald: new THREE.MeshPhysicalMaterial({ color: "#00a846", metalness: 0, roughness: 0, transmission: 0.8, thickness: 5, ior: 1.5 }),
  onyx: new THREE.MeshPhysicalMaterial({ color: "#050505", metalness: 0, roughness: 0.1, clearcoat: 1.0 }),
};

function ConfiguratorScene({ url, config, onPartClick, selectedPartName }: any) {
  const { scene } = useGLTF(url) as any;
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        let materialToApply = new THREE.MeshStandardMaterial({ 
          color: "#999999", 
          roughness: 0.3,
          metalness: 0.5 
        });

        if (config[child.name]) {
          const matKey = config[child.name] as keyof typeof MATERIALS;
          if (MATERIALS[matKey]) materialToApply = MATERIALS[matKey];
        }

        if (child.name === selectedPartName) {
          const highlightMat = materialToApply.clone();
          highlightMat.emissive = new THREE.Color("#4444ff"); // Azul neon WFX
          highlightMat.emissiveIntensity = 0.4;
          child.material = highlightMat;
        } else {
          child.material = materialToApply;
        }
        
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [config, clonedScene, selectedPartName]);

  return (
    <Stage environment="city" intensity={1}>
      <primitive 
        object={clonedScene} 
        onPointerDown={(e: any) => {
          e.stopPropagation();
          const object = e.object;
          console.log("Clique:", object.name);
          if (object.isMesh) onPartClick(object.name);
        }}
      />
    </Stage>
  );
}

export default function ModelConfigurator({ fileUrl, initialConfig, onConfigChange }: any) {
  const [config, setConfig] = useState(initialConfig || {});
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const handleMaterialSelect = (matKey: string) => {
    if (selectedPart) {
      const newConfig = { ...config, [selectedPart]: matKey };
      setConfig(newConfig);
      onConfigChange(newConfig);
    } else {
      alert("Selecione uma peça primeiro!");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[600px] border border-slate-800 rounded-xl overflow-hidden bg-[#0b0f19] shadow-2xl">
      
      {/* Área 3D */}
      <div className="flex-1 relative cursor-crosshair bg-gradient-to-b from-slate-900 to-[#050505]">
        <Canvas 
          dpr={[1, 2]} 
          camera={{ position: [10, 10, 10], fov: 45 }}
          onPointerMissed={() => setSelectedPart(null)}
        >
          <ConfiguratorScene 
            url={fileUrl} 
            config={config} 
            onPartClick={setSelectedPart}
            selectedPartName={selectedPart}
          />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
        </Canvas>
        
        {/* Overlay de Instruções (Mais limpo) */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none select-none">
          <div className="bg-black/40 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-white/5 text-xs flex items-center gap-2">
            <MousePointer2 size={14} className="text-blue-400" />
            <span>Clique para selecionar</span>
          </div>
          <div className="bg-black/40 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-white/5 text-xs flex items-center gap-2">
            <Palette size={14} className="text-amber-400" />
            <span>Pinte com o menu lateral</span>
          </div>
        </div>
      </div>

      {/* Painel Lateral */}
      <div className="w-full lg:w-80 bg-[#0f1420] border-l border-slate-800 flex flex-col">
        
        {/* Cabeçalho do Painel */}
        <div className="p-6 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-blue-500" />
            Editor de Materiais
          </h3>
          <p className="text-xs text-slate-500 mt-1">Configure os materiais de cada parte.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {selectedPart ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              
              {/* Card da Peça Selecionada (Visual Premium) */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Peça Ativa</span>
                    <p className="text-sm font-mono text-white mt-1 break-all line-clamp-2" title={selectedPart}>
                      {selectedPart}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedPart(null)}
                    className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-md transition-all"
                    title="Deselecionar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Seção de Metais */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                  Metais Preciosos
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'gold', name: 'Ouro 18k', color: '#FFD700', border: '#B8860B' },
                    { id: 'silver', name: 'Prata 950', color: '#E0E0E0', border: '#A0A0A0' },
                    { id: 'roseGold', name: 'Ouro Rosé', color: '#B76E79', border: '#8B4513' },
                  ].map((m) => (
                    <button 
                      key={m.id} 
                      type="button" // Importante para não submeter form
                      onClick={() => handleMaterialSelect(m.id)} 
                      className="group flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300" 
                        style={{ backgroundColor: m.color, border: `2px solid ${m.border}` }}
                      ></div>
                      <span className="text-[10px] text-slate-400 group-hover:text-white font-medium">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção de Gemas */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                  Gemas & Pedras
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'diamond', name: 'Diamante', color: '#ffffff' },
                    { id: 'ruby', name: 'Rubi', color: '#ff0040' },
                    { id: 'sapphire', name: 'Safira', color: '#0f52ba' },
                    { id: 'emerald', name: 'Esmeralda', color: '#00a846' },
                    { id: 'onyx', name: 'Ônix', color: '#1a1a1a' },
                  ].map((m) => (
                    <button 
                      key={m.id} 
                      type="button" 
                      onClick={() => handleMaterialSelect(m.id)} 
                      className="group flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors" 
                      title={m.name}
                    >
                      <div 
                        className="w-8 h-8 rounded-full border border-slate-600 group-hover:border-white transition-all shadow-lg group-hover:scale-110" 
                        style={{ backgroundColor: m.color }}
                      ></div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-4 opacity-40 pb-20 select-none">
              <div className="relative">
                <div className="w-20 h-20 border-2 border-dashed border-slate-700 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <MousePointer2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500" size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">Nenhuma parte selecionada</p>
                <p className="text-xs">Clique no modelo 3D ao lado.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}