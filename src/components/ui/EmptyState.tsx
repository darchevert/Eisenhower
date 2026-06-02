import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/Theme';
import { Spacing, Typography } from '@/theme/spacing';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  color: string;
}

export function EmptyState({ icon, title, subtitle, color }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={28} color={color} style={styles.icon} />
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    marginBottom: Spacing.sm,
    opacity: 0.5,
  },
  title: {
    ...Typography.footnote,
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption2,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
