import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@/theme/Theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useTaskStore } from '@/store/taskStore';
import { useBadge } from '@/hooks/useBadge';
import AppNavigator from '@/navigation/AppNavigator';

function ThemedApp() {
  const currentTheme = useSettingsStore((s) => s.currentTheme);
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);
  const tasksHydrated = useTaskStore((s) => s._hasHydrated);

  // Keep the app icon badge count in sync with active Q1 tasks
  useBadge();

  if (!settingsHydrated || !tasksHydrated) {
    return null;
  }

  return (
    <ThemeProvider themeName={currentTheme}>
      <AppNavigator />
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
