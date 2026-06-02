/**
 * SortableTaskList — drag-to-reorder task list within a quadrant.
 *
 * Architecture:
 * - Parent holds activeDragIndex, targetIndex, dragOffsetY as shared values.
 * - Each SortableItem is a proper React component with its own hooks.
 * - useAnimatedReaction in each item auto-shifts it when drag state changes.
 * - Pan.activateAfterLongPress(400) triggers the drag sequence cleanly.
 * - On release, reorderTask() is called with the new index.
 *
 * Cross-quadrant movement is handled via the "Move to…" option in TaskModal.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '@/store/taskStore';
import type { Task, QuadrantId } from '@/types';

const ITEM_HEIGHT = 56;
const SPRING_CFG = { damping: 22, stiffness: 320 };

// ─── Shared drag state (passed from parent to every item) ────────────────────

interface SharedDragState {
  activeDragIndex: Animated.SharedValue<number>;
  targetIndex: Animated.SharedValue<number>;
  dragOffsetY: Animated.SharedValue<number>;
  totalCount: Animated.SharedValue<number>;
}

// ─── SortableItem ────────────────────────────────────────────────────────────

interface SortableItemProps {
  task: Task;
  index: number;
  dragState: SharedDragState;
  renderTask: (task: Task, isDragging: boolean) => React.ReactElement;
  onCommitReorder: (from: number, to: number) => void;
  onHaptic: () => void;
  isLast: boolean;
  borderColor: string;
}

function SortableItem({
  task,
  index,
  dragState,
  renderTask,
  onCommitReorder,
  onHaptic,
  isLast,
  borderColor,
}: SortableItemProps) {
  const { activeDragIndex, targetIndex, dragOffsetY, totalCount } = dragState;

  // Sync index into a shared value so worklets always see the latest value
  const indexSV = useSharedValue(index);
  indexSV.value = index; // synchronous update before any render-driven gesture

  // Per-item animation state (proper hooks at component top level)
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);
  const shiftY = useSharedValue(0); // used to slide non-dragged items aside

  // ── Auto-shift when drag state changes ──────────────────────────────────
  useAnimatedReaction(
    () => {
      const from = activeDragIndex.value;
      const to = targetIndex.value;
      const me = indexSV.value;

      if (from === -1 || me === from) return 0;
      if (from < to && me > from && me <= to) return -ITEM_HEIGHT;
      if (from > to && me < from && me >= to) return ITEM_HEIGHT;
      return 0;
    },
    (newShift, prevShift) => {
      if (newShift !== prevShift) {
        shiftY.value = withSpring(newShift, SPRING_CFG);
      }
    }
  );

  // ── Gesture: long-press then pan ─────────────────────────────────────────
  const gesture = Gesture.Pan()
    .activateAfterLongPress(400)
    .onStart(() => {
      'worklet';
      runOnJS(onHaptic)();
      activeDragIndex.value = indexSV.value;
      targetIndex.value = indexSV.value;
      dragOffsetY.value = 0;
      shiftY.value = 0;
      scale.value = withSpring(1.04, { damping: 14, stiffness: 180 });
      zIndex.value = 100;
      opacity.value = withTiming(0.92, { duration: 100 });
    })
    .onUpdate((e) => {
      'worklet';
      if (activeDragIndex.value !== indexSV.value) return;
      dragOffsetY.value = e.translationY;
      const rawTarget = Math.round(
        (indexSV.value * ITEM_HEIGHT + e.translationY) / ITEM_HEIGHT
      );
      targetIndex.value = Math.max(0, Math.min(totalCount.value - 1, rawTarget));
    })
    .onEnd(() => {
      'worklet';
      if (activeDragIndex.value !== indexSV.value) return;
      const from = indexSV.value;
      const to = targetIndex.value;

      // Reset visual state; shiftY on other items auto-resets via useAnimatedReaction
      scale.value = withSpring(1, SPRING_CFG);
      zIndex.value = 0;
      opacity.value = withTiming(1, { duration: 80 });
      dragOffsetY.value = 0;
      activeDragIndex.value = -1;
      targetIndex.value = -1;

      if (from !== to) {
        runOnJS(onCommitReorder)(from, to);
      }
    })
    .onFinalize(() => {
      'worklet';
      // Safety net: cancelled or interrupted gesture
      if (activeDragIndex.value === indexSV.value) {
        scale.value = withSpring(1, SPRING_CFG);
        zIndex.value = 0;
        opacity.value = withTiming(1, { duration: 80 });
        dragOffsetY.value = 0;
        activeDragIndex.value = -1;
        targetIndex.value = -1;
      }
    });

  // ── Animated style ────────────────────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeDragIndex.value === indexSV.value;
    return {
      transform: [
        { translateY: isActive ? dragOffsetY.value : shiftY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
      opacity: opacity.value,
      ...(isActive
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 10,
            elevation: 10,
          }
        : {}),
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          animatedStyle,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: borderColor,
          },
        ]}
      >
        {renderTask(task, false)}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── SortableTaskList ─────────────────────────────────────────────────────────

interface SortableTaskListProps {
  tasks: Task[];
  quadrant: QuadrantId;
  accentColor: string;
  onEditTask: (task: Task) => void;
  renderTask: (task: Task, isDragging: boolean) => React.ReactElement;
  borderColor: string;
}

export function SortableTaskList({
  tasks,
  quadrant,
  accentColor,
  onEditTask,
  renderTask,
  borderColor,
}: SortableTaskListProps) {
  const reorderTask = useTaskStore((s) => s.reorderTask);

  // Shared state for the active drag (single drag at a time)
  const activeDragIndex = useSharedValue(-1);
  const targetIndex = useSharedValue(-1);
  const dragOffsetY = useSharedValue(0);
  const totalCount = useSharedValue(tasks.length);
  // Keep totalCount in sync (used in worklet for clamping)
  totalCount.value = tasks.length;

  const dragState: SharedDragState = {
    activeDragIndex,
    targetIndex,
    dragOffsetY,
    totalCount,
  };

  const commitReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const task = tasks[fromIndex];
      if (task) {
        reorderTask(task.id, toIndex);
      }
    },
    [tasks, reorderTask]
  );

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  if (tasks.length === 0) return null;

  return (
    <View style={styles.container}>
      {tasks.map((task, index) => (
        <SortableItem
          key={task.id}
          task={task}
          index={index}
          dragState={dragState}
          renderTask={renderTask}
          onCommitReorder={commitReorder}
          onHaptic={triggerHaptic}
          isLast={index === tasks.length - 1}
          borderColor={borderColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // overflow visible so the scale-up shadow is not clipped
    overflow: 'visible',
  },
});
