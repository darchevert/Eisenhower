import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { TaskCard } from './TaskCard';
import { SortableTaskList } from './SortableTaskList';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { QUADRANT_META } from '@/theme/quadrantThemes';
import { Spacing, Radius, Typography } from '@/theme/spacing';
import { t } from '@/i18n';
import type { QuadrantId, Task } from '@/types';

interface QuadrantCardProps {
  quadrantId: QuadrantId;
  onAddTask: (quadrantId: QuadrantId) => void;
  onEditTask: (task: Task) => void;
}

export function QuadrantCard({ quadrantId, onAddTask, onEditTask }: QuadrantCardProps) {
  const { colors, mode, getQuadrantStyle } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const meta = QUADRANT_META[quadrantId];
  const style = getQuadrantStyle(quadrantId);
  const allTasks = useTaskStore((s) => s.tasks);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);
  const tasks = useMemo(
    () =>
      allTasks
        .filter((tk) => tk.quadrant === quadrantId && tk.matrixId === currentMatrixId)
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return (a.order ?? 0) - (b.order ?? 0);
        }),
    [allTasks, currentMatrixId, quadrantId]
  );
  const showCompleted = useSettingsStore((s) => s.showCompleted);

  const visibleTasks = showCompleted ? tasks : tasks.filter((tk) => !tk.completed);
  const displayTasks = expanded ? visibleTasks : visibleTasks.slice(0, 3);
  const hasMore = visibleTasks.length > 3 && !expanded;
  const activeTasks = tasks.filter((tk) => !tk.completed);

  const label = t(`quadrants.${quadrantId}.label`);

  const borderColor = mode === 'dark'
    ? style.accent + '55'
    : style.accent + '45';

  const addBtnBg = mode === 'dark'
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.05)';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor,
          borderWidth: 1.5,
          ...Platform.select({
            android: { elevation: 1 },
          }),
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={meta.icon as any}
            size={15}
            color={style.accent}
            style={styles.headerIcon}
          />
          <Text
            style={[styles.headerTitle, { color: style.accent }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {label}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={12}
            color={style.accent + '80'}
          />
        </View>

        <View style={styles.headerRight}>
          {activeTasks.length > 0 && (
            <View style={[styles.badge, { backgroundColor: style.accent }]}>
              <Text style={styles.badgeText}>{activeTasks.length}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddTask(quadrantId);
            }}
            style={[styles.addBtn, { backgroundColor: addBtnBg }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtle separator */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      {/* Task list */}
      <View style={styles.body}>
        {displayTasks.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyWrap}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddTask(quadrantId);
            }}
            activeOpacity={0.6}
          >
            <View style={[styles.emptyPlus, { borderColor: style.accent + '50' }]}>
              <Ionicons name="add" size={18} color={style.accent + '80'} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {t('matrix.tapToAdd')}
            </Text>
          </TouchableOpacity>
        ) : (
          <SortableTaskList
            tasks={displayTasks}
            quadrant={quadrantId}
            accentColor={style.accent}
            onEditTask={onEditTask}
            borderColor={colors.borderLight}
            renderTask={(task) => (
              <TaskCard task={task} accentColor={style.accent} onPress={onEditTask} />
            )}
          />
        )}

        {hasMore && (
          <TouchableOpacity
            style={styles.showMore}
            onPress={() => {
              Haptics.selectionAsync();
              setExpanded(true);
            }}
          >
            <Text style={[styles.showMoreText, { color: style.accent }]}>
              {t('matrix.showMore', { count: visibleTasks.length - 3 })}
            </Text>
          </TouchableOpacity>
        )}
        {expanded && visibleTasks.length > 3 && (
          <TouchableOpacity
            style={styles.showMore}
            onPress={() => {
              Haptics.selectionAsync();
              setExpanded(false);
            }}
          >
            <Text style={[styles.showMoreText, { color: style.accent }]}>
              {t('matrix.showLess')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    flexShrink: 0,
  },
  headerTitle: {
    ...Typography.subheadSemi,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
    marginLeft: Spacing.xs,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.md,
  },
  body: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  emptyWrap: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyPlus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.caption1,
  },
  showMore: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  showMoreText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
});
