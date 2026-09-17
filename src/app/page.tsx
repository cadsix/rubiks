'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CubeColor, CubeState, Face, Move, PresetPattern } from '@/lib/cube/types';
import { getSolvedCubeState, cloneCubeState, applyMove, applyMoves, isCubeSolved } from '@/lib/cube/state';
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

const Cube3D = dynamic(() => import('@/components/cube/Cube3D').then((mod) => mod.Cube3D), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-[400px] sm:h-[460px] lg:h-[480px] flex flex-col items-center justify-center rounded-xl bg-white border border-neutral-200">
      <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
      <span className="text-xs text-neutral-400 font-mono mt-2.5">Loading 3D View...</span>
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
  const [animatingMove, setAnimatingMove] = useState<Move | null>(null);

  const validation = useMemo(() => validateCubeState(cubeState), [cubeState]);
  const isSolved = useMemo(() => isCubeSolved(cubeState), [cubeState]);

  const handlePaint = useCallback((face: Face, index: number) => {
    if (lockCenters && index === 4) return;

    setCubeState((prev) => {
      const next = cloneCubeState(prev);
      next[face][index] = activeColor;
      return next;
    });
  }, [activeColor, lockCenters]);

  const handleApplyMove = useCallback((move: Move) => {
    setAnimatingMove(move);
    setCubeState((prev) => applyMove(prev, move));
  }, []);

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

  const handleStateChangeFromPlayer = useCallback((newState: CubeState, move?: Move | null) => {
    if (move) setAnimatingMove(move);
    setCubeState(newState);
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
                  onAnimationComplete={() => setAnimatingMove(null)}
                />
                <MoveControls onApplyMove={handleApplyMove} />
              </div>

              {/* Right Column: 2D Net Editor & Direct Solver Controls */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <CubeNet2D
                  state={cubeState}
                  activeColor={activeColor}
                  onPaint={handlePaint}
                  lockCenters={lockCenters}
                  onToggleLockCenters={() => setLockCenters(!lockCenters)}
                />

                {/* Solver Player right below Net Editor */}
                <SolutionPlayer
                  currentState={cubeState}
                  onStateChange={handleStateChangeFromPlayer}
                  canSolve={validation.canSolve}
                  isSolved={isSolved}
                />

                {/* Validation Status */}
                <ValidationCard
                  validation={validation}
                  isSolved={isSolved}
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
        Rubik's Studio • Kociemba Two-Phase Engine
      </footer>
    </div>
  );
}
