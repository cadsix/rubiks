'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CubeState, Move } from '@/lib/cube/types';
import { solveCubeState, SolveResult } from '@/lib/solver/kociemba';
import { applyMove, invertMove } from '@/lib/cube/state';
import { MOVE_DESCRIPTIONS, FACE_NAMES } from '@/lib/cube/constants';
import { playSuccessSound, playClickSound, playTurnSound } from '@/lib/audio/soundEffects';
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
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Keyboard,
} from 'lucide-react';

interface SolutionPlayerProps {
  currentState: CubeState;
  onStateChange: (state: CubeState) => void;
  onAnimateMove: (move: Move, onComplete?: () => void, duration?: number) => void;
  canSolve: boolean;
  isSolved: boolean;
  isAnimating: boolean;
  onHintMoveChange?: (move: Move | null) => void;
  autoSolveTrigger?: number;
}

export const SolutionPlayer: React.FC<SolutionPlayerProps> = ({
  currentState,
  onStateChange,
  onAnimateMove,
  canSolve,
  isSolved,
  isAnimating,
  onHintMoveChange,
  autoSolveTrigger,
}) => {
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.5); // Default to human follow-along speed (0.5x)
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
    if (speedMultiplier === 0.5) return 450; // Smooth leisurely rotation
    if (speedMultiplier === 1) return 300;
    return 180;
  }, [speedMultiplier]);

  const handleSolve = useCallback(async () => {
    if (!canSolve || isSolving) return;
    setIsSolving(true);
    setIsPlaying(false);

    try {
      const result = await solveCubeState(currentStateRef.current);
      setSolveResult(result);
      setSavedInitialState(currentStateRef.current);
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
  }, [canSolve, isSolving]);

  // Trigger solve from external action (e.g. top bar)
  useEffect(() => {
    if (autoSolveTrigger && autoSolveTrigger > 0) {
      handleSolve();
    }
  }, [autoSolveTrigger, handleSolve]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 65,
      spread: 75,
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

  // Synchronized Auto-Playback Loop (pacing designed for humans to follow)
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
          // Leisurely pause between moves so the user can easily observe
          const pauseBetweenMoves = speedMultiplier === 0.5 ? 1200 : speedMultiplier === 1 ? 500 : 200;
          timeoutId = setTimeout(runNext, pauseBetweenMoves);
        }
      });
    };

    runNext();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isPlaying, stepForward, speedMultiplier]);

  // Keyboard navigation (Space or ArrowRight for next step, ArrowLeft for previous step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!solveResult || !solveResult.success || solveResult.steps.length === 0) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (!isAnimating && currentStepIndex < solveResult.steps.length - 1) {
          stepForward();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isAnimating && currentStepIndex >= 0) {
          stepBackward();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [solveResult, isAnimating, currentStepIndex, stepForward, stepBackward]);

  // Keep 3D hint overlay in sync with the upcoming/current move
  useEffect(() => {
    if (!onHintMoveChange) return;
    if (!solveResult || !solveResult.success || solveResult.steps.length === 0) {
      onHintMoveChange(null);
      return;
    }

    const nextIdx = currentStepIndex + 1;
    if (nextIdx < solveResult.steps.length) {
      onHintMoveChange(solveResult.steps[nextIdx].move);
    } else {
      onHintMoveChange(null);
    }
  }, [solveResult, currentStepIndex, onHintMoveChange]);

  const copySolution = () => {
    if (!solveResult?.solution) return;
    navigator.clipboard.writeText(solveResult.solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalSteps = solveResult?.steps.length || 0;
  const isAtEnd = currentStepIndex >= totalSteps - 1;
  const nextStepToExecute =
    solveResult && currentStepIndex + 1 < totalSteps
      ? solveResult.steps[currentStepIndex + 1]
      : null;
  const justFinishedStep =
    solveResult && currentStepIndex >= 0 ? solveResult.steps[currentStepIndex] : null;
  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
      {/* Top Header & Solve CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-neutral-700" />
            <span>Step-by-Step Solver Guide</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Follow along on your physical cube step-by-step
          </p>
        </div>

        <button
          onClick={handleSolve}
          disabled={!canSolve || isSolving || isAnimating}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-xs tracking-wide transition-all shadow-xs ${
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
              <span>Computing Moves...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>{isSolved ? 'Re-Solve' : 'Generate Step Solution'}</span>
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
                <span>The cube is already in a fully solved configuration!</span>
              </div>
            ) : (
              <>
                {/* Stats & Holding Guide */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200 font-semibold">
                      {solveResult.moveCount} total steps
                    </span>
                    <span className="font-mono text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                      Optimal Kociemba
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
                        <span>Copy Algorithm</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Permanent Physical Holding Guide */}
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-950 text-xs">
                  <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="flex-1 leading-snug">
                    <span className="font-semibold text-blue-900">How to Hold Your Cube: </span>
                    <span className="text-blue-950">
                      Hold <span className="font-semibold underline decoration-blue-400">White face on Top</span>,{' '}
                      <span className="font-semibold underline decoration-blue-400">Green face on Front</span>.
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200">
                  <div
                    className="bg-neutral-900 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Big Step Action Guide Card */}
                {!isAtEnd && nextStepToExecute ? (
                  <div className="flex flex-col gap-3 p-4 rounded-xl bg-neutral-50 border-2 border-neutral-300/80 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-500">
                        <span>Current Instruction:</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-800 font-semibold">
                          Step {currentStepIndex + 2} of {totalSteps}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-neutral-400">
                        {Math.round(progressPercent)}% done
                      </span>
                    </div>

                    {/* Move Description & Big Callout */}
                    <div className="flex items-center gap-4 bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
                      {/* Big Move Badge */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-neutral-900 text-white font-mono font-bold text-2xl shadow-sm shrink-0">
                        {nextStepToExecute.move}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-900 leading-snug">
                          {nextStepToExecute.text}
                        </span>
                        <span className="text-xs text-neutral-500 mt-0.5">
                          {MOVE_DESCRIPTIONS[nextStepToExecute.move] || `Rotate ${nextStepToExecute.face} face`}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Follow-Along Step CTA */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={stepBackward}
                        disabled={currentStepIndex === -1 || isAnimating}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 font-medium text-xs disabled:opacity-30 disabled:pointer-events-none transition border border-neutral-200 shadow-2xs"
                        title="Go back to previous move (Left Arrow)"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <button
                        onClick={() => stepForward()}
                        disabled={isAnimating}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition active:scale-[0.98] shadow-sm cursor-pointer"
                        title="Perform this turn and advance (Spacebar or Right Arrow)"
                      >
                        <span>Done! Next Step ({nextStepToExecute.move})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono px-0.5">
                      <span className="flex items-center gap-1">
                        <Keyboard className="w-3 h-3 text-neutral-400" />
                        <span>Tip: Press <kbd className="bg-white px-1 py-0.5 rounded border border-neutral-200 text-neutral-700">Space</kbd> or <kbd className="bg-white px-1 py-0.5 rounded border border-neutral-200 text-neutral-700">→</kbd> to step</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Solved Completion Card */
                  <div className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-emerald-950">Cube Fully Solved!</span>
                    <span className="text-xs text-emerald-800">
                      All {totalSteps} optimal moves executed successfully.
                    </span>
                    <button
                      onClick={resetToSolveStart}
                      className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-medium transition shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Review from Step 1</span>
                    </button>
                  </div>
                )}

                {/* Timeline Move Chips */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono px-0.5">
                    <span>Move Timeline</span>
                    <span>Click any step to jump</span>
                  </div>

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
                      const isNext = currentStepIndex + 1 === idx;
                      const isPassed = currentStepIndex > idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => jumpToStep(idx)}
                          disabled={isAnimating}
                          className={`px-2.5 py-1 text-xs font-mono font-medium rounded shrink-0 border transition ${
                            isActive
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs font-bold'
                              : isNext
                              ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold ring-1 ring-blue-300'
                              : isPassed
                              ? 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200/70'
                              : 'bg-white border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50'
                          }`}
                          title={`Step ${idx + 1}: ${step.text}`}
                        >
                          {step.move}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Auto-Play Bar (Human-Paced) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={isAtEnd}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-xs disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Auto-Play</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Auto-Play (Demonstration)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={resetToSolveStart}
                      disabled={currentStepIndex === -1 || isAnimating}
                      className="p-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-600 disabled:opacity-30 disabled:pointer-events-none transition border border-neutral-200 shadow-2xs"
                      title="Reset to start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-200">
                    <span className="text-[11px] text-neutral-400 mr-1 font-mono">Pace:</span>
                    {[
                      { label: 'Follow-Along (Slow)', mult: 0.5 },
                      { label: 'Normal', mult: 1 },
                      { label: 'Fast', mult: 2 },
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
                {solveResult.error ||
                  'The cube configuration has an impossible physical parity error (e.g. twisted corner or flipped edge).'}
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
