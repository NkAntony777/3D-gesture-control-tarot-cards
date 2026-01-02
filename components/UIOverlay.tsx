import React from 'react';
import { CardMode } from '../types';
import { DECK } from '../constants';
import { Sparkles, Wind, Layers, Aperture, Camera, CameraOff, Hand } from 'lucide-react';

interface UIOverlayProps {
  mode: CardMode;
  setMode: (mode: CardMode) => void;
  activeCardId: number | null;
  setActiveCardId: (id: number | null) => void;
  isCameraEnabled: boolean;
  setIsCameraEnabled: (enabled: boolean) => void;
  detectedGesture: string;
  cursorPosition?: {x: number, y: number} | null;
  isPinching?: boolean;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  mode, setMode, activeCardId, setActiveCardId, 
  isCameraEnabled, setIsCameraEnabled, detectedGesture,
  cursorPosition, isPinching
}) => {
  const activeCard = activeCardId !== null ? DECK[activeCardId] : null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* MAGICAL CURSOR */}
      {isCameraEnabled && cursorPosition && (
        <div 
          className="absolute z-50 pointer-events-none transition-transform duration-75"
          style={{ 
            left: `${cursorPosition.x * 100}%`, 
            top: `${cursorPosition.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Outer Ring */}
          <div className={`w-12 h-12 rounded-full border-2 border-dotted transition-all duration-300 animate-spin-slow opacity-60 ${isPinching ? 'border-red-400 scale-75' : 'border-amber-400'}`}></div>
          {/* Inner Dot */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-150 ${isPinching ? 'bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.8)] scale-150' : 'bg-amber-400 shadow-[0_0_15px_rgba(255,200,0,0.8)]'}`}></div>
          {/* Crosshair lines */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-[1px] bg-gradient-to-r from-transparent via-amber-200/50 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-[1px] bg-gradient-to-b from-transparent via-amber-200/50 to-transparent"></div>
        </div>
      )}

      {/* Top Header */}
      <header className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="font-magic text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            ASTRAL SANCTUM
          </h1>
          <p className="text-blue-200/60 text-xs tracking-[0.2em] mt-1 font-light">
            Ethereal Interface v9.4
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
           {/* Camera Toggle */}
           <button 
             onClick={() => setIsCameraEnabled(!isCameraEnabled)}
             className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest transition-all ${
               isCameraEnabled 
               ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
               : 'bg-blue-900/20 border-blue-500/30 text-blue-400 hover:border-blue-400'
             }`}
           >
             {isCameraEnabled ? <Camera size={14} /> : <CameraOff size={14} />}
             {isCameraEnabled ? 'Vision Active' : 'Enable Gesture'}
           </button>
           
           {/* Gesture Debug Info */}
           {isCameraEnabled && (
             <div className="flex flex-col items-end gap-1 text-[10px] text-amber-500/80 font-mono">
               <div>DETECTED: <span className="font-bold text-white">{detectedGesture}</span></div>
               {isPinching && <div className="text-red-400 font-bold animate-pulse">PINCH DETECTED</div>}
             </div>
           )}
        </div>
      </header>

      {/* Active Card Reveal */}
      {activeCard && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto text-center transform transition-all duration-700 ease-out z-20">
            <div className="glass-panel p-8 rounded-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 border-amber-500/30 bg-black/80">
                <h2 className="font-magic text-4xl text-amber-100 mb-2 drop-shadow-md">{activeCard.name}</h2>
                <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent my-4"></div>
                <p className="text-blue-100 text-sm font-light max-w-xs leading-relaxed">{activeCard.description}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveCardId(null); setMode('RING'); }}
                  className="mt-6 text-xs text-amber-500 hover:text-amber-200 transition-colors uppercase tracking-widest border border-amber-500/20 px-4 py-2 rounded-full hover:bg-amber-900/20"
                >
                  Return Card
                </button>
            </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="w-full flex flex-col items-center gap-6 pointer-events-auto">
        
        {/* Gestural Instruction Text */}
        <div className="text-center transition-opacity duration-300">
          <p className="text-amber-100/50 text-xs tracking-widest uppercase font-light font-magic">
            {isCameraEnabled 
              ? <span className="text-amber-300 animate-pulse">✋ Open: Spread • 🤏 Pinch: Select • ✊ Fist: Chaos • ☝️ Point: Draw</span>
              : (mode === 'RING' ? "Drag to Rotate • Click to Inspect" : mode === 'DRAW' ? "Destiny Manifesting" : "Interact with the Ethers")
            }
          </p>
        </div>

        {/* Mode Switcher / Rune Bar */}
        <div className="glass-panel rounded-2xl p-2 px-6 flex items-center gap-8 mb-4">
          
          <ControlButton 
            isActive={mode === 'RING'} 
            onClick={() => setMode('RING')} 
            icon={<Aperture size={20} />} 
            label="Orbit"
          />
          
          <ControlButton 
            isActive={mode === 'SHUFFLE'} 
            onClick={() => setMode('SHUFFLE')} 
            icon={<Wind size={20} />} 
            label="Chaos"
          />
          
          {/* Main Action Button - The "Draw" */}
          <button 
            onClick={() => setMode('DRAW')}
            className={`
              relative group -mt-8 mx-2
            `}
          >
            <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 group-hover:opacity-50 transition-opacity rounded-full"></div>
            <div className="w-16 h-16 rounded-full glass-panel border border-amber-400/50 flex items-center justify-center text-amber-100 shadow-[0_0_20px_rgba(255,180,50,0.3)] group-hover:scale-110 transition-transform duration-300 bg-amber-900/30">
               <Sparkles size={28} className={mode === 'DRAW' ? 'animate-spin-slow' : ''} />
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-amber-200/80 opacity-0 group-hover:opacity-100 transition-opacity w-max">
              DIVINE
            </span>
          </button>

          <ControlButton 
            isActive={mode === 'SPREAD'} 
            onClick={() => setMode('SPREAD')} 
            icon={<Layers size={20} className="rotate-90" />} 
            label="Spread"
          />

          <ControlButton 
            isActive={mode === 'STACK'} 
            onClick={() => setMode('STACK')} 
            icon={<Layers size={20} />} 
            label="Stack"
          />

        </div>
      </div>
    </div>
  );
};

const ControlButton = ({ isActive, onClick, icon, label }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 group transition-all duration-300 ${isActive ? 'text-amber-300 scale-110' : 'text-blue-300/50 hover:text-blue-200'}`}
  >
    <div className={`p-2 rounded-full transition-all ${isActive ? 'bg-amber-500/20 shadow-[0_0_15px_rgba(255,200,50,0.2)]' : 'group-hover:bg-blue-500/10'}`}>
      {icon}
    </div>
    <span className="text-[9px] tracking-[0.2em] font-light uppercase opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5">
      {label}
    </span>
  </button>
);

export default UIOverlay;