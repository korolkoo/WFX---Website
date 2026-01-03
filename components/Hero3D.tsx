"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, useGLTF } from "@react-three/drei";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import * as THREE from "three";

// Pre-carrega para evitar lags na troca
useGLTF.preload("/models/pingente_v2.glb");

function JewelryModel({ type }: { type: number }) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Carrega o GLB
  const { scene: originalScene } = useGLTF("/models/pingente_v2.glb");

  // OTIMIZAÇÃO: Clona a cena e aplica o material APENAS UMA VEZ
  // O useMemo garante que isso não rode 60x por segundo, travando o PC
  const scene = useMemo(() => {
    const clonedScene = originalScene.clone();
    
    // Material de Ouro Otimizado
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: "#FFD700",
      metalness: 1,
      roughness: 0.2, // Um pouco mais áspero gasta menos processamento de reflexo
      envMapIntensity: 1, 
    });

    // Aplica o material em tudo de uma vez
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = goldMaterial;
        // OTIMIZAÇÃO: Liga e desliga sombras conforme a necessidade
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    return clonedScene;
  }, [originalScene]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const silverMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    metalness: 0.9,
    roughness: 0.1,
  });

  const simpleGoldMaterial = new THREE.MeshStandardMaterial({
    color: "#FFD700",
    metalness: 1,
    roughness: 0.15,
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        
        {/* MODELO 1: GLB OTIMIZADO */}
        {type === 0 && (
          <primitive 
            object={scene} 
            rotation={[0, 0, 0]}  // Mudei para zero. Se precisar ajustar, mexa aqui.
            scale={0.18} 
          />
        )}

        {/* MODELO 2: BRINCO */}
        {type === 1 && (
          <group>
            <mesh material={silverMaterial} position={[-0.8, 0.5, 0]} rotation={[0, 1.5, 0]}>
              <torusGeometry args={[1, 0.1, 16, 32]} /> {/* Reduzi segmentos de 50 para 32 */}
            </mesh>
            <mesh material={silverMaterial} position={[0.8, -0.5, 0]} rotation={[0, 1.5, 0]}>
              <torusGeometry args={[1, 0.1, 16, 32]} />
            </mesh>
          </group>
        )}

        {/* MODELO 3: PINGENTE */}
        {type === 2 && (
          <mesh material={simpleGoldMaterial}>
             <octahedronGeometry args={[2, 0]} />
          </mesh>
        )}
      </Float>
    </group>
  );
}

export default function Hero3D() {
  const [currentModel, setCurrentModel] = useState(0);

  // Reduzi a frequência de troca para pesar menos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentModel((prev) => (prev + 1) % 3);
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full min-h-[400px]">
      {/* dpr={[1, 2]}: Limita a resolução em telas Retina (evita renderizar 4k em macbook)
         gl={{ powerPreference: "high-performance" }}: Pede pro PC usar a placa de vídeo dedicada
      */}
      <Canvas dpr={[1, 2]} gl={{ powerPreference: "high-performance", antialias: true }}>
        <PerspectiveCamera makeDefault position={[4, 2, 6]} fov={45} />
        
        {/* Reduzi a intensidade das luzes para evitar estouro de branco */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={80} /> {/* Tirei o castShadow */}
        <Environment preset="city" />
        
        <Suspense fallback={null}>
            <JewelryModel type={currentModel} />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
        
      </Canvas>
    </div>
  );
}