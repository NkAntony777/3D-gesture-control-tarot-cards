import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, Stars, MeshReflectorMaterial } from '@react-three/drei';
import { Color } from 'three';
import Deck from './Deck';
import { CardMode } from '../types';

interface ExperienceProps {
  mode: CardMode;
  activeCardId: number | null;
  setActiveCardId: (id: number | null) => void;
  setMode: (mode: CardMode) => void;
  isCameraEnabled: boolean;
  cursorPosition: {x: number, y: number} | null;
  isPinching: boolean;
  deckRotation: number;
}

const Experience: React.FC<ExperienceProps> = ({ 
  mode, activeCardId, setActiveCardId, setMode,
  isCameraEnabled, cursorPosition, isPinching, deckRotation
}) => {
  const lightRef = useRef<any>(null);

  useFrame(({ clock }) => {
    // Dynamic lighting based on time
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(clock.elapsedTime * 0.2) * 5;
      lightRef.current.position.z = Math.cos(clock.elapsedTime * 0.2) * 5;
      // Pulse intensity based on mode
      const intensityBase = mode === 'DRAW' ? 3 : 1.5;
      lightRef.current.intensity = intensityBase + Math.sin(clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <>
      {/* --- Environment & Lighting --- */}
      
      {/* Deep atmospheric fog */}
      <fog attach="fog" args={['#050510', 5, 25]} />
      
      {/* Ambient twilight */}
      <ambientLight intensity={0.2} color="#4a4a8a" />
      
      {/* Main magical light source (The floating candle/orb idea) */}
      <pointLight 
        ref={lightRef}
        position={[0, 4, 0]} 
        color="#ffaa00" 
        distance={20} 
        decay={2}
      />
      
      {/* Rim lighting for the glass texture */}
      <spotLight 
        position={[10, 10, -10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        color="#00ffff" 
      />

      {/* --- Visual FX --- */}
      
      {/* Background Stars/Runes */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Floating Dust Motes */}
      <Sparkles 
        count={200} 
        scale={12} 
        size={2} 
        speed={0.4} 
        opacity={0.5} 
        color={mode === 'SHUFFLE' ? "#ffaa00" : "#4a9eff"} 
      />

      {/* --- The Deck System --- */}
      <Deck 
        mode={mode} 
        activeCardId={activeCardId} 
        setActiveCardId={setActiveCardId} 
        setMode={setMode}
        isCameraEnabled={isCameraEnabled}
        cursorPosition={cursorPosition}
        isPinching={isPinching}
        deckRotation={deckRotation}
      />

      {/* --- Ground Reflection (The floor of the sanctum) --- */}
      <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101010"
          metalness={0.5}
          mirror={0.5}
        />
      </mesh>
    </>
  );
};

export default Experience;