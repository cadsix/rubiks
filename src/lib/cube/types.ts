export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export type CubeColor = 'white' | 'red' | 'green' | 'yellow' | 'orange' | 'blue';

export type Move = 
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2';

export interface CubeState {
  U: CubeColor[];
  R: CubeColor[];
  F: CubeColor[];
  D: CubeColor[];
  L: CubeColor[];
  B: CubeColor[];
}

export interface ValidationResult {
  valid: boolean;
  canSolve: boolean;
  errors: string[];
  warnings: string[];
  colorCounts: Record<CubeColor, number>;
}

export interface SolutionStep {
  move: Move;
  face: Face;
  direction: 'CW' | 'CCW' | 'DOUBLE';
  text: string;
  index: number;
}

export interface PresetPattern {
  id: string;
  name: string;
  description: string;
  category: 'scramble' | 'pattern' | 'special';
  moves: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
}
