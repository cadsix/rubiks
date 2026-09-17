import { CubeColor, CubeState, Face, ValidationResult } from './types';
import { ALL_COLORS, ALL_FACES, COLOR_NAMES, STANDARD_FACE_COLORS } from './constants';

const OPPOSITE_COLORS: Record<CubeColor, CubeColor> = {
  white: 'yellow',
  yellow: 'white',
  green: 'blue',
  blue: 'green',
  red: 'orange',
  orange: 'red',
};

// 8 Corner definitions: [Face1, Index1, Face2, Index2, Face3, Index3]
const CORNERS: [Face, number, Face, number, Face, number][] = [
  ['U', 8, 'R', 0, 'F', 2], // URF
  ['U', 6, 'F', 0, 'L', 2], // UFL
  ['U', 0, 'L', 0, 'B', 2], // ULB
  ['U', 2, 'B', 0, 'R', 2], // UBR
  ['D', 2, 'F', 8, 'R', 6], // DFR
  ['D', 0, 'L', 8, 'F', 6], // DLF
  ['D', 6, 'B', 8, 'L', 6], // DBL
  ['D', 8, 'R', 8, 'B', 6], // DRB
];

// 12 Edge definitions: [Face1, Index1, Face2, Index2]
const EDGES: [Face, number, Face, number][] = [
  ['U', 5, 'R', 1], // UR
  ['U', 7, 'F', 1], // UF
  ['U', 3, 'L', 1], // UL
  ['U', 1, 'B', 1], // UB
  ['D', 5, 'R', 7], // DR
  ['D', 1, 'F', 7], // DF
  ['D', 3, 'L', 7], // DL
  ['D', 7, 'B', 7], // DB
  ['F', 5, 'R', 3], // FR
  ['F', 3, 'L', 5], // FL
  ['B', 5, 'L', 3], // BL
  ['B', 3, 'R', 5], // BR
];

export function validateCubeState(state: CubeState): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const colorCounts: Record<CubeColor, number> = {
    white: 0,
    red: 0,
    green: 0,
    yellow: 0,
    orange: 0,
    blue: 0,
  };

  // 1. Count colors
  for (const face of ALL_FACES) {
    for (const color of state[face]) {
      if (color && colorCounts[color] !== undefined) {
        colorCounts[color]++;
      }
    }
  }

  // Check if all faces have colors
  let totalTiles = 0;
  for (const color of ALL_COLORS) {
    const count = colorCounts[color];
    totalTiles += count;
    if (count !== 9) {
      if (count < 9) {
        errors.push(`Missing ${9 - count} ${COLOR_NAMES[color]} tile${9 - count > 1 ? 's' : ''} (${count}/9)`);
      } else {
        errors.push(`Too many ${COLOR_NAMES[color]} tiles (${count}/9)`);
      }
    }
  }

  if (totalTiles !== 54) {
    return {
      valid: false,
      canSolve: false,
      errors,
      warnings,
      colorCounts,
    };
  }

  // 2. Validate Centers (Indices 4)
  const centerColors = ALL_FACES.map(f => state[f][4]);
  const uniqueCenters = new Set(centerColors);
  if (uniqueCenters.size !== 6) {
    errors.push('Centers must have 6 unique colors. Each face center defines its side.');
  }

  // 3. Validate Corners (No opposite or duplicate colors on same piece)
  const cornerSignatures = new Set<string>();
  let cornerTwistSum = 0;

  for (let i = 0; i < CORNERS.length; i++) {
    const [f1, i1, f2, i2, f3, i3] = CORNERS[i];
    const c1 = state[f1][i1];
    const c2 = state[f2][i2];
    const c3 = state[f3][i3];

    // Check duplicate color on same piece
    if (c1 === c2 || c1 === c3 || c2 === c3) {
      errors.push(`Invalid corner piece with duplicate color: ${COLOR_NAMES[c1]}, ${COLOR_NAMES[c2]}, ${COLOR_NAMES[c3]}`);
      break;
    }

    // Check opposite colors on same piece
    if (OPPOSITE_COLORS[c1] === c2 || OPPOSITE_COLORS[c1] === c3 || OPPOSITE_COLORS[c2] === c3) {
      errors.push(`Invalid corner with opposite colors: ${COLOR_NAMES[c1]}, ${COLOR_NAMES[c2]}, ${COLOR_NAMES[c3]}`);
      break;
    }

    // Uniqueness
    const sorted = [c1, c2, c3].sort().join('-');
    if (cornerSignatures.has(sorted)) {
      errors.push(`Duplicate corner piece detected: ${sorted.replace(/-/g, ', ')}`);
    }
    cornerSignatures.add(sorted);

    // Orientation: Check where U or D color is
    const uOrDColor1 = state.U[4];
    const uOrDColor2 = state.D[4];
    if (c1 === uOrDColor1 || c1 === uOrDColor2) {
      cornerTwistSum += 0;
    } else if (c2 === uOrDColor1 || c2 === uOrDColor2) {
      cornerTwistSum += 1;
    } else if (c3 === uOrDColor1 || c3 === uOrDColor2) {
      cornerTwistSum += 2;
    }
  }

  if (cornerTwistSum % 3 !== 0 && errors.length === 0) {
    errors.push('Corner twist parity error: A single corner is twisted and impossible to solve physically.');
  }

  // 4. Validate Edges
  const edgeSignatures = new Set<string>();
  let edgeFlipSum = 0;

  for (let i = 0; i < EDGES.length; i++) {
    const [f1, i1, f2, i2] = EDGES[i];
    const c1 = state[f1][i1];
    const c2 = state[f2][i2];

    if (c1 === c2) {
      errors.push(`Invalid edge piece with same color: ${COLOR_NAMES[c1]}`);
      break;
    }

    if (OPPOSITE_COLORS[c1] === c2) {
      errors.push(`Invalid edge with opposite colors: ${COLOR_NAMES[c1]} and ${COLOR_NAMES[c2]}`);
      break;
    }

    const sorted = [c1, c2].sort().join('-');
    if (edgeSignatures.has(sorted)) {
      errors.push(`Duplicate edge piece detected: ${sorted.replace(/-/g, ', ')}`);
    }
    edgeSignatures.add(sorted);

    // Basic edge flip test
    const uColor = state.U[4];
    const dColor = state.D[4];
    const fColor = state.F[4];
    const bColor = state.B[4];

    if (c1 === uColor || c1 === dColor) {
      edgeFlipSum += 0;
    } else if (c2 === uColor || c2 === dColor) {
      edgeFlipSum += 1;
    } else if (c1 === fColor || c1 === bColor) {
      edgeFlipSum += 0;
    } else {
      edgeFlipSum += 1;
    }
  }

  if (edgeFlipSum % 2 !== 0 && errors.length === 0) {
    errors.push('Edge flip parity error: A single edge is flipped and impossible to solve physically.');
  }

  const valid = errors.length === 0;

  return {
    valid,
    canSolve: valid,
    errors,
    warnings,
    colorCounts,
  };
}
