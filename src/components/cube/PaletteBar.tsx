'use client';

import React, { useEffect } from 'react';
import { CubeColor } from '@/lib/cube/types';
import { COLOR_HEX, COLOR_NAMES, ALL_COLORS } from '@/lib/cube/constants';
import { playClickSound } from '@/lib/audio/soundEffects';
import { RotateCcw, Trash2, Shuffle } from 'lucide-react';

interface PaletteBarProps {
  activeColor: CubeColor;
  onSelectColor: (color: CubeColor) => void;
  colorCounts: Record<CubeColor, number>;
  onReset: () => void;
  onClear: () => void;
  onScramble: () => void;
}

const SHORTCUT_KEYS: Record<string, CubeColor> = {
  '1': 'white',
  '2': 'yellow',
  '3': 'green',
  '4': 'blue',
  '5': 'red',
  '6': 'orange',
};

export const PaletteBar: React.FC<PaletteBarProps> = ({
  activeColor,
  onSelectColor,
  colorCounts,
  onReset,
  onClear,
  onScramble,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const matchedColor = SHORTCUT_KEYS[e.key];
      if (matchedColor) {
        playClickSound();
        onSelectColor(matchedColor);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectColor]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-white border border-neutral-200 shadow-xs w-full">
      {/* Color Swatch Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {ALL_COLORS.map((color, index) => {
          const isSelected = activeColor === color;
          const count = colorCounts[color] || 0;
          const isExact = count === 9;
          const hex = COLOR_HEX[color];

          return (
            <button
              key={color}
              onClick={() => {
                playClickSound();
                onSelectColor(color);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-neutral-100 border border-neutral-400 shadow-xs ring-1 ring-neutral-400/40'
                  : 'bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <div
                className="w-4 h-4 rounded-sm border border-neutral-300 shrink-0 shadow-xs"
                style={{ backgroundColor: hex }}
              />
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-neutral-800">
                  {COLOR_NAMES[color]}
                </span>
                <span
                  className={`text-[11px] font-mono ${
                    isExact ? 'text-neutral-400' : 'text-neutral-600 font-semibold'
                  }`}
                >
                  {count}/9
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 self-center sm:self-auto">
        <button
          onClick={() => {
            playClickSound();
            onScramble();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition active:scale-95 shadow-xs"
          title="Random scramble"
        >
          <Shuffle className="w-3.5 h-3.5 text-neutral-300" />
          <span>Scramble</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            onReset();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-200 transition active:scale-95 shadow-xs"
          title="Reset to solved state"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
          <span>Reset</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            onClear();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 border border-neutral-200 transition active:scale-95 shadow-xs"
          title="Clear all facelets"
        >
          <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </div>
  );
};
