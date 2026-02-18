"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Float, useGLTF, Center } from "@react-three/drei";
import { useRef, Suspense, useMemo } from "react";
import * as THREE from "three";

// Pre-carrega o fallback
useGLTF.preload("/models/pingente_v2.glb");

interface Hero3DProps {
  glbUrl?: string;
  materialConfig?: any;
}

// OS MATERIAIS DE ALTA QUALIDADE IDÊNTICOS AOS DA PÁGINA DO PRODUTO
const MATERIALS = {
  gold: new THREE.MeshPhysicalMaterial({ color: "#FFD700", metalness: 1.0, roughness: 0.15, clearcoat: 1.0, envMapIntensity: 2.0 }),
  silver: new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", emissive: "#111111", metalness: 1.0, roughness: 0.0, clearcoat: 1.0, envMapIntensity: 2.5 }),
  diamond: new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0.1, roughness: 0, transmission: 1, thickness: 10, ior: 2.4, envMapIntensity: 5, dispersion: 15 }),
  ruby: new THREE.MeshPhysicalMaterial({ color: "#ff0000", emissive: "#330000", metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.76, envMapIntensity: 3, clearcoat: 1.0, attenuationColor: new THREE.Color("#ff0000"), attenuationDistance: 5 }),
  sapphire: new THREE.MeshPhysicalMaterial({ color: "#0000ff", emissive: "#000033", metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.76, envMapIntensity: 3, clearcoat: 1.0, attenuationColor: new THREE.Color("#0000ff"), attenuationDistance: 5 }),
  emerald: new THREE.MeshPhysicalMaterial({ color: "#00ff00", emissive: "#003300", metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.57, envMapIntensity: 3, clearcoat: 1.0, attenuationColor: new THREE.Color("#00ff00"), attenuationDistance: 5 }),
};

function JewelryModel({ glbUrl, materialConfig }: Hero3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  const actualUrl = glbUrl || "/models/pingente_v2.glb";
  const { scene: originalScene } = useGLTF(actualUrl);

  const scene = useMemo(() => {
    const clonedScene = originalScene.clone(true);
    
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        let materialToApply = null;
        const partConfig = materialConfig ? materialConfig[child.name] : null;

        // Se tem configuração no banco (String ou Objeto de Resina)
        if (partConfig) {
          if (typeof partConfig === 'string' && MATERIALS[partConfig as keyof typeof MATERIALS]) {
            materialToApply = MATERIALS[partConfig as keyof typeof MATERIALS];
          } 
          else if (typeof partConfig === 'object' && partConfig.type === 'resin') {
            materialToApply = new THREE.MeshPhysicalMaterial({
              color: partConfig.color, metalness: 0.0, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05, reflectivity: 0.5, ior: 1.5, envMapIntensity: 1.2, side: THREE.DoubleSide
            });
          }
        }

        // Se não tem, detecta pelo nome
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

    return clonedScene;
  }, [originalScene, materialConfig]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Center>
            <primitive 
              object={scene} 
              rotation={[0, 0, 0]}  
              scale={0.25}
            />
          </Center>
      </Float>
    </group>
  );
}

export default function Hero3D({ glbUrl, materialConfig }: Hero3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas dpr={[1, 2]} gl={{ powerPreference: "high-performance", antialias: true }}>
        <PerspectiveCamera makeDefault position={[4, 2, 6]} fov={45} />
        
        {/* Iluminação Idêntica a da Página do Produto */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />
        <Environment preset="city" blur={0.8} />
        
        <Suspense fallback={null}>
            <JewelryModel glbUrl={glbUrl} materialConfig={materialConfig} />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}