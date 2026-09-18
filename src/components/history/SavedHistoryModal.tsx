'use client';

import React, { useState, useEffect } from 'react';
import { CubeState, CubeColor } from '@/lib/cube/types';
import { COLOR_HEX } from '@/lib/cube/constants';
import {
  SavedCubeEntry,
  getSavedHistory,
  saveStateToHistory,
  deleteHistoryEntry,
  clearAllHistory,
} from '@/lib/storage/cubeStorage';
import { playClickSound } from '@/lib/audio/soundEffects';
import {
  X,
  History,
  BookmarkPlus,
  Trash2,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface SavedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: CubeState;
  onLoadState: (state: CubeState) => void;
}

export const SavedHistoryModal: React.FC<SavedHistoryModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onLoadState,
}) => {
  const [history, setHistory] = useState<SavedCubeEntry[]>([]);
  const [customName, setCustomName] = useState('');
  const [savedJustNow, setSavedJustNow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHistory(getSavedHistory());
      setSavedJustNow(false);
      setCustomName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    const entry = saveStateToHistory(currentState, customName.trim() || undefined);
    setHistory(getSavedHistory());
    setCustomName('');
    setSavedJustNow(true);
    setTimeout(() => setSavedJustNow(false), 2000);
  };

  const handleLoad = (entry: SavedCubeEntry) => {
    playClickSound();
    onLoadState(entry.state);
    onClose();
  };

  const handleDelete = (id: string) => {
    playClickSound();
    const updated = deleteHistoryEntry(id);
    setHistory(updated);
  };

  const handleClearAll = () => {
    playClickSound();
    clearAllHistory();
    setHistory([]);
  };

  const formatTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Mini 6-face color grid preview
  const MiniCubePreview = ({ state }: { state: CubeState }) => {
    const faces = ['U', 'L', 'F', 'R', 'B', 'D'] as const;
    return (
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded border border-neutral-200 shrink-0">
        {faces.map((f) => (
          <div
            key={f}
            className="w-2.5 h-2.5 rounded-[2px] border border-black/20"
            style={{ backgroundColor: COLOR_HEX[state[f]?.[4] || 'white'] }}
            title={`${f} face center`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 leading-none">
                Saved Cubes & History
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                Persistent local cache of your cube configurations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Save Current State Form */}
          <form
            onSubmit={handleSaveCurrent}
            className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200"
          >
            <input
              type="text"
              placeholder="Name this configuration (e.g. My Scramble)..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-400 transition"
            />

            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition active:scale-95 shrink-0 shadow-xs"
            >
              {savedJustNow ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Save Snapshot</span>
                </>
              )}
            </button>
          </form>

          {/* History List */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-neutral-500 px-0.5">
              <span>Saved Configurations ({history.length})</span>
              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[11px] text-red-500 hover:text-red-700 transition"
                >
                  Clear all
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-neutral-400 text-xs flex flex-col items-center gap-1.5">
                <Clock className="w-6 h-6 text-neutral-300" />
                <span>No saved cubes in history yet.</span>
                <span className="text-[11px] text-neutral-400">
                  Save your current scramble above to reload it anytime!
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-0.5 scrollbar-thin">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 transition shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MiniCubePreview state={entry.state} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-neutral-900 truncate">
                          {entry.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                          <span>{formatTime(entry.timestamp)}</span>
                          <span>•</span>
                          <span>{entry.isSolved ? 'Solved state' : 'Custom configuration'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleLoad(entry)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white text-xs font-medium transition active:scale-95 border border-neutral-200"
                        title="Load this cube into the 3D studio"
                      >
                        <span>Load</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Automatically backed up to your browser cache</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
