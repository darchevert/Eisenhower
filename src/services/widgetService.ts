import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_DATA_KEY = '@eisenhower/widget_data';
const WIDGET_TASKS_KEY = '@eisenhower/widget_tasks'; // legacy Q1-only key

export interface WidgetTaskData {
  id: string;
  title: string;
}

export interface WidgetData {
  q1: WidgetTaskData[];
  q2: WidgetTaskData[];
  q3: WidgetTaskData[];
  q4: WidgetTaskData[];
}

export const WidgetService = {
  async syncAll(data: WidgetData): Promise<void> {
    const json = JSON.stringify(data);
    await AsyncStorage.setItem(WIDGET_DATA_KEY, json);
    // Keep legacy key so old Q1-only widget instances still work
    await AsyncStorage.setItem(WIDGET_TASKS_KEY, JSON.stringify(data.q1));

    if (Platform.OS === 'android') {
      await syncAndroid(data);
    } else if (Platform.OS === 'ios') {
      await syncIOS(json);
    }
  },
};

async function syncAndroid(data: WidgetData): Promise<void> {
  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const React = require('react');
    const { EisenhowerWidget } = require('../../widgets/EisenhowerWidget');
    const { Q2Widget } = require('../../widgets/Q2Widget');
    const { Q3Widget } = require('../../widgets/Q3Widget');
    const { Q4Widget } = require('../../widgets/Q4Widget');
    const { MatrixOverviewWidget } = require('../../widgets/MatrixOverviewWidget');

    const updates = [
      { widgetName: 'Eisenhower', component: EisenhowerWidget, props: { tasks: data.q1 } },
      { widgetName: 'EisenhowerQ2', component: Q2Widget, props: { tasks: data.q2 } },
      { widgetName: 'EisenhowerQ3', component: Q3Widget, props: { tasks: data.q3 } },
      { widgetName: 'EisenhowerQ4', component: Q4Widget, props: { tasks: data.q4 } },
      { widgetName: 'EisenhowerMatrix', component: MatrixOverviewWidget, props: { data } },
    ];

    await Promise.all(
      updates.map(({ widgetName, component, props }) =>
        requestWidgetUpdate({
          widgetName,
          renderWidget: () => React.createElement(component, props),
          widgetNotFound: () => {},
        }).catch(() => {})
      )
    );
  } catch {
    // Widget not installed on device — safe to ignore
  }
}

async function syncIOS(json: string): Promise<void> {
  try {
    const { WidgetDataModule } = require('../../modules/widget-data/src');
    await WidgetDataModule.setWidgetData(json);
  } catch {
    // Native module not available in Expo Go — safe to ignore
  }
}
