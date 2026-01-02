import { Vector3, Euler } from 'three';

export type CardMode = 'RING' | 'SHUFFLE' | 'SPREAD' | 'STACK' | 'DRAW';

export interface TarotCardData {
  id: number;
  isMajor: boolean;
  name: string;
  description: string;
}

// Fixed positions for optimization
export interface CardTransform {
  position: Vector3;
  rotation: Euler;
}