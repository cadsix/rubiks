import { CubeColor, CubeState, Face, Move } from './types';
import { COLOR_TO_CHAR, CHAR_TO_COLOR, STANDARD_FACE_COLORS, ALL_FACES } from './constants';

export function getSolvedCubeState(): CubeState {
  return {
    U: Array(9).fill('white'),
    R: Array(9).fill('red'),
    F: Array(9).fill('green'),
    D: Array(9).fill('yellow'),
    L: Array(9).fill('orange'),
    B: Array(9).fill('blue'),
  };
}

export function cloneCubeState(state: CubeState): CubeState {
  return {
    U: [...state.U],
    R: [...state.R],
    F: [...state.F],
    D: [...state.D],
    L: [...state.L],
    B: [...state.B],
  };
}

// Helper to rotate a single 3x3 face clockwise
function rotateFaceCW(face: CubeColor[]): CubeColor[] {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ];
}

function rotateFaceCCW(face: CubeColor[]): CubeColor[] {
  return [
    face[2], face[5], face[8],
    face[1], face[4], face[7],
    face[0], face[3], face[6],
  ];
}

function rotateFace180(face: CubeColor[]): CubeColor[] {
  return [
    face[8], face[7], face[6],
    face[5], face[4], face[3],
    face[2], face[1], face[0],
  ];
}

