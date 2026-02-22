"use client";

import { Canvas, useFrame } from "@react-three/fiber";
// Removemos o Stage, Center e Bounds. Vamos fazer via Matemática!
import { PresentationControls, Environment, useGLTF, Html } from "@react-three/drei";
import { useRef, Suspense, useMemo, memo } from "react";
import * as THREE from "three";

interface Hero3DProps {
  glbUrl?: string;
  materialConfig?: any;
  category?: string;
}

const MATERIALS = {
  gold: new THREE.MeshPhysicalMaterial({ color: "#FFD700", metalness: 1.0, roughness: 0.15, clearcoat: 1.0, envMapIntensity: 2.0 }),
  silver: new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", emissive: "#111111", metalness: 1.0, roughness: 0.0, clearcoat: 1.0, envMapIntensity: 2.5 }),
  diamond: new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0.1, roughness: 0, transmission: 1, thickness: 10, ior: 2.4, envMapIntensity: 5, dispersion: 15 }),
  ruby: new THREE.MeshPhysicalMaterial({ color: "#ff0000", emissive: "#330000", metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.76, envMapIntensity: 3, clearcoat: 1.0, attenuationColor: new THREE.Color("#ff0000"), attenuationDistance: 5 }),
  sapphire: new THREE.MeshPhysicalMaterial({ color: "#0000ff", emissive: "#000033", metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.76, envMapIntensity: 3, clearcoat: 1.0, attenuationColor: new THREE.Color("#0000ff"), attenuationDistance: 5 }),
  emerald: new THREE.MeshPhysicalMaterial({ color: "#00ff00", emissive: "#003300", metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 10, ior: 1.57, envMapIntensity: 3, clearcoat: 1.0, attenuationColor: new THREE.Color("#00ff00"), attenuationDistance: 5 }),
};

function LoadedJewelry({ url, materialConfig }: { url: string, materialConfig: any }) {
  const { scene: originalScene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const clonedScene = originalScene.clone(true);

    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        let materialToApply = null;
        const partConfig = materialConfig ? materialConfig[child.name] : null;

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

    // ==========================================
    // MÁGICA: NORMALIZAÇÃO MATEMÁTICA
    // ==========================================
    clonedScene.scale.set(1, 1, 1);
    clonedScene.position.set(0, 0, 0);

    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const TARGET_SIZE = 20; 
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim > 0) {
        const scale = TARGET_SIZE / maxDim;
        clonedScene.scale.setScalar(scale);
        clonedScene.position.x = -center.x * scale;
        clonedScene.position.y = -center.y * scale;
        clonedScene.position.z = -center.z * scale;
    }

    return clonedScene;
  }, [originalScene, materialConfig]);

  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <group ref={meshRef}>
      <primitive object={scene} />
    </group>
  );
}

function FallbackJewelry() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <div className="w-10 h-10 border-4 border-wfx-border border-t-wfx-primary rounded-full animate-spin"></div>
      </div>
    </Html>
  );
}

function Hero3D({ glbUrl, materialConfig, category }: Hero3DProps) {
  const isRing = category?.toLowerCase().includes("ané");
  const initialRotation = isRing ? [0.6, 0.8, 0] : [0.3, -0.4, 0];

  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas dpr={[1, 2]} gl={{ powerPreference: "high-performance", antialias: true }} shadows camera={{ position: [0, 0, 40], fov: 35 }}>

        <Environment preset="city" blur={0.8} />
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />

        <Suspense fallback={<FallbackJewelry />}>
          <PresentationControls
            global
            snap={false}
            rotation={initialRotation as [number, number, number]}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
          >
            <group position={[0, 0.3, 0]}>
              {glbUrl ? (
                <LoadedJewelry url={glbUrl} materialConfig={materialConfig} />
              ) : (
                <FallbackJewelry />
              )}
            </group>
          </PresentationControls>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default memo(Hero3D);