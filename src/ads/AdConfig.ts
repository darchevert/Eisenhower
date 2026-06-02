import { Platform } from 'react-native';

const TEST_IDS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
};

const PROD_IDS = {
  banner: Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_IOS ?? TEST_IDS.banner)
    : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID ?? TEST_IDS.banner),

  interstitial: Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS ?? TEST_IDS.interstitial)
    : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID ?? TEST_IDS.interstitial),
};

export const AdConfig = {
  banner: __DEV__ ? TEST_IDS.banner : PROD_IDS.banner,
  interstitial: __DEV__ ? TEST_IDS.interstitial : PROD_IDS.interstitial,
  interstitialTriggerCount: 5,
} as const;
