import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/Theme';
import { usePremium } from '@/hooks/usePremium';
import { PurchaseService } from '@/services/purchaseService';
import { Spacing, Radius, Shadow, Typography, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { sp } from '@/utils/scale';
import type { PurchasesPackage } from 'react-native-purchases';

type PlanKey = 'monthly' | 'annual' | 'lifetime';

const PROMO_KEY = 'eisenhower_promo_start';
const PROMO_DURATION = 24 * 60 * 60 * 1000;

interface CompRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  free: boolean;
}

const COMPARISON: CompRow[] = [
  { icon: 'list', label: 'Tâches illimitées', free: true },
  { icon: 'eye', label: 'Mode focus', free: true },
  { icon: 'grid', label: 'Matrice Eisenhower', free: true },
  { icon: 'contrast', label: 'Thème clair / sombre', free: true },
  { icon: 'notifications', label: 'Rappels & notifications', free: true },
  { icon: 'phone-portrait', label: 'Widgets écran d\'accueil', free: false },
  { icon: 'repeat', label: 'Tâches récurrentes', free: false },
  { icon: 'layers', label: 'Matrices multiples', free: false },
  { icon: 'bar-chart', label: 'Statistiques avancées', free: false },
  { icon: 'pricetag', label: 'Étiquettes (tags)', free: false },
  { icon: 'color-palette', label: 'Thèmes premium', free: false },
  { icon: 'document-text', label: 'Export de la matrice', free: false },
  { icon: 'ban', label: 'Sans publicité', free: false },
];

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function PremiumScreen() {
  const { colors, mode } = useTheme();
  const { isPremium, restore } = usePremium();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('lifetime');
  const [packages, setPackages] = useState<{ monthly: PurchasesPackage | null; annual: PurchasesPackage | null; lifetime: PurchasesPackage | null }>({
    monthly: null,
    annual: null,
    lifetime: null,
  });
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    PurchaseService.getPackages().then(setPackages);

    AsyncStorage.getItem(PROMO_KEY).then((val) => {
      const start = val ? parseInt(val, 10) : Date.now();
      if (!val) AsyncStorage.setItem(PROMO_KEY, String(start));
      const remaining = start + PROMO_DURATION - Date.now();
      setCountdown(Math.max(0, remaining));
      if (remaining > 0) {
        timerRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1000) {
              clearInterval(timerRef.current!);
              return 0;
            }
            return c - 1000;
          });
        }, 1000);
      }
    });

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function getPriceString(plan: PlanKey): string {
    const pkg = packages[plan];
    if (pkg) return pkg.product.priceString;
    return plan === 'monthly' ? '2,99 €' : plan === 'annual' ? '9,99 €' : '22,99 €';
  }

  async function handlePurchase() {
    const pkg = packages[selectedPlan];
    setLoading(true);
    try {
      let success: boolean;
      if (__DEV__) {
        success = await PurchaseService.purchase();
      } else if (pkg) {
        success = await PurchaseService.purchasePackage(pkg);
      } else {
        success = await PurchaseService.purchase();
      }
      if (success) {
        Alert.alert('Bienvenue dans Premium ! 🎉', 'Toutes les fonctionnalités sont débloquées.', [
          { text: 'Profitez !', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Achat annulé', 'Veuillez réessayer ou restaurer votre achat.');
      }
    } catch {
      Alert.alert('Erreur', 'Un problème est survenu. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert('Restauré !', 'Votre accès Premium a été restauré.');
      } else {
        Alert.alert('Rien à restaurer', 'Aucun achat trouvé pour ce compte.');
      }
    } finally {
      setLoading(false);
    }
  }

  function ctaLabel(): string {
    if (selectedPlan === 'monthly') return `S'abonner · ${getPriceString('monthly')}/mois`;
    if (selectedPlan === 'annual') return `S'abonner · ${getPriceString('annual')}/an`;
    return `Obtenir un accès à vie · ${getPriceString('lifetime')}`;
  }

  if (isPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.activeContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
          <Text style={[styles.activeTitle, { color: colors.text }]}>Premium Actif</Text>
          <Text style={[styles.activeDesc, { color: colors.textSecondary }]}>
            Toutes les fonctionnalités sont débloquées. Profitez de votre expérience sans publicité !
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.crownBadge}>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Eisenhower Pro</Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
            Débloquez l'expérience Eisenhower complète
          </Text>
        </View>

        {/* Countdown banner */}
        {countdown > 0 && (
          <View style={styles.promoBanner}>
            <Ionicons name="timer-outline" size={16} color="#fff" />
            <Text style={styles.promoText}>
              Offre nouveaux membres — expire dans{' '}
              <Text style={styles.promoTimer}>{formatCountdown(countdown)}</Text>
            </Text>
          </View>
        )}

        {/* Comparison table */}
        <View style={[styles.tableCard, { backgroundColor: colors.surface }, Shadow.sm]}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1, color: colors.text }]}>Fonctionnalité</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary }]}>Gratuit</Text>
            <Text style={[styles.tableHeaderCell, { color: '#F59E0B' }]}>Pro</Text>
          </View>
          {COMPARISON.map((row, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                { borderTopColor: colors.borderLight },
                i === 0 && { borderTopWidth: 0 },
              ]}
            >
              <View style={styles.tableRowLabel}>
                <Ionicons name={row.icon} size={14} color={colors.textSecondary} />
                <Text style={[styles.tableRowText, { color: colors.text }]}>{row.label}</Text>
              </View>
              <View style={styles.tableRowCheck}>
                <Ionicons name="checkmark" size={16} color={row.free ? '#22C55E' : colors.borderLight} />
              </View>
              <View style={styles.tableRowCheck}>
                <Ionicons name="checkmark" size={16} color="#22C55E" />
              </View>
            </View>
          ))}
        </View>

        {/* Plan cards */}
        <View style={styles.plansSection}>
          <Text style={[styles.plansTitle, { color: colors.textSecondary }]}>CHOISISSEZ VOTRE PLAN</Text>
          <View style={styles.plansRow}>
            {/* Monthly */}
            <TouchableOpacity
              style={[
                styles.planCard,
                { backgroundColor: colors.surface, borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border },
                selectedPlan === 'monthly' && styles.planCardSelected,
                Shadow.sm,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.planName, { color: colors.text }]}>Mensuel</Text>
              <Text style={[styles.planPrice, { color: colors.text }]}>{getPriceString('monthly')}</Text>
              <Text style={[styles.planPer, { color: colors.textSecondary }]}>par mois</Text>
            </TouchableOpacity>

            {/* Annual */}
            <TouchableOpacity
              style={[
                styles.planCard,
                { backgroundColor: colors.surface, borderColor: selectedPlan === 'annual' ? colors.primary : colors.border },
                selectedPlan === 'annual' && styles.planCardSelected,
                Shadow.sm,
              ]}
              onPress={() => setSelectedPlan('annual')}
              activeOpacity={0.8}
            >
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>72% de réduction</Text>
              </View>
              <Text style={[styles.planName, { color: colors.text }]}>Annuel</Text>
              <Text style={[styles.planPrice, { color: colors.text }]}>{getPriceString('annual')}</Text>
              <Text style={[styles.planPer, { color: colors.textSecondary }]}>par an · 0,83 €/mois</Text>
            </TouchableOpacity>

            {/* Lifetime */}
            <TouchableOpacity
              style={[
                styles.planCard,
                { backgroundColor: colors.surface, borderColor: selectedPlan === 'lifetime' ? '#F59E0B' : colors.border },
                selectedPlan === 'lifetime' && styles.planCardLifetime,
                Shadow.sm,
              ]}
              onPress={() => setSelectedPlan('lifetime')}
              activeOpacity={0.8}
            >
              <View style={[styles.planBadge, styles.planBadgeGold]}>
                <Text style={styles.planBadgeText}>Recommandé</Text>
              </View>
              <Text style={[styles.planName, { color: colors.text }]}>À vie</Text>
              <Text style={[styles.planPrice, { color: colors.text }]}>{getPriceString('lifetime')}</Text>
              <Text style={[styles.planPer, { color: colors.textSecondary }]}>paiement unique</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.purchaseBtn, loading && { opacity: 0.7 }]}
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseBtnText}>{ctaLabel()}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestore} disabled={loading} style={styles.restoreBtn}>
            <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
              Restaurer un achat
            </Text>
          </TouchableOpacity>

          <View style={styles.legalRow}>
            <Text style={[styles.legalText, { color: colors.textTertiary }]}>Conditions d'utilisation</Text>
            <Text style={[styles.legalDot, { color: colors.textTertiary }]}>·</Text>
            <Text style={[styles.legalText, { color: colors.textTertiary }]}>Politique de confidentialité</Text>
          </View>
        </View>

        {__DEV__ && (
          <TouchableOpacity
            style={[styles.devBtn, { borderColor: colors.border }]}
            onPress={handlePurchase}
          >
            <Text style={[styles.devBtnText, { color: colors.textTertiary }]}>[DEV] Débloquer gratuitement</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  scrollContent: { paddingBottom: Spacing.xxxl },

  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
  crownBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  crownEmoji: { fontSize: sp(32) },
  heroTitle: { fontSize: sp(28), fontWeight: '800', letterSpacing: -0.5, marginBottom: Spacing.xs },
  heroDesc: { ...Typography.callout, textAlign: 'center' },

  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#EF4444',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  promoText: { ...Typography.caption1, color: '#fff', flex: 1 },
  promoTimer: { fontWeight: '800', letterSpacing: 1 },

  tableCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tableHeaderCell: { ...Typography.caption2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', width: 44 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tableRowLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tableRowText: { ...Typography.caption1, flex: 1 },
  tableRowCheck: { width: 44, alignItems: 'center' },

  plansSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  plansTitle: { ...Typography.caption2, fontWeight: '700', letterSpacing: 0.8, marginBottom: Spacing.sm },
  plansRow: { flexDirection: 'row', gap: Spacing.sm },
  planCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 3,
  },
  planCardSelected: { borderWidth: 2 },
  planCardLifetime: { borderColor: '#F59E0B', borderWidth: 2 },
  planBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  planBadgeGold: { backgroundColor: '#F59E0B' },
  planBadgeText: { ...Typography.caption2, color: '#fff', fontWeight: '700' },
  planName: { ...Typography.caption1, fontWeight: '700' },
  planPrice: { fontSize: sp(16), fontWeight: '800', letterSpacing: -0.5 },
  planPer: { ...Typography.caption2, textAlign: 'center' },

  ctaSection: {
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  purchaseBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  purchaseBtnText: { color: '#FFFFFF', ...Typography.headline, fontWeight: '700' },
  restoreBtn: { paddingVertical: Spacing.sm, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  restoreText: { ...Typography.callout },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legalText: { ...Typography.caption2 },
  legalDot: { ...Typography.caption2 },

  activeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  activeTitle: { fontSize: sp(26), fontWeight: '800' },
  activeDesc: { ...Typography.subhead, textAlign: 'center', lineHeight: sp(22) },

  devBtn: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  devBtnText: { ...Typography.caption1 },
});
