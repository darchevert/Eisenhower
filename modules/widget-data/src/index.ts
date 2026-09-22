import { Platform } from 'react-native';

let NativeWidgetData: {
  setTasks: (json: string) => Promise<void>;
  setWidgetData: (json: string) => Promise<void>;
} | null = null;

if (Platform.OS === 'ios') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    NativeWidgetData = requireNativeModule('WidgetData');
  } catch {}
}

export const WidgetDataModule = {
  async setTasks(json: string): Promise<void> {
    if (NativeWidgetData) {
      await NativeWidgetData.setTasks(json);
    }
  },
  async setWidgetData(json: string): Promise<void> {
    if (NativeWidgetData) {
      await NativeWidgetData.setWidgetData(json);
    }
  },
};
