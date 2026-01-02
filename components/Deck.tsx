import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DECK } from '../constants';
import CardMesh from './CardMesh';
import { CardMode } from '../types';

interface DeckProps {
  mode: CardMode;
  activeCardId: number | null;
  setActiveCardId: (id: number | null) => void;
  setMode: (mode: CardMode) => void;
  isCameraEnabled: boolean;
  cursorPosition: {x: number, y: number} | null;
  isPinching: boolean;
  deckRotation: number;
}

const Deck: React.FC<DeckProps> = ({ 
  mode, activeCardId, setActiveCardId, setMode,
  isCameraEnabled, cursorPosition, isPinching, deckRotation
}) => {
  // We use a group to hold all cards
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const prevPinching = useRef(false);
  
  // Access Three.js internals for manual raycasting
  const { camera, raycaster, pointer } = useThree();

  // Reusable vectors to avoid GC
  const vec = new THREE.Vector3();
  const euler = new THREE.Euler();
  const q = new THREE.Quaternion();

  // Animation constants
  const LERP_SPEED = 0.08; // Smoothness of transition

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const children = groupRef.current.children;

    // --- Hand Tracking Interaction Logic ---
    if (isCameraEnabled && cursorPosition) {
      // 1. Convert 0-1 coords to NDC (-1 to 1)
      const ndcX = (cursorPosition.x * 2) - 1;
      const ndcY = -(cursorPosition.y * 2) + 1;

      // 2. Update R3F pointer 
      pointer.set(ndcX, ndcY);

      // 3. Raycast
      raycaster.setFromCamera(pointer, camera);
      
      const intersects = raycaster.intersectObjects(children, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while(obj.parent && obj.parent !== groupRef.current) {
          obj = obj.parent;
        }
        
        const index = children.indexOf(obj as THREE.Object3D);
        if (index !== -1) {
           const card = DECK[index];
           if (card && hoveredId !== card.id) {
             setHoveredId(card.id);
           }
           
           // Handle Pinch CLICK
           if (isPinching && !prevPinching.current) {
             // Trigger Click
             if (activeCardId === card.id) {
               setActiveCardId(null);
               setMode('RING');
             } else {
               setActiveCardId(card.id);
               setMode('DRAW');
             }
           }
        }
      } else {
        if (hoveredId !== null) setHoveredId(null);
      }
    }

    prevPinching.current = isPinching;


    // --- Card Animation Logic ---
    DECK.forEach((card, i) => {
      const mesh = children[i];
      if (!mesh) return;

      // --- Target Calculation Logic ---
      
      let targetPos = new THREE.Vector3();
      let targetRot = new THREE.Euler();
      let hoverOffset = 0;

      // Interactive Hover Effect
      if (hoveredId === card.id && mode !== 'SHUFFLE' && mode !== 'DRAW') {
        hoverOffset = 0.5;
      }

      if (activeCardId === card.id) {
        // --- DRAWN CARD STATE ---
        targetPos.set(0, 0, 8); 
        targetRot.set(0, Math.PI, 0); 
        targetPos.y += Math.sin(time * 1.5) * 0.2;
        targetPos.x += Math.cos(time * 1.0) * 0.1;
        
      } else if (activeCardId !== null) {
        const angle = (i / 78) * Math.PI * 2;
        targetPos.set(Math.cos(angle) * 15, Math.sin(angle) * 15, -10);
        targetRot.set(0, 0, angle);

      } else {
        // --- NORMAL MODES ---
        switch (mode) {
          case 'RING': {
            // Apply deckRotation offset here
            if (card.isMajor) {
              const count = 22;
              const angle = (i / count) * Math.PI * 2 + (time * 0.1) + deckRotation; 
              const radius = 4;
              targetPos.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.5, Math.sin(angle) * radius);
              targetRot.set(0, -angle + Math.PI / 2, 0);
            } else {
              const count = 56;
              const idx = i - 22;
              const angle = (idx / count) * Math.PI * 2 - (time * 0.05) + deckRotation;
              const radius = 7;
              targetPos.set(Math.cos(angle) * radius, Math.sin(angle * 3 + 1) * 0.5, Math.sin(angle) * radius);
              targetRot.set(0, -angle + Math.PI / 2, 0);
            }
            break;
          }

          case 'SHUFFLE': {
            const angle = i * 0.5 + time * 3;
            const radius = 2 + (i % 5) + Math.sin(time * 2 + i) * 1;
            const height = (i / 78) * 10 - 5 + Math.cos(time * 3) * 2;
            targetPos.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
            targetRot.set(time * 2, time, i);
            break;
          }

          case 'SPREAD': {
            const width = 16;
            const x = (i / 78) * width - width / 2;
            const y = Math.sin(x * 0.5 + time) * 1 + hoverOffset;
            const z = Math.abs(x) * 0.5;
            targetPos.set(x, y, z);
            targetRot.set(0, -x * 0.1, Math.sin(time + x) * 0.1);
            break;
          }

          case 'STACK': {
            const stackIndex = i % 3;
            const stackHeight = Math.floor(i / 3) * 0.05;
            const xBase = (stackIndex - 1) * 4;
            const breathe = Math.sin(time * 2 + stackIndex) * 0.2;
            targetPos.set(xBase, -2 + stackHeight + breathe, 0);
            targetRot.set(-Math.PI / 2, 0, (stackIndex * 0.5) + time * 0.1);
            break;
          }

          case 'DRAW': {
            const theta = THREE.MathUtils.randFloatSpread(Math.PI * 2);
            const phi = THREE.MathUtils.randFloatSpread(Math.PI);
            const r = 5 + Math.sin(time + i);
            targetPos.setFromSphericalCoords(r, phi, theta);
            targetRot.set(time * 0.1, time * 0.1, 0);
            break;
          }
        }
      }

      mesh.position.lerp(targetPos, LERP_SPEED);
      q.setFromEuler(targetRot);
      mesh.quaternion.slerp(q, LERP_SPEED);

    });
  });

  const handleCardClick = (id: number) => {
    if (activeCardId === id) {
      setActiveCardId(null); 
      setMode('RING');
    } else {
      setActiveCardId(id); 
      setMode('DRAW'); 
    }
  };

  return (
    <group ref={groupRef}>
      {DECK.map((card) => (
        <CardMesh
          key={card.id}
          card={card}
          isActive={activeCardId === card.id}
          isHovered={hoveredId === card.id}
          onPointerOver={() => setHoveredId(card.id)}
          onPointerOut={() => setHoveredId(null)}
          onClick={() => handleCardClick(card.id)}
        />
      ))}
    </group>
  );
};

export default Deck;