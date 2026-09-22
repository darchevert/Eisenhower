import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/id';
import type { ThemeName, FocusSession } from '@/types';

export type SortBy = 'default' | 'dueDate' | 'alpha';

interface SettingsStore {
  isPremium: boolean;
  currentTheme: ThemeName;
  darkModeEnabled: boolean;
  showCompleted: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  sessionCompletedCount: number;
  focusModeEnabled: boolean;
  sortBy: SortBy;
  lastWeeklyReview: number | null;
  focusSessions: FocusSession[];
  hasSeenOnboarding: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  markOnboardingDone: () => void;
  addFocusSession: (session: Omit<FocusSession, 'id'>) => void;
  setPremium: (v: boolean) => void;
  setTheme: (theme: ThemeName) => void;
  setDarkMode: (v: boolean) => void;
  toggleShowCompleted: () => void;
  setDailyReminder: (enabled: boolean, time?: string) => void;
  incrementSessionCompleted: () => void;
  resetSessionCompleted: () => void;
  toggleFocusMode: () => void;
  setSortBy: (sort: SortBy) => void;
  setLastWeeklyReview: (ts: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      isPremium: false,
      currentTheme: 'default',
      darkModeEnabled: false,
      showCompleted: false,
      dailyReminderEnabled: false,
      dailyReminderTime: '20:00',
      sessionCompletedCount: 0,
      focusModeEnabled: false,
      sortBy: 'default',
      lastWeeklyReview: null,
      focusSessions: [],
      hasSeenOnboarding: false,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),
      markOnboardingDone: () => set({ hasSeenOnboarding: true }),
      addFocusSession: (session) =>
        set((s) => ({
          focusSessions: [{ ...session, id: generateId() }, ...s.focusSessions].slice(0, 100),
        })),
      setPremium: (v) => set({ isPremium: v }),
      setTheme: (theme) => set({ currentTheme: theme }),
      setDarkMode: (v) => set({ darkModeEnabled: v }),
      toggleShowCompleted: () => set((s) => ({ showCompleted: !s.showCompleted })),
      setDailyReminder: (enabled, time) =>
        set((s) => ({
          dailyReminderEnabled: enabled,
          dailyReminderTime: time ?? s.dailyReminderTime,
        })),
      incrementSessionCompleted: () =>
        set((s) => ({ sessionCompletedCount: s.sessionCompletedCount + 1 })),
      resetSessionCompleted: () => set({ sessionCompletedCount: 0 }),
      toggleFocusMode: () => set((s) => ({ focusModeEnabled: !s.focusModeEnabled })),
      setSortBy: (sort) => set({ sortBy: sort }),
      setLastWeeklyReview: (ts) => set({ lastWeeklyReview: ts }),
    }),
    {
      name: 'eisenhower-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        isPremium: s.isPremium,
        currentTheme: s.currentTheme,
        darkModeEnabled: s.darkModeEnabled,
        showCompleted: s.showCompleted,
        dailyReminderEnabled: s.dailyReminderEnabled,
        dailyReminderTime: s.dailyReminderTime,
        focusModeEnabled: s.focusModeEnabled,
        sortBy: s.sortBy,
        lastWeeklyReview: s.lastWeeklyReview,
        focusSessions: s.focusSessions,
        hasSeenOnboarding: s.hasSeenOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
