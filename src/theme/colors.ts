/**
 * iOS System Colors — matches Apple's Human Interface Guidelines precisely.
 * Light mode uses systemGroupedBackground hierarchy.
 * Dark mode uses iOS true-dark palette.
 */
export const AppColors = {
  light: {
    // Backgrounds (iOS grouped style)
    background: '#F2F2F7',      // systemGroupedBackground
    surface: '#FFFFFF',          // secondarySystemGroupedBackground
    surfaceSecondary: '#F2F2F7', // tertiarySystemGroupedBackground (same as bg)

    // Accent
    primary: '#EF4444',

    // Labels
    text: '#000000',            // label
    textSecondary: '#6D6D72',   // secondaryLabel (iOS: rgba(60,60,67,0.6))
    textTertiary: '#AEAEB2',    // tertiaryLabel (iOS: rgba(60,60,67,0.3))

    // Separators
    border: '#C6C6C8',          // opaqueSeparator
    borderLight: '#E5E5EA',     // separator (lighter, for hairlines)

    // Semantic
    success: '#34C759',         // systemGreen
    error: '#FF3B30',           // systemRed
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    // Backgrounds
    background: '#000000',       // dark systemGroupedBackground
    surface: '#1C1C1E',         // dark secondarySystemGroupedBackground
    surfaceSecondary: '#2C2C2E', // dark tertiarySystemGroupedBackground

    // Accent
    primary: '#FF453A',

    // Labels
    text: '#FFFFFF',             // dark label
    textSecondary: '#8E8E93',    // dark secondaryLabel
    textTertiary: '#636366',     // dark tertiaryLabel

    // Separators
    border: '#38383A',           // dark opaqueSeparator
    borderLight: '#2C2C2E',      // dark separator

    // Semantic
    success: '#30D158',          // dark systemGreen
    error: '#FF453A',            // dark systemRed
    overlay: 'rgba(0,0,0,0.65)',
  },
} as const;

export type ColorScheme = typeof AppColors.light;
