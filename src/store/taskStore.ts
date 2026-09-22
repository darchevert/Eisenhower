import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/id';
import type { Task, Matrix, QuadrantId } from '@/types';
import { WidgetService } from '@/services/widgetService';
import { NotificationService } from '@/services/notificationService';

function syncWidgetFromState(tasks: Task[], matrixId: string) {
  const q1Tasks = tasks
    .filter((t) => t.quadrant === 'q1' && t.matrixId === matrixId && !t.completed)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 5)
    .map((t) => ({ id: t.id, title: t.title }));
  WidgetService.sync(q1Tasks).catch(() => {});
}

const DEFAULT_MATRIX: Matrix = {
  id: 'default',
  name: 'My Matrix',
  icon: 'grid',
  createdAt: Date.now(),
};

function nextDueDate(dueDate: number | undefined, recurrence: string): number | undefined {
  const base = dueDate ? new Date(dueDate) : new Date();
  if (recurrence === 'daily') {
    base.setDate(base.getDate() + 1);
  } else if (recurrence === 'weekly') {
    base.setDate(base.getDate() + 7);
  } else if (recurrence === 'monthly') {
    base.setMonth(base.getMonth() + 1);
  } else {
    return undefined;
  }
  return base.getTime();
}

interface TaskStore {
  matrices: Matrix[];
  tasks: Task[];
  currentMatrixId: string;
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  addTask: (data: Pick<Task, 'title' | 'description' | 'quadrant' | 'dueDate' | 'recurrence'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  moveTask: (id: string, quadrant: QuadrantId) => void;
  reorderTask: (id: string, newOrder: number) => void;
  clearCompleted: (quadrant?: QuadrantId) => void;

  addMatrix: (name: string) => void;
  deleteMatrix: (id: string) => void;
  renameMatrix: (id: string, name: string) => void;
  setCurrentMatrix: (id: string) => void;

  getTasksByQuadrant: (quadrant: QuadrantId) => Task[];
  getActiveTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      matrices: [DEFAULT_MATRIX],
      tasks: [],
      currentMatrixId: 'default',
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addTask: (data) => {
        const { currentMatrixId, tasks } = get();
        const quadrantTasks = tasks.filter(
          (t) => t.quadrant === data.quadrant && t.matrixId === currentMatrixId
        );
        const task: Task = {
          id: generateId(),
          title: data.title,
          description: data.description,
          quadrant: data.quadrant,
          dueDate: data.dueDate,
          completed: false,
          createdAt: Date.now(),
          matrixId: currentMatrixId,
          order: quadrantTasks.length,
          recurrence: data.recurrence ?? 'none',
        };
        set((s) => {
          const next = [...s.tasks, task];
          syncWidgetFromState(next, s.currentMatrixId);
          return { tasks: next };
        });
        if (task.dueDate) {
          NotificationService.scheduleTaskReminder(task);
        }
      },

      updateTask: (id, updates) => {
        const { tasks } = get();
        const task = tasks.find((t) => t.id === id);
        set((s) => {
          const next = s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
          syncWidgetFromState(next, s.currentMatrixId);
          return { tasks: next };
        });
        if (task && 'dueDate' in updates) {
          const merged = { ...task, ...updates };
          if (merged.dueDate) {
            NotificationService.scheduleTaskReminder(merged as Task);
          } else {
            NotificationService.cancelTaskReminder(id);
          }
        }
      },

      deleteTask: (id) => {
        NotificationService.cancelTaskReminder(id);
        set((s) => {
          const next = s.tasks.filter((t) => t.id !== id);
          syncWidgetFromState(next, s.currentMatrixId);
          return { tasks: next };
        });
      },

      toggleComplete: (id) => {
        const { tasks, currentMatrixId } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        const nowCompleting = !task.completed;
        const updatedTasks = tasks.map((t) =>
          t.id === id
            ? { ...t, completed: nowCompleting, completedAt: nowCompleting ? Date.now() : undefined }
            : t
        );

        // Cancel reminder when completing
        if (nowCompleting) {
          NotificationService.cancelTaskReminder(id);
        }

        // If completing a recurring task → create the next occurrence
        if (nowCompleting && task.recurrence && task.recurrence !== 'none') {
          const quadrantTasks = tasks.filter(
            (t) => t.quadrant === task.quadrant && t.matrixId === currentMatrixId
          );
          const nextTask: Task = {
            id: generateId(),
            title: task.title,
            description: task.description,
            quadrant: task.quadrant,
            completed: false,
            createdAt: Date.now(),
            matrixId: currentMatrixId,
            order: quadrantTasks.length,
            recurrence: task.recurrence,
            dueDate: nextDueDate(task.dueDate, task.recurrence),
          };
          const final = [...updatedTasks, nextTask];
          syncWidgetFromState(final, currentMatrixId);
          set({ tasks: final });
          if (nextTask.dueDate) {
            NotificationService.scheduleTaskReminder(nextTask);
          }
        } else {
          syncWidgetFromState(updatedTasks, currentMatrixId);
          set({ tasks: updatedTasks });
        }
      },

      moveTask: (id, quadrant) => {
        const { tasks, currentMatrixId } = get();
        const targetTasks = tasks.filter(
          (t) => t.quadrant === quadrant && t.matrixId === currentMatrixId
        );
        set((s) => {
          const next = s.tasks.map((t) =>
            t.id === id ? { ...t, quadrant, order: targetTasks.length } : t
          );
          syncWidgetFromState(next, s.currentMatrixId);
          return { tasks: next };
        });
      },

      reorderTask: (id, newOrder) => {
        const { tasks } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        const oldOrder = task.order;
        if (oldOrder === newOrder) return;

        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.quadrant !== task.quadrant || t.matrixId !== task.matrixId) return t;
            if (t.id === id) return { ...t, order: newOrder };
            if (oldOrder < newOrder && t.order > oldOrder && t.order <= newOrder)
              return { ...t, order: t.order - 1 };
            if (oldOrder > newOrder && t.order < oldOrder && t.order >= newOrder)
              return { ...t, order: t.order + 1 };
            return t;
          }),
        }));
      },

      clearCompleted: (quadrant) =>
        set((s) => ({
          tasks: s.tasks.filter((t) =>
            t.completed ? (quadrant ? t.quadrant !== quadrant : false) : true
          ),
        })),

      addMatrix: (name) => {
        const matrix: Matrix = {
          id: generateId(),
          name,
          icon: 'grid',
          createdAt: Date.now(),
        };
        set((s) => ({ matrices: [...s.matrices, matrix], currentMatrixId: matrix.id }));
      },

      deleteMatrix: (id) => {
        if (id === 'default') return;
        set((s) => ({
          matrices: s.matrices.filter((m) => m.id !== id),
          tasks: s.tasks.filter((t) => t.matrixId !== id),
          currentMatrixId: s.currentMatrixId === id ? 'default' : s.currentMatrixId,
        }));
      },

      renameMatrix: (id, name) =>
        set((s) => ({
          matrices: s.matrices.map((m) => (m.id === id ? { ...m, name } : m)),
        })),

      setCurrentMatrix: (id) => set({ currentMatrixId: id }),

      getTasksByQuadrant: (quadrant) => {
        const { tasks, currentMatrixId } = get();
        return tasks
          .filter((t) => t.quadrant === quadrant && t.matrixId === currentMatrixId)
          .sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return (a.order ?? 0) - (b.order ?? 0);
          });
      },

      getActiveTasks: () => {
        const { tasks, currentMatrixId } = get();
        return tasks.filter((t) => t.matrixId === currentMatrixId && !t.completed);
      },
    }),
    {
      name: 'eisenhower-tasks',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
