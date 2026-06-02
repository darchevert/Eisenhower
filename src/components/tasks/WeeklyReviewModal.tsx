import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Spacing, Radius, Shadow, Typography, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { t } from '@/i18n';
import { QUADRANT_IDS } from '@/utils/quadrants';

interface WeeklyReviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export function WeeklyReviewModal({ visible, onClose }: WeeklyReviewModalProps) {
  const { colors, mode, getQuadrantStyle } = useTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);
  const setLastWeeklyReview = useSettingsStore((s) => s.setLastWeeklyReview);

  const slideAnim = useRef(new Animated.Value(500)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 500, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function handleClose(reminded = false) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reminded) {
      setLastWeeklyReview(Date.now());
    }
    onClose();
  }

  // Stats for last 7 days
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCompleted = tasks.filter(
    (t) =>
      t.matrixId === currentMatrixId &&
      t.completed &&
      (t.completedAt ?? t.createdAt) >= oneWeekAgo
  );

  const completedByQuadrant = QUADRANT_IDS.map((id) => ({
    id,
    count: recentCompleted.filter((t) => t.quadrant === id).length,
  }));

  const q1Count = completedByQuadrant.find((q) => q.id === 'q1')?.count ?? 0;
  const totalCount = recentCompleted.length;

  // Active Q1 tasks
  const activeQ1 = tasks.filter(
    (t) => t.matrixId === currentMatrixId && t.quadrant === 'q1' && !t.completed
  ).length;

  const showQ1Warning = activeQ1 > 5;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => handleClose(true)}
    >
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => handleClose(true)} />
      </Animated.View>

      <View style={styles.wrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] },
            Shadow.lg,
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: '#F59E0B18' }]}>
            <Ionicons name="calendar" size={32} color="#F59E0B" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
            {t('weeklyReview.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
            {t('weeklyReview.subtitle')}
          </Text>

          {/* Stats summary */}
          <View style={[styles.statsRow, { backgroundColor: colors.surfaceSecondary, borderRadius: Radius.md }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('weeklyReview.completed', { count: totalCount })}
              </Text>
            </View>
          </View>

          {/* Quadrant breakdown */}
          <View style={styles.breakdown}>
            {completedByQuadrant.map(({ id, count }) => {
              const qStyle = getQuadrantStyle(id);
              return (
                <View key={id} style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: qStyle.accent }]} />
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.1}>
                    {t(`quadrants.${id}.short`)}
                  </Text>
                  <Text style={[styles.breakdownCount, { color: colors.text }]} maxFontSizeMultiplier={1.1}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Tip */}
          <View style={[styles.tipBox, { backgroundColor: showQ1Warning ? '#FF3B3012' : '#34C75912', borderRadius: Radius.sm }]}>
            <Ionicons
              name={showQ1Warning ? 'warning-outline' : 'bulb-outline'}
              size={14}
              color={showQ1Warning ? colors.error : colors.success}
            />
            <Text
              style={[styles.tipText, { color: showQ1Warning ? colors.error : colors.success }]}
              maxFontSizeMultiplier={1.1}
            >
              {showQ1Warning ? t('weeklyReview.q1Warning') : t('weeklyReview.q2Tip')}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.skipBtn, { borderColor: colors.borderLight }]}
              onPress={() => handleClose(true)}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.1}>
                {t('weeklyReview.skip')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: '#F59E0B' }]}
              onPress={() => handleClose(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.closeBtnText} maxFontSizeMultiplier={1.1}>
                {t('weeklyReview.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: { ...Typography.title2, textAlign: 'center' },
  subtitle: { ...Typography.callout, textAlign: 'center', lineHeight: 20 },
  statsRow: {
    width: '100%',
    padding: Spacing.md,
    alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statValue: { ...Typography.title1 },
  statLabel: { ...Typography.caption1, textAlign: 'center', marginTop: 2 },
  breakdown: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { ...Typography.caption2 },
  breakdownCount: { ...Typography.subheadSemi },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.md,
    width: '100%',
  },
  tipText: { ...Typography.caption1, flex: 1, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginTop: Spacing.xs,
  },
  skipBtn: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { ...Typography.callout, fontWeight: '500' },
  closeBtn: {
    flex: 2,
    height: MIN_TOUCH_TARGET,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#FFFFFF', ...Typography.callout, fontWeight: '700' },
});
