'use client';

import React from 'react';
import { PRESET_PATTERNS } from '@/lib/cube/presets';
import { PresetPattern } from '@/lib/cube/types';
import { playClickSound } from '@/lib/audio/soundEffects';

interface PresetBarProps {
  onSelectPreset: (preset: PresetPattern) => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({ onSelectPreset }) => {
  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl bg-white border border-neutral-200 shadow-xs">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-semibold text-neutral-800">
          Preset Patterns & Scrambles
        </span>
        <span className="text-[11px] text-neutral-400">
          Click to load
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
        {PRESET_PATTERNS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              playClickSound();
              onSelectPreset(preset);
            }}
            className="flex flex-col items-start p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 hover:bg-neutral-100 text-left transition active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between w-full mb-0.5">
              <span className="text-xs font-medium text-neutral-800 group-hover:text-black truncate">
                {preset.name}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
              {preset.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
