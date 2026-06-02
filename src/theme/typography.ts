import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Design reference width (iPhone 6/7/8/SE2).
 * All font sizes in the codebase are designed at this width.
 */
const BASE_WIDTH = 375;

/**
 * Moderate scale factor (0–1).
 * 0 = no scaling at all
 * 1 = fully proportional to screen width
 * 0.4 = gentle scaling (recommended for fonts)
 *
 * Effect at common widths:
 *   320px  →  −6 %   (iPhone SE 1st gen)
 *   375px  →   0 %   (iPhone 6/7/8, design base)
 *   390px  →  +2 %   (iPhone 14)
 *   414px  →  +4 %   (iPhone 6/7/8 Plus)
 *   428px  →  +6 %   (iPhone 14 Pro Max)
 */
const SCALE_FACTOR = 0.4;

/**
 * fs(size) — Font Scale
 * Scales a font size moderately based on device screen width.
 * Always returns a whole number (rounded).
 *
 * Usage:  fontSize: fs(16)
 */
export function fs(size: number): number {
  const ratio = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size + (ratio - 1) * size * SCALE_FACTOR);
}
