import {
  CubeColor,
  CubeState,
  Face,
  ValidationResult,
  ParityDiagnosis,
  TwistedCornerInfo,
  FlippedEdgeInfo,
} from './types';
import { ALL_COLORS, ALL_FACES, COLOR_NAMES, FACE_NAMES } from './constants';

const OPPOSITE_COLORS: Record<CubeColor, CubeColor> = {
  white: 'yellow',
  yellow: 'white',
  green: 'blue',
  blue: 'green',
  red: 'orange',
  orange: 'red',
};

// 8 Corner definitions: [Face1, Index1, Face2, Index2, Face3, Index3]
export const CORNERS_DEF: {
  name: string;
  positionName: string;
  faces: [Face, number, Face, number, Face, number];
}[] = [
  { name: 'Top-Front-Right (URF)', positionName: 'Top-Front-Right', faces: ['U', 8, 'R', 0, 'F', 2] },
  { name: 'Top-Front-Left (UFL)', positionName: 'Top-Front-Left', faces: ['U', 6, 'F', 0, 'L', 2] },
  { name: 'Top-Back-Left (ULB)', positionName: 'Top-Back-Left', faces: ['U', 0, 'L', 0, 'B', 2] },
  { name: 'Top-Back-Right (UBR)', positionName: 'Top-Back-Right', faces: ['U', 2, 'B', 0, 'R', 2] },
  { name: 'Bottom-Front-Right (DFR)', positionName: 'Bottom-Front-Right', faces: ['D', 2, 'F', 8, 'R', 6] },
  { name: 'Bottom-Front-Left (DLF)', positionName: 'Bottom-Front-Left', faces: ['D', 0, 'L', 8, 'F', 6] },
  { name: 'Bottom-Back-Left (DBL)', positionName: 'Bottom-Back-Left', faces: ['D', 6, 'B', 8, 'L', 6] },
  { name: 'Bottom-Back-Right (DRB)', positionName: 'Bottom-Back-Right', faces: ['D', 8, 'R', 8, 'B', 6] },
];

