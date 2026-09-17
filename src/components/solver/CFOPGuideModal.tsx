'use client';

import React, { useState } from 'react';
import { CFOP_STEPS } from '@/lib/solver/cfopGuide';
import { BookOpen, Copy, Check, X } from 'lucide-react';
import { playClickSound } from '@/lib/audio/soundEffects';

interface CFOPGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAlgorithm?: (alg: string) => void;
}

export const CFOPGuideModal: React.FC<CFOPGuideModalProps> = ({
  isOpen,
  onClose,
  onApplyAlgorithm,
}) => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [copiedAlg, setCopiedAlg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStep = CFOP_STEPS[activeStage];

  const handleCopy = (alg: string) => {
    navigator.clipboard.writeText(alg);
    setCopiedAlg(alg);
    setTimeout(() => setCopiedAlg(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neutral-600" />
            <span className="text-sm font-semibold text-neutral-900">
              CFOP (Fridrich) Method Guide
            </span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stage Tabs */}
        <div className="grid grid-cols-4 border-b border-neutral-200 bg-neutral-50/50">
          {CFOP_STEPS.map((step, idx) => (
            <button
              key={step.stage}
              onClick={() => {
                playClickSound();
                setActiveStage(idx);
              }}
              className={`py-2 px-2 text-center text-xs font-medium transition border-b-2 ${
                activeStage === idx
                  ? 'border-neutral-900 text-neutral-900 bg-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <div className="text-[10px] text-neutral-400 font-mono">Step {idx + 1}</div>
              <div className="truncate">{step.stage.toUpperCase()}</div>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          <div>
            <span className="text-[11px] font-mono text-neutral-500">
              {currentStep.subtitle}
            </span>
            <h4 className="text-sm font-semibold text-neutral-900 mt-0.5">
              {currentStep.title}
            </h4>
            <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs leading-relaxed">
            <strong className="text-neutral-900">Tip: </strong>
            {currentStep.tip}
          </div>

          <div>
            <span className="text-[11px] font-medium text-neutral-700 block mb-1.5">
              Algorithms
            </span>
            <div className="space-y-1.5">
              {currentStep.sampleAlgs.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-neutral-900">
                      {item.name}
                    </span>
                    <code className="text-xs font-mono text-neutral-600 mt-0.5">
                      {item.alg}
                    </code>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(item.alg)}
                      className="p-1.5 rounded bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200 transition shadow-2xs"
                      title="Copy notation"
                    >
                      {copiedAlg === item.alg ? (
                        <Check className="w-3.5 h-3.5 text-neutral-800" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onApplyAlgorithm && (
                      <button
                        onClick={() => {
                          playClickSound();
                          onApplyAlgorithm(item.alg);
                          onClose();
                        }}
                        className="px-2 py-1 rounded text-xs bg-neutral-900 hover:bg-neutral-800 text-white font-medium transition shadow-2xs"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
          <span>{activeStage + 1} / 4</span>
          <div className="flex gap-1.5">
            <button
              disabled={activeStage === 0}
              onClick={() => {
                playClickSound();
                setActiveStage(activeStage - 1);
              }}
              className="px-2.5 py-1 rounded bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none text-neutral-700 border border-neutral-200 transition"
            >
              Previous
            </button>
            <button
              disabled={activeStage === CFOP_STEPS.length - 1}
              onClick={() => {
                playClickSound();
                setActiveStage(activeStage + 1);
              }}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none text-white font-medium transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
