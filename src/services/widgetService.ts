import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_TASKS_KEY = '@eisenhower/widget_tasks';

export interface WidgetTaskData {
  id: string;
  title: string;
}

export const WidgetService = {
  async sync(tasks: WidgetTaskData[]): Promise<void> {
    const top5 = tasks.slice(0, 5);
    const json = JSON.stringify(top5);

    // Both platforms read from AsyncStorage via the widget task handler
    await AsyncStorage.setItem(WIDGET_TASKS_KEY, json);

    if (Platform.OS === 'android') {
      await syncAndroid(top5);
    } else if (Platform.OS === 'ios') {
      await syncIOS(json);
    }
  },
};

async function syncAndroid(tasks: WidgetTaskData[]): Promise<void> {
  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const { EisenhowerWidget } = require('../../widgets/EisenhowerWidget');
    const React = require('react');
    await requestWidgetUpdate({
      widgetName: 'Eisenhower',
      renderWidget: () => React.createElement(EisenhowerWidget, { tasks }),
      widgetNotFound: () => {},
    });
  } catch {
    // Widget not installed on device or no instances — safe to ignore
  }
}

async function syncIOS(json: string): Promise<void> {
  try {
    const { WidgetDataModule } = require('../../modules/widget-data/src');
    await WidgetDataModule.setTasks(json);
  } catch {
    // Native module not available in Expo Go — safe to ignore
  }
}
