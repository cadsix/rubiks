'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CubeColor, CubeState, Face, Move } from '@/lib/cube/types';
import { COLOR_HEX } from '@/lib/cube/constants';
import { playTurnSound, playClickSound } from '@/lib/audio/soundEffects';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface Cube3DProps {
  state: CubeState;
  activeColor?: CubeColor;
  onFaceletClick?: (face: Face, index: number) => void;
  animatingMove?: Move | null;
  onAnimationComplete?: () => void;
  animationSpeed?: number;
}

interface FaceletMapping {
  face: Face;
  index: number;
  cubiePos: [number, number, number];
  normal: [number, number, number];
  rotation: [number, number, number];
}

const FACELET_MAP: FaceletMapping[] = [];

// U Face (y = 1)
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const idx = r * 3 + c;
    const x = c - 1;
    const z = r - 1;
    FACELET_MAP.push({
      face: 'U',
      index: idx,
      cubiePos: [x, 1, z],
      normal: [0, 1, 0],
      rotation: [-Math.PI / 2, 0, 0],
    });
  }
}

// D Face (y = -1)
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const idx = r * 3 + c;
    const x = c - 1;
    const z = 1 - r;
    FACELET_MAP.push({
      face: 'D',
      index: idx,
      cubiePos: [x, -1, z],
      normal: [0, -1, 0],
      rotation: [Math.PI / 2, 0, 0],
    });
  }
}

// F Face (z = 1)
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const idx = r * 3 + c;
    const x = c - 1;
    const y = 1 - r;
    FACELET_MAP.push({
      face: 'F',
      index: idx,
      cubiePos: [x, y, 1],
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
    });
  }
}

// B Face (z = -1)
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const idx = r * 3 + c;
    const x = 1 - c;
    const y = 1 - r;
    FACELET_MAP.push({
      face: 'B',
      index: idx,
      cubiePos: [x, y, -1],
      normal: [0, 0, -1],
      rotation: [0, Math.PI, 0],
    });
  }
}

// L Face (x = -1)
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const idx = r * 3 + c;
    const z = c - 1;
    const y = 1 - r;
    FACELET_MAP.push({
      face: 'L',
      index: idx,
      cubiePos: [-1, y, z],
      normal: [-1, 0, 0],
      rotation: [0, -Math.PI / 2, 0],
    });
  }
}

// R Face (x = 1)
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const idx = r * 3 + c;
    const z = 1 - c;
    const y = 1 - r;
    FACELET_MAP.push({
      face: 'R',
      index: idx,
      cubiePos: [1, y, z],
      normal: [1, 0, 0],
      rotation: [0, Math.PI / 2, 0],
    });
  }
}

