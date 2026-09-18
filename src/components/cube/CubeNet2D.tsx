'use client';

import React, { useState } from 'react';
import { CubeColor, CubeState, Face } from '@/lib/cube/types';
import { COLOR_HEX } from '@/lib/cube/constants';
import { playClickSound } from '@/lib/audio/soundEffects';

interface CubeNet2DProps {
  state: CubeState;
  activeColor: CubeColor;
  onPaint: (face: Face, index: number) => void;
  lockCenters?: boolean;
  onToggleLockCenters?: () => void;
  highlightFacelets?: Array<{ face: Face; index: number }>;
}

interface FaceBoxProps {
  face: Face;
  tiles: CubeColor[];
  activeColor: CubeColor;
  onPaint: (face: Face, index: number) => void;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  highlightIndices?: Set<number>;
}

const FaceBox: React.FC<FaceBoxProps> = ({
  face,
  tiles,
  onPaint,
  isDragging,
  setIsDragging,
  highlightIndices,
}) => {
  const handleTileClick = (idx: number) => {
    playClickSound();
    onPaint(face, idx);
  };

  const handlePointerEnter = (idx: number) => {
    if (isDragging) {
      playClickSound();
      onPaint(face, idx);
    }
  };

  return (
    <div className="flex flex-col items-center p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 shadow-2xs">
      <div className="flex items-center justify-between w-full mb-1 px-1">
        <span className="text-[11px] font-semibold text-neutral-600 font-mono">
          {face}
        </span>
        <span
          className="w-2 h-2 rounded-full border border-neutral-300 shadow-2xs"
          style={{ backgroundColor: COLOR_HEX[tiles[4]] }}
          title={`Center: ${tiles[4]}`}
        />
      </div>

      <div
        className="grid grid-cols-3 gap-1 p-1 bg-neutral-200/60 rounded-md border border-neutral-200 select-none touch-none"
        onPointerDown={() => setIsDragging(true)}
      >
        {tiles.map((color, idx) => {
          const isCenter = idx === 4;
          const hex = COLOR_HEX[color] || '#e5e5e5';
          const isHighlighted = highlightIndices?.has(idx);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleTileClick(idx)}
              onPointerEnter={() => handlePointerEnter(idx)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[5px] transition-all flex items-center justify-center border hover:scale-[1.05] hover:z-10 active:scale-95 shadow-xs cursor-pointer ${
                isHighlighted
                  ? 'border-amber-500 ring-2 ring-amber-400 ring-offset-1 animate-pulse z-10'
                  : 'border-black/10'
              }`}
              style={{
                backgroundColor: hex,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
              }}
              title={`Face ${face} #${idx + 1}${isCenter ? ' (Center)' : ''}${
                isHighlighted ? ' (Twisted Piece)' : ''
              }`}
            >
              {isCenter && (
                <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const CubeNet2D: React.FC<CubeNet2DProps> = ({
  state,
  activeColor,
  onPaint,
  highlightFacelets = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const getHighlightIndices = (face: Face): Set<number> => {
    const set = new Set<number>();
    highlightFacelets.forEach((hf) => {
      if (hf.face === face) set.add(hf.index);
    });
    return set;
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-white border border-neutral-200 shadow-xs relative"
      onPointerUp={() => setIsDragging(false)}
      onPointerLeave={() => setIsDragging(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-[380px] mb-2.5 px-0.5">
        <span className="text-xs font-semibold text-neutral-800">
          2D Net Editor
        </span>
        <span className="text-[11px] text-neutral-400">
          Click or drag any tile
        </span>
      </div>

      {/* 2D Unfolded Cross Layout */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Top: Up Face */}
        <div className="flex justify-center">
          <FaceBox
            face="U"
            tiles={state.U}
            activeColor={activeColor}
            onPaint={onPaint}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            highlightIndices={getHighlightIndices('U')}
          />
        </div>

        {/* Middle Row: Left, Front, Right, Back */}
        <div className="flex items-center gap-1.5">
          <FaceBox
            face="L"
            tiles={state.L}
            activeColor={activeColor}
            onPaint={onPaint}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            highlightIndices={getHighlightIndices('L')}
          />
          <FaceBox
            face="F"
            tiles={state.F}
            activeColor={activeColor}
            onPaint={onPaint}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            highlightIndices={getHighlightIndices('F')}
          />
          <FaceBox
            face="R"
            tiles={state.R}
            activeColor={activeColor}
            onPaint={onPaint}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            highlightIndices={getHighlightIndices('R')}
          />
          <FaceBox
            face="B"
            tiles={state.B}
            activeColor={activeColor}
            onPaint={onPaint}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            highlightIndices={getHighlightIndices('B')}
          />
        </div>

        {/* Bottom: Down Face */}
        <div className="flex justify-center">
          <FaceBox
            face="D"
            tiles={state.D}
            activeColor={activeColor}
            onPaint={onPaint}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            highlightIndices={getHighlightIndices('D')}
          />
        </div>
      </div>
    </div>
  );
};
