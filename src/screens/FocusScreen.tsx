import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/Theme';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BannerAd } from '@/ads/BannerAd';
import { useInterstitial } from '@/ads/useInterstitial';
import { AdConfig } from '@/ads/AdConfig';
import { Spacing, Typography, Radius, Shadow } from '@/theme/spacing';
import { sp } from '@/utils/scale';
import { t } from '@/i18n';
import type { Task } from '@/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 240;
const STROKE_WIDTH = 12;
const RADIUS_RING = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_RING;

const PRESETS = [
  { label: '15', minutes: 15 },
  { label: '25', minutes: 25 },
  { label: '45', minutes: 45 },
];

export function FocusScreen() {
  const { colors, mode } = useTheme();
  const allTasks = useTaskStore((s) => s.tasks);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);
  const activeTasks = useMemo(
    () => allTasks.filter((tk) => tk.matrixId === currentMatrixId && !tk.completed),
    [allTasks, currentMatrixId]
  );
  const isPremium = useSettingsStore((s) => s.isPremium);
  const sessionCompletedCount = useSettingsStore((s) => s.sessionCompletedCount);
  const incrementCompleted = useSettingsStore((s) => s.incrementSessionCompleted);
  const resetCount = useSettingsStore((s) => s.resetSessionCompleted);
  const addFocusSession = useSettingsStore((s) => s.addFocusSession);
  const focusSessions = useSettingsStore((s) => s.focusSessions);
  const { showIfReady } = useInterstitial();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = useSharedValue(1);

  const today = new Date().toDateString();
  const todaySessions = focusSessions.filter(
    (s) => new Date(s.completedAt).toDateString() === today
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  useEffect(() => {
    if (totalSeconds > 0) {
      progress.value = withTiming(timeLeft / totalSeconds, {
        duration: 800,
        easing: Easing.linear,
      });
    }
  }, [timeLeft, totalSeconds]);

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (!isComplete) return;

    setIsRunning(false);
    setIsPaused(false);
    setShowComplete(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addFocusSession({
      taskId: selectedTask?.id,
      taskTitle: selectedTask?.title,
      duration: totalSeconds,
      completedAt: Date.now(),
    });

    if (!isPremium) {
      const newCount = sessionCompletedCount + 1;
      incrementCompleted();
      if (newCount >= AdConfig.interstitialTriggerCount) {
        resetCount();
        setTimeout(() => showIfReady(), 2000);
      }
    }

    const timer = setTimeout(() => {
      setShowComplete(false);
      setIsComplete(false);
      setTimeLeft(totalSeconds);
      progress.value = withTiming(1, { duration: 600 });
    }, 3500);

    return () => clearTimeout(timer);
  }, [isComplete]);

  function selectPreset(index: number) {
    if (isRunning) return;
    setSelectedPreset(index);
    const secs = PRESETS[index].minutes * 60;
    setTotalSeconds(secs);
    setTimeLeft(secs);
    progress.value = withTiming(1, { duration: 400 });
  }

  function handleStart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsComplete(false);
    setShowComplete(false);
    setIsRunning(true);
    setIsPaused(false);
  }

  function handlePause() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(true);
  }

  function handleResume() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(false);
  }

  function handleEnd() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setShowComplete(false);
    setIsComplete(false);
    setTimeLeft(totalSeconds);
    progress.value = withTiming(1, { duration: 500 });
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const trackColor = mode === 'dark' ? colors.surfaceSecondary : '#E5E5EA';
  const surfaceColor = mode === 'dark' ? colors.surface : colors.surface;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.borderLight,
            backgroundColor: mode === 'light' ? colors.surface : colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('focus.title')}</Text>
        {todaySessions.length > 0 && (
          <View style={[styles.sessionBadge, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
            <Text style={[styles.sessionBadgeText, { color: colors.primary }]}>
              {t('focus.sessionCount', { count: todaySessions.length })}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Task selector */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            {t('focus.selectTask').toUpperCase()}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.taskChips}
        >
          <TouchableOpacity
            style={[
              styles.taskChip,
              {
                backgroundColor: !selectedTask ? colors.primary : (mode === 'dark' ? colors.surfaceSecondary : colors.surface),
                borderColor: !selectedTask ? colors.primary : colors.borderLight,
              },
            ]}
            onPress={() => !isRunning && setSelectedTask(null)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.taskChipText,
                { color: !selectedTask ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {t('focus.noTask')}
            </Text>
          </TouchableOpacity>

          {activeTasks.slice(0, 12).map((task) => {
            const isSelected = selectedTask?.id === task.id;
            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskChip,
                  {
                    backgroundColor: isSelected ? colors.primary : (mode === 'dark' ? colors.surfaceSecondary : colors.surface),
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => !isRunning && setSelectedTask(task)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.taskChipText,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Timer ring */}
        <View style={styles.timerContainer}>
          {selectedTask && !showComplete && (
            <Text
              style={[styles.taskLabel, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {selectedTask.title}
            </Text>
          )}

          <View style={styles.ringWrapper}>
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            >
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS_RING}
                fill="none"
                stroke={trackColor}
                strokeWidth={STROKE_WIDTH}
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS_RING}
                fill="none"
                stroke={showComplete ? colors.success : colors.primary}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                animatedProps={animatedProps}
                transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
              />
            </Svg>

            <View style={styles.ringCenter} pointerEvents="none">
              {showComplete ? (
                <View style={styles.completeCenter}>
                  <Ionicons name="checkmark-circle" size={56} color={colors.success} />
                  <Text style={[styles.completeText, { color: colors.success }]}>
                    {t('focus.complete')}
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    style={[styles.timerText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {`${mm}:${ss}`}
                  </Text>
                  {isRunning && !isPaused && (
                    <Text style={[styles.timerStatus, { color: colors.textTertiary }]}>
                      {t('focus.running')}
                    </Text>
                  )}
                  {isPaused && (
                    <Text style={[styles.timerStatus, { color: colors.primary }]}>
                      {t('focus.paused')}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Preset buttons */}
        {!isRunning && !showComplete && (
          <View style={styles.presets}>
            {PRESETS.map((p, i) => {
              const active = selectedPreset === i;
              return (
                <TouchableOpacity
                  key={p.label}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: active ? colors.primary : surfaceColor,
                      borderColor: active ? colors.primary : colors.borderLight,
                    },
                    !active && Platform.OS === 'ios' && Shadow.sm,
                  ]}
                  onPress={() => selectPreset(i)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetBtnNum, { color: active ? '#FFFFFF' : colors.text }]}>
                    {p.label}
                  </Text>
                  <Text
                    style={[
                      styles.presetBtnMin,
                      { color: active ? 'rgba(255,255,255,0.75)' : colors.textTertiary },
                    ]}
                  >
                    {t('focus.min')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning && !showComplete ? (
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={handleStart}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.startBtnText}>{t('focus.start')}</Text>
            </TouchableOpacity>
          ) : isRunning ? (
            <View style={styles.runningControls}>
              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  {
                    backgroundColor: surfaceColor,
                    borderColor: colors.borderLight,
                  },
                  Platform.OS === 'ios' && Shadow.sm,
                ]}
                onPress={isPaused ? handleResume : handlePause}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isPaused ? 'play' : 'pause'}
                  size={20}
                  color={colors.text}
                />
                <Text style={[styles.controlBtnText, { color: colors.text }]}>
                  {isPaused ? t('focus.resume') : t('focus.pause')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  {
                    backgroundColor: surfaceColor,
                    borderColor: colors.borderLight,
                  },
                  Platform.OS === 'ios' && Shadow.sm,
                ]}
                onPress={handleEnd}
                activeOpacity={0.75}
              >
                <Ionicons name="stop" size={20} color={colors.error} />
                <Text style={[styles.controlBtnText, { color: colors.error }]}>
                  {t('focus.end')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Today's sessions history */}
        {todaySessions.length > 0 && (
          <View
            style={[
              styles.historyCard,
              {
                backgroundColor: surfaceColor,
                borderColor: colors.borderLight,
              },
              Platform.OS === 'ios' && Shadow.sm,
            ]}
          >
            <Text style={[styles.historySectionLabel, { color: colors.textTertiary }]}>
              {t('focus.sessionCount', { count: todaySessions.length }).toUpperCase()}
            </Text>
            {todaySessions
              .slice()
              .reverse()
              .slice(0, 5)
              .map((session, idx, arr) => (
                <View
                  key={session.id}
                  style={[
                    styles.sessionRow,
                    idx < arr.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                >
                  <View style={[styles.sessionDot, { backgroundColor: colors.primary + '33' }]}>
                    <Ionicons name="timer-outline" size={12} color={colors.primary} />
                  </View>
                  <Text
                    style={[styles.sessionTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {session.taskTitle ?? t('focus.noTask')}
                  </Text>
                  <Text style={[styles.sessionDuration, { color: colors.textTertiary }]}>
                    {Math.round(session.duration / 60)}{t('focus.min')}
                  </Text>
                </View>
              ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    ...Typography.title2,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  sessionBadgeText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  scroll: {
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.caption2Semi,
    letterSpacing: 0.5,
  },
  taskChips: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  taskChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: 180,
  },
  taskChipText: {
    ...Typography.footnote,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  taskLabel: {
    ...Typography.footnote,
    fontWeight: '500',
    marginBottom: Spacing.md,
    maxWidth: RING_SIZE - 20,
    textAlign: 'center',
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: sp(52),
    fontWeight: '700',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    lineHeight: sp(60),
  },
  timerStatus: {
    ...Typography.caption1,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  completeCenter: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  completeText: {
    ...Typography.subheadSemi,
    textAlign: 'center',
  },
  presets: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 2,
  },
  presetBtnNum: {
    ...Typography.title3,
  },
  presetBtnMin: {
    ...Typography.caption2,
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.full,
  },
  startBtnText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  runningControls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  controlBtnText: {
    ...Typography.subheadSemi,
  },
  historyCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  historySectionLabel: {
    ...Typography.caption2Semi,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  sessionDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sessionTitle: {
    ...Typography.subhead,
    flex: 1,
  },
  sessionDuration: {
    ...Typography.footnote,
    flexShrink: 0,
  },
  bottomPad: {
    height: Spacing.xxl,
  },
});
