'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CubeColor, CubeState, Face, Move, TwistedCornerInfo } from '@/lib/cube/types';
import { COLOR_HEX, MOVE_DESCRIPTIONS, FACE_NAMES } from '@/lib/cube/constants';
import { playTurnSound, playClickSound, playCornerTwistSound } from '@/lib/audio/soundEffects';
import { ZoomIn, ZoomOut, RefreshCw, Compass, Eye, Sparkles, AlertTriangle } from 'lucide-react';

export interface AnimatingMovePayload {
  move: Move;
  id: number;
  duration?: number;
}

export interface AnimatingCornerTwistPayload {
  cornerIndex: number;
  direction: 'CW' | 'CCW';
  id: number;
  duration?: number;
}

export interface AnimatingEdgeFlipPayload {
  edgeIndex: number;
  id: number;
  duration?: number;
}

interface Cube3DProps {
  state: CubeState;
  activeColor?: CubeColor;
  onFaceletClick?: (face: Face, index: number) => void;
  animatingMove?: AnimatingMovePayload | null;
  animatingCornerTwist?: AnimatingCornerTwistPayload | null;
  animatingEdgeFlip?: AnimatingEdgeFlipPayload | null;
  onAnimationComplete?: () => void;
  hintMove?: Move | null;
  highlightCornerIndex?: number | null;
  focusCornerIndex?: number | null;
  twistedCornerInfo?: TwistedCornerInfo | null;
  onQuickFixCorner?: (cornerIndex: number, direction: 'CW' | 'CCW') => void;
}

interface FaceletMapping {
  face: Face;
  index: number;
  cubiePos: [number, number, number];
  normal: [number, number, number];
  rotation: [number, number, number];
}

export const CORNER_COORDS: [number, number, number][] = [
  [1, 1, 1], // 0: URF
  [-1, 1, 1], // 1: UFL
  [-1, 1, -1], // 2: ULB
  [1, 1, -1], // 3: UBR
  [1, -1, 1], // 4: DFR
  [-1, -1, 1], // 5: DLF
  [-1, -1, -1], // 6: DBL
  [1, -1, -1], // 7: DRB
];

