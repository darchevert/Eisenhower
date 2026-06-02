import type { QuadrantId } from '@/types';
import { QUADRANT_META } from '@/theme/quadrantThemes';

export const QUADRANT_IDS: QuadrantId[] = ['q1', 'q2', 'q3', 'q4'];

export function getQuadrantMeta(id: QuadrantId) {
  return QUADRANT_META[id];
}

export function getQuadrantLabel(id: QuadrantId): string {
  return QUADRANT_META[id].label;
}
