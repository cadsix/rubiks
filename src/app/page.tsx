'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CubeColor, CubeState, Face, Move, PresetPattern } from '@/lib/cube/types';
import {
  getSolvedCubeState,
  cloneCubeState,
  applyMove,
  applyMoves,
  isCubeSolved,
  fixCornerTwist,
  fixEdgeFlip,
} from '@/lib/cube/state';
import { validateCubeState } from '@/lib/cube/validator';
import { generateRandomScramble } from '@/lib/cube/presets';
import { Header } from '@/components/ui/Header';
import { CubeNet2D } from '@/components/cube/CubeNet2D';
import { PaletteBar } from '@/components/cube/PaletteBar';
import { MoveControls } from '@/components/cube/MoveControls';
import { PresetBar } from '@/components/cube/PresetBar';
import { SolutionPlayer } from '@/components/solver/SolutionPlayer';
import { ValidationCard } from '@/components/solver/ValidationCard';
import { CFOPGuideModal } from '@/components/solver/CFOPGuideModal';
import { CameraScannerModal } from '@/components/scanner/CameraScannerModal';
import { SpeedTimer } from '@/components/timer/SpeedTimer';
import { playClickSound, playTurnSound } from '@/lib/audio/soundEffects';
import { AnimatingMovePayload } from '@/components/cube/Cube3D';

const Cube3D = dynamic(() => import('@/components/cube/Cube3D').then((mod) => mod.Cube3D), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-[400px] sm:h-[460px] lg:h-[490px] flex flex-col items-center justify-center rounded-xl bg-white border border-neutral-200">
      <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
      <span className="text-xs text-neutral-400 font-mono mt-2.5">Loading 3D Studio...</span>
    </div>
  ),
});

