import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stats, Loader } from '@react-three/drei';
import Experience from './components/Experience';
import UIOverlay from './components/UIOverlay';
import GestureController from './components/GestureController';
import { CardMode } from './types';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export default function App() {
  const [mode, setMode] = useState<CardMode>('RING');
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string>('None');
  
  // Hand tracking state
  const [cursorPosition, setCursorPosition] = useState<{x: number, y: number} | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  
  // Global rotation state controlled by gestures
  const [deckRotation, setDeckRotation] = useState(0);

  return (
    <div className="w-full h-screen bg-black text-white relative overflow-hidden">
      
      {/* 3D Scene */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2, 12], fov: 45 }}
        gl={{ antialias: false, alpha: false }}
      >
        <color attach="background" args={['#050510']} />
        
        <Suspense fallback={null}>
          <Experience 
            mode={mode} 
            activeCardId={activeCardId} 
            setActiveCardId={setActiveCardId}
            setMode={setMode}
            isCameraEnabled={isCameraEnabled}
            cursorPosition={cursorPosition}
            isPinching={isPinching}
            deckRotation={deckRotation}
          />
          
          <Environment preset="city" />
          
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1.2} mipmapBlur intensity={1.5} radius={0.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>

        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI / 1.8} 
          minPolarAngle={Math.PI / 3}
          maxDistance={15}
          minDistance={8}
          enabled={!isCameraEnabled} // Disable mouse orbit when using hand control to avoid conflict? Actually keep it but maybe dampen
        />
      </Canvas>

      <Loader />

      {/* Gesture Control Layer */}
      {isCameraEnabled && (
        <GestureController 
          setMode={setMode} 
          setDetectedGesture={setDetectedGesture}
          setCursorPosition={setCursorPosition}
          setIsPinching={setIsPinching}
          setDeckRotation={setDeckRotation}
        />
      )}

      {/* UI Overlay */}
      <UIOverlay 
        mode={mode} 
        setMode={setMode} 
        activeCardId={activeCardId}
        setActiveCardId={setActiveCardId}
        isCameraEnabled={isCameraEnabled}
        setIsCameraEnabled={setIsCameraEnabled}
        detectedGesture={detectedGesture}
        cursorPosition={cursorPosition}
        isPinching={isPinching}
      />
    </div>
  );
}