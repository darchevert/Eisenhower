import { useSettingsStore } from '@/store/settingsStore';
import { PurchaseService } from '@/services/purchaseService';

export function usePremium() {
  const isPremium = useSettingsStore((s) => s.isPremium);
  const setPremium = useSettingsStore((s) => s.setPremium);

  async function purchase(): Promise<boolean> {
    const success = await PurchaseService.purchase();
    if (success) setPremium(true);
    return success;
  }

  async function restore(): Promise<boolean> {
    const success = await PurchaseService.restore();
    if (success) setPremium(true);
    return success;
  }

  return { isPremium, purchase, restore };
}
