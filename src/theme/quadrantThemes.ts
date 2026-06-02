import type { QuadrantId } from '@/types';

export interface QuadrantMeta {
  id: QuadrantId;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: string;
  accent: string;
  lightBg: string;
  darkBg: string;
  urgentRow: boolean;
  importantCol: boolean;
}

export const QUADRANT_META: Record<QuadrantId, Omit<QuadrantMeta, 'accent' | 'lightBg' | 'darkBg'>> = {
  q1: {
    id: 'q1',
    label: 'Do First',
    shortLabel: 'Do',
    subtitle: 'Urgent · Important',
    icon: 'flash',
    urgentRow: true,
    importantCol: true,
  },
  q2: {
    id: 'q2',
    label: 'Schedule',
    shortLabel: 'Plan',
    subtitle: 'Important · Not Urgent',
    icon: 'calendar',
    urgentRow: false,
    importantCol: true,
  },
  q3: {
    id: 'q3',
    label: 'Delegate',
    shortLabel: 'Pass',
    subtitle: 'Urgent · Not Important',
    icon: 'people',
    urgentRow: true,
    importantCol: false,
  },
  q4: {
    id: 'q4',
    label: 'Eliminate',
    shortLabel: 'Drop',
    subtitle: 'Not Urgent · Not Important',
    icon: 'trash',
    urgentRow: false,
    importantCol: false,
  },
};
