import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { useStats } from '@/hooks/useStats';
import { usePremium } from '@/hooks/usePremium';
import { useTaskStore } from '@/store/taskStore';
import { formatDueDate } from '@/utils/date';
import { Spacing, Radius, Shadow, Typography, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { QUADRANT_IDS } from '@/utils/quadrants';
import { t } from '@/i18n';
import { BannerAd } from '@/ads/BannerAd';

const TRACK_HEIGHT = 60;

function AnimatedBar({
  count,
  maxCount,
  color,
  delay,
}: {
  count: number;
  maxCount: number;
  color: string;
  delay: number;
}) {
  const targetH = count > 0 ? Math.max(4, Math.round((count / maxCount) * TRACK_HEIGHT)) : 0;
  const heightAnim = useSharedValue(0);

  useEffect(() => {
    heightAnim.value = withDelay(
      delay,
      withTiming(targetH, { duration: 550, easing: Easing.out(Easing.cubic) })
    );
  }, [targetH]);

  const animStyle = useAnimatedStyle(() => ({ height: heightAnim.value }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: color, opacity: count > 0 ? 1 : 0.15 },
        animStyle,
      ]}
    />
  );
}

export function StatsScreen() {
  const { colors, mode, getQuadrantStyle } = useTheme();
  const stats = useStats();
  const { isPremium } = usePremium();
  const navigation = useNavigation<any>();

  const tasks = useTaskStore((s) => s.tasks);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);

  const completedTasks = tasks
    .filter((t) => t.matrixId === currentMatrixId && t.completed)
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt))
    .slice(0, 30); // show last 30

  const totalActive = Object.values(stats.activeByQuadrant).reduce((a, b) => a + b, 0);
  const q1Pct = totalActive > 0 ? Math.round((stats.activeByQuadrant.q1 / totalActive) * 100) : 0;

  if (!isPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.borderLight },
            mode === 'light' && { backgroundColor: colors.surface, ...Shadow.sm },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('stats.title')}</Text>
        </View>
        <View style={styles.paywallContainer}>
          <View style={[styles.paywallCard, { backgroundColor: colors.surface }, Shadow.md]}>
            <Ionicons name="bar-chart" size={48} color="#F59E0B" />
            <Text style={[styles.paywallTitle, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('stats.unlockStats')}</Text>
            <Text style={[styles.paywallDesc, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
              {t('stats.unlockStatsDesc')}
            </Text>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Premium');
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="star" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeBtnText} maxFontSizeMultiplier={1.1}>{t('stats.getPremium')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const maxDay = Math.max(...stats.dailyCompletions.map((d) => d.count), 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.borderLight },
            mode === 'light' && { backgroundColor: colors.surface, ...Shadow.sm },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('stats.title')}</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }, Shadow.sm]}>
            <Text style={[styles.summaryValue, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{stats.totalCompleted}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.1}>{t('stats.totalDone')}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }, Shadow.sm]}>
            <Text style={[styles.summaryValue, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{stats.completedThisWeek}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.1}>{t('stats.thisWeek')}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }, Shadow.sm]}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]} maxFontSizeMultiplier={1.2}>{stats.streakDays}🔥</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.1}>{t('stats.dayStreak')}</Text>
          </View>
        </View>

        {/* Q1 stress indicator */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadow.sm]}>
          <Text style={[styles.cardTitle, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('stats.priorityBalance')}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
            {q1Pct > 50
              ? t('stats.urgentWarning', { pct: q1Pct })
              : q1Pct === 0 && totalActive > 0
              ? t('stats.noUrgent')
              : t('stats.goodBalance', { pct: q1Pct })}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${q1Pct}%`, backgroundColor: q1Pct > 50 ? colors.error : colors.success },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
            {t('stats.urgentVsTotal', { urgent: stats.activeByQuadrant.q1, total: totalActive })}
          </Text>
        </View>

        {/* Quadrant breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadow.sm]}>
          <Text style={[styles.cardTitle, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('stats.activeTasks')}</Text>
          {QUADRANT_IDS.map((id) => {
            const qStyle = getQuadrantStyle(id);
            const count = stats.activeByQuadrant[id];
            const pct = totalActive > 0 ? (count / totalActive) * 100 : 0;
            return (
              <View key={id} style={styles.quadrantRow}>
                <View style={[styles.quadrantDot, { backgroundColor: qStyle.accent }]} />
                <Text style={[styles.quadrantRowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.1}>
                  {t(`quadrants.${id}.label`)}
                </Text>
                <View style={[styles.quadrantBarContainer, { backgroundColor: colors.surfaceSecondary }]}>
                  <View
                    style={[styles.quadrantBar, { width: `${pct}%`, backgroundColor: qStyle.accent }]}
                  />
                </View>
                <Text style={[styles.quadrantCount, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.1}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* Weekly chart */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadow.sm]}>
          <Text style={[styles.cardTitle, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('stats.completedWeek')}</Text>
          <View style={styles.barChart}>
            {stats.dailyCompletions.map((day, i) => (
              <View key={i} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <AnimatedBar
                    count={day.count}
                    maxCount={maxDay}
                    color={colors.primary}
                    delay={i * 55}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.0}>{day.date}</Text>
                {day.count > 0 && (
                  <Text style={[styles.barValue, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.0}>{day.count}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Completed History */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadow.sm]}>
          <Text style={[styles.cardTitle, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
            {t('stats.history')}
          </Text>
          {completedTasks.length === 0 ? (
            <Text style={[styles.emptyHistoryText, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
              {t('stats.noHistory')}
            </Text>
          ) : (
            completedTasks.map((task) => {
              const qStyle = getQuadrantStyle(task.quadrant);
              const completedDate = task.completedAt
                ? formatDueDate(task.completedAt)
                : null;
              return (
                <View
                  key={task.id}
                  style={[styles.historyItem, { borderBottomColor: colors.borderLight }]}
                >
                  <View style={[styles.historyDot, { backgroundColor: qStyle.accent }]} />
                  <View style={styles.historyContent}>
                    <Text
                      style={[styles.historyTitle, { color: colors.textSecondary }]}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.2}
                    >
                      {task.title}
                    </Text>
                    {completedDate && (
                      <Text style={[styles.historyDate, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
                        {completedDate}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="checkmark-circle" size={16} color={qStyle.accent} />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  title: { ...Typography.title1 },
  scrollContent: { paddingBottom: Spacing.xxxl },
  paywallContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  paywallCard: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  paywallTitle: { ...Typography.title2, textAlign: 'center' },
  paywallDesc: { ...Typography.callout, textAlign: 'center', lineHeight: 22 },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#F59E0B',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  upgradeBtnText: { color: '#FFFFFF', ...Typography.callout, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryCard: { flex: 1, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  summaryValue: { ...Typography.title2 },
  summaryLabel: { ...Typography.caption1, fontWeight: '500', marginTop: 2, textAlign: 'center' },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  cardTitle: { ...Typography.headline, marginBottom: Spacing.sm },
  cardSubtitle: { ...Typography.footnote, lineHeight: 18, marginBottom: Spacing.sm },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { ...Typography.caption1 },
  quadrantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  quadrantDot: { width: 8, height: 8, borderRadius: 4 },
  quadrantRowLabel: { width: 72, ...Typography.footnote, fontWeight: '500' },
  quadrantBarContainer: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  quadrantBar: { height: '100%', borderRadius: 4 },
  quadrantCount: { width: 24, ...Typography.footnote, textAlign: 'right' },
  barChart: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { height: TRACK_HEIGHT, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
  barLabel: { ...Typography.caption2 },
  barValue: { ...Typography.caption2, fontWeight: '600' },
  // History
  emptyHistoryText: { ...Typography.footnote, textAlign: 'center', paddingVertical: Spacing.md },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  historyContent: { flex: 1, minWidth: 0 },
  historyTitle: {
    ...Typography.footnote,
    textDecorationLine: 'line-through',
  },
  historyDate: { ...Typography.caption2, marginTop: 1 },
});
