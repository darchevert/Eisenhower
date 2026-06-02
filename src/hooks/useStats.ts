import { useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { isSameDay, getWeekDays, formatShortDate } from '@/utils/date';
import type { AppStats, QuadrantId } from '@/types';
import { QUADRANT_IDS } from '@/utils/quadrants';

export function useStats(): AppStats {
  const tasks = useTaskStore((s) => s.tasks);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);

  return useMemo(() => {
    const matrixTasks = tasks.filter((t) => t.matrixId === currentMatrixId);
    const completed = matrixTasks.filter((t) => t.completed);
    const now = Date.now();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const completedThisWeek = completed.filter(
      (t) => t.createdAt >= weekStart.getTime()
    ).length;

    const completedByQuadrant = QUADRANT_IDS.reduce(
      (acc, id) => ({ ...acc, [id]: completed.filter((t) => t.quadrant === id).length }),
      {} as Record<QuadrantId, number>
    );

    const activeByQuadrant = QUADRANT_IDS.reduce(
      (acc, id) => ({
        ...acc,
        [id]: matrixTasks.filter((t) => t.quadrant === id && !t.completed).length,
      }),
      {} as Record<QuadrantId, number>
    );

    const days = getWeekDays();
    const dailyCompletions = days.map((day) => ({
      date: formatShortDate(day.getTime()),
      count: completed.filter((t) => isSameDay(t.createdAt, day.getTime())).length,
    }));

    // Simple streak: consecutive days with at least 1 completed task
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const hasTasks = completed.some((t) => isSameDay(t.createdAt, d.getTime()));
      if (hasTasks) streakDays++;
      else if (i > 0) break;
    }

    return {
      totalCompleted: completed.length,
      completedThisWeek,
      completedByQuadrant,
      activeByQuadrant,
      streakDays,
      dailyCompletions,
    };
  }, [tasks, currentMatrixId]);
}
