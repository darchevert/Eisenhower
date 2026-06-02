import { useEffect, useRef } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AdConfig } from './AdConfig';
import { useSettingsStore } from '@/store/settingsStore';

const ad = InterstitialAd.createForAdRequest(AdConfig.interstitial, {
  requestNonPersonalizedAdsOnly: true,
});

export function useInterstitial() {
  const loaded = useRef(false);
  const isPremium = useSettingsStore((s) => s.isPremium);

  useEffect(() => {
    if (isPremium) return;
    const unsubLoad = ad.addAdEventListener(AdEventType.LOADED, () => {
      loaded.current = true;
    });
    const unsubClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loaded.current = false;
      ad.load();
    });
    ad.load();
    return () => {
      unsubLoad();
      unsubClose();
    };
  }, [isPremium]);

  function showIfReady() {
    if (isPremium || !loaded.current) return;
    ad.show();
  }

  return { showIfReady };
}
