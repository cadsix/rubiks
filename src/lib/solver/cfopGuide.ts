export interface CFOPStep {
  title: string;
  subtitle: string;
  stage: 'cross' | 'f2l' | 'oll' | 'pll';
  description: string;
  tip: string;
  sampleAlgs: { name: string; alg: string; note: string }[];
}

export const CFOP_STEPS: CFOPStep[] = [
  {
    title: '1. The White Cross',
    subtitle: 'Solve 4 White Edge Pieces',
    stage: 'cross',
    description: 'Create a cross on the bottom (White) face, aligning each white edge with its matching center color on the adjacent side faces (Green, Red, Blue, Orange).',
    tip: 'Solve cross on the bottom (D) to save rotation time and see F2L pieces on top.',
    sampleAlgs: [
      { name: 'Daisy to Cross', alg: "F2 R2 B2 L2", note: 'Bring white edges to top yellow face, match side color, then turn 180° down' },
      { name: 'Flipped Bottom Edge', alg: "F' U' R U", note: 'Flips a white edge in the bottom layer into correct orientation' },
    ],
  },
  {
    title: '2. First Two Layers (F2L)',
    subtitle: 'Pair 4 Corners & Edges Simultaneously',
    stage: 'f2l',
    description: 'Solve the 4 corner-edge pairs into their respective slots between the first two layers, completing the bottom two thirds of the cube in just 4 pairs.',
    tip: 'Look ahead for the corresponding edge while pairing the corner in the top layer.',
    sampleAlgs: [
      { name: 'Basic Insert (Right)', alg: "U R U' R'", note: 'Standard connected pair insertion into front-right slot' },
      { name: 'Basic Insert (Left)', alg: "U' L' U L", note: 'Standard connected pair insertion into front-left slot' },
      { name: 'Split & Insert (Sexy Move)', alg: "R U R' U'", note: 'The fundamental trigger used in thousands of algorithms' },
    ],
  },
  {
    title: '3. Orient Last Layer (OLL)',
    subtitle: 'Turn All Yellow Stickers Facing Up',
    stage: 'oll',
    description: 'Orient all pieces on the top (Yellow) layer so the entire top face becomes solid yellow, regardless of their side alignment.',
    tip: '2-Look OLL uses just 2 simple algorithms: first orient yellow edges (Yellow Cross), then orient corners.',
    sampleAlgs: [
      { name: 'Yellow Edge Cross (Bar)', alg: "F R U R' U' F'", note: 'Converts a horizontal yellow bar into a complete yellow cross' },
      { name: 'Yellow Edge Cross (L-Shape)', alg: "F U R U' R' F'", note: 'Converts a 9-o-clock L-shape into a yellow cross' },
      { name: 'Sune (Corner Orientation)', alg: "R U R' U R U2 R'", note: 'Most famous corner orientation algorithm in speedcubing' },
      { name: 'Anti-Sune', alg: "R U2 R' U' R U' R'", note: 'Mirrored Sune for opposite corner orientations' },
    ],
  },
  {
    title: '4. Permute Last Layer (PLL)',
    subtitle: 'Swap Remaining Pieces Into Final Place',
    stage: 'pll',
    description: 'Rearrange the corners and edges of the top layer to match the side faces, completing the entire Rubik\'s Cube solve.',
    tip: 'Look for "Headlights" (two corners with matching colors on the same face) to determine the next algorithm.',
    sampleAlgs: [
      { name: 'T-Perm (Corners & Edges)', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", note: 'Swaps two adjacent corners and two opposite edges' },
      { name: 'Y-Perm (Diagonal Corners)', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", note: 'Swaps two diagonally opposite corners' },
      { name: 'U-Perm A (3 Edge Cycle)', alg: "R U' R U R U R U' R' U' R2", note: 'Cycles 3 top layer edges counter-clockwise' },
      { name: 'U-Perm B (3 Edge Cycle)', alg: "R2 U R U R' U' R' U' R' U R'", note: 'Cycles 3 top layer edges clockwise' },
      { name: 'H-Perm (Opposite Edges)', alg: "M2 U M2 U2 M2 U M2", note: 'Swaps opposite edge pairs across the top layer' },
    ],
  },
];
