import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd as RNBannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AdConfig } from './AdConfig';
import { useSettingsStore } from '@/store/settingsStore';

export function BannerAd() {
  const isPremium = useSettingsStore((s) => s.isPremium);
  if (isPremium) return null;

  return (
    <View style={styles.container}>
      <RNBannerAd
        unitId={AdConfig.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
