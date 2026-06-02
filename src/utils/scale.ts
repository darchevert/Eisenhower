import { Dimensions, PixelRatio } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

/**
 * Reference width: iPhone 14 Pro (390pt).
 * Scale factor is clamped so small phones (320pt) get 0.85x
 * and large phones/tablets (430pt+) get at most 1.12x.
 */
const BASE_WIDTH = 390;
const ratio = Math.min(Math.max(W / BASE_WIDTH, 0.85), 1.12);

/**
 * sp() — Scale-Point
 * Use for ALL font sizes and icon sizes to make them adapt to screen width.
 * Example: sp(17) → 15 on iPhone SE, 17 on iPhone 14, 19 on iPad
 */
export function sp(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
}

/**
 * sw() — Scale-Width
 * Use for spacing/padding values that should scale with the screen.
 * Slightly more restrained than sp() — capped at 1.08x.
 */
export function sw(size: number): number {
  const widthRatio = Math.min(Math.max(W / BASE_WIDTH, 0.88), 1.08);
  return Math.round(PixelRatio.roundToNearestPixel(size * widthRatio));
}

export const Screen = {
  width: W,
  height: H,
  isSmall: W < 360,   // iPhone SE, old Android
  isMedium: W >= 360 && W < 414,
  isLarge: W >= 414,  // iPhone Plus / Pro Max / most Android
} as const;
