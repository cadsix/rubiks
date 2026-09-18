'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CubeState, Move } from '@/lib/cube/types';
import { solveCubeState, SolveResult } from '@/lib/solver/kociemba';
import { applyMove, invertMove } from '@/lib/cube/state';
import { MOVE_DESCRIPTIONS } from '@/lib/cube/constants';
import { playSuccessSound, playClickSound } from '@/lib/audio/soundEffects';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Copy,
  Check,
  Compass,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface SolutionPlayerProps {
  currentState: CubeState;
  onStateChange: (state: CubeState) => void;
  onAnimateMove: (move: Move, onComplete?: () => void, duration?: number) => void;
  canSolve: boolean;
  isSolved: boolean;
  isAnimating: boolean;
}

export const SolutionPlayer: React.FC<SolutionPlayerProps> = ({
  currentState,
  onStateChange,
  onAnimateMove,
  canSolve,
  isSolved,
  isAnimating,
}) => {
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [savedInitialState, setSavedInitialState] = useState<CubeState | null>(null);

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const currentStepIndexRef = useRef(currentStepIndex);
  currentStepIndexRef.current = currentStepIndex;

  const solveResultRef = useRef(solveResult);
  solveResultRef.current = solveResult;

  const currentStateRef = useRef(currentState);
  currentStateRef.current = currentState;

  // Move durations based on speed multiplier
  const getMoveDuration = useCallback(() => {
    if (speedMultiplier === 0.5) return 500;
    if (speedMultiplier === 2) return 180;
    return 300;
  }, [speedMultiplier]);

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
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Step Forward with True 3D Physical Rotation
  const stepForward = useCallback(
    (onDone?: () => void) => {
      const result = solveResultRef.current;
      const currIdx = currentStepIndexRef.current;
      const state = currentStateRef.current;

      if (!result || currIdx >= result.steps.length - 1) {
        setIsPlaying(false);
        return;
      }

      const nextIdx = currIdx + 1;
      const nextStep = result.steps[nextIdx];
      const duration = getMoveDuration();

      onAnimateMove(
        nextStep.move,
        () => {
          const nextState = applyMove(state, nextStep.move);
          onStateChange(nextState);
          setCurrentStepIndex(nextIdx);

          if (nextIdx === result.steps.length - 1) {
            setIsPlaying(false);
            triggerConfetti();
            playSuccessSound();
          }

          if (onDone) onDone();
        },
        duration
      );
    },
    [onAnimateMove, onStateChange, getMoveDuration]
  );

  // Step Backward with True 3D Physical Inverse Rotation
  const stepBackward = useCallback(() => {
    const result = solveResultRef.current;
    const currIdx = currentStepIndexRef.current;
    const state = currentStateRef.current;

    if (!result || currIdx < 0) return;

    const currentStep = result.steps[currIdx];
    const inverse = invertMove(currentStep.move) as Move;
    const duration = getMoveDuration();

    onAnimateMove(
      inverse,
      () => {
        const prevState = applyMove(state, inverse);
        onStateChange(prevState);
        setCurrentStepIndex(currIdx - 1);
      },
      duration
    );
  }, [onAnimateMove, onStateChange, getMoveDuration]);

  // Jump to Step Directly (instant jump without sequential delay)
  const jumpToStep = (targetIndex: number) => {
    if (!solveResult || !savedInitialState || isAnimating) return;
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

  // Reset to initial scrambled state
  const resetToSolveStart = () => {
    if (!savedInitialState || isAnimating) return;
    setIsPlaying(false);
    onStateChange(savedInitialState);
    setCurrentStepIndex(-1);
  };

  // Synchronized Auto-Playback Loop
  useEffect(() => {
    if (!isPlaying) return;

    let timeoutId: NodeJS.Timeout;

    const runNext = () => {
      if (!isPlayingRef.current) return;
      const result = solveResultRef.current;
      const currIdx = currentStepIndexRef.current;

      if (!result || currIdx >= result.steps.length - 1) {
        setIsPlaying(false);
        return;
      }

      stepForward(() => {
        if (isPlayingRef.current) {
          const pauseBetweenMoves = speedMultiplier === 0.5 ? 200 : speedMultiplier === 2 ? 80 : 120;
          timeoutId = setTimeout(runNext, pauseBetweenMoves);
        }
      });
    };

    runNext();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isPlaying, stepForward, speedMultiplier]);

  const copySolution = () => {
    if (!solveResult?.solution) return;
    navigator.clipboard.writeText(solveResult.solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStep =
    solveResult && currentStepIndex >= 0 ? solveResult.steps[currentStepIndex] : null;
  const nextUpcomingStep =
    solveResult && currentStepIndex + 1 < solveResult.steps.length
      ? solveResult.steps[currentStepIndex + 1]
      : null;
  const totalSteps = solveResult?.steps.length || 0;
  const progressPercent =
    totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
      {/* Top Header & Solve CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight flex items-center gap-1.5">
            <span>Optimal Solver</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
              Two-Phase Kociemba
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Step-by-step physical solution (&lt;22 optimal moves)
          </p>
        </div>

        <button
          onClick={handleSolve}
          disabled={!canSolve || isSolving || isAnimating}
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
              <span>Computing Solution...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>{isSolved ? 'Re-Solve' : 'Solve Cube'}</span>
            </>
          )}
        </button>
      </div>

      {/* Solution Section */}
      {solveResult && (
        <div className="flex flex-col gap-3 pt-2.5 border-t border-neutral-100">
          {solveResult.success ? (
            solveResult.steps.length === 0 ? (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>The cube is already in a fully solved state!</span>
              </div>
            ) : (
              <>
                {/* Stats, Orientation Reminder & Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200 font-semibold">
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

                {/* Physical Orientation Guide */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs">
                  <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-blue-950">Holding Position: </span>
                    <span className="text-blue-800">
                      Hold <span className="font-medium text-blue-950 underline decoration-blue-300">White face UP</span>,{' '}
                      <span className="font-medium text-blue-950 underline decoration-blue-300">Green face FRONT</span>.
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden border border-neutral-200">
                  <div
                    className="bg-neutral-900 h-full transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Active Step Card */}
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-3.5">
                    {/* Big Move Badge */}
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white border border-neutral-300 shadow-xs">
                      <span className="font-mono font-bold text-xl text-neutral-900 leading-none">
                        {currentStep ? currentStep.move : nextUpcomingStep?.move || '—'}
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        {currentStep
                          ? `Step ${currentStepIndex + 1} of ${totalSteps}`
                          : `Step 1 of ${totalSteps} (Ready to start)`}
                      </div>
                      <div className="text-xs font-semibold text-neutral-900 mt-0.5">
                        {currentStep
                          ? currentStep.text
                          : nextUpcomingStep
                          ? `Next: ${nextUpcomingStep.text}`
                          : 'Ready to solve'}
                      </div>
                      {MOVE_DESCRIPTIONS[currentStep?.move || nextUpcomingStep?.move || ''] && (
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {MOVE_DESCRIPTIONS[currentStep?.move || nextUpcomingStep?.move || '']}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500 font-mono font-medium">
                    {Math.round(progressPercent)}%
                  </div>
                </div>

                {/* Timeline Move Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-thin">
                  <button
                    onClick={resetToSolveStart}
                    disabled={isAnimating}
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
                        disabled={isAnimating}
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
                      disabled={currentStepIndex === -1 || isAnimating}
                      className="p-2 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition border border-neutral-200 shadow-2xs"
                      title="Reset to start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={stepBackward}
                      disabled={currentStepIndex === -1 || isAnimating}
                      className="p-2 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition border border-neutral-200 shadow-2xs"
                      title="Step Backward (Previous move)"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={currentStepIndex >= totalSteps - 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shadow-xs"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Auto Play</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => stepForward()}
                      disabled={currentStepIndex >= totalSteps - 1 || isAnimating}
                      className="p-2 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition border border-neutral-200 shadow-2xs"
                      title="Step Forward (Next move)"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-200">
                    <span className="text-[11px] text-neutral-400 mr-1 font-mono">Speed:</span>
                    {[
                      { label: '0.5x Slow', mult: 0.5 },
                      { label: '1x', mult: 1 },
                      { label: '2x Fast', mult: 2 },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setSpeedMultiplier(s.mult)}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded font-medium transition ${
                          speedMultiplier === s.mult
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
            <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 text-xs">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Unable to Solve Configuration</span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                {solveResult.error || 'The cube configuration has an impossible physical parity error (e.g. twisted corner or flipped edge).'}
              </p>
              <div className="text-[11px] text-amber-800">
                👉 Please check the <strong>Cube State & Parity</strong> card below to see the exact piece pinpointed and auto-fix it.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
