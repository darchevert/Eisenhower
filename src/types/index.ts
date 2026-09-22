export type QuadrantId = 'q1' | 'q2' | 'q3' | 'q4';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: QuadrantId;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
  matrixId: string;
  order: number;
  tags?: string[];
  recurrence?: RecurrenceType;
}

export interface Matrix {
  id: string;
  name: string;
  icon: string;
  createdAt: number;
}

export type ThemeName =
  | 'default'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'midnight'
  | 'rosegold'
  | 'arctic'
  | 'ember';

export interface QuadrantAccentColors {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

export interface WeeklyStats {
  date: string;
  count: number;
}

export interface AppStats {
  totalCompleted: number;
  completedThisWeek: number;
  completedByQuadrant: Record<QuadrantId, number>;
  activeByQuadrant: Record<QuadrantId, number>;
  streakDays: number;
  dailyCompletions: WeeklyStats[];
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  duration: number;
  completedAt: number;
}
