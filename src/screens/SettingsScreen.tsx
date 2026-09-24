import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { usePremium } from '@/hooks/usePremium';
import { PurchaseService } from '@/services/purchaseService';
import { UserIdService } from '@/services/userIdService';
import { useSettingsStore } from '@/store/settingsStore';
import { useTaskStore } from '@/store/taskStore';
import { NotificationService } from '@/services/notificationService';
import { PREMIUM_THEMES } from '@/theme/premiumThemes';
import { PremiumBadge } from '@/components/ui/PremiumBadge';
import { Spacing, Radius, Shadow, Typography, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { t } from '@/i18n';
import type { ThemeName } from '@/types';
import type { SortBy } from '@/store/settingsStore';

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'default', label: t('settings.sortDefault') },
  { key: 'dueDate', label: t('settings.sortDueDate') },
  { key: 'alpha', label: t('settings.sortAlpha') },
];

export function SettingsScreen() {
  const { colors, mode } = useTheme();
  const { isPremium } = usePremium();
  const versionTapCount = useRef(0);
  const versionTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userId, setUserId] = useState<string | null>(UserIdService.getCached());

  useEffect(() => {
    if (!userId) {
      UserIdService.get().then(setUserId);
    }
  }, []);

  function handleVersionTap() {
    versionTapCount.current += 1;
    if (versionTapTimeout.current) clearTimeout(versionTapTimeout.current);
    versionTapTimeout.current = setTimeout(() => { versionTapCount.current = 0; }, 2000);
    if (versionTapCount.current >= 7) {
      versionTapCount.current = 0;
      if (Platform.OS === 'ios') {
        Alert.prompt(
          '🔑',
          '',
          async (userId) => {
            if (!userId?.trim()) return;
            const ok = await PurchaseService.loginAsUser(userId.trim());
            Alert.alert(ok ? '✓' : '✗', ok ? 'Premium activé' : 'Aucun entitlement trouvé');
          },
          'plain-text',
          '',
          'default',
        );
      } else {
        Alert.alert('ID', 'Utilise l\'interface RevenueCat pour accorder l\'accès sur Android.');
      }
    }
  }
  const navigation = useNavigation<any>();
  const currentTheme = useSettingsStore((s) => s.currentTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const darkModeEnabled = useSettingsStore((s) => s.darkModeEnabled);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const showCompleted = useSettingsStore((s) => s.showCompleted);
  const toggleShowCompleted = useSettingsStore((s) => s.toggleShowCompleted);
  const dailyReminder = useSettingsStore((s) => s.dailyReminderEnabled);
  const dailyReminderTime = useSettingsStore((s) => s.dailyReminderTime);
  const setDailyReminder = useSettingsStore((s) => s.setDailyReminder);
  const focusModeEnabled = useSettingsStore((s) => s.focusModeEnabled);
  const toggleFocusMode = useSettingsStore((s) => s.toggleFocusMode);
  const sortBy = useSettingsStore((s) => s.sortBy);
  const setSortBy = useSettingsStore((s) => s.setSortBy);
  const clearCompleted = useTaskStore((s) => s.clearCompleted);

  function handleThemeSelect(name: ThemeName, premium: boolean) {
    if (premium && !isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      navigation.navigate('Premium');
      return;
    }
    Haptics.selectionAsync();
    setTheme(name);
  }

  function handleDarkModeToggle(v: boolean) {
    if (!isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      navigation.navigate('Premium');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDarkMode(v);
  }

  function handleFocusMode(v: boolean) {
    if (!isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      navigation.navigate('Premium');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFocusMode();
  }

  function handleClearCompleted() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t('settings.clearConfirmTitle'),
      t('settings.clearConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.clearCompleted'), style: 'destructive', onPress: () => clearCompleted() },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.borderLight },
          mode === 'light' && { backgroundColor: colors.surface, ...Shadow.sm },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Premium banner */}
        {!isPremium && (
          <TouchableOpacity
            style={[styles.premiumBanner, { backgroundColor: colors.surface }, Shadow.sm]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('Premium');
            }}
            activeOpacity={0.75}
          >
            <View style={styles.premiumBannerLeft}>
              <View style={styles.premiumIconBox}>
                <Ionicons name="star" size={18} color="#F59E0B" />
              </View>
              <View style={styles.premiumBannerText}>
                <Text style={[styles.premiumBannerTitle, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
                  {t('settings.unlockPremium')}
                </Text>
                <Text style={[styles.premiumBannerDesc, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                  {t('settings.unlockPremiumSub')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
          {t('settings.appearance')}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }, Shadow.sm]}>
          {/* Dark Mode row */}
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: '#1E293B18' }]}>
                <Ionicons name="moon-outline" size={16} color="#1E293B" />
              </View>
              <View style={styles.rowLabelGroup}>
                <Text style={[styles.rowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('settings.darkMode')}</Text>
                {!isPremium && (
                  <Text style={[styles.rowSublabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
                    {t('settings.darkModeDesc')}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.rowRight}>
              {!isPremium && <PremiumBadge />}
              <Switch
                value={darkModeEnabled}
                onValueChange={handleDarkModeToggle}
                trackColor={{ true: '#34C759' }}
                disabled={false}
              />
            </View>
          </View>

          {/* Theme */}
          <View style={styles.themeSection}>
            <Text style={[styles.themeSectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
              {t('settings.theme')}
            </Text>
            <View style={styles.themeGrid}>
              {PREMIUM_THEMES.map((theme) => (
                <TouchableOpacity
                  key={theme.name}
                  onPress={() => handleThemeSelect(theme.name, theme.isPremium)}
                  style={[
                    styles.themeChip,
                    {
                      borderColor: currentTheme === theme.name ? theme.colors.q1 : colors.borderLight,
                      borderWidth: currentTheme === theme.name ? 2 : StyleSheet.hairlineWidth,
                      backgroundColor: colors.surfaceSecondary,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    {theme.preview.map((color, i) => (
                      <View key={i} style={[styles.previewDot, { backgroundColor: color }]} />
                    ))}
                  </View>
                  <Text style={[styles.themeLabel, { color: colors.text }]} maxFontSizeMultiplier={1.1}>{theme.label}</Text>
                  {theme.isPremium && !isPremium && <PremiumBadge />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
          {t('settings.preferences')}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }, Shadow.sm]}>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: '#3B82F618' }]}>
                <Ionicons name="checkmark-done" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('settings.showCompleted')}</Text>
            </View>
            <Switch
              value={showCompleted}
              onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleShowCompleted();
              }}
              trackColor={{ true: '#34C759' }}
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: '#F59E0B18' }]}>
                <Ionicons name="notifications-outline" size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('settings.dailyReminder')}</Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={async (v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (v) {
                  const granted = await NotificationService.requestPermission();
                  if (!granted) {
                    Alert.alert(
                      t('settings.dailyReminder'),
                      t('settings.notificationsPermissionDenied')
                    );
                    return;
                  }
                  const [h, m] = dailyReminderTime.split(':').map(Number);
                  await NotificationService.scheduleDailyReminder(h, m);
                } else {
                  await NotificationService.cancelDailyReminder();
                }
                setDailyReminder(v);
              }}
              trackColor={{ true: '#34C759' }}
            />
          </View>
        </View>

        {/* Productivity */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
          {t('settings.productivity')}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }, Shadow.sm]}>
          {/* Focus Mode */}
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: '#8B5CF618' }]}>
                <Ionicons name="eye-outline" size={16} color="#8B5CF6" />
              </View>
              <View style={styles.rowLabelGroup}>
                <Text style={[styles.rowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('settings.focusMode')}</Text>
                <Text style={[styles.rowSublabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
                  {isPremium ? t('settings.focusModeDesc') : t('common.premium')}
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              {!isPremium && <PremiumBadge />}
              <Switch
                value={focusModeEnabled}
                onValueChange={handleFocusMode}
                trackColor={{ true: '#8B5CF6' }}
              />
            </View>
          </View>

          {/* Widgets */}
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: '#6366F118' }]}>
                <Ionicons name="grid-outline" size={16} color="#6366F1" />
              </View>
              <View style={styles.rowLabelGroup}>
                <Text style={[styles.rowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
                  {t('premium.features.widgets')}
                </Text>
                <Text style={[styles.rowSublabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
                  {isPremium ? t('premium.features.widgetsDesc') : t('common.premium')}
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              {!isPremium && <PremiumBadge />}
              {isPremium && (
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              )}
              {!isPremium && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    navigation.navigate('Premium');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sort By */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: '#10B98118' }]}>
                <Ionicons name="swap-vertical-outline" size={16} color="#10B981" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('settings.sortBy')}</Text>
            </View>
            <View style={styles.sortPicker}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: sortBy === opt.key ? colors.primary : colors.surfaceSecondary,
                      borderColor: sortBy === opt.key ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSortBy(opt.key);
                  }}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      { color: sortBy === opt.key ? '#FFFFFF' : colors.textSecondary },
                    ]}
                    maxFontSizeMultiplier={1.1}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Data */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
          {t('settings.data')}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }, Shadow.sm]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={handleClearCompleted}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: colors.error + '18' }]}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.error }]} maxFontSizeMultiplier={1.2}>{t('settings.clearCompleted')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
          {t('settings.about')}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }, Shadow.sm]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.borderLight }]}
            onPress={handleVersionTap}
            activeOpacity={1}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('settings.version')}</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2}>1.0.0</Text>
          </TouchableOpacity>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]} maxFontSizeMultiplier={1.2}>{t('settings.status')}</Text>
            <Text style={[styles.rowValue, { color: isPremium ? '#34C759' : colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
              {isPremium ? t('settings.statusPremium') : t('settings.statusFree')}
            </Text>
          </View>
          {userId && (
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() => {
                Clipboard.setString(userId);
                Haptics.selectionAsync();
                Alert.alert('Copié', 'ID copié dans le presse-papiers.');
              }}
              activeOpacity={0.6}
            >
              <Text style={[styles.rowLabel, { color: colors.textTertiary, fontSize: 11 }]} maxFontSizeMultiplier={1.1}>
                ID
              </Text>
              <Text
                style={[styles.rowValue, { color: colors.textTertiary, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
              >
                {userId.slice(0, 8)}…
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  },
  title: { ...Typography.title1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl, paddingTop: Spacing.lg },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F59E0B40',
    minHeight: MIN_TOUCH_TARGET,
  },
  premiumBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  premiumIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBannerText: { flex: 1 },
  premiumBannerTitle: { ...Typography.subheadSemi },
  premiumBannerDesc: { ...Typography.caption1, marginTop: 2 },
  sectionLabel: {
    ...Typography.caption2Semi,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  section: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_TARGET,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, minWidth: 0 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabelGroup: { flex: 1, minWidth: 0 },
  rowLabel: { ...Typography.callout, fontWeight: '400' },
  rowSublabel: { ...Typography.caption1, marginTop: 1 },
  rowValue: { ...Typography.callout },
  themeSection: { padding: Spacing.lg, paddingTop: Spacing.md },
  themeSectionTitle: { ...Typography.callout, fontWeight: '500', marginBottom: Spacing.md },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  themeChip: {
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 68,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 3,
    flexWrap: 'wrap',
    width: 44,
    height: 24,
  },
  previewDot: { width: 20, height: 10, borderRadius: 3 },
  themeLabel: { ...Typography.caption2, fontWeight: '500' },
  sortPicker: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  sortChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  sortChipText: { ...Typography.caption2, fontWeight: '600' },
});
