import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/Theme';
import { QuadrantCard } from '@/components/matrix/QuadrantCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { WeeklyReviewModal } from '@/components/tasks/WeeklyReviewModal';
import { MatrixPickerSheet } from '@/components/matrix/MatrixPickerSheet';
import { BannerAd } from '@/ads/BannerAd';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePremium } from '@/hooks/usePremium';
import { exportMatrixAsText } from '@/utils/export';
import { Spacing, Typography } from '@/theme/spacing';
import { t, getLocale } from '@/i18n';
import type { QuadrantId, Task } from '@/types';

export function MatrixScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantId>('q1');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const hasShownReview = useRef(false);

  const matrices = useTaskStore((s) => s.matrices);
  const tasks = useTaskStore((s) => s.tasks);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);
  const currentMatrix = matrices.find((m) => m.id === currentMatrixId);

  const focusModeEnabled = useSettingsStore((s) => s.focusModeEnabled);
  const toggleFocusMode = useSettingsStore((s) => s.toggleFocusMode);
  const lastWeeklyReview = useSettingsStore((s) => s.lastWeeklyReview);
  const { isPremium } = usePremium();

  // Show weekly review once per session if 7+ days have passed since last review
  useEffect(() => {
    if (hasShownReview.current) return;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - (lastWeeklyReview ?? 0) >= SEVEN_DAYS) {
      hasShownReview.current = true;
      const timer = setTimeout(() => setReviewVisible(true), 1800);
      return () => clearTimeout(timer);
    }
  }, []); // intentionally run only on mount

  function handleAddTask(quadrantId: QuadrantId) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingTask(null);
    setSelectedQuadrant(quadrantId);
    setModalVisible(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setSelectedQuadrant(task.quadrant);
    setModalVisible(true);
  }

  function handleFocusMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFocusMode();
  }

  async function handleExport() {
    if (!currentMatrix) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      await exportMatrixAsText(currentMatrix, tasks);
    } catch {
      Alert.alert(t('share.exportTitle'), t('share.exportSuccess'));
    } finally {
      setExporting(false);
    }
  }

  const today = (() => {
    try {
      const formatted = new Intl.DateTimeFormat(getLocale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date());
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return new Date().toDateString();
    }
  })();

  const quadrantsToShow: QuadrantId[] = focusModeEnabled
    ? ['q1', 'q2']
    : ['q1', 'q3', 'q2', 'q4'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.borderLight },
          { backgroundColor: colors.surface },
        ]}
      >
        {/* Left: focus mode */}
        <TouchableOpacity
          style={[
            styles.headerBtn,
            {
              backgroundColor: focusModeEnabled ? colors.primary + '20' : colors.surfaceSecondary,
              borderColor: focusModeEnabled ? colors.primary : colors.borderLight,
            },
          ]}
          onPress={handleFocusMode}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="eye-outline"
            size={16}
            color={focusModeEnabled ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Center: matrix name — tappable to switch */}
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerVisible(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.matrixName, { color: colors.text }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {currentMatrix?.name ?? 'My Matrix'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={colors.textTertiary} style={styles.matrixChevron} />
        </TouchableOpacity>

        {/* Right: export + add */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.headerBtn,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.borderLight,
                opacity: exporting ? 0.5 : 1,
              },
            ]}
            onPress={handleExport}
            disabled={exporting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPressIn={() => { fabScale.value = withSpring(0.88, { damping: 8, stiffness: 400 }); }}
            onPressOut={() => { fabScale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
            onPress={() => handleAddTask('q1')}
            activeOpacity={1}
          >
            <Animated.View style={[styles.addFab, { backgroundColor: colors.primary }, fabAnimStyle]}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Focus mode banner */}
      {focusModeEnabled && (
        <View style={[styles.focusBanner, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="eye-outline" size={13} color={colors.primary} />
          <Text style={[styles.focusBannerText, { color: colors.primary }]} maxFontSizeMultiplier={1.1}>
            {t('matrix.focusMode')} — Q1 & Q2
          </Text>
          <TouchableOpacity onPress={handleFocusMode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Axis labels */}
      {!focusModeEnabled && (
        <View style={[styles.axisContainer, { backgroundColor: colors.background }]}>
          <View style={styles.axisRow}>
            <View style={[styles.axisTag, { backgroundColor: colors.surface }]}>
              <Ionicons name="arrow-up" size={9} color={colors.textTertiary} />
              <Text
                style={[styles.axisLabel, { color: colors.textTertiary }]}
                maxFontSizeMultiplier={1.1}
              >
                {t('matrix.important')}
              </Text>
            </View>
            <View style={[styles.axisTag, { backgroundColor: colors.surface }]}>
              <Ionicons name="flash-outline" size={9} color={colors.textTertiary} />
              <Text
                style={[styles.axisLabel, { color: colors.textTertiary }]}
                maxFontSizeMultiplier={1.1}
              >
                {t('matrix.urgent')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Matrix grid */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {focusModeEnabled ? (
          // Focus mode: Q1 and Q2 stacked vertically (full width)
          <>
            <QuadrantCard quadrantId="q1" onAddTask={handleAddTask} onEditTask={handleEditTask} />
            <QuadrantCard quadrantId="q2" onAddTask={handleAddTask} onEditTask={handleEditTask} />
          </>
        ) : (
          // Normal 2x2 grid
          <>
            <View style={styles.row}>
              <QuadrantCard quadrantId="q1" onAddTask={handleAddTask} onEditTask={handleEditTask} />
              <QuadrantCard quadrantId="q3" onAddTask={handleAddTask} onEditTask={handleEditTask} />
            </View>
            <View style={styles.row}>
              <QuadrantCard quadrantId="q2" onAddTask={handleAddTask} onEditTask={handleEditTask} />
              <QuadrantCard quadrantId="q4" onAddTask={handleAddTask} onEditTask={handleEditTask} />
            </View>
          </>
        )}
      </ScrollView>

      <BannerAd />

      <TaskModal
        visible={modalVisible}
        task={editingTask}
        defaultQuadrant={selectedQuadrant}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(null);
        }}
      />

      <WeeklyReviewModal
        visible={reviewVisible}
        onClose={() => setReviewVisible(false)}
      />

      <MatrixPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onNavigatePremium={() => navigation.navigate('Premium')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  matrixName: {
    ...Typography.headline,
    fontWeight: '700',
  },
  matrixChevron: {
    marginLeft: 3,
  },
  dateText: {
    ...Typography.footnote,
    marginTop: 2,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFab: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
  },
  focusBannerText: {
    flex: 1,
    ...Typography.caption1,
    fontWeight: '600',
  },
  axisContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  axisRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  axisTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  axisLabel: {
    ...Typography.caption2Semi,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
