import { useRef } from 'react';
import type { FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedSphere = () => {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      sphereRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Sphere args={[1, 64, 64]} ref={sphereRef} scale={1.5}>
      <MeshDistortMaterial
        color="#8b5cf6"
        attach="material"
        distort={0.4}
        speed={1.5}
        roughness={0.2}
        metalness={0.8}
        emissive="#3b82f6"
        emissiveIntensity={0.2}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </Sphere>
  );
};

export const ThreeBackground: FC = () => {
  return (
    <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '50vw', height: '50vh', zIndex: -1, pointerEvents: 'none', filter: 'blur(10px)' }}>
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#06b6d4" />
        <AnimatedSphere />
      </Canvas>
    </div>
  );
};
