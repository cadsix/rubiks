'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateRandomScramble } from '@/lib/cube/presets';
import { playTimerBeep, playClickSound } from '@/lib/audio/soundEffects';
import { Shuffle, Trash2 } from 'lucide-react';

interface SolveRecord {
  id: string;
  timeMs: number;
  date: string;
  scramble: string;
}

export const SpeedTimer: React.FC = () => {
  const [scramble, setScramble] = useState<string>('');
  const [timeMs, setTimeMs] = useState<number>(0);
  const [timerState, setTimerState] = useState<'idle' | 'holding' | 'ready' | 'running'>('idle');
  const [solves, setSolves] = useState<SolveRecord[]>([]);

  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setScramble(generateRandomScramble(20));
    const saved = localStorage.getItem('rubiks_speed_solves');
    if (saved) {
      try {
        setSolves(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveSolve = (ms: number) => {
    const newSolve: SolveRecord = {
      id: Date.now().toString(),
      timeMs: ms,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      scramble,
    };
    const updated = [newSolve, ...solves];
    setSolves(updated);
    localStorage.setItem('rubiks_speed_solves', JSON.stringify(updated));
    setScramble(generateRandomScramble(20));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      e.preventDefault();

      if (timerState === 'running') {
        stopTimer();
      } else if (timerState === 'idle') {
        setTimerState('holding');
        holdTimeoutRef.current = setTimeout(() => {
          setTimerState('ready');
          playTimerBeep(true);
        }, 400);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();

      if (timerState === 'ready') {
        startTimer();
      } else if (timerState === 'holding') {
        if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
        setTimerState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, [timerState]);

  const startTimer = () => {
    setTimerState('running');
    startTimeRef.current = performance.now();

    const update = () => {
      const elapsed = performance.now() - startTimeRef.current;
      setTimeMs(elapsed);
      animationFrameRef.current = requestAnimationFrame(update);
    };
    animationFrameRef.current = requestAnimationFrame(update);
  };

  const stopTimer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    const finalTime = performance.now() - startTimeRef.current;
    setTimeMs(finalTime);
    setTimerState('idle');
    saveSolve(Math.round(finalTime));
    playTimerBeep(false);
  };

  const handlePointerDown = () => {
    if (timerState === 'running') {
      stopTimer();
    } else if (timerState === 'idle') {
      setTimerState('holding');
      holdTimeoutRef.current = setTimeout(() => {
        setTimerState('ready');
        playTimerBeep(true);
      }, 400);
    }
  };

  const handlePointerUp = () => {
    if (timerState === 'ready') {
      startTimer();
    } else if (timerState === 'holding') {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      setTimerState('idle');
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${hundredths.toString().padStart(2, '0')}`;
  };

  const bestTime = solves.length > 0 ? Math.min(...solves.map((s) => s.timeMs)) : null;
  const recent5 = solves.slice(0, 5);
  const ao5 =
    recent5.length === 5
      ? Math.round(
          (recent5.map((s) => s.timeMs).sort((a, b) => a - b).slice(1, 4).reduce((a, b) => a + b, 0)) / 3
        )
      : null;

  const clearHistory = () => {
    playClickSound();
    setSolves([]);
    localStorage.removeItem('rubiks_speed_solves');
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-xl bg-white border border-neutral-200 shadow-xs">
      {/* Scramble Row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-800">
            Speedcubing Timer
          </span>
          <button
            onClick={() => {
              playClickSound();
              setScramble(generateRandomScramble(20));
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition shadow-xs"
          >
            <Shuffle className="w-3.5 h-3.5 text-neutral-300" />
            <span>New Scramble</span>
          </button>
        </div>

        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-xs sm:text-sm text-neutral-800 text-center select-all">
          {scramble}
        </div>
      </div>

      {/* Big Minimalist Timer Display */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-14 rounded-xl border transition-all cursor-pointer select-none touch-none ${
          timerState === 'ready'
            ? 'bg-neutral-100 border-neutral-400'
            : timerState === 'holding'
            ? 'bg-neutral-50 border-neutral-300'
            : timerState === 'running'
            ? 'bg-neutral-50 border-neutral-300'
            : 'bg-neutral-50/70 border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <div className="font-mono text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-neutral-900">
          {formatTime(timeMs)}
        </div>

        <div className="mt-3 text-xs text-neutral-500 font-medium">
          {timerState === 'ready' ? (
            <span className="text-neutral-900 font-semibold">Release to start</span>
          ) : timerState === 'holding' ? (
            <span>Keep holding...</span>
          ) : timerState === 'running' ? (
            <span>Tap to stop</span>
          ) : (
            <span>Hold spacebar to prime</span>
          )}
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
          <span className="text-[11px] text-neutral-500 font-medium">Best</span>
          <span className="text-sm sm:text-base font-bold font-mono text-neutral-900 mt-0.5">
            {bestTime ? formatTime(bestTime) : '—'}
          </span>
        </div>

        <div className="flex flex-col items-center p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
          <span className="text-[11px] text-neutral-500 font-medium">Ao5</span>
          <span className="text-sm sm:text-base font-bold font-mono text-neutral-900 mt-0.5">
            {ao5 ? formatTime(ao5) : '—'}
          </span>
        </div>

        <div className="flex flex-col items-center p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
          <span className="text-[11px] text-neutral-500 font-medium">Solves</span>
          <span className="text-sm sm:text-base font-bold font-mono text-neutral-900 mt-0.5">
            {solves.length}
          </span>
        </div>
      </div>

      {/* History */}
      {solves.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">
              Session History
            </span>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {solves.slice(0, 10).map((record, index) => (
              <div
                key={record.id}
                className="flex flex-col p-1.5 rounded-md bg-neutral-50 border border-neutral-200 shrink-0 min-w-[75px]"
              >
                <span className="text-[10px] text-neutral-400 font-mono">#{solves.length - index}</span>
                <span className="text-xs font-mono font-medium text-neutral-800">{formatTime(record.timeMs)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
