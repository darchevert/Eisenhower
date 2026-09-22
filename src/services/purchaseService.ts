import Purchases, {
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

const ENTITLEMENT_ID = 'premium';

const API_KEY =
  Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '')
    : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '');

export const PurchaseService = {
  configure(): void {
    if (Platform.OS === 'web') return;
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    if (API_KEY) {
      Purchases.configure({ apiKey: API_KEY });
    }
  },

  async getOffering(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current ?? null;
    } catch {
      return null;
    }
  },

  async getPackage(): Promise<PurchasesPackage | null> {
    const offering = await PurchaseService.getOffering();
    return offering?.availablePackages[0] ?? null;
  },

  async purchase(): Promise<boolean> {
    if (__DEV__) {
      useSettingsStore.getState().setPremium(true);
      return true;
    }
    try {
      const pkg = await PurchaseService.getPackage();
      if (!pkg) return false;
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      if (active) useSettingsStore.getState().setPremium(true);
      return active;
    } catch (e: any) {
      if (e?.userCancelled) return false;
      throw e;
    }
  },

  async restore(): Promise<boolean> {
    if (__DEV__) return false;
    try {
      const customerInfo = await Purchases.restorePurchases();
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      if (active) useSettingsStore.getState().setPremium(true);
      return active;
    } catch {
      return false;
    }
  },

  async checkStatus(): Promise<void> {
    if (__DEV__) return;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      useSettingsStore.getState().setPremium(active);
    } catch {}
  },

  async loginAsUser(userId: string): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      if (active) useSettingsStore.getState().setPremium(true);
      return active;
    } catch {
      return false;
    }
  },

  getProductId(): string {
    return 'com.darchevert.eisenhower.premium';
  },
};
