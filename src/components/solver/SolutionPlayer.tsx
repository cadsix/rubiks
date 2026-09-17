'use client';

import React, { useState, useEffect } from 'react';
import { CubeState, Move } from '@/lib/cube/types';
import { solveCubeState, SolveResult } from '@/lib/solver/kociemba';
import { applyMove, invertMove } from '@/lib/cube/state';
import { playSuccessSound } from '@/lib/audio/soundEffects';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';

interface SolutionPlayerProps {
  currentState: CubeState;
  onStateChange: (state: CubeState, animatingMove?: Move | null) => void;
  canSolve: boolean;
  isSolved: boolean;
}

export const SolutionPlayer: React.FC<SolutionPlayerProps> = ({
  currentState,
  onStateChange,
  canSolve,
  isSolved,
}) => {
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(500);
  const [copied, setCopied] = useState(false);
  const [savedInitialState, setSavedInitialState] = useState<CubeState | null>(null);

  const handleSolve = async () => {
    if (!canSolve || isSolving) return;
    setIsSolving(true);
    setIsPlaying(false);

    try {
      const result = await solveCubeState(currentState);
      setSolveResult(result);
      setSavedInitialState(currentState);
      setCurrentStepIndex(-1);

      if (result.success && result.steps.length === 0) {
        triggerConfetti();
        playSuccessSound();
      }
    } catch (e) {
      console.error('Solve error:', e);
    } finally {
      setIsSolving(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const stepForward = () => {
    if (!solveResult || currentStepIndex >= solveResult.steps.length - 1) return;
    const nextIndex = currentStepIndex + 1;
    const nextStep = solveResult.steps[nextIndex];

    const nextState = applyMove(currentState, nextStep.move);
    onStateChange(nextState, nextStep.move);
    setCurrentStepIndex(nextIndex);

    if (nextIndex === solveResult.steps.length - 1) {
      setIsPlaying(false);
      triggerConfetti();
      playSuccessSound();
    }
  };

  const stepBackward = () => {
    if (!solveResult || currentStepIndex < 0) return;
    const currentStep = solveResult.steps[currentStepIndex];
    const inverse = invertMove(currentStep.move);

    const prevState = applyMove(currentState, inverse);
    onStateChange(prevState, inverse as Move);
    setCurrentStepIndex(currentStepIndex - 1);
  };

  const jumpToStep = (targetIndex: number) => {
    if (!solveResult || !savedInitialState) return;
    setIsPlaying(false);

    let state = savedInitialState;
    for (let i = 0; i <= targetIndex; i++) {
      state = applyMove(state, solveResult.steps[i].move);
    }
    onStateChange(state);
    setCurrentStepIndex(targetIndex);

    if (targetIndex === solveResult.steps.length - 1) {
      triggerConfetti();
      playSuccessSound();
    }
  };

  const resetToSolveStart = () => {
    if (!savedInitialState) return;
    setIsPlaying(false);
    onStateChange(savedInitialState);
    setCurrentStepIndex(-1);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (solveResult && currentStepIndex < solveResult.steps.length - 1) {
        stepForward();
      } else {
        setIsPlaying(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex, solveResult, speed]);

  const copySolution = () => {
    if (!solveResult?.solution) return;
    navigator.clipboard.writeText(solveResult.solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStep = solveResult && currentStepIndex >= 0 ? solveResult.steps[currentStepIndex] : null;
  const totalSteps = solveResult?.steps.length || 0;
  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
      {/* Top Header & Solve CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
            Optimal Solver
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Two-Phase Kociemba algorithm (typically &lt;22 moves)
          </p>
        </div>

        <button
          onClick={handleSolve}
          disabled={!canSolve || isSolving}
          className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-medium text-xs tracking-wide transition-all shadow-xs ${
            !canSolve
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
              : isSolving
              ? 'bg-neutral-800 text-white animate-pulse'
              : 'bg-neutral-900 hover:bg-neutral-800 text-white active:scale-95'
          }`}
        >
          {isSolving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Solving...</span>
            </>
          ) : (
            <span>{isSolved ? 'Re-Solve' : 'Solve Cube'}</span>
          )}
        </button>
      </div>

      {/* Solution Section */}
      {solveResult && (
        <div className="flex flex-col gap-3 pt-2.5 border-t border-neutral-100">
          {solveResult.success ? (
            solveResult.steps.length === 0 ? (
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs">
                Cube is already in solved configuration.
              </div>
            ) : (
              <>
                {/* Stats & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                      {solveResult.moveCount} moves
                    </span>
                    <span className="font-mono text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                      {solveResult.timeMs}ms
                    </span>
                  </div>

                  <button
                    onClick={copySolution}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs transition shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Copy Notation</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden border border-neutral-200">
                  <div
                    className="bg-neutral-900 h-full transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Active Step Highlight */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-neutral-300 font-mono font-bold text-lg text-neutral-900 shadow-xs">
                      {currentStep ? currentStep.move : '—'}
                    </div>
                    <div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        {currentStep ? `Step ${currentStepIndex + 1} of ${totalSteps}` : 'Initial state'}
                      </div>
                      <div className="text-xs font-medium text-neutral-800 mt-0.5">
                        {currentStep ? currentStep.text : 'Ready to start'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-400 font-mono">
                    {Math.round(progressPercent)}%
                  </div>
                </div>

                {/* Timeline Move Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-thin">
                  <button
                    onClick={() => resetToSolveStart()}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded shrink-0 border transition ${
                      currentStepIndex === -1
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Start
                  </button>

                  {solveResult.steps.map((step, idx) => {
                    const isActive = currentStepIndex === idx;
                    const isPassed = currentStepIndex > idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => jumpToStep(idx)}
                        className={`px-2.5 py-1 text-xs font-mono font-medium rounded shrink-0 border transition ${
                          isActive
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs font-bold'
                            : isPassed
                            ? 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200/70'
                            : 'bg-white border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {step.move}
                      </button>
                    );
                  })}
                </div>

                {/* Playback Controls & Speed */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={resetToSolveStart}
                      disabled={currentStepIndex === -1}
                      className="p-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition border border-neutral-200 shadow-2xs"
                      title="Reset to start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={stepBackward}
                      disabled={currentStepIndex === -1}
                      className="p-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition border border-neutral-200 shadow-2xs"
                      title="Step Backward"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={currentStepIndex >= totalSteps - 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shadow-xs"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={stepForward}
                      disabled={currentStepIndex >= totalSteps - 1}
                      className="p-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition border border-neutral-200 shadow-2xs"
                      title="Step Forward"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-200">
                    <span className="text-[11px] text-neutral-400 mr-1">Speed:</span>
                    {[
                      { label: '0.5x', ms: 900 },
                      { label: '1x', ms: 500 },
                      { label: '2x', ms: 250 },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setSpeed(s.ms)}
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded font-medium transition ${
                          speed === s.ms
                            ? 'bg-neutral-900 text-white shadow-2xs'
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )
          ) : (
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs">
              {solveResult.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
