'use client';

import React from 'react';
import { ValidationResult } from '@/lib/cube/types';
import { AlertCircle, Check } from 'lucide-react';

interface ValidationCardProps {
  validation: ValidationResult;
  isSolved: boolean;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({
  validation,
  isSolved,
}) => {
  const { valid, errors } = validation;

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-3.5 rounded-xl bg-white border border-neutral-200 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-800">
          Cube State Validation
        </span>

        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
            isSolved
              ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
              : valid
              ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
              : 'bg-neutral-50 text-neutral-600 border-neutral-200'
          }`}
        >
          {isSolved ? 'Solved' : valid ? 'Solvable' : `${errors.length} issues`}
        </span>
      </div>

      {!valid ? (
        <div className="flex flex-col gap-1.5 mt-0.5">
          {errors.map((err, i) => (
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
              : 'State and parity are valid. Ready for optimal solve.'}
          </span>
        </div>
      )}
    </div>
  );
};