export function applyMove(state: CubeState, move: Move | string): CubeState {
  const next = cloneCubeState(state);
  const cleanMove = move.trim();

  switch (cleanMove) {
    case 'U': {
      next.U = rotateFaceCW(next.U);
      const temp = [next.F[0], next.F[1], next.F[2]];
      next.F[0] = next.R[0]; next.F[1] = next.R[1]; next.F[2] = next.R[2];
      next.R[0] = next.B[0]; next.R[1] = next.B[1]; next.R[2] = next.B[2];
      next.B[0] = next.L[0]; next.B[1] = next.L[1]; next.B[2] = next.L[2];
      next.L[0] = temp[0];   next.L[1] = temp[1];   next.L[2] = temp[2];
      break;
    }
    case "U'": {
      next.U = rotateFaceCCW(next.U);
      const temp = [next.F[0], next.F[1], next.F[2]];
      next.F[0] = next.L[0]; next.F[1] = next.L[1]; next.F[2] = next.L[2];
      next.L[0] = next.B[0]; next.L[1] = next.B[1]; next.L[2] = next.B[2];
      next.B[0] = next.R[0]; next.B[1] = next.R[1]; next.B[2] = next.R[2];
      next.R[0] = temp[0];   next.R[1] = temp[1];   next.R[2] = temp[2];
      break;
    }
    case 'U2': {
      return applyMove(applyMove(state, 'U'), 'U');
    }

    case 'D': {
      next.D = rotateFaceCW(next.D);
      const temp = [next.F[6], next.F[7], next.F[8]];
      next.F[6] = next.L[6]; next.F[7] = next.L[7]; next.F[8] = next.L[8];
      next.L[6] = next.B[6]; next.L[7] = next.B[7]; next.L[8] = next.B[8];
      next.B[6] = next.R[6]; next.B[7] = next.R[7]; next.B[8] = next.R[8];
      next.R[6] = temp[0];   next.R[7] = temp[1];   next.R[8] = temp[2];
      break;
    }
    case "D'": {
      next.D = rotateFaceCCW(next.D);
      const temp = [next.F[6], next.F[7], next.F[8]];
      next.F[6] = next.R[6]; next.F[7] = next.R[7]; next.F[8] = next.R[8];
      next.R[6] = next.B[6]; next.R[7] = next.B[7]; next.R[8] = next.B[8];
      next.B[6] = next.L[6]; next.B[7] = next.L[7]; next.B[8] = next.L[8];
      next.L[6] = temp[0];   next.L[7] = temp[1];   next.L[8] = temp[2];
      break;
    }
    case 'D2': {
      return applyMove(applyMove(state, 'D'), 'D');
    }

    case 'F': {
      next.F = rotateFaceCW(next.F);
      const temp = [next.U[6], next.U[7], next.U[8]];
      next.U[6] = next.L[8]; next.U[7] = next.L[5]; next.U[8] = next.L[2];
      next.L[2] = next.D[0]; next.L[5] = next.D[1]; next.L[8] = next.D[2];
      next.D[0] = next.R[6]; next.D[1] = next.R[3]; next.D[2] = next.R[0];
      next.R[0] = temp[0];   next.R[3] = temp[1];   next.R[6] = temp[2];
      break;
    }
    case "F'": {
      next.F = rotateFaceCCW(next.F);
      const temp = [next.U[6], next.U[7], next.U[8]];
      next.U[6] = next.R[0]; next.U[7] = next.R[3]; next.U[8] = next.R[6];
      next.R[0] = next.D[2]; next.R[3] = next.D[1]; next.R[6] = next.D[0];
      next.D[0] = next.L[2]; next.D[1] = next.L[5]; next.D[2] = next.L[8];
      next.L[2] = temp[2];   next.L[5] = temp[1];   next.L[8] = temp[0];
      break;
    }
    case 'F2': {
      return applyMove(applyMove(state, 'F'), 'F');
    }

    case 'B': {
      next.B = rotateFaceCW(next.B);
      const temp = [next.U[0], next.U[1], next.U[2]];
      next.U[0] = next.R[2]; next.U[1] = next.R[5]; next.U[2] = next.R[8];
      next.R[2] = next.D[8]; next.R[5] = next.D[7]; next.R[8] = next.D[6];
      next.D[6] = next.L[0]; next.D[7] = next.L[3]; next.D[8] = next.L[6];
      next.L[0] = temp[2];   next.L[3] = temp[1];   next.L[6] = temp[0];
      break;
    }
    case "B'": {
      next.B = rotateFaceCCW(next.B);
      const temp = [next.U[0], next.U[1], next.U[2]];
      next.U[0] = next.L[6]; next.U[1] = next.L[3]; next.U[2] = next.L[0];
      next.L[0] = next.D[6]; next.L[3] = next.D[7]; next.L[6] = next.D[8];
      next.D[6] = next.R[8]; next.D[7] = next.R[5]; next.D[8] = next.R[2];
      next.R[2] = temp[0];   next.R[5] = temp[1];   next.R[8] = temp[2];
      break;
    }
    case 'B2': {
      return applyMove(applyMove(state, 'B'), 'B');
    }

    case 'L': {
      next.L = rotateFaceCW(next.L);
      const temp = [next.U[0], next.U[3], next.U[6]];
      next.U[0] = next.B[8]; next.U[3] = next.B[5]; next.U[6] = next.B[2];
      next.B[2] = next.D[6]; next.B[5] = next.D[3]; next.B[8] = next.D[0];
      next.D[0] = next.F[0]; next.D[3] = next.F[3]; next.D[6] = next.F[6];
      next.F[0] = temp[0];   next.F[3] = temp[1];   next.F[6] = temp[2];
      break;
    }
    case "L'": {
      next.L = rotateFaceCCW(next.L);
      const temp = [next.U[0], next.U[3], next.U[6]];
      next.U[0] = next.F[0]; next.U[3] = next.F[3]; next.U[6] = next.F[6];
      next.F[0] = next.D[0]; next.F[3] = next.D[3]; next.F[6] = next.D[6];
      next.D[0] = next.B[8]; next.D[3] = next.B[5]; next.D[6] = next.B[2];
      next.B[2] = temp[2];   next.B[5] = temp[1];   next.B[8] = temp[0];
      break;
    }
    case 'L2': {
      return applyMove(applyMove(state, 'L'), 'L');
    }

    case 'R': {
      next.R = rotateFaceCW(next.R);
      const temp = [next.U[2], next.U[5], next.U[8]];
      next.U[2] = next.F[2]; next.U[5] = next.F[5]; next.U[8] = next.F[8];
      next.F[2] = next.D[2]; next.F[5] = next.D[5]; next.F[8] = next.D[8];
      next.D[2] = next.B[6]; next.D[5] = next.B[3]; next.D[8] = next.B[0];
      next.B[0] = temp[2];   next.B[3] = temp[1];   next.B[6] = temp[0];
      break;
    }
    case "R'": {
      next.R = rotateFaceCCW(next.R);
      const temp = [next.U[2], next.U[5], next.U[8]];
      next.U[2] = next.B[6]; next.U[5] = next.B[3]; next.U[8] = next.B[0];
      next.B[0] = next.D[8]; next.B[3] = next.D[5]; next.B[6] = next.D[2];
      next.D[2] = next.F[2]; next.D[5] = next.F[5]; next.D[8] = next.F[8];
      next.F[2] = temp[0];   next.F[5] = temp[1];   next.F[8] = temp[2];
      break;
    }
    case 'R2': {
      return applyMove(applyMove(state, 'R'), 'R');
    }

    default:
      console.warn(`Unknown move: ${move}`);
      return state;
  }

  return next;
}

export function applyMoves(state: CubeState, movesStr: string): CubeState {
  if (!movesStr) return state;
  const tokens = movesStr.trim().split(/\s+/).filter(Boolean);
  let current = cloneCubeState(state);
  for (const token of tokens) {
    current = applyMove(current, token);
  }
  return current;
}

