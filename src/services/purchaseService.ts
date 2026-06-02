import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

const PRODUCT_ID =
  process.env.EXPO_PUBLIC_IAP_PREMIUM_ID ?? 'com.darchevert.eisenhower.premium';

export const PurchaseService = {
  /**
   * Trigger the native purchase flow.
   * Returns true if the purchase completed successfully.
   */
  async purchase(): Promise<boolean> {
    // Dev shortcut — unlock instantly without going through the store
    if (__DEV__) {
      useSettingsStore.getState().setPremium(true);
      return true;
    }

    let connection = false;
    try {
      await initConnection();
      connection = true;

      return await new Promise<boolean>((resolve) => {
        const updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
          try {
            if (purchase.transactionReceipt) {
              await finishTransaction({ purchase, isConsumable: false });
              useSettingsStore.getState().setPremium(true);
              updateSub.remove();
              errorSub.remove();
              resolve(true);
            }
          } catch {
            updateSub.remove();
            errorSub.remove();
            resolve(false);
          }
        });

        const errorSub = purchaseErrorListener((_err: PurchaseError) => {
          updateSub.remove();
          errorSub.remove();
          resolve(false);
        });

        // Trigger the purchase request
        const purchaseParams =
          Platform.OS === 'android'
            ? { skus: [PRODUCT_ID] }
            : { sku: PRODUCT_ID, andDangerouslyFinishTransactionAutomaticallyIOS: false };

        requestPurchase(purchaseParams as any).catch(() => {
          updateSub.remove();
          errorSub.remove();
          resolve(false);
        });
      });
    } catch {
      return false;
    } finally {
      if (connection) {
        try { await endConnection(); } catch { /* ignore */ }
      }
    }
  },

  /**
   * Restore previous purchases (App Store / Play Store).
   * Returns true if a valid premium purchase was found.
   */
  async restore(): Promise<boolean> {
    if (__DEV__) return false;

    let connection = false;
    try {
      await initConnection();
      connection = true;

      const purchases = await getAvailablePurchases();
      const hasPremium = purchases.some((p) => p.productId === PRODUCT_ID);

      if (hasPremium) {
        useSettingsStore.getState().setPremium(true);
      }

      return hasPremium;
    } catch {
      return false;
    } finally {
      if (connection) {
        try { await endConnection(); } catch { /* ignore */ }
      }
    }
  },

  getProductId(): string {
    return PRODUCT_ID;
  },
};
