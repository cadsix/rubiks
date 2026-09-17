'use client';

import React from 'react';
import { Move } from '@/lib/cube/types';
import { playClickSound } from '@/lib/audio/soundEffects';

interface MoveControlsProps {
  onApplyMove: (move: Move) => void;
  disabled?: boolean;
}

const MOVE_GROUPS: { label: string; moves: Move[] }[] = [
  { label: 'U', moves: ['U', "U'", 'U2'] },
  { label: 'D', moves: ['D', "D'", 'D2'] },
  { label: 'F', moves: ['F', "F'", 'F2'] },
  { label: 'B', moves: ['B', "B'", 'B2'] },
  { label: 'L', moves: ['L', "L'", 'L2'] },
  { label: 'R', moves: ['R', "R'", 'R2'] },
];

export const MoveControls: React.FC<MoveControlsProps> = ({
  onApplyMove,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-xl bg-white border border-neutral-200 shadow-xs">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-semibold text-neutral-800">
          Manual Rotations
        </span>
        <span className="text-[11px] text-neutral-400 font-mono">
          WCA Notation
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {MOVE_GROUPS.map((group) => (
          <div
            key={group.label}
            className="flex items-center justify-between p-1 rounded-lg bg-neutral-50 border border-neutral-200"
          >
            {group.moves.map((move) => (
              <button
                key={move}
                disabled={disabled}
                onClick={() => {
                  playClickSound();
                  onApplyMove(move);
                }}
                className="flex-1 py-1 px-1 text-xs font-mono font-medium rounded text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/70 transition disabled:opacity-30 disabled:pointer-events-none active:scale-95 text-center"
              >
                {move}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
