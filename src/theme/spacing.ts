import { sp, sw } from '@/utils/scale';

/**
 * Spacing — base 8pt grid, scales slightly with screen width via sw().
 */
export const Spacing = {
  xs: sw(4),
  sm: sw(8),
  md: sw(12),
  lg: sw(16),
  xl: sw(20),
  xxl: sw(24),
  xxxl: sw(32),
} as const;

/**
 * Radius — iOS corner radii.
 * iOS uses 10–13pt for list items, 16pt for cards, 20pt for sheets.
 */
export const Radius = {
  sm: 10,
  md: 13,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

/**
 * Shadow — very subtle iOS-style elevation.
 * iOS rarely uses deep shadows — just a slight lift.
 */
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/**
 * Typography — iOS Human Interface Guidelines type scale.
 * All sizes go through sp() for screen-width-based adaptation.
 *
 * Usage: <Text style={[Typography.headline, { color: colors.text }]}>
 */
export const Typography = {
  largeTitle: { fontSize: sp(34), fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: sp(41) },
  title1:     { fontSize: sp(28), fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: sp(34) },
  title2:     { fontSize: sp(22), fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: sp(28) },
  title3:     { fontSize: sp(20), fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: sp(25) },
  headline:   { fontSize: sp(17), fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: sp(22) },
  body:       { fontSize: sp(17), fontWeight: '400' as const, lineHeight: sp(22) },
  callout:    { fontSize: sp(16), fontWeight: '400' as const, lineHeight: sp(21) },
  subhead:    { fontSize: sp(15), fontWeight: '400' as const, lineHeight: sp(20) },
  subheadSemi:{ fontSize: sp(15), fontWeight: '600' as const, lineHeight: sp(20) },
  footnote:   { fontSize: sp(13), fontWeight: '400' as const, lineHeight: sp(18) },
  footnoteSemi:{ fontSize: sp(13), fontWeight: '500' as const, lineHeight: sp(18) },
  caption1:   { fontSize: sp(12), fontWeight: '400' as const, lineHeight: sp(16) },
  caption2:   { fontSize: sp(11), fontWeight: '400' as const, lineHeight: sp(13) },
  caption2Semi:{ fontSize: sp(11), fontWeight: '600' as const, lineHeight: sp(13), letterSpacing: 0.06 },
} as const;

/** Minimum touch target per Apple HIG: 44pt */
export const MIN_TOUCH_TARGET = 44;
