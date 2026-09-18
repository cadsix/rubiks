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

export interface TwistedCornerInfo {
  cornerIndex: number;
  name: string; // e.g. "Top-Front-Right (URF)"
  positionName: string; // e.g. "Top-Front-Right"
  colors: [CubeColor, CubeColor, CubeColor];
  colorNames: string; // e.g. "White-Green-Red"
  twistAngle: string; // e.g. "120° Clockwise"
  direction: 'CW' | 'CCW';
  fixDirection: 'CW' | 'CCW';
  faces: [Face, number, Face, number, Face, number];
  fixInstruction: string;
}

export interface FlippedEdgeInfo {
  edgeIndex: number;
  name: string; // e.g. "Top-Front (UF)"
  positionName: string; // e.g. "Top-Front"
  colors: [CubeColor, CubeColor];
  colorNames: string; // e.g. "White-Green"
  faces: [Face, number, Face, number];
  fixInstruction: string;
}

export interface ParityDiagnosis {
  hasCornerTwistParity: boolean;
  hasEdgeFlipParity: boolean;
  cornerTwistSum: number;
  edgeFlipSum: number;
  twistedCorners: TwistedCornerInfo[];
  primaryTwistedCorner?: TwistedCornerInfo;
  flippedEdges: FlippedEdgeInfo[];
  primaryFlippedEdge?: FlippedEdgeInfo;
}

export interface ValidationResult {
  valid: boolean;
  canSolve: boolean;
  errors: string[];
  warnings: string[];
  colorCounts: Record<CubeColor, number>;
  parityDiagnosis?: ParityDiagnosis;
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
