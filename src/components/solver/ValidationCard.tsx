'use client';

import React from 'react';
import { ValidationResult, TwistedCornerInfo, FlippedEdgeInfo, CubeColor } from '@/lib/cube/types';
import { AlertCircle, Check, Wrench, RotateCw, RefreshCcw, Sparkles, Eye } from 'lucide-react';
import { COLOR_HEX } from '@/lib/cube/constants';

interface ValidationCardProps {
  validation: ValidationResult;
  isSolved: boolean;
  onFixCornerTwist?: (cornerIndex: number, direction: 'CW' | 'CCW') => void;
  onFocusCorner?: (cornerIndex: number) => void;
  onFixEdgeFlip?: (edgeIndex: number) => void;
  onFocusEdge?: (edgeIndex: number) => void;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({
  validation,
  isSolved,
  onFixCornerTwist,
  onFocusCorner,
  onFixEdgeFlip,
  onFocusEdge,
}) => {
  const { valid, errors, parityDiagnosis } = validation;

  const hasTwistParity = parityDiagnosis?.hasCornerTwistParity;
  const primaryTwistedCorner = parityDiagnosis?.primaryTwistedCorner;

  const hasEdgeParity = parityDiagnosis?.hasEdgeFlipParity;
  const primaryFlippedEdge = parityDiagnosis?.primaryFlippedEdge;

  return (
    <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-xl bg-white border border-neutral-200 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-neutral-500" />
          <span>Cube State & Parity</span>
        </span>

        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded border font-medium ${
            isSolved
              ? 'bg-neutral-100 text-neutral-800 border-neutral-200'
              : valid
              ? 'bg-neutral-100 text-neutral-800 border-neutral-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {isSolved ? 'Solved' : valid ? 'Solvable' : `${errors.length} issue${errors.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {!valid ? (
        <div className="flex flex-col gap-2 mt-0.5">
          {/* Specific Corner Twist Diagnostic & Auto-Fix Card */}
          {hasTwistParity && primaryTwistedCorner && (
            <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-amber-50/80 border border-amber-300 text-amber-950 text-xs shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <RotateCw className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Twisted Corner Pinpointed:</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 border border-amber-300 font-semibold">
                  {primaryTwistedCorner.twistAngle}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-[11px] text-amber-950 leading-relaxed bg-white/80 p-2.5 rounded-md border border-amber-200">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-950">Piece:</span>
                    <span className="font-mono font-bold text-neutral-900 bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-300">
                      {primaryTwistedCorner.positionName}
                    </span>
                    <span className="text-neutral-500 text-[10px]">({primaryTwistedCorner.colorNames})</span>
                  </div>
                  {/* Colors preview dots */}
                  <div className="flex items-center gap-1 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    {primaryTwistedCorner.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block shadow-2xs"
                        style={{ backgroundColor: COLOR_HEX[c] }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-0.5 text-neutral-700 text-[11px] leading-snug">
                  <span className="font-semibold text-neutral-900">How to fix in real life: </span>
                  {primaryTwistedCorner.fixInstruction}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-1.5 mt-0.5">
                {onFocusCorner && (
                  <button
                    type="button"
                    onClick={() => onFocusCorner(primaryTwistedCorner.cornerIndex)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 font-medium text-xs transition active:scale-95 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Show Me in 3D</span>
                  </button>
                )}

                {onFixCornerTwist && (
                  <button
                    type="button"
                    onClick={() =>
                      onFixCornerTwist(primaryTwistedCorner.cornerIndex, primaryTwistedCorner.fixDirection)
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition active:scale-95 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                    <span>Physically Twist & Fix</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Specific Edge Flip Diagnostic & Auto-Fix Card */}
          {hasEdgeParity && primaryFlippedEdge && (
            <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-orange-50/80 border border-orange-300 text-orange-950 text-xs shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-orange-900">
                  <RefreshCcw className="w-4 h-4 text-orange-700 shrink-0" />
                  <span>Flipped Edge Pinpointed:</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-200/70 text-orange-900 border border-orange-300 font-semibold">
                  Orientation Inverted
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-[11px] text-orange-950 leading-relaxed bg-white/80 p-2.5 rounded-md border border-orange-200">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-orange-950">Piece:</span>
                    <span className="font-mono font-bold text-neutral-900 bg-orange-100/60 px-1.5 py-0.5 rounded border border-orange-300">
                      {primaryFlippedEdge.positionName}
                    </span>
                    <span className="text-neutral-500 text-[10px]">({primaryFlippedEdge.colorNames})</span>
                  </div>
                  {/* Colors preview dots */}
                  <div className="flex items-center gap-1 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    {primaryFlippedEdge.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block shadow-2xs"
                        style={{ backgroundColor: COLOR_HEX[c] }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-0.5 text-neutral-700 text-[11px] leading-snug">
                  <span className="font-semibold text-neutral-900">How to fix in real life: </span>
                  {primaryFlippedEdge.fixInstruction}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-1.5 mt-0.5">
                {onFocusEdge && (
                  <button
                    type="button"
                    onClick={() => onFocusEdge(primaryFlippedEdge.edgeIndex)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 font-medium text-xs transition active:scale-95 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Show Me in 3D</span>
                  </button>
                )}

                {onFixEdgeFlip && (
                  <button
                    type="button"
                    onClick={() => onFixEdgeFlip(primaryFlippedEdge.edgeIndex)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition active:scale-95 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-200" />
                    <span>Auto-Fix This Edge</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* General non-parity errors (missing colors, centers) */}
          {errors
            .filter(
              (err) =>
                !err.toLowerCase().includes('corner twist') &&
                !err.toLowerCase().includes('edge flip')
            )
            .map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs leading-snug"
              >
                <AlertCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs">
          <Check className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
          <span>
            {isSolved
              ? 'All 6 faces are aligned.'
              : 'All 54 facelets and piece parities are valid. Ready for optimal solve.'}
          </span>
        </div>
      )}
    </div>
  );
};

