'use client';

import React, { useState, useEffect } from 'react';
import { Box, Volume2, VolumeX, BookOpen, Timer, Camera } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '@/lib/audio/soundEffects';

interface HeaderProps {
  activeTab: 'studio' | 'timer';
  onTabChange: (tab: 'studio' | 'timer') => void;
  onOpenCFOP: () => void;
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenCFOP,
  onOpenScanner,
}) => {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  return (
    <header className="w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center text-white shadow-xs">
            <Box className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Rubik's Studio
          </span>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
          <button
            onClick={() => {
              playClickSound();
              onTabChange('studio');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Solver & 3D</span>
          </button>
          <button
            onClick={() => {
              playClickSound();
              onTabChange('timer');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'timer'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Timer</span>
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              playClickSound();
              onOpenScanner();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs font-medium transition shadow-xs"
            title="Scan cube with webcam"
          >
            <Camera className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden md:inline">Camera</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onOpenCFOP();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs font-medium transition shadow-xs"
            title="Open CFOP Method Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden md:inline">Guide</span>
          </button>

          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-md border transition ${
              soundOn
                ? 'bg-white border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 shadow-xs'
                : 'bg-neutral-100 border-neutral-200 text-neutral-400 hover:text-neutral-600'
            }`}
            title={soundOn ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
