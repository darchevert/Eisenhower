import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/Theme';
import { useSettingsStore } from '@/store/settingsStore';
import { t } from '@/i18n';

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  title: string;
  body: string;
}

export function OnboardingScreen() {
  const { colors, getQuadrantStyle } = useTheme();
  const markOnboardingDone = useSettingsStore((s) => s.markOnboardingDone);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const q1 = getQuadrantStyle('q1');
  const q2 = getQuadrantStyle('q2');
  const q3 = getQuadrantStyle('q3');

  const slides: Slide[] = [
    {
      icon: 'grid-outline',
      iconColor: colors.primary,
      bgColor: colors.background,
      title: t('onboarding.slide1Title'),
      body: t('onboarding.slide1Body'),
    },
    {
      icon: 'flash',
      iconColor: q1.accent,
      bgColor: q1.bg,
      title: t('onboarding.slide2Title'),
      body: t('onboarding.slide2Body'),
    },
    {
      icon: 'calendar-outline',
      iconColor: q2.accent,
      bgColor: q2.bg,
      title: t('onboarding.slide3Title'),
      body: t('onboarding.slide3Body'),
    },
    {
      icon: 'git-branch-outline',
      iconColor: q3.accent,
      bgColor: colors.background,
      title: t('onboarding.slide4Title'),
      body: t('onboarding.slide4Body'),
    },
  ];

  const isLast = currentIndex === slides.length - 1;

  function goNext() {
    if (isLast) {
      markOnboardingDone();
    } else {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
      setCurrentIndex(next);
    }
  }

  function handleScroll(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentIndex(idx);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={markOnboardingDone}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_W }]}>
            <View style={[styles.iconCircle, { backgroundColor: slide.bgColor }]}>
              <Ionicons name={slide.icon} size={72} color={slide.iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentIndex ? colors.primary : colors.border,
                width: i === currentIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom button */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.primary, marginBottom: insets.bottom + 24 }]}
        onPress={goNext}
        activeOpacity={0.85}
      >
        <Text style={styles.nextText}>
          {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
        </Text>
        {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    width: SCREEN_W,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  iconCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    width: SCREEN_W - 48,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
