import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { TarotCardData } from '../types';

interface CardMeshProps {
  card: TarotCardData;
  isActive: boolean;
  isHovered: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

const CardMesh: React.FC<CardMeshProps> = ({ 
  card, 
  isActive, 
  isHovered, 
  onPointerOver, 
  onPointerOut, 
  onClick 
}) => {
  
  const width = 1.2;
  const height = 2.0;
  const depth = 0.05;
  
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (isActive && auraRef.current) {
      const time = state.clock.elapsedTime;
      // Pulsating scale
      const scale = 1.15 + Math.sin(time * 2.5) * 0.05;
      auraRef.current.scale.set(scale, scale, 1);
      
      // Pulsating opacity
      const opacity = 0.3 + Math.sin(time * 3) * 0.2;
      if (auraRef.current.material instanceof THREE.MeshBasicMaterial) {
        auraRef.current.material.opacity = opacity;
      }
      
      // Subtle magical rotation
      auraRef.current.rotation.z = Math.sin(time * 0.5) * 0.05;
    }
  });

  // --- Procedural Gold Filigree Texture Generation ---
  // We generate a CanvasTexture on the fly to simulate the "Gold Cutout" look
  const filigreeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 854; // ~ 1.6 ratio
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 1. Clear background (Transparent)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Elaborate Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 15;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      
      // Inner thin border
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

      // Corners
      ctx.beginPath();
      ctx.arc(40, 40, 20, 0, Math.PI * 2);
      ctx.arc(canvas.width - 40, 40, 20, 0, Math.PI * 2);
      ctx.arc(40, canvas.height - 40, 20, 0, Math.PI * 2);
      ctx.arc(canvas.width - 40, canvas.height - 40, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // 3. Draw Card Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      
      // Arcana Number (Roman Numeral logic simplified or just ID)
      ctx.font = 'bold 40px Cinzel';
      ctx.fillText(card.isMajor ? "MAJOR" : "MINOR", canvas.width / 2, 120);

      // Main Name - Multi-line handling
      ctx.font = 'bold 60px Cinzel';
      const words = card.name.split(' ');
      let y = canvas.height / 2;
      words.forEach((word, i) => {
        ctx.fillText(word.toUpperCase(), canvas.width / 2, y + (i * 70) - ((words.length - 1) * 35));
      });

      // Decorative Symbol Placeholder (Circle in middle)
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 180, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bottom Decoration
      ctx.font = 'italic 30px Cinzel';
      ctx.fillText("DESTINY", canvas.width / 2, canvas.height - 100);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, [card.name, card.isMajor]);

  // Base Glass Material
  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: isHovered ? '#1a1a40' : '#050510', 
    metalness: 0.8,
    roughness: 0.1,
    transmission: 0.2, // Darker glass
    thickness: 1.5,
    clearcoat: 1,
  }), [isHovered]);

  // Gold Glowing Material
  // We use the generated texture as an Alpha Map (where to show gold) and Emissive Map (where to glow)
  const goldFiligreeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffd700', // Gold
    map: filigreeTexture,
    alphaMap: filigreeTexture,
    emissive: '#ffaa00',
    emissiveMap: filigreeTexture,
    emissiveIntensity: isActive ? 3 : 1.2,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, // Makes it look like light
    depthWrite: false, // Prevents z-fighting with glass
  }), [filigreeTexture, isActive]);

  // Gold Edge
  const edgeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#cc8800',
    metalness: 1,
    roughness: 0.3,
  }), []);

  return (
    <group 
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { onPointerOut(); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* 1. The Glass Slab Body */}
      <RoundedBox args={[width, height, depth]} radius={0.02} smoothness={4}>
        <primitive object={glassMaterial} attach="material" />
      </RoundedBox>

      {/* 2. The Gold Edge Frame */}
      <mesh position={[0, 0, 0]}>
         <boxGeometry args={[width + 0.02, height + 0.02, depth * 0.8]} />
         <primitive object={edgeMaterial} attach="material" />
      </mesh>

      {/* 3. The Glowing Gold Filigree Face (Front) */}
      <mesh position={[0, 0, depth / 2 + 0.005]}>
         <planeGeometry args={[width * 0.9, height * 0.9]} />
         <primitive object={goldFiligreeMaterial} attach="material" />
      </mesh>

      {/* 4. The Back Design (Simplified repeated pattern) */}
      <mesh position={[0, 0, -depth / 2 - 0.005]} rotation={[0, Math.PI, 0]}>
         <planeGeometry args={[width * 0.9, height * 0.9]} />
         <meshBasicMaterial 
            color="#442200" 
            transparent 
            opacity={0.3} 
            wireframe 
            side={THREE.DoubleSide} 
         />
      </mesh>

      {/* 5. Dynamic Light when Active */}
      {isActive && (
        <pointLight distance={4} intensity={4} color="#ffaa00" />
      )}

      {/* 6. Pulsating Golden Aura (Only when active) */}
      {isActive && (
        <mesh ref={auraRef} position={[0, 0, -0.02]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial 
            map={filigreeTexture}
            color="#ffaa00"
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};

export default CardMesh;