import { PresetPattern } from './types';

export const PRESET_PATTERNS: PresetPattern[] = [
  {
    id: 'solved',
    name: 'Solved Cube',
    description: 'All 6 faces perfectly aligned and solved',
    category: 'special',
    moves: '',
  },
  {
    id: 'checkerboard',
    name: 'Checkerboard',
    description: 'Classic 6-face alternating checkerboard pattern',
    category: 'pattern',
    moves: 'R2 L2 U2 D2 F2 B2',
    difficulty: 'Easy',
  },
  {
    id: 'superflip',
    name: 'Superflip (God’s Number)',
    description: 'All 12 edges flipped in place. Maximum distance from solved (20 moves)',
    category: 'special',
    moves: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
    difficulty: 'Extreme',
  },
  {
    id: 'cube-in-cube',
    name: 'Cube in a Cube',
    description: 'Nested 2x2 cube inside a 3x3 cube on opposite corners',
    category: 'pattern',
    moves: "F L F U' R U F2 L2 U' L' B D' B' L2 U",
    difficulty: 'Medium',
  },
  {
    id: 'anaconda',
    name: 'Anaconda',
    description: 'Snake-like looping ribbon around the cube faces',
    category: 'pattern',
    moves: "L U B' U' R L' B R' F B' D R D' F'",
    difficulty: 'Medium',
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Zig-zag wrapping snake pattern across all sides',
    category: 'pattern',
    moves: "F2 R' B' U R' L F' L F' B D' R B L2",
    difficulty: 'Hard',
  },
  {
    id: 'plus-minus',
    name: 'Plus / Cross Pattern',
    description: 'Bold center crosses on all 6 faces',
    category: 'pattern',
    moves: "U2 R2 L2 U2 D2 R2 L2 D2",
    difficulty: 'Easy',
  },
  {
    id: 'four-spots',
    name: '4 Spots (Donut)',
    description: 'Center dots swapped on four lateral faces',
    category: 'pattern',
    moves: "F2 B2 U D' R2 L2 U D'",
    difficulty: 'Easy',
  },
  {
    id: 'six-spots',
    name: '6 Spots',
    description: 'All 6 center dots swapped into opposite color faces',
    category: 'pattern',
    moves: "U D' R L' F B' U D'",
    difficulty: 'Easy',
  },
  {
    id: 'scramble-easy',
    name: 'Easy Scramble (5 Moves)',
    description: 'Gentle scramble for quick testing and beginners',
    category: 'scramble',
    moves: "R U R' F' U2",
    difficulty: 'Easy',
  },
  {
    id: 'scramble-medium',
    name: 'Medium Scramble (12 Moves)',
    description: 'Moderate mix across multiple axes',
    category: 'scramble',
    moves: "F U2 L' B D2 R' F' L U B2 R2 D'",
    difficulty: 'Medium',
  },
  {
    id: 'scramble-hard',
    name: 'WCA Official Scramble (20 Moves)',
    description: 'Tournament-grade random 20-move scramble',
    category: 'scramble',
    moves: "D2 B' R2 F2 D2 R2 F' U2 B' L2 B' D' R' B2 D B L' F2 U B'",
    difficulty: 'Hard',
  },
];

const BASIC_MOVES = ['U', 'D', 'F', 'B', 'L', 'R'];
const MODIFIERS = ['', "'", '2'];

export function generateRandomScramble(moveCount: number = 20): string {
  const scramble: string[] = [];
  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < moveCount; i++) {
    let face = '';
    do {
      face = BASIC_MOVES[Math.floor(Math.random() * BASIC_MOVES.length)];
    } while (
      face === lastFace ||
      (face === secondLastFace && areOppositeFaces(face, lastFace))
    );

    const mod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    scramble.push(`${face}${mod}`);

    secondLastFace = lastFace;
    lastFace = face;
  }

  return scramble.join(' ');
}

function areOppositeFaces(f1: string, f2: string): boolean {
  return (
    (f1 === 'U' && f2 === 'D') ||
    (f1 === 'D' && f2 === 'U') ||
    (f1 === 'F' && f2 === 'B') ||
    (f1 === 'B' && f2 === 'F') ||
    (f1 === 'L' && f2 === 'R') ||
    (f1 === 'R' && f2 === 'L')
  );
}
