import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@/theme/Theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useTaskStore } from '@/store/taskStore';
import { useBadge } from '@/hooks/useBadge';
import { useAppOpen } from '@/ads/useAppOpen';
import AppNavigator from '@/navigation/AppNavigator';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PurchaseService } from '@/services/purchaseService';
import { NotificationService } from '@/services/notificationService';

// Configure RevenueCat once at module load (before any component mounts)
PurchaseService.configure();

function ThemedApp() {
  const currentTheme = useSettingsStore((s) => s.currentTheme);
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const tasksHydrated = useTaskStore((s) => s._hasHydrated);

  useBadge();
  useAppOpen();

  useEffect(() => {
    if (settingsHydrated) {
      PurchaseService.checkStatus();
    }
  }, [settingsHydrated]);

  useEffect(() => {
    if (!tasksHydrated) return;
    const { tasks } = useTaskStore.getState();
    const now = Date.now();
    const overdueCount = tasks.filter(
      (tk) => !tk.completed && tk.dueDate && tk.dueDate < now
    ).length;
    NotificationService.scheduleOverdueDigest(overdueCount);
  }, [tasksHydrated]);

  if (!settingsHydrated || !tasksHydrated) {
    return null;
  }

  return (
    <ThemeProvider themeName={currentTheme}>
      {hasSeenOnboarding ? <AppNavigator /> : <OnboardingScreen />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemedApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