export function invertMove(move: string): string {
  const m = move.trim();
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return `${m}'`;
}

export function invertAlgorithm(movesStr: string): string {
  if (!movesStr) return '';
  const tokens = movesStr.trim().split(/\s+/).filter(Boolean);
  return tokens.reverse().map(invertMove).join(' ');
}

// Convert CubeState to 54-char facelet string for solver:
// Order: U(9), R(9), F(9), D(9), L(9), B(9)
export function stateToFaceletString(state: CubeState): string {
  const centerColors: Record<Face, CubeColor> = {
    U: state.U[4],
    R: state.R[4],
    F: state.F[4],
    D: state.D[4],
    L: state.L[4],
    B: state.B[4],
  };

  // Map each color to the face whose center has that color
  const colorToFaceLetter: Record<CubeColor, Face> = {} as any;
  for (const face of ALL_FACES) {
    const color = centerColors[face];
    colorToFaceLetter[color] = face;
  }

  const order: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  let result = '';

  for (const face of order) {
    for (let i = 0; i < 9; i++) {
      const color = state[face][i];
      const letter = colorToFaceLetter[color] || COLOR_TO_CHAR[color] || 'U';
      result += letter;
    }
  }

  return result;
}

export function faceletStringToState(faceletStr: string): CubeState {
  const clean = faceletStr.replace(/\s+/g, '');
  const state = getSolvedCubeState();
  if (clean.length !== 54) return state;

  const order: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (let f = 0; f < 6; f++) {
    const face = order[f];
    for (let i = 0; i < 9; i++) {
      const char = clean[f * 9 + i] as Face;
      state[face][i] = CHAR_TO_COLOR[char] || 'white';
    }
  }

  return state;
}

export function isCubeSolved(state: CubeState): boolean {
  for (const face of ALL_FACES) {
    const firstColor = state[face][0];
    for (let i = 1; i < 9; i++) {
      if (state[face][i] !== firstColor) return false;
    }
  }
  return true;
}

const CORNER_SLOTS: [Face, number, Face, number, Face, number][] = [
  ['U', 8, 'R', 0, 'F', 2], // URF (0)
  ['U', 6, 'F', 0, 'L', 2], // UFL (1)
  ['U', 0, 'L', 0, 'B', 2], // ULB (2)
  ['U', 2, 'B', 0, 'R', 2], // UBR (3)
  ['D', 2, 'F', 8, 'R', 6], // DFR (4)
  ['D', 0, 'L', 8, 'F', 6], // DLF (5)
  ['D', 6, 'B', 8, 'L', 6], // DBL (6)
  ['D', 8, 'R', 8, 'B', 6], // DRB (7)
];

const EDGE_SLOTS: [Face, number, Face, number][] = [
  ['U', 5, 'R', 1], // UR (0)
  ['U', 7, 'F', 1], // UF (1)
  ['U', 3, 'L', 1], // UL (2)
  ['U', 1, 'B', 1], // UB (3)
  ['D', 5, 'R', 7], // DR (4)
  ['D', 1, 'F', 7], // DF (5)
  ['D', 3, 'L', 7], // DL (6)
  ['D', 7, 'B', 7], // DB (7)
  ['F', 5, 'R', 3], // FR (8)
  ['F', 3, 'L', 5], // FL (9)
  ['B', 5, 'L', 3], // BL (10)
  ['B', 3, 'R', 5], // BR (11)
];

export function fixCornerTwist(state: CubeState, cornerIndex: number, direction: 'CW' | 'CCW'): CubeState {
  if (cornerIndex < 0 || cornerIndex >= CORNER_SLOTS.length) return state;
  const next = cloneCubeState(state);
  const [f1, i1, f2, i2, f3, i3] = CORNER_SLOTS[cornerIndex];
  const c1 = next[f1][i1];
  const c2 = next[f2][i2];
  const c3 = next[f3][i3];

  if (direction === 'CW') {
    next[f1][i1] = c3;
    next[f2][i2] = c1;
    next[f3][i3] = c2;
  } else {
    next[f1][i1] = c2;
    next[f2][i2] = c3;
    next[f3][i3] = c1;
  }

  return next;
}

export function fixEdgeFlip(state: CubeState, edgeIndex: number): CubeState {
  if (edgeIndex < 0 || edgeIndex >= EDGE_SLOTS.length) return state;
  const next = cloneCubeState(state);
  const [f1, i1, f2, i2] = EDGE_SLOTS[edgeIndex];
  const c1 = next[f1][i1];
  const c2 = next[f2][i2];

  next[f1][i1] = c2;
  next[f2][i2] = c1;

  return next;
}

