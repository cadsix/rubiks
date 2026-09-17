'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CubeColor, CubeState, Face, Move } from '@/lib/cube/types';
import { COLOR_HEX, MOVE_DESCRIPTIONS, FACE_NAMES } from '@/lib/cube/constants';
import { playTurnSound, playClickSound } from '@/lib/audio/soundEffects';
import { ZoomIn, ZoomOut, RefreshCw, Compass } from 'lucide-react';

export interface AnimatingMovePayload {
  move: Move;
  id: number;
  duration?: number;
}

interface Cube3DProps {
  state: CubeState;
  activeColor?: CubeColor;
  onFaceletClick?: (face: Face, index: number) => void;
  animatingMove?: AnimatingMovePayload | null;
  onAnimationComplete?: () => void;
  hintMove?: Move | null;
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

// Color palette mapping
const COLOR_VALUES: Record<CubeColor, number> = {
  white: 0xffffff,
  red: 0xef4444,
  green: 0x22c55e,
  yellow: 0xeab308,
  orange: 0xf97316,
  blue: 0x3b82f6,
};

export const Cube3D: React.FC<Cube3DProps> = ({
  state,
  onFaceletClick,
  animatingMove,
  onAnimationComplete,
  hintMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const cubieGroupsRef = useRef<THREE.Group[]>([]);
  const stickerMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const hintGroupRef = useRef<THREE.Group | null>(null);

  const isDraggingRef = useRef(false);
  const prevPointerPosRef = useRef({ x: 0, y: 0 });
  const pointerStartPosRef = useRef({ x: 0, y: 0 });
  const totalDragDistRef = useRef(0);
  const pointerStartTimeRef = useRef(0);

  const autoRotateRef = useRef(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const isAnimatingRef = useRef(false);
  const currentAnimationIdRef = useRef<number | null>(null);

  const orbitAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 6.5, distance: 7.6 });

  // Update camera position helper
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, distance } = orbitAngleRef.current;
    const x = distance * Math.sin(theta) * Math.cos(phi);
    const y = distance * Math.sin(phi);
    const z = distance * Math.cos(theta) * Math.cos(phi);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 500;
    const height = containerRef.current.clientHeight || 460;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(36, width / (height || 1), 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(12, 16, 14);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight2.position.set(-12, -10, -12);
    scene.add(dirLight2);

    const rootGroup = new THREE.Group();
    rootGroupRef.current = rootGroup;
    scene.add(rootGroup);

    // Move Hint Group
    const hintGroup = new THREE.Group();
    hintGroupRef.current = hintGroup;
    scene.add(hintGroup);

    // Construct 26 cubies with speedcube black core and glossy stickers
    const cubieGeo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    const cubieMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.6,
      metalness: 0.1,
    });

    const stickerGeo = new THREE.PlaneGeometry(0.85, 0.85);
    const cubieGroups: THREE.Group[] = [];
    const stickersMap = new Map<string, THREE.Mesh>();

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;

          const cubieGroup = new THREE.Group();
          cubieGroup.position.set(x, y, z);
          cubieGroup.userData = { gridX: x, gridY: y, gridZ: z };

          // Plastic core
          const boxMesh = new THREE.Mesh(cubieGeo, cubieMat);
          cubieGroup.add(boxMesh);

          // Find matching stickers for this canonical position
          FACELET_MAP.filter((f) => f.cubiePos[0] === x && f.cubiePos[1] === y && f.cubiePos[2] === z).forEach((item) => {
            const colorName = state[item.face][item.index] || 'white';
            const colorHex = COLOR_VALUES[colorName] || 0xffffff;

            const stickerMat = new THREE.MeshStandardMaterial({
              color: colorHex,
              roughness: 0.18,
              metalness: 0.05,
              side: THREE.FrontSide,
            });

            const sticker = new THREE.Mesh(stickerGeo, stickerMat);
            sticker.position.set(
              item.normal[0] * 0.478,
              item.normal[1] * 0.478,
              item.normal[2] * 0.478
            );
            sticker.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
            sticker.userData = {
              face: item.face,
              index: item.index,
            };

            cubieGroup.add(sticker);
            stickersMap.set(`${item.face}_${item.index}`, sticker);
          });

          rootGroup.add(cubieGroup);
          cubieGroups.push(cubieGroup);
        }
      }
    }

    cubieGroupsRef.current = cubieGroups;
    stickerMeshesRef.current = stickersMap;

    // Animation Render Loop
    let animationFrameId: number;
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      if (autoRotateRef.current && !isAnimatingRef.current) {
        orbitAngleRef.current.theta += 0.004;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    renderLoop();

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
  }, [updateCameraPosition]);

  // Sync sticker colors to state when not animating
  useEffect(() => {
    if (isAnimatingRef.current || !stickerMeshesRef.current) return;

    FACELET_MAP.forEach((item) => {
      const sticker = stickerMeshesRef.current.get(`${item.face}_${item.index}`);
      if (sticker) {
        const colorName = state[item.face][item.index];
        const hex = COLOR_VALUES[colorName] || 0xffffff;
        (sticker.material as THREE.MeshStandardMaterial).color.setHex(hex);
      }
    });
  }, [state]);

  // Update Move Hint Overlay (Active face indicator)
  useEffect(() => {
    if (!hintGroupRef.current) return;
    const hintGroup = hintGroupRef.current;
    while (hintGroup.children.length > 0) {
      const obj = hintGroup.children[0];
      hintGroup.remove(obj);
    }

    if (!hintMove) return;

    const moveStr = hintMove.trim();
    const face = moveStr[0] as Face;

    // Create a subtle glowing square frame on the active face
    const frameGeo = new THREE.RingGeometry(1.35, 1.48, 32);
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);

    switch (face) {
      case 'U':
        frameMesh.position.set(0, 1.55, 0);
        frameMesh.rotation.set(-Math.PI / 2, 0, 0);
        break;
      case 'D':
        frameMesh.position.set(0, -1.55, 0);
        frameMesh.rotation.set(Math.PI / 2, 0, 0);
        break;
      case 'F':
        frameMesh.position.set(0, 0, 1.55);
        frameMesh.rotation.set(0, 0, 0);
        break;
      case 'B':
        frameMesh.position.set(0, 0, -1.55);
        frameMesh.rotation.set(0, Math.PI, 0);
        break;
      case 'L':
        frameMesh.position.set(-1.55, 0, 0);
        frameMesh.rotation.set(0, -Math.PI / 2, 0);
        break;
      case 'R':
        frameMesh.position.set(1.55, 0, 0);
        frameMesh.rotation.set(0, Math.PI / 2, 0);
        break;
    }

    hintGroup.add(frameMesh);
  }, [hintMove]);

  // Physical 3D Slice Rotation Engine
  useEffect(() => {
    if (!animatingMove || !rootGroupRef.current) return;

    // Check if this animation ID was already handled
    if (currentAnimationIdRef.current === animatingMove.id) return;
    currentAnimationIdRef.current = animatingMove.id;

    const moveStr = animatingMove.move.trim();
    const face = moveStr[0] as Face;
    const isPrime = moveStr.includes("'");
    const isDouble = moveStr.includes('2');
    const duration = animatingMove.duration || 260;

    isAnimatingRef.current = true;
    playTurnSound();

    // Determine target axis, matching slice cubies, and target rotation angle
    let axis: 'x' | 'y' | 'z' = 'y';
    let targetAngle = -Math.PI / 2;
    let matchPos = (pos: THREE.Vector3) => Math.round(pos.y) === 1;

    switch (face) {
      case 'U':
        axis = 'y';
        matchPos = (pos) => Math.round(pos.y) === 1;
        targetAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
        break;
      case 'D':
        axis = 'y';
        matchPos = (pos) => Math.round(pos.y) === -1;
        targetAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
        break;
      case 'F':
        axis = 'z';
        matchPos = (pos) => Math.round(pos.z) === 1;
        targetAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
        break;
      case 'B':
        axis = 'z';
        matchPos = (pos) => Math.round(pos.z) === -1;
        targetAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
        break;
      case 'R':
        axis = 'x';
        matchPos = (pos) => Math.round(pos.x) === 1;
        targetAngle = isDouble ? -Math.PI : isPrime ? Math.PI / 2 : -Math.PI / 2;
        break;
      case 'L':
        axis = 'x';
        matchPos = (pos) => Math.round(pos.x) === -1;
        targetAngle = isDouble ? Math.PI : isPrime ? -Math.PI / 2 : Math.PI / 2;
        break;
    }

    const root = rootGroupRef.current;
    const pivot = new THREE.Group();
    root.add(pivot);

    // Filter the 9 cubies for this face slice
    const sliceCubies = cubieGroupsRef.current.filter((c) => matchPos(c.position));

    sliceCubies.forEach((cubie) => {
      pivot.attach(cubie);
    });

    const startTime = performance.now();

    // Smooth ease-in-out cubic curve
    const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const animateSlice = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOut(progress);

      pivot.rotation[axis] = targetAngle * eased;

      if (progress < 1) {
        requestAnimationFrame(animateSlice);
      } else {
        // Complete physical slice rotation
        pivot.rotation[axis] = targetAngle;
        pivot.updateMatrixWorld(true);

        // Detach cubies back to root
        sliceCubies.forEach((cubie) => {
          root.attach(cubie);
        });

        root.remove(pivot);

        // Reset all 26 cubies to pristine canonical positions/orientations
        // and let state update repaint them with exact colors
        cubieGroupsRef.current.forEach((cubie) => {
          const { gridX, gridY, gridZ } = cubie.userData;
          cubie.position.set(gridX, gridY, gridZ);
          cubie.rotation.set(0, 0, 0);
          cubie.updateMatrix();
        });

        isAnimatingRef.current = false;

        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };

    requestAnimationFrame(animateSlice);
  }, [animatingMove, onAnimationComplete]);

  // Pointer drag & click handling
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
    orbitAngleRef.current.phi = Math.max(
      -Math.PI / 2.3,
      Math.min(Math.PI / 2.3, orbitAngleRef.current.phi + deltaY * 0.008)
    );

    updateCameraPosition();
    prevPointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const distFromStart = Math.hypot(
      e.clientX - pointerStartPosRef.current.x,
      e.clientY - pointerStartPosRef.current.y
    );
    const totalMoved = totalDragDistRef.current;
    const elapsed = Date.now() - pointerStartTimeRef.current;

    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    // Pure click criteria (not an orbit drag)
    const isPureClick = distFromStart <= 6 && totalMoved <= 6 && elapsed < 400;

    if (isPureClick && !isAnimatingRef.current) {
      const hit = getRaycastHit(e.clientX, e.clientY);
      if (hit && onFaceletClick) {
        playClickSound();
        onFaceletClick(hit.face, hit.index);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    orbitAngleRef.current.distance = Math.max(
      4.5,
      Math.min(14, orbitAngleRef.current.distance + e.deltaY * 0.005)
    );
    updateCameraPosition();
  };

  const getRaycastHit = (clientX: number, clientY: number): { face: Face; index: number } | null => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const stickerMeshes = Array.from(stickerMeshesRef.current.values());
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

  const setCameraPreset = (theta: number, phi: number, distance: number = 7.6) => {
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
          onClick={() => setCameraPreset(Math.PI / 4, Math.PI / 6.5)}
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

      {/* Active Move Hint Tag */}
      {hintMove && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/90 text-white border border-neutral-800 backdrop-blur-md shadow-md z-10 animate-fade-in">
          <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono text-neutral-400 leading-none">Turn Hint</span>
            <span className="text-xs font-bold font-mono text-white mt-0.5">{hintMove}</span>
          </div>
        </div>
      )}

      {/* Zoom & Auto-Rotate Controls */}
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

      {/* Helper Footer Hint */}
      <div className="absolute bottom-2.5 left-3 text-[11px] text-neutral-400 font-mono pointer-events-none z-10">
        Orbit: drag | Paint: click tile
      </div>
    </div>
  );
};
