'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CubeColor, CubeState, Face } from '@/lib/cube/types';
import { COLOR_HEX, FACE_NAMES, STANDARD_FACE_COLORS } from '@/lib/cube/constants';
import { classifyColor } from '@/lib/vision/colorDetector';
import { playClickSound, playSuccessSound } from '@/lib/audio/soundEffects';
import { Camera, X, ArrowRight, AlertCircle } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScannedState: (state: CubeState) => void;
}

const SCAN_ORDER: Face[] = ['U', 'F', 'R', 'B', 'L', 'D'];

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyScannedState,
}) => {
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [scannedFaces, setScannedFaces] = useState<Record<Face, CubeColor[]>>({
    U: Array(9).fill('white'),
    R: Array(9).fill('red'),
    F: Array(9).fill('green'),
    D: Array(9).fill('yellow'),
    L: Array(9).fill('orange'),
    B: Array(9).fill('blue'),
  });
  const [liveFaceColors, setLiveFaceColors] = useState<CubeColor[]>(Array(9).fill('white'));
  const [hasCameraError, setHasCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const currentFace = SCAN_ORDER[currentFaceIndex];

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setHasCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        startColorSampling();
      }
    } catch (e) {
      console.error('Camera access error:', e);
      setHasCameraError(true);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startColorSampling = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const sample = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const size = Math.min(canvas.width, canvas.height) * 0.55;
        const startX = (canvas.width - size) / 2;
        const startY = (canvas.height - size) / 2;
        const step = size / 3;

        const detected: CubeColor[] = [];

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const centerX = Math.floor(startX + c * step + step / 2);
            const centerY = Math.floor(startY + r * step + step / 2);

            const patch = ctx.getImageData(centerX - 3, centerY - 3, 7, 7).data;
            let avgR = 0, avgG = 0, avgB = 0;
            const pixels = patch.length / 4;

            for (let p = 0; p < patch.length; p += 4) {
              avgR += patch[p];
              avgG += patch[p + 1];
              avgB += patch[p + 2];
            }
            avgR = Math.round(avgR / pixels);
            avgG = Math.round(avgG / pixels);
            avgB = Math.round(avgB / pixels);

            const color = classifyColor(avgR, avgG, avgB);
            detected.push(color);
          }
        }

        setLiveFaceColors(detected);
      }

      animationFrameRef.current = requestAnimationFrame(sample);
    };

    sample();
  };

  const captureCurrentFace = () => {
    playClickSound();
    const updated = {
      ...scannedFaces,
      [currentFace]: [...liveFaceColors],
    };
    setScannedFaces(updated);

    if (currentFaceIndex < SCAN_ORDER.length - 1) {
      setCurrentFaceIndex(currentFaceIndex + 1);
    } else {
      playSuccessSound();
      onApplyScannedState(updated as CubeState);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-neutral-600" />
            <span className="text-sm font-semibold text-neutral-900">
              Camera Color Scanner
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

        {/* Progress Tabs */}
        <div className="grid grid-cols-6 border-b border-neutral-200 bg-neutral-50/50 text-center text-xs">
          {SCAN_ORDER.map((f, idx) => {
            const isDone = idx < currentFaceIndex;
            const isCurrent = idx === currentFaceIndex;

            return (
              <button
                key={f}
                onClick={() => setCurrentFaceIndex(idx)}
                className={`py-2 px-1 font-mono transition border-b-2 ${
                  isCurrent
                    ? 'border-neutral-900 text-neutral-900 font-semibold bg-white'
                    : isDone
                    ? 'border-neutral-400 text-neutral-600'
                    : 'border-transparent text-neutral-400'
                }`}
              >
                Face {f}
              </button>
            );
          })}
        </div>

        {/* Viewport */}
        <div className="p-4 flex flex-col items-center gap-3.5 overflow-y-auto">
          <div className="text-center">
            <span className="text-[11px] font-mono text-neutral-500 uppercase">
              Face {currentFace} ({FACE_NAMES[currentFace]})
            </span>
            <div className="text-xs text-neutral-600 mt-0.5">
              Center color is{' '}
              <strong className="text-neutral-900 capitalize">
                {STANDARD_FACE_COLORS[currentFace]}
              </strong>
            </div>
          </div>

          <div className="relative w-full max-w-[300px] aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-200 flex items-center justify-center">
            {hasCameraError ? (
              <div className="p-4 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-neutral-500" />
                <p>Camera permission required.</p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1 rounded bg-neutral-800 text-white font-medium mt-1"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* 3x3 Overlay Grid */}
                <div className="absolute inset-0 m-auto w-3/4 h-3/4 grid grid-cols-3 gap-1 pointer-events-none p-1 border border-white/80 rounded-lg">
                  {liveFaceColors.map((col, idx) => (
                    <div
                      key={idx}
                      className="border border-white/50 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: `${COLOR_HEX[col]}44`,
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full border border-black/30"
                        style={{ backgroundColor: COLOR_HEX[col] }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Detected Face Colors */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
              Detected Face Colors
            </span>
            <div className="grid grid-cols-3 gap-1 p-1.5 rounded-lg bg-neutral-100 border border-neutral-200">
              {liveFaceColors.map((col, idx) => (
                <div
                  key={idx}
                  className="w-6 h-6 rounded border border-neutral-300 flex items-center justify-center text-[9px] font-mono shadow-2xs"
                  style={{ backgroundColor: COLOR_HEX[col], color: col === 'white' || col === 'yellow' ? '#000' : '#fff' }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={() => {
              if (currentFaceIndex > 0) setCurrentFaceIndex(currentFaceIndex - 1);
            }}
            disabled={currentFaceIndex === 0}
            className="px-3 py-1.5 text-xs rounded-md bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none text-neutral-700 border border-neutral-200 transition"
          >
            Back
          </button>

          <button
            onClick={captureCurrentFace}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md font-medium text-xs bg-neutral-900 hover:bg-neutral-800 text-white transition shadow-xs"
          >
            <span>{currentFaceIndex === SCAN_ORDER.length - 1 ? 'Finish' : 'Capture Face'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
