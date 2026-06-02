import React, { createContext, useContext, useMemo } from 'react';
import { AppColors, type ColorScheme } from './colors';
import { getTheme, type PremiumTheme } from './premiumThemes';
import { useSettingsStore } from '@/store/settingsStore';
import type { ThemeName, QuadrantId } from '@/types';

type ThemeMode = 'light' | 'dark';

interface QuadrantStyle {
  accent: string;
  lightBg: string;
  darkBg: string;
  bg: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  colors: ColorScheme;
  currentTheme: PremiumTheme;
  getQuadrantStyle: (id: QuadrantId) => QuadrantStyle;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  themeName: ThemeName;
}

export function ThemeProvider({ children, themeName }: ThemeProviderProps) {
  const darkModeEnabled = useSettingsStore((s) => s.darkModeEnabled);
  const mode: ThemeMode = darkModeEnabled ? 'dark' : 'light';
  const colors = AppColors[mode];
  const currentTheme = getTheme(themeName);

  const getQuadrantStyle = useMemo(
    () =>
      (id: QuadrantId): QuadrantStyle => ({
        accent: currentTheme.colors[id],
        lightBg: currentTheme.lightBg[id],
        darkBg: currentTheme.darkBg[id],
        bg: mode === 'dark' ? currentTheme.darkBg[id] : currentTheme.lightBg[id],
      }),
    [currentTheme, mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, colors, currentTheme, getQuadrantStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
