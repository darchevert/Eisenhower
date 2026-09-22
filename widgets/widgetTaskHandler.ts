import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EisenhowerWidget, type WidgetTask } from './EisenhowerWidget';

const WIDGET_TASKS_KEY = '@eisenhower/widget_tasks';

async function loadTasks(): Promise<WidgetTask[]> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_TASKS_KEY);
    if (!json) return [];
    return JSON.parse(json) as WidgetTask[];
  } catch {
    return [];
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget, widgetInfo } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const tasks = await loadTasks();
      renderWidget(React.createElement(EisenhowerWidget, { tasks }));
      break;
    }
    case 'WIDGET_CLICK':
      // Android handles OPEN_APP action via clickAction prop — no extra code needed
      break;
    default:
      break;
  }
}
