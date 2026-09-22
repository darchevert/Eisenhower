import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/Theme';
import { usePremium } from '@/hooks/usePremium';
import { PurchaseService } from '@/services/purchaseService';
import { Spacing, Radius, Shadow, Typography, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { sp } from '@/utils/scale';

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { icon: 'color-palette', title: '8 Premium Themes', desc: 'Ocean, Forest, Sunset, Midnight, Rose Gold & more' },
  { icon: 'bar-chart', title: 'Productivity Stats', desc: 'Weekly charts, streak tracker & Q1/Q2 balance score' },
  { icon: 'grid', title: 'Multiple Matrices', desc: 'Separate matrices for Work, Personal, Projects…' },
  { icon: 'repeat', title: 'Recurring Tasks', desc: 'Daily, weekly or monthly task recurrence' },
  { icon: 'phone-portrait', title: 'Home Screen Widget', desc: 'Your Q1 & Q2 tasks right on your home screen' },
  { icon: 'document', title: 'Export to PDF', desc: 'Share or print your matrix anytime' },
  { icon: 'calendar', title: 'Weekly Review', desc: 'Sunday evening guided 2-minute review ritual' },
  { icon: 'eye-off', title: 'Focus Mode', desc: 'Hide Q3 & Q4, focus only on what matters' },
  { icon: 'ban', title: 'No Ads', desc: 'Clean, distraction-free experience forever' },
];

export function PremiumScreen() {
  const { colors } = useTheme();
  const { isPremium, purchase, restore } = usePremium();
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    PurchaseService.getPackage().then((pkg) => {
      if (pkg) setPrice(pkg.product.priceString);
    });
  }, []);

  async function handlePurchase() {
    setLoading(true);
    try {
      const success = await purchase();
      if (success) {
        Alert.alert('Welcome to Premium! 🎉', 'All features are now unlocked.', [
          { text: 'Enjoy!', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Purchase failed', 'Please try again or restore your purchase.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert('Restored!', 'Your premium access has been restored.');
      } else {
        Alert.alert('Nothing to restore', 'No previous purchase found for this account.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (isPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.activeContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
          <Text style={[styles.activeTitle, { color: colors.text }]}>Premium Active</Text>
          <Text style={[styles.activeDesc, { color: colors.textSecondary }]}>
            All features are unlocked. Enjoy your ad-free experience!
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.starBadge}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.starText}>PREMIUM</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Master Your{'\n'}Priorities
          </Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
            One-time purchase · No subscription · Lifetime access
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={[styles.featureRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color="#F59E0B" />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
              </View>
              <Ionicons name="checkmark" size={16} color="#22C55E" />
            </View>
          ))}
        </View>

        {/* Price & CTA */}
        <View style={[styles.ctaCard, { backgroundColor: colors.surface }, Shadow.md]}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.text }]}>{price ?? '$4.99'}</Text>
            <Text style={[styles.priceNote, { color: colors.textSecondary }]}>one-time · forever</Text>
          </View>

          <TouchableOpacity
            style={[styles.purchaseBtn, loading && { opacity: 0.7 }]}
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="star" size={18} color="#FFFFFF" />
                <Text style={styles.purchaseBtnText}>Unlock Premium</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestore} disabled={loading} style={styles.restoreBtn}>
            <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
              Restore Purchase
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.legalText, { color: colors.textTertiary }]}>
          Payment will be charged to your account at purchase confirmation.
          No recurring charges.
        </Text>

        {__DEV__ && (
          <TouchableOpacity
            style={[styles.devBtn, { borderColor: colors.border }]}
            onPress={handlePurchase}
          >
            <Text style={[styles.devBtnText, { color: colors.textTertiary }]}>
              [DEV] Unlock free
            </Text>
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
  hero: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl, paddingBottom: Spacing.xl },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  starText: { ...Typography.caption2, fontWeight: '800', color: '#D97706', letterSpacing: 1 },
  heroTitle: { fontSize: sp(32), fontWeight: '800', textAlign: 'center', lineHeight: sp(40), letterSpacing: -1 },
  heroDesc: { ...Typography.callout, textAlign: 'center', marginTop: Spacing.sm },
  featuresContainer: { marginHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { ...Typography.callout, fontWeight: '600' },
  featureDesc: { ...Typography.caption1, marginTop: 2 },
  ctaCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  priceRow: { alignItems: 'center' },
  price: { fontSize: sp(42), fontWeight: '800', letterSpacing: -1 },
  priceNote: { ...Typography.callout, marginTop: 2 },
  purchaseBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#F59E0B',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  purchaseBtnText: { color: '#FFFFFF', ...Typography.headline, fontWeight: '700' },
  restoreBtn: { paddingVertical: Spacing.sm, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  restoreText: { ...Typography.callout },
  legalText: { ...Typography.caption2, textAlign: 'center', marginHorizontal: Spacing.xl, lineHeight: sp(16) },
  activeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  activeTitle: { fontSize: sp(26), fontWeight: '800' },
  activeDesc: { ...Typography.subhead, textAlign: 'center', lineHeight: sp(22) },
  devBtn: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
  devBtnText: { ...Typography.caption1 },
});
