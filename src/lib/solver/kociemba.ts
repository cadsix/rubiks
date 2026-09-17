import { CubeState, SolutionStep, Move, Face } from '../cube/types';
import { stateToFaceletString } from '../cube/state';
import { MOVE_DESCRIPTIONS } from '../cube/constants';
import Cube from 'cubejs';

let isSolverInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureSolverInitialized(): Promise<void> {
  if (isSolverInitialized) return;
  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve) => {
    try {
      // Execute in next tick to not block main thread
      setTimeout(() => {
        Cube.initSolver();
        isSolverInitialized = true;
        resolve();
      }, 0);
    } catch (e) {
      console.error('Failed to initialize solver:', e);
      resolve();
    }
  });

  return initPromise;
}

export function parseSolutionToSteps(solutionStr: string): SolutionStep[] {
  if (!solutionStr || !solutionStr.trim()) return [];

  const rawTokens = solutionStr.trim().split(/\s+/).filter(Boolean);
  return rawTokens.map((tok, idx) => {
    const move = tok as Move;
    const face = tok[0] as Face;
    let direction: 'CW' | 'CCW' | 'DOUBLE' = 'CW';
    if (tok.includes("'")) direction = 'CCW';
    else if (tok.includes('2')) direction = 'DOUBLE';

    const text = MOVE_DESCRIPTIONS[tok] || `Move ${tok}`;

    return {
      move,
      face,
      direction,
      text,
      index: idx,
    };
  });
}

export interface SolveResult {
  success: boolean;
  solution: string;
  steps: SolutionStep[];
  moveCount: number;
  timeMs: number;
  error?: string;
}

export async function solveCubeState(state: CubeState): Promise<SolveResult> {
  const startTime = performance.now();

  try {
    await ensureSolverInitialized();
    const faceletStr = stateToFaceletString(state);

    // If already solved:
    const solvedPattern = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
    if (faceletStr === solvedPattern) {
      return {
        success: true,
        solution: '',
        steps: [],
        moveCount: 0,
        timeMs: Math.round(performance.now() - startTime),
      };
    }

    const cube = Cube.fromString(faceletStr);
    const rawSolution = cube.solve();
    const cleanSolution = rawSolution.trim();
    const steps = parseSolutionToSteps(cleanSolution);
    const elapsed = Math.round(performance.now() - startTime);

    return {
      success: true,
      solution: cleanSolution,
      steps,
      moveCount: steps.length,
      timeMs: elapsed,
    };
  } catch (err: any) {
    console.error('Solver error:', err);
    return {
      success: false,
      solution: '',
      steps: [],
      moveCount: 0,
      timeMs: Math.round(performance.now() - startTime),
      error: err?.message || 'Unable to solve cube configuration. Please verify that all facelet colors are positioned correctly.',
    };
  }
}
