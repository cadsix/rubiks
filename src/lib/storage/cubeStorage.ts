import { CubeState } from '../cube/types';
import { isCubeSolved } from '../cube/state';

export interface SavedCubeEntry {
  id: string;
  name: string;
  timestamp: number;
  state: CubeState;
  isSolved?: boolean;
}

const ACTIVE_STATE_KEY = 'rubiks_active_state_v1';
const HISTORY_KEY = 'rubiks_cube_history_v1';

// Save the active working state to localStorage
export function saveCurrentState(state: CubeState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save cube state to localStorage:', e);
  }
}

// Load active working state from localStorage
export function loadCurrentState(): CubeState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.U) &&
      Array.isArray(parsed.R) &&
      Array.isArray(parsed.F) &&
      Array.isArray(parsed.D) &&
      Array.isArray(parsed.L) &&
      Array.isArray(parsed.B)
    ) {
      return parsed as CubeState;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Clear active working state
export function clearCurrentState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_STATE_KEY);
  } catch (e) {}
}

// Get all saved history entries
export function getSavedHistory(): SavedCubeEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedCubeEntry[];
  } catch (e) {
    return [];
  }
}

// Save a cube snapshot to history
export function saveStateToHistory(state: CubeState, customName?: string): SavedCubeEntry {
  const history = getSavedHistory();
  const solved = isCubeSolved(state);
  const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const name = customName || (solved ? `Solved Cube (${dateStr})` : `Custom Scramble (${dateStr})`);

  const newEntry: SavedCubeEntry = {
    id: `cube_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    timestamp: Date.now(),
    state: JSON.parse(JSON.stringify(state)),
    isSolved: solved,
  };

  // Keep most recent 25 entries
  const updated = [newEntry, ...history.filter((h) => h.id !== newEntry.id)].slice(0, 25);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {}
  }

  return newEntry;
}

// Delete an entry from history
export function deleteHistoryEntry(id: string): SavedCubeEntry[] {
  const history = getSavedHistory().filter((h) => h.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
  }
  return history;
}

// Clear all history
export function clearAllHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {}
}
