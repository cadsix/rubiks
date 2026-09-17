import { CubeColor, Face, Move } from './types';

export const COLOR_HEX: Record<CubeColor, string> = {
  white: '#FFFFFF',
  red: '#EF4444',
  green: '#22C55E',
  yellow: '#EAB308',
  orange: '#F97316',
  blue: '#3B82F6',
};

export const COLOR_NAMES: Record<CubeColor, string> = {
  white: 'White',
  red: 'Red',
  green: 'Green',
  yellow: 'Yellow',
  orange: 'Orange',
  blue: 'Blue',
};

export const FACE_NAMES: Record<Face, string> = {
  U: 'Top (Up)',
  L: 'Left',
  F: 'Front',
  R: 'Right',
  B: 'Back',
  D: 'Bottom (Down)',
};

export const STANDARD_FACE_COLORS: Record<Face, CubeColor> = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

export const COLOR_TO_CHAR: Record<CubeColor, Face> = {
  white: 'U',
  red: 'R',
  green: 'F',
  yellow: 'D',
  orange: 'L',
  blue: 'B',
};

export const CHAR_TO_COLOR: Record<Face, CubeColor> = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

export const ALL_FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
export const ALL_COLORS: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

export const ALL_MOVES: Move[] = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
];

export const MOVE_DESCRIPTIONS: Record<string, string> = {
  U: 'Rotate Top (Up) face Clockwise 90°',
  "U'": 'Rotate Top (Up) face Counter-Clockwise 90°',
  U2: 'Rotate Top (Up) face 180°',
  D: 'Rotate Bottom (Down) face Clockwise 90°',
  "D'": 'Rotate Bottom (Down) face Counter-Clockwise 90°',
  D2: 'Rotate Bottom (Down) face 180°',
  F: 'Rotate Front face Clockwise 90°',
  "F'": 'Rotate Front face Counter-Clockwise 90°',
  F2: 'Rotate Front face 180°',
  B: 'Rotate Back face Clockwise 90°',
  "B'": 'Rotate Back face Counter-Clockwise 90°',
  B2: 'Rotate Back face 180°',
  L: 'Rotate Left face Clockwise 90°',
  "L'": 'Rotate Left face Counter-Clockwise 90°',
  L2: 'Rotate Left face 180°',
  R: 'Rotate Right face Clockwise 90°',
  "R'": 'Rotate Right face Counter-Clockwise 90°',
  R2: 'Rotate Right face 180°',
};