// 12 Edge definitions: [Face1, Index1, Face2, Index2]
export const EDGES_DEF: {
  name: string;
  positionName: string;
  faces: [Face, number, Face, number];
}[] = [
  { name: 'Top-Right (UR)', positionName: 'Top-Right', faces: ['U', 5, 'R', 1] },
  { name: 'Top-Front (UF)', positionName: 'Top-Front', faces: ['U', 7, 'F', 1] },
  { name: 'Top-Left (UL)', positionName: 'Top-Left', faces: ['U', 3, 'L', 1] },
  { name: 'Top-Back (UB)', positionName: 'Top-Back', faces: ['U', 1, 'B', 1] },
  { name: 'Bottom-Right (DR)', positionName: 'Bottom-Right', faces: ['D', 5, 'R', 7] },
  { name: 'Bottom-Front (DF)', positionName: 'Bottom-Front', faces: ['D', 1, 'F', 7] },
  { name: 'Bottom-Left (DL)', positionName: 'Bottom-Left', faces: ['D', 3, 'L', 7] },
  { name: 'Bottom-Back (DB)', positionName: 'Bottom-Back', faces: ['D', 7, 'B', 7] },
  { name: 'Front-Right (FR)', positionName: 'Front-Right', faces: ['F', 5, 'R', 3] },
  { name: 'Front-Left (FL)', positionName: 'Front-Left', faces: ['F', 3, 'L', 5] },
  { name: 'Back-Left (BL)', positionName: 'Back-Left', faces: ['B', 5, 'L', 3] },
  { name: 'Back-Right (BR)', positionName: 'Back-Right', faces: ['B', 3, 'R', 5] },
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

  // Check if all faces have 9 colors
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
  const centerColors = ALL_FACES.map((f) => state[f][4]);
  const uniqueCenters = new Set(centerColors);
  if (uniqueCenters.size !== 6) {
    errors.push('Centers must have 6 unique colors. Each face center defines its side.');
  }

  // 3. Validate Corners & Extract Detailed Corner Orientations
  const cornerSignatures = new Set<string>();
  const cornerTwistList: TwistedCornerInfo[] = [];
  let cornerTwistSum = 0;

  const uOrDColor1 = state.U[4] || 'white';
  const uOrDColor2 = state.D[4] || 'yellow';

  for (let i = 0; i < CORNERS_DEF.length; i++) {
    const def = CORNERS_DEF[i];
    const [f1, i1, f2, i2, f3, i3] = def.faces;
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

    // Orientation Calculation: Where is the U or D color?
    let ori = 0;
    let twistAngle = '0° (Aligned)';
    let direction: 'CW' | 'CCW' = 'CW';
    let fixDirection: 'CW' | 'CCW' = 'CCW';

    if (c1 === uOrDColor1 || c1 === uOrDColor2) {
      ori = 0;
    } else if (c2 === uOrDColor1 || c2 === uOrDColor2) {
      ori = 1;
      twistAngle = '120° Clockwise';
      direction = 'CW';
      fixDirection = 'CCW';
    } else if (c3 === uOrDColor1 || c3 === uOrDColor2) {
      ori = 2;
      twistAngle = '120° Counter-Clockwise';
      direction = 'CCW';
      fixDirection = 'CW';
    }

    cornerTwistSum += ori;

    if (ori !== 0) {
      const uOrD = c1 === uOrDColor1 || c2 === uOrDColor1 || c3 === uOrDColor1 ? uOrDColor1 : uOrDColor2;
      const targetFaceName = def.faces[0] === 'U' ? 'Top (White)' : 'Bottom (Yellow)';
      cornerTwistList.push({
        cornerIndex: i,
        name: def.name,
        positionName: def.positionName,
        colors: [c1, c2, c3],
        colorNames: `${COLOR_NAMES[c1]}-${COLOR_NAMES[c2]}-${COLOR_NAMES[c3]}`,
        twistAngle,
        direction,
        fixDirection,
        faces: def.faces,
        fixInstruction: `Hold the cube with White on Top, Green in Front. Twist the ${def.positionName} corner piece ${
          fixDirection === 'CW' ? 'Clockwise' : 'Counter-Clockwise'
        } so its ${COLOR_NAMES[uOrD]} sticker faces ${targetFaceName}.`,
      });
    }
  }

  // 4. Validate Edges & Extract Detailed Edge Orientations
  const edgeSignatures = new Set<string>();
  const flippedEdgeList: FlippedEdgeInfo[] = [];
  let edgeFlipSum = 0;

  const uColor = state.U[4] || 'white';
  const dColor = state.D[4] || 'yellow';
  const fColor = state.F[4] || 'green';
  const bColor = state.B[4] || 'blue';

  for (let i = 0; i < EDGES_DEF.length; i++) {
    const def = EDGES_DEF[i];
    const [f1, i1, f2, i2] = def.faces;
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

    // Edge flip test
    let isFlipped = false;
    if (c1 === uColor || c1 === dColor) {
      isFlipped = false;
    } else if (c2 === uColor || c2 === dColor) {
      isFlipped = true;
    } else if (c1 === fColor || c1 === bColor) {
      isFlipped = false;
    } else if (c2 === fColor || c2 === bColor) {
      isFlipped = true;
    } else {
      isFlipped = false;
    }

    if (isFlipped) {
      edgeFlipSum += 1;
      flippedEdgeList.push({
        edgeIndex: i,
        name: def.name,
        positionName: def.positionName,
        colors: [c1, c2],
        colorNames: `${COLOR_NAMES[c1]}-${COLOR_NAMES[c2]}`,
        faces: def.faces,
        fixInstruction: `Remove the ${def.positionName} edge piece and insert it flipped so ${COLOR_NAMES[c1]} faces ${FACE_NAMES[def.faces[0]]}.`,
      });
    }
  }

  // Check Parities
  const hasCornerTwistParity = cornerTwistSum % 3 !== 0;
  const hasEdgeFlipParity = edgeFlipSum % 2 !== 0;

  const parityDiagnosis: ParityDiagnosis = {
    hasCornerTwistParity,
    hasEdgeFlipParity,
    cornerTwistSum,
    edgeFlipSum,
    twistedCorners: cornerTwistList,
    primaryTwistedCorner: cornerTwistList.length > 0 ? cornerTwistList[0] : undefined,
    flippedEdges: flippedEdgeList,
    primaryFlippedEdge: flippedEdgeList.length > 0 ? flippedEdgeList[0] : undefined,
  };

  if (hasCornerTwistParity && errors.length === 0) {
    if (cornerTwistList.length === 1) {
      const tc = cornerTwistList[0];
      errors.push(`Corner Twist Detected: The ${tc.positionName} (${tc.colorNames}) corner is twisted ${tc.twistAngle.toLowerCase()}.`);
    } else {
      errors.push('Corner twist parity error: One or more corners are twisted physically.');
    }
  }

  if (hasEdgeFlipParity && errors.length === 0) {
    if (flippedEdgeList.length === 1) {
      const fe = flippedEdgeList[0];
      errors.push(`Edge Flip Detected: The ${fe.positionName} (${fe.colorNames}) edge is flipped.`);
    } else {
      errors.push('Edge flip parity error: A single edge is flipped and impossible to solve physically.');
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    canSolve: valid,
    errors,
    warnings,
    colorCounts,
    parityDiagnosis,
  };
}
