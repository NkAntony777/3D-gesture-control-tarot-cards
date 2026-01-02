import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { CardMode } from '../types';

interface GestureControllerProps {
  setMode: (mode: CardMode) => void;
  setDetectedGesture: (gesture: string) => void;
  setCursorPosition: (pos: {x: number, y: number} | null) => void;
  setIsPinching: (isPinching: boolean) => void;
  setDeckRotation: React.Dispatch<React.SetStateAction<number>>;
}

const GestureController: React.FC<GestureControllerProps> = ({ 
  setMode, 
  setDetectedGesture,
  setCursorPosition,
  setIsPinching,
  setDeckRotation
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  const lastGestureTime = useRef<number>(0);
  const lastGesture = useRef<string>('None');
  
  // Track previous X position for swipe calculation
  const lastHandX = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        if (!active) return;

        recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        // Start Camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240 } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            // Start Loop
            predict();
          }
        }
      } catch (e) {
        console.error("Gesture Init Failed", e);
      }
    };

    setup();

    return () => {
      active = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const predict = () => {
    if (recognizerRef.current && videoRef.current && videoRef.current.readyState === 4) {
      const now = Date.now();
      const results = recognizerRef.current.recognizeForVideo(videoRef.current, now);
      let currentGestureName = 'None';

      // 1. Gesture Recognition
      if (results.gestures.length > 0) {
        const gesture = results.gestures[0][0];
        const name = gesture.categoryName;
        const score = gesture.score;

        if (score > 0.5) {
          currentGestureName = name;
          setDetectedGesture(name);

          // Mode Switching Logic (Debounced)
          if (name !== lastGesture.current && now - lastGestureTime.current > 1000) {
            let newMode: CardMode | null = null;
            // Gesture Mapping
            switch(name) {
              case 'Open_Palm': 
                // Only switch to SPREAD if hand is relatively still (handled by user intent usually),
                // or we can allow SPREAD and Rotation to coexist or toggle.
                // For now, let's keep the switch but the rotation will happen simultaneously which looks cool
                newMode = 'SPREAD'; 
                break;
              case 'Closed_Fist': newMode = 'SHUFFLE'; break;
              case 'Pointing_Up': newMode = 'DRAW'; break;
              case 'Victory': newMode = 'RING'; break;
              case 'Thumb_Up': newMode = 'STACK'; break;
            }

            if (newMode) {
              setMode(newMode);
              lastGesture.current = name;
              lastGestureTime.current = now;
            }
          }
        }
      } else {
        setDetectedGesture('None');
      }

      // 2. Hand Landmarks & Interactions
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Key Points
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        
        // --- ROTATION CONTROL (Open Palm Swipe) ---
        // Mirroring: video is scale-x-[-1], so left on screen is right in logic.
        // We use raw coordinates (0-1). 
        // 0 is Left (in raw buffer), 1 is Right.
        if (currentGestureName === 'Open_Palm' || currentGestureName === 'None') {
          if (lastHandX.current !== null) {
            const deltaX = wrist.x - lastHandX.current;
            // Sensitivity Factor - Negative because of mirroring/coordinate preference
            // If I move hand Right (on screen), x decreases (0 is left?). 
            // Let's adjust feel: Hand Right -> Rotate Right.
            const sensitivity = 8; 
            
            // Only rotate if movement is significant (noise filter)
            if (Math.abs(deltaX) > 0.002) {
              setDeckRotation(prev => prev - deltaX * sensitivity);
            }
          }
          lastHandX.current = wrist.x;
        } else {
          lastHandX.current = null; // Reset if gesture changes/hand lost to prevent jumps
        }

        // --- PINCH DETECTION ---
        const distance = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) + 
          Math.pow(thumbTip.y - indexTip.y, 2)
        );
        const isPinching = distance < 0.08;
        setIsPinching(isPinching);

        // --- CURSOR POSITION ---
        setCursorPosition({
          x: 1.0 - indexTip.x,
          y: indexTip.y
        });

      } else {
        setCursorPosition(null);
        setIsPinching(false);
        lastHandX.current = null;
      }
    }
    requestRef.current = requestAnimationFrame(predict);
  };

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none">
      {/* Hidden processing video */}
      <video 
        ref={videoRef} 
        className="w-32 h-24 object-cover opacity-50 rounded-lg border border-amber-500/30 scale-x-[-1]" 
        muted 
        playsInline 
      />
      <div className="absolute top-0 left-0 bg-black/50 text-[10px] text-amber-500 p-1 rounded-br">SENSOR ACTIVE</div>
    </div>
  );
};

export default GestureController;