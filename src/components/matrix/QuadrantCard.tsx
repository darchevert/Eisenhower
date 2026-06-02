import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
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

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: style.bg },
        mode === 'light'
          ? { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.07)' }
          : { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.06)' },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: style.accent }]}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Ionicons name={meta.icon as any} size={14} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1} maxFontSizeMultiplier={1.2}>{label}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {activeTasks.length > 0 && (
            <Badge count={activeTasks.length} color="rgba(255,255,255,0.28)" />
          )}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddTask(quadrantId);
            }}
            style={styles.addBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task list */}
      <View style={styles.body}>
        {displayTasks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={meta.icon as any}
              title={t('matrix.noTasks')}
              subtitle={t('matrix.tapToAdd')}
              color={style.accent}
            />
          </View>
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
    paddingVertical: Spacing.sm + 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    color: '#FFFFFF',
    ...Typography.subheadSemi,
    letterSpacing: 0.1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  emptyWrap: {
    paddingVertical: Spacing.xs,
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