export const Cube3D: React.FC<Cube3DProps> = ({
  state,
  onFaceletClick,
  animatingMove,
  onAnimationComplete,
  animationSpeed = 250,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const stickersRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const isDraggingRef = useRef(false);
  const prevPointerPosRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(false);
  const [autoRotate, setAutoRotate] = useState(false);

  const orbitAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 6, distance: 7.5 });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 500;
    const height = containerRef.current.clientHeight || 460;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / (height || 1), 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Studio lighting for clean product look
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(10, 15, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight2.position.set(-10, -8, -10);
    scene.add(dirLight2);

    const rootGroup = new THREE.Group();
    rootGroupRef.current = rootGroup;
    scene.add(rootGroup);

    // 26 cubies with matte dark frame
    const cubieGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const cubieMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.35,
      metalness: 0.1,
    });

    const stickerGeo = new THREE.PlaneGeometry(0.86, 0.86);
    const stickers = new Map<string, THREE.Mesh>();

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;

          const cubie = new THREE.Mesh(cubieGeo, cubieMat);
          cubie.position.set(x, y, z);
          rootGroup.add(cubie);
        }
      }
    }

    FACELET_MAP.forEach((item) => {
      const colorHex = COLOR_HEX[state[item.face][item.index]] || '#ffffff';
      const stickerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.2,
        metalness: 0.05,
        side: THREE.FrontSide,
      });

      const sticker = new THREE.Mesh(stickerGeo, stickerMat);
      sticker.position.set(
        item.cubiePos[0] + item.normal[0] * 0.485,
        item.cubiePos[1] + item.normal[1] * 0.485,
        item.cubiePos[2] + item.normal[2] * 0.485
      );
      sticker.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
      sticker.userData = {
        face: item.face,
        index: item.index,
      };

      rootGroup.add(sticker);
      stickers.set(`${item.face}_${item.index}`, sticker);
    });
    stickersRef.current = stickers;

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotateRef.current) {
        orbitAngleRef.current.theta += 0.005;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();

    const updateSize = (w: number, h: number) => {
      if (!cameraRef.current || !rendererRef.current) return;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      updateSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          updateSize(w, h);
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
        if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, distance } = orbitAngleRef.current;
    const x = distance * Math.sin(theta) * Math.cos(phi);
    const y = distance * Math.sin(phi);
    const z = distance * Math.cos(theta) * Math.cos(phi);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  };

  useEffect(() => {
    if (!stickersRef.current) return;

    FACELET_MAP.forEach((item) => {
      const sticker = stickersRef.current.get(`${item.face}_${item.index}`);
      if (sticker) {
        const color = state[item.face][item.index];
        const hex = COLOR_HEX[color] || '#ffffff';
        (sticker.material as THREE.MeshStandardMaterial).color.set(hex);
      }
    });
  }, [state]);

  useEffect(() => {
    if (!animatingMove) return;
    playTurnSound();

    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, animationSpeed);

    return () => clearTimeout(timer);
  }, [animatingMove, animationSpeed, onAnimationComplete]);

  const pointerStartPosRef = useRef({ x: 0, y: 0 });
  const totalDragDistRef = useRef(0);
  const pointerStartTimeRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    prevPointerPosRef.current = { x: e.clientX, y: e.clientY };
    totalDragDistRef.current = 0;
    pointerStartTimeRef.current = Date.now();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - prevPointerPosRef.current.x;
    const deltaY = e.clientY - prevPointerPosRef.current.y;
    totalDragDistRef.current += Math.hypot(deltaX, deltaY);

    orbitAngleRef.current.theta -= deltaX * 0.008;
    orbitAngleRef.current.phi = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, orbitAngleRef.current.phi + deltaY * 0.008));

    updateCameraPosition();
    prevPointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const distFromStart = Math.hypot(e.clientX - pointerStartPosRef.current.x, e.clientY - pointerStartPosRef.current.y);
    const totalMoved = totalDragDistRef.current;
    const elapsed = Date.now() - pointerStartTimeRef.current;

    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    // Only register as click if pointer barely moved (pure tap)
    const isPureClick = distFromStart <= 5 && totalMoved <= 5 && elapsed < 400;

    if (isPureClick) {
      const hit = getRaycastHit(e.clientX, e.clientY);
      if (hit && onFaceletClick) {
        playClickSound();
        onFaceletClick(hit.face, hit.index);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    orbitAngleRef.current.distance = Math.max(4.5, Math.min(14, orbitAngleRef.current.distance + e.deltaY * 0.005));
    updateCameraPosition();
  };

  const getRaycastHit = (clientX: number, clientY: number): { face: Face; index: number } | null => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const stickerMeshes = Array.from(stickersRef.current.values());
    const intersects = raycaster.intersectObjects(stickerMeshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      return {
        face: mesh.userData.face,
        index: mesh.userData.index,
      };
    }
    return null;
  };

  const setCameraPreset = (theta: number, phi: number, distance: number = 7.5) => {
    orbitAngleRef.current = { theta, phi, distance };
    updateCameraPosition();
  };

  const toggleAutoRotate = () => {
    autoRotateRef.current = !autoRotateRef.current;
    setAutoRotate(autoRotateRef.current);
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] lg:h-[490px] flex items-center justify-center select-none overflow-hidden rounded-xl bg-white border border-neutral-200 shadow-xs">
      {/* ThreeJS Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none bg-radial from-neutral-100 to-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Camera View Presets */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
        <button
          onClick={() => setCameraPreset(Math.PI / 4, Math.PI / 6)}
          className="px-2 py-1 text-xs font-medium rounded-md bg-white/90 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-200 transition shadow-xs backdrop-blur-xs"
        >
          Isometric
        </button>
        <button
          onClick={() => setCameraPreset(0, 0)}
          className="px-2 py-1 text-xs font-medium rounded-md bg-white/90 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-200 transition shadow-xs backdrop-blur-xs"
        >
          Front
        </button>
        <button
          onClick={() => setCameraPreset(Math.PI, 0)}
          className="px-2 py-1 text-xs font-medium rounded-md bg-white/90 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-200 transition shadow-xs backdrop-blur-xs"
        >
          Back
        </button>
        <button
          onClick={() => setCameraPreset(0, Math.PI / 2.3)}
          className="px-2 py-1 text-xs font-medium rounded-md bg-white/90 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-200 transition shadow-xs backdrop-blur-xs"
        >
          Top
        </button>
      </div>

      {/* Zoom & Auto-Rotate */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        <button
          onClick={toggleAutoRotate}
          className={`p-1.5 rounded-md border transition backdrop-blur-xs shadow-xs ${
            autoRotate
              ? 'bg-neutral-900 border-neutral-900 text-white'
              : 'bg-white/90 border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
          title={autoRotate ? 'Stop rotation' : 'Auto rotate'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => {
            orbitAngleRef.current.distance = Math.max(4.5, orbitAngleRef.current.distance - 0.8);
            updateCameraPosition();
          }}
          className="p-1.5 rounded-md bg-white/90 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 border border-neutral-200 transition backdrop-blur-xs shadow-xs"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            orbitAngleRef.current.distance = Math.min(14, orbitAngleRef.current.distance + 0.8);
            updateCameraPosition();
          }}
          className="p-1.5 rounded-md bg-white/90 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 border border-neutral-200 transition backdrop-blur-xs shadow-xs"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Hint */}
      <div className="absolute bottom-2.5 left-3 text-[11px] text-neutral-400 font-mono pointer-events-none z-10">
        Orbit: drag | Paint: click tile
      </div>
    </div>
  );
};
