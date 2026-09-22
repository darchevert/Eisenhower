import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import { useSettingsStore } from '@/store/settingsStore';
import { AdConfig } from './AdConfig';

const FOUR_HOURS = 4 * 60 * 60 * 1000;

const ad = AppOpenAd.createForAdRequest(AdConfig.appOpen, {
  requestNonPersonalizedAdsOnly: true,
});

export function useAppOpen() {
  const isPremium = useSettingsStore((s) => s.isPremium);
  const loaded = useRef(false);
  const lastShown = useRef(0);

  useEffect(() => {
    if (isPremium) return;

    const unsubLoad = ad.addAdEventListener(AdEventType.LOADED, () => {
      loaded.current = true;
    });
    const unsubClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loaded.current = false;
      lastShown.current = Date.now();
      ad.load();
    });

    ad.load();

    return () => {
      unsubLoad();
      unsubClose();
    };
  }, [isPremium]);

  useEffect(() => {
    if (isPremium) return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && loaded.current && Date.now() - lastShown.current >= FOUR_HOURS) {
        ad.show();
      }
    });

    return () => subscription.remove();
  }, [isPremium]);
}