export const CORNER_CAMERA_ANGLES: Record<number, { theta: number; phi: number }> = {
  0: { theta: Math.PI / 4, phi: Math.PI / 6.5 }, // URF (1, 1, 1)
  1: { theta: -Math.PI / 4, phi: Math.PI / 6.5 }, // UFL (-1, 1, 1)
  2: { theta: -3 * Math.PI / 4, phi: Math.PI / 6.5 }, // ULB (-1, 1, -1)
  3: { theta: 3 * Math.PI / 4, phi: Math.PI / 6.5 }, // UBR (1, 1, -1)
  4: { theta: Math.PI / 4, phi: -Math.PI / 6.5 }, // DFR (1, -1, 1)
  5: { theta: -Math.PI / 4, phi: -Math.PI / 6.5 }, // DLF (-1, -1, 1)
  6: { theta: -3 * Math.PI / 4, phi: -Math.PI / 6.5 }, // DBL (-1, -1, -1)
  7: { theta: 3 * Math.PI / 4, phi: -Math.PI / 6.5 }, // DRB (1, -1, -1)
};

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
  animatingCornerTwist,
  onAnimationComplete,
  hintMove,
  highlightCornerIndex,
  focusCornerIndex,
  twistedCornerInfo,
  onQuickFixCorner,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const cubieGroupsRef = useRef<THREE.Group[]>([]);
  const stickerMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const hintGroupRef = useRef<THREE.Group | null>(null);
  const cornerHighlightGroupRef = useRef<THREE.Group | null>(null);

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

  // Smooth camera orbit glide helper
  const smoothOrbitTo = useCallback(
    (targetTheta: number, targetPhi: number, targetDistance: number = 7.5, durationMs: number = 380) => {
      const startTheta = orbitAngleRef.current.theta;
      const startPhi = orbitAngleRef.current.phi;
      const startDist = orbitAngleRef.current.distance;

      // Find shortest angular path
      let dTheta = (targetTheta - startTheta) % (2 * Math.PI);
      if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
      if (dTheta < -Math.PI) dTheta += 2 * Math.PI;

      const dPhi = targetPhi - startPhi;
      const dDist = targetDistance - startDist;
      const startTime = performance.now();

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeOutCubic(progress);

        orbitAngleRef.current.theta = startTheta + dTheta * eased;
        orbitAngleRef.current.phi = startPhi + dPhi * eased;
        orbitAngleRef.current.distance = startDist + dDist * eased;
        updateCameraPosition();

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    },
    [updateCameraPosition]
  );

  // Focus Camera to corner when requested
  useEffect(() => {
    if (focusCornerIndex !== null && focusCornerIndex !== undefined) {
      const target = CORNER_CAMERA_ANGLES[focusCornerIndex];
      if (target) {
        smoothOrbitTo(target.theta, target.phi, 7.2, 420);
      }
    }
  }, [focusCornerIndex, smoothOrbitTo]);

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

    // Corner Highlight Group
    const cornerHighlightGroup = new THREE.Group();
    cornerHighlightGroupRef.current = cornerHighlightGroup;
    scene.add(cornerHighlightGroup);

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
              gridX: x,
              gridY: y,
              gridZ: z,
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

  // Highlight Twisted Corner Marker with 3D ring & locator
  useEffect(() => {
    if (!cornerHighlightGroupRef.current) return;
    const group = cornerHighlightGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (highlightCornerIndex === undefined || highlightCornerIndex === null) return;
    const coords = CORNER_COORDS[highlightCornerIndex];
    if (!coords) return;

    const [cx, cy, cz] = coords;
    const axis = new THREE.Vector3(cx, cy, cz).normalize();

    // 1. Glowing outer halo ring around the corner axis
    const torusGeo = new THREE.TorusGeometry(0.55, 0.04, 16, 32);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(cx * 1.32, cy * 1.32, cz * 1.32);
    // Align ring normal to diagonal axis
    const defaultNormal = new THREE.Vector3(0, 0, 1);
    torus.quaternion.setFromUnitVectors(defaultNormal, axis);
    group.add(torus);

    // 2. Translucent corner beacon sphere
    const sphereGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const marker = new THREE.Mesh(sphereGeo, sphereMat);
    marker.position.set(cx * 1.25, cy * 1.25, cz * 1.25);
    group.add(marker);
  }, [highlightCornerIndex]);

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

    // Create a subtle glowing ring frame on the active face
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

    if (currentAnimationIdRef.current === animatingMove.id) return;
    currentAnimationIdRef.current = animatingMove.id;

    const moveStr = animatingMove.move.trim();
    const face = moveStr[0] as Face;
    const isPrime = moveStr.includes("'");
    const isDouble = moveStr.includes('2');
    const duration = animatingMove.duration || 260;

    isAnimatingRef.current = true;
    playTurnSound();

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

    const sliceCubies = cubieGroupsRef.current.filter((c) => matchPos(c.position));
    sliceCubies.forEach((cubie) => {
      pivot.attach(cubie);
    });

    const startTime = performance.now();
    const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const animateSlice = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOut(progress);

      pivot.rotation[axis] = targetAngle * eased;

      if (progress < 1) {
        requestAnimationFrame(animateSlice);
      } else {
        pivot.rotation[axis] = targetAngle;
        pivot.updateMatrixWorld(true);

        sliceCubies.forEach((cubie) => {
          root.attach(cubie);
        });

        root.remove(pivot);

        cubieGroupsRef.current.forEach((cubie) => {
          const { gridX, gridY, gridZ } = cubie.userData;
          cubie.position.set(gridX, gridY, gridZ);
          cubie.rotation.set(0, 0, 0);
          cubie.updateMatrix();
        });

        isAnimatingRef.current = false;
        if (onAnimationComplete) onAnimationComplete();
      }
    };

    requestAnimationFrame(animateSlice);
  }, [animatingMove, onAnimationComplete]);

  // True Physical 3D Single Corner Twist Engine:
  // Realistic multi-stage physical simulation:
  // 1. Smoothly glide camera directly to the corner so human user sees it front & center
  // 2. Grip & Tension stretch: Cubie lifts outward along diagonal by 0.36 units
  // 3. Deliberate 120° physical hand rotation
  // 4. Spring snap-in into socket with tactile plastic sound
  useEffect(() => {
    if (!animatingCornerTwist || !rootGroupRef.current) return;

    if (currentAnimationIdRef.current === animatingCornerTwist.id) return;
    currentAnimationIdRef.current = animatingCornerTwist.id;

    const { cornerIndex, direction, duration = 640 } = animatingCornerTwist;
    const coords = CORNER_COORDS[cornerIndex];
    if (!coords) return;

    const [cx, cy, cz] = coords;

    // Automatically glide camera to face corner
    const camAngle = CORNER_CAMERA_ANGLES[cornerIndex];
    if (camAngle) {
      smoothOrbitTo(camAngle.theta, camAngle.phi, 7.1, 320);
    }

    isAnimatingRef.current = true;

    // Find the single target corner cubie
    const targetCubie = cubieGroupsRef.current.find(
      (c) => c.userData.gridX === cx && c.userData.gridY === cy && c.userData.gridZ === cz
    );

    if (!targetCubie) {
      isAnimatingRef.current = false;
      return;
    }

    // Diagonal outward vector from origin
    const axis = new THREE.Vector3(cx, cy, cz).normalize();
    // CW twist = -120 deg (-2pi/3), CCW twist = +120 deg (+2pi/3)
    const targetAngle = direction === 'CW' ? -(2 * Math.PI) / 3 : (2 * Math.PI) / 3;

    const root = rootGroupRef.current;
    const pivot = new THREE.Group();
    pivot.position.set(cx, cy, cz);
    root.add(pivot);

    pivot.attach(targetCubie);

    const startTime = performance.now();
    let hasPlayedTwistSound = false;

    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    const animateCorner = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (!hasPlayedTwistSound && progress > 0.05) {
        hasPlayedTwistSound = true;
        playCornerTwistSound();
      }

      let lift = 0;
      let angle = 0;

      if (progress < 0.18) {
        // Stage 1: Grip & pull outward against tension spring (0 to 0.36 units)
        const t1 = progress / 0.18;
        lift = 0.36 * easeOutQuad(t1);
        angle = 0;
      } else if (progress < 0.82) {
        // Stage 2: Deliberate tactile 120° rotation
        const t2 = (progress - 0.18) / 0.64;
        const eased2 = easeInOutCubic(t2);
        angle = targetAngle * eased2;
        // Keep lifted with slight human twisting wobble
        lift = 0.36 + Math.sin(t2 * Math.PI) * 0.04;
      } else if (progress < 0.96) {
        // Stage 3: Spring snap-back into socket
        const t3 = (progress - 0.82) / 0.14;
        lift = 0.36 * (1 - t3) * Math.cos(t3 * (Math.PI / 2));
        angle = targetAngle;
      } else {
        // Stage 4: Solidly seated
        lift = 0;
        angle = targetAngle;
      }

      // Apply 3D outward position and rotation around diagonal
      pivot.position.set(cx + axis.x * lift, cy + axis.y * lift, cz + axis.z * lift);
      pivot.setRotationFromAxisAngle(axis, angle);

      if (progress < 1) {
        requestAnimationFrame(animateCorner);
      } else {
        pivot.setRotationFromAxisAngle(axis, targetAngle);
        pivot.position.set(cx, cy, cz);
        pivot.updateMatrixWorld(true);

        root.attach(targetCubie);
        root.remove(pivot);

        targetCubie.position.set(cx, cy, cz);
        targetCubie.rotation.set(0, 0, 0);
        targetCubie.updateMatrix();

        playClickSound(); // Final crisp seat
        isAnimatingRef.current = false;

        if (onAnimationComplete) onAnimationComplete();
      }
    };

    requestAnimationFrame(animateCorner);
  }, [animatingCornerTwist, onAnimationComplete, smoothOrbitTo]);

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

    const isPureClick = distFromStart <= 6 && totalMoved <= 6 && elapsed < 400;

    if (isPureClick && !isAnimatingRef.current) {
      const hit = getRaycastHit(e.clientX, e.clientY);
      if (hit) {
        // If clicking directly on the highlighted twisted corner, trigger quick fix
        if (
          highlightCornerIndex !== null &&
          highlightCornerIndex !== undefined &&
          twistedCornerInfo &&
          onQuickFixCorner
        ) {
          const cornerCoords = CORNER_COORDS[highlightCornerIndex];
          if (
            hit.gridX === cornerCoords[0] &&
            hit.gridY === cornerCoords[1] &&
            hit.gridZ === cornerCoords[2]
          ) {
            onQuickFixCorner(twistedCornerInfo.cornerIndex, twistedCornerInfo.fixDirection);
            return;
          }
        }

        if (onFaceletClick) {
          playClickSound();
          onFaceletClick(hit.face, hit.index);
        }
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

  const getRaycastHit = (
    clientX: number,
    clientY: number
  ): { face: Face; index: number; gridX: number; gridY: number; gridZ: number } | null => {
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
        gridX: mesh.userData.gridX,
        gridY: mesh.userData.gridY,
        gridZ: mesh.userData.gridZ,
      };
    }
    return null;
  };

  const setCameraPreset = (theta: number, phi: number, distance: number = 7.6) => {
    smoothOrbitTo(theta, phi, distance, 300);
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

      {/* Floating Twisted Corner Interactive Overlay Banner in 3D Viewport */}
      {twistedCornerInfo && (
        <div className="absolute top-12 left-3 right-3 sm:right-auto flex items-center justify-between gap-2 p-2 px-3 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white border border-amber-400 backdrop-blur-md shadow-md z-10 animate-fade-in transition">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-100 shrink-0 animate-bounce" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold text-amber-100 uppercase tracking-wider">
                Twisted Corner Pinpointed
              </span>
              <span className="text-xs font-bold text-white leading-tight">
                {twistedCornerInfo.positionName} ({twistedCornerInfo.colorNames})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                const target = CORNER_CAMERA_ANGLES[twistedCornerInfo.cornerIndex];
                if (target) smoothOrbitTo(target.theta, target.phi, 7.0, 360);
              }}
              className="px-2 py-1 text-[11px] font-medium rounded bg-white/20 hover:bg-white/30 text-white transition active:scale-95 flex items-center gap-1"
              title="Focus camera directly on this piece"
            >
              <Eye className="w-3 h-3" />
              <span>Focus</span>
            </button>

            {onQuickFixCorner && (
              <button
                onClick={() => onQuickFixCorner(twistedCornerInfo.cornerIndex, twistedCornerInfo.fixDirection)}
                className="px-2.5 py-1 text-[11px] font-bold rounded bg-white text-amber-900 hover:bg-amber-50 transition active:scale-95 flex items-center gap-1 shadow-xs"
                title="Physically twist this corner cubie in 3D"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Twist & Fix</span>
              </button>
            )}
          </div>
        </div>
      )}

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

