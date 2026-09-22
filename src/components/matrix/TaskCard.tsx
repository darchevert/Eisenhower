import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { Checkbox } from '@/components/ui/Checkbox';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useInterstitial } from '@/ads/useInterstitial';
import { AdConfig } from '@/ads/AdConfig';
import { formatDueDate, isOverdue } from '@/utils/date';
import { Spacing, Typography, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { t } from '@/i18n';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  accentColor: string;
  onPress: (task: Task) => void;
}

export function TaskCard({ task, accentColor, onPress }: TaskCardProps) {
  const { colors } = useTheme();
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const incrementCompleted = useSettingsStore((s) => s.incrementSessionCompleted);
  const sessionCount = useSettingsStore((s) => s.sessionCompletedCount);
  const resetCount = useSettingsStore((s) => s.resetSessionCompleted);
  const isPremium = useSettingsStore((s) => s.isPremium);
  const { showIfReady } = useInterstitial();
  const swipeRef = useRef<Swipeable>(null);

  function handleToggle() {
    toggleComplete(task.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!task.completed) {
      const newCount = sessionCount + 1;
      incrementCompleted();
      if (!isPremium && newCount >= AdConfig.interstitialTriggerCount) {
        resetCount();
        setTimeout(() => showIfReady(), 500);
      }
    }
  }

  function handleDelete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t('tasks.deleteConfirmTitle'),
      t('tasks.deleteConfirmMsg', { title: task.title }),
      [
        { text: t('tasks.cancel'), style: 'cancel', onPress: () => swipeRef.current?.close() },
        { text: t('tasks.delete'), style: 'destructive', onPress: () => deleteTask(task.id) },
      ]
    );
  }

  const renderLeftActions = () => (
    <View style={[styles.swipeAction, styles.completeAction]}>
      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
      <Text style={styles.swipeText}>{t('tasks.done')}</Text>
    </View>
  );

  const renderRightActions = () => (
    <View style={[styles.swipeAction, styles.deleteAction]}>
      <Ionicons name="trash" size={20} color="#FFFFFF" />
      <Text style={styles.swipeText}>{t('tasks.delete')}</Text>
    </View>
  );

  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify().damping(18)}
      exiting={FadeOutLeft.duration(220)}
    >
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableLeftOpen={handleToggle}
      onSwipeableRightOpen={handleDelete}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          onPress(task);
        }}
        activeOpacity={0.6}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderLeftColor: task.completed ? colors.border : accentColor,
          },
        ]}
      >
        <Checkbox checked={task.completed} onToggle={handleToggle} color={accentColor} size={22} />
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: task.completed ? colors.textTertiary : colors.text },
              task.completed && styles.titleCompleted,
            ]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
          >
            {task.title}
          </Text>
          {task.dueDate && (
            <View style={styles.dueRow}>
              <Ionicons
                name="time-outline"
                size={11}
                color={overdue ? colors.error : colors.textTertiary}
              />
              <Text
                style={[styles.dueText, { color: overdue ? colors.error : colors.textTertiary }]}
                maxFontSizeMultiplier={1.2}
              >
                {formatDueDate(task.dueDate)}
              </Text>
            </View>
          )}
          {task.recurrence && task.recurrence !== 'none' && (
            <View style={styles.dueRow}>
              <Ionicons name="repeat" size={11} color={colors.textTertiary} />
              <Text style={[styles.dueText, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.2}>
                {t(`recurrence.${task.recurrence}`)}
              </Text>
            </View>
          )}
        </View>
        {!task.completed && (
          <Ionicons name="chevron-forward" size={14} color={colors.border} />
        )}
      </TouchableOpacity>
    </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    minHeight: MIN_TOUCH_TARGET,
    borderLeftWidth: 3,
    gap: Spacing.md,
  },
  content: { flex: 1, gap: 3 },
  title: {
    ...Typography.subhead,
    fontWeight: '500',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dueText: { ...Typography.caption2 },
  swipeAction: {
    width: 72,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  completeAction: { backgroundColor: '#34C759' },
  deleteAction: { backgroundColor: '#FF3B30' },
  swipeText: { color: '#FFFFFF', ...Typography.caption2, fontWeight: '600' },
});
