import { CubeColor } from '../cube/types';

export interface HSV {
  h: number; // 0 to 360
  s: number; // 0 to 1
  v: number; // 0 to 1
}

export function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, v };
}

export function classifyColor(r: number, g: number, b: number): CubeColor {
  const { h, s, v } = rgbToHsv(r, g, b);

  // White detection: Low saturation, reasonable brightness
  if (s < 0.22 && v > 0.35) {
    return 'white';
  }

  // Very dark/black fallback
  if (v < 0.2) {
    return 'blue';
  }

  // Yellow
  if (h >= 42 && h < 75) {
    return 'yellow';
  }

  // Green
  if (h >= 75 && h < 165) {
    return 'green';
  }

  // Blue
  if (h >= 165 && h < 265) {
    return 'blue';
  }

  // Orange vs Red
  if (h >= 12 && h < 42) {
    return 'orange';
  }

  // Red (wraps around 360 and 0)
  if (h >= 340 || h < 12) {
    // If low saturation/brightness slightly towards orange
    if (h >= 8 && s < 0.85) return 'orange';
    return 'red';
  }

  // Default fallback based on closest color
  return 'white';
}
