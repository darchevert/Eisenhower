import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useTaskStore } from '@/store/taskStore';

/**
 * Keeps the app icon badge count in sync with the number of active Q1 tasks.
 * Badge = 0 when no Q1 tasks are pending (badge is cleared).
 */
export function useBadge() {
  const tasks = useTaskStore((s) => s.tasks);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);

  useEffect(() => {
    const q1ActiveCount = tasks.filter(
      (t) => t.quadrant === 'q1' && t.matrixId === currentMatrixId && !t.completed
    ).length;

    Notifications.setBadgeCountAsync(q1ActiveCount).catch(() => {
      // setBadgeCountAsync may not be available on all platforms — fail silently
    });
  }, [tasks, currentMatrixId]);
}
