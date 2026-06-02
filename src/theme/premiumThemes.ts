import type { ThemeName, QuadrantAccentColors } from '@/types';

export interface PremiumTheme {
  name: ThemeName;
  label: string;
  preview: string[];
  colors: QuadrantAccentColors;
  lightBg: QuadrantAccentColors;
  darkBg: QuadrantAccentColors;
  isPremium: boolean;
}

export const PREMIUM_THEMES: PremiumTheme[] = [
  {
    name: 'default',
    label: 'Classic',
    preview: ['#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6'],
    isPremium: false,
    colors: { q1: '#EF4444', q2: '#3B82F6', q3: '#F59E0B', q4: '#8B5CF6' },
    lightBg: { q1: '#FEF2F2', q2: '#EFF6FF', q3: '#FFFBEB', q4: '#F5F3FF' },
    darkBg: { q1: '#2D1515', q2: '#0F1D3D', q3: '#2D1F00', q4: '#1E1030' },
  },
  {
    name: 'ocean',
    label: 'Ocean',
    preview: ['#06B6D4', '#0EA5E9', '#14B8A6', '#6366F1'],
    isPremium: true,
    colors: { q1: '#06B6D4', q2: '#0EA5E9', q3: '#14B8A6', q4: '#6366F1' },
    lightBg: { q1: '#ECFEFF', q2: '#F0F9FF', q3: '#F0FDFA', q4: '#EEF2FF' },
    darkBg: { q1: '#0A2330', q2: '#071B2C', q3: '#072320', q4: '#12133A' },
  },
  {
    name: 'forest',
    label: 'Forest',
    preview: ['#22C55E', '#16A34A', '#84CC16', '#78716C'],
    isPremium: true,
    colors: { q1: '#22C55E', q2: '#16A34A', q3: '#84CC16', q4: '#78716C' },
    lightBg: { q1: '#F0FDF4', q2: '#DCFCE7', q3: '#F7FEE7', q4: '#F5F5F4' },
    darkBg: { q1: '#0A2018', q2: '#062010', q3: '#151F00', q4: '#1C1A19' },
  },
  {
    name: 'sunset',
    label: 'Sunset',
    preview: ['#F43F5E', '#F97316', '#EAB308', '#A8A29E'],
    isPremium: true,
    colors: { q1: '#F43F5E', q2: '#F97316', q3: '#EAB308', q4: '#A8A29E' },
    lightBg: { q1: '#FFF1F2', q2: '#FFF7ED', q3: '#FEFCE8', q4: '#FAFAF9' },
    darkBg: { q1: '#2D0914', q2: '#2D1200', q3: '#251E00', q4: '#1C1A19' },
  },
  {
    name: 'midnight',
    label: 'Midnight',
    preview: ['#7C3AED', '#2563EB', '#DB2777', '#374151'],
    isPremium: true,
    colors: { q1: '#7C3AED', q2: '#2563EB', q3: '#DB2777', q4: '#6B7280' },
    lightBg: { q1: '#F5F3FF', q2: '#EFF6FF', q3: '#FDF2F8', q4: '#F9FAFB' },
    darkBg: { q1: '#1A0D35', q2: '#0C1A35', q3: '#2D0820', q4: '#1A1C1E' },
  },
  {
    name: 'rosegold',
    label: 'Rose Gold',
    preview: ['#E11D48', '#BE185D', '#D97706', '#A78BFA'],
    isPremium: true,
    colors: { q1: '#E11D48', q2: '#BE185D', q3: '#D97706', q4: '#A78BFA' },
    lightBg: { q1: '#FFF1F2', q2: '#FDF2F8', q3: '#FFFBEB', q4: '#F5F3FF' },
    darkBg: { q1: '#2D0814', q2: '#260A1E', q3: '#241300', q4: '#1A1030' },
  },
  {
    name: 'arctic',
    label: 'Arctic',
    preview: ['#0284C7', '#0EA5E9', '#38BDF8', '#64748B'],
    isPremium: true,
    colors: { q1: '#0284C7', q2: '#0EA5E9', q3: '#38BDF8', q4: '#64748B' },
    lightBg: { q1: '#F0F9FF', q2: '#E0F2FE', q3: '#E0F2FE', q4: '#F8FAFC' },
    darkBg: { q1: '#062030', q2: '#071B2C', q3: '#041825', q4: '#151C24' },
  },
  {
    name: 'ember',
    label: 'Ember',
    preview: ['#DC2626', '#EA580C', '#CA8A04', '#92400E'],
    isPremium: true,
    colors: { q1: '#DC2626', q2: '#EA580C', q3: '#CA8A04', q4: '#78350F' },
    lightBg: { q1: '#FEF2F2', q2: '#FFF7ED', q3: '#FEFCE8', q4: '#FEF3C7' },
    darkBg: { q1: '#2D0A0A', q2: '#2D1200', q3: '#251A00', q4: '#1C0D00' },
  },
];

export function getTheme(name: ThemeName): PremiumTheme {
  return PREMIUM_THEMES.find((t) => t.name === name) ?? PREMIUM_THEMES[0];
}