export default function Home() {
  const [cubeState, setCubeState] = useState<CubeState>(getSolvedCubeState);
  const [activeColor, setActiveColor] = useState<CubeColor>('white');
  const [lockCenters, setLockCenters] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'studio' | 'timer'>('studio');
  const [isCFOPGuideOpen, setIsCFOPGuideOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Animation orchestration state
  const [animatingMove, setAnimatingMove] = useState<AnimatingMovePayload | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const onAnimationCompleteCallbackRef = useRef<(() => void) | null>(null);

  const validation = useMemo(() => validateCubeState(cubeState), [cubeState]);
  const isSolved = useMemo(() => isCubeSolved(cubeState), [cubeState]);

  const highlightFacelets = useMemo(() => {
    const list: Array<{ face: Face; index: number }> = [];
    if (validation.parityDiagnosis?.hasCornerTwistParity && validation.parityDiagnosis.primaryTwistedCorner) {
      const tc = validation.parityDiagnosis.primaryTwistedCorner;
      list.push({ face: tc.faces[0], index: tc.faces[1] });
      list.push({ face: tc.faces[2], index: tc.faces[3] });
      list.push({ face: tc.faces[4], index: tc.faces[5] });
    }
    if (validation.parityDiagnosis?.hasEdgeFlipParity && validation.parityDiagnosis.primaryFlippedEdge) {
      const fe = validation.parityDiagnosis.primaryFlippedEdge;
      list.push({ face: fe.faces[0], index: fe.faces[1] });
      list.push({ face: fe.faces[2], index: fe.faces[3] });
    }
    return list;
  }, [validation]);

  const handlePaint = useCallback((face: Face, index: number) => {
    setCubeState((prev) => {
      const next = cloneCubeState(prev);
      next[face][index] = activeColor;
      return next;
    });
  }, [activeColor]);

  // Request a physical 3D move animation
  const handleAnimateMove = useCallback(
    (move: Move, onComplete?: () => void, duration?: number) => {
      setIsAnimating(true);
      onAnimationCompleteCallbackRef.current = onComplete || null;
      setAnimatingMove({
        move,
        id: Date.now() + Math.random(),
        duration,
      });
    },
    []
  );

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    setAnimatingMove(null);
    if (onAnimationCompleteCallbackRef.current) {
      const cb = onAnimationCompleteCallbackRef.current;
      onAnimationCompleteCallbackRef.current = null;
      cb();
    }
  }, []);

  // Manual move from buttons
  const handleManualMove = useCallback(
    (move: Move) => {
      if (isAnimating) return;
      handleAnimateMove(
        move,
        () => {
          setCubeState((prev) => applyMove(prev, move));
        },
        240
      );
    },
    [handleAnimateMove, isAnimating]
  );

  const handleApplyAlgorithm = useCallback((alg: string) => {
    playTurnSound();
    setCubeState((prev) => applyMoves(prev, alg));
  }, []);

  const handleSelectPreset = useCallback((preset: PresetPattern) => {
    playTurnSound();
    if (preset.id === 'solved') {
      setCubeState(getSolvedCubeState());
    } else if (preset.moves) {
      const fresh = getSolvedCubeState();
      setCubeState(applyMoves(fresh, preset.moves));
    }
  }, []);

  const handleRandomScramble = useCallback(() => {
    playTurnSound();
    const scramble = generateRandomScramble(20);
    const fresh = getSolvedCubeState();
    setCubeState(applyMoves(fresh, scramble));
  }, []);

  const handleReset = useCallback(() => {
    playClickSound();
    setCubeState(getSolvedCubeState());
  }, []);

  const handleClear = useCallback(() => {
    playClickSound();
    setCubeState({
      U: Array(9).fill('white'),
      R: Array(9).fill('white'),
      F: Array(9).fill('white'),
      D: Array(9).fill('white'),
      L: Array(9).fill('white'),
      B: Array(9).fill('white'),
    });
  }, []);

  const handleFixCornerTwist = useCallback((cornerIndex: number, direction: 'CW' | 'CCW') => {
    playTurnSound();
    setCubeState((prev) => fixCornerTwist(prev, cornerIndex, direction));
  }, []);

  const handleFixEdgeFlip = useCallback((edgeIndex: number) => {
    playTurnSound();
    setCubeState((prev) => fixEdgeFlip(prev, edgeIndex));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-neutral-900">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCFOP={() => setIsCFOPGuideOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
        {activeTab === 'studio' ? (
          <>
            {/* Color Palette Bar */}
            <PaletteBar
              activeColor={activeColor}
              onSelectColor={setActiveColor}
              colorCounts={validation.colorCounts}
              onReset={handleReset}
              onClear={handleClear}
              onScramble={handleRandomScramble}
            />

            {/* Two-Column Ergonomic Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: 3D Viewport & Manual Moves */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <Cube3D
                  state={cubeState}
                  activeColor={activeColor}
                  onFaceletClick={handlePaint}
                  animatingMove={animatingMove}
                  onAnimationComplete={handleAnimationComplete}
                  hintMove={hintMove}
                />
                <MoveControls onApplyMove={handleManualMove} disabled={isAnimating} />
              </div>

              {/* Right Column: 2D Net Editor & Optimal Solver Player */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <CubeNet2D
                  state={cubeState}
                  activeColor={activeColor}
                  onPaint={handlePaint}
                  lockCenters={lockCenters}
                  onToggleLockCenters={() => setLockCenters(!lockCenters)}
                  highlightFacelets={highlightFacelets}
                />

                {/* Solver Player */}
                <SolutionPlayer
                  currentState={cubeState}
                  onStateChange={setCubeState}
                  onAnimateMove={handleAnimateMove}
                  canSolve={validation.canSolve}
                  isSolved={isSolved}
                  isAnimating={isAnimating}
                />

                {/* Validation Status & Parity Fix */}
                <ValidationCard
                  validation={validation}
                  isSolved={isSolved}
                  onFixCornerTwist={handleFixCornerTwist}
                  onFixEdgeFlip={handleFixEdgeFlip}
                />
              </div>
            </div>

            {/* Preset Patterns Bar */}
            <PresetBar onSelectPreset={handleSelectPreset} />
          </>
        ) : (
          <SpeedTimer />
        )}
      </main>

      {/* Modals */}
      <CFOPGuideModal
        isOpen={isCFOPGuideOpen}
        onClose={() => setIsCFOPGuideOpen(false)}
        onApplyAlgorithm={handleApplyAlgorithm}
      />

      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyScannedState={(scanned) => setCubeState(scanned)}
      />

      {/* Minimal Footer */}
      <footer className="w-full border-t border-neutral-200 py-3.5 px-4 text-center text-[11px] text-neutral-400 font-mono">
        Rubik's Studio • Kociemba Two-Phase Optimal Engine
      </footer>
    </div>
  );
}
