import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EisenhowerWidget, type WidgetTask } from './EisenhowerWidget';
import { Q2Widget } from './Q2Widget';
import { Q3Widget } from './Q3Widget';
import { Q4Widget } from './Q4Widget';
import { MatrixOverviewWidget } from './MatrixOverviewWidget';
import { DashboardWidget } from './DashboardWidget';
import { DoubleSectionWidget } from './DoubleSectionWidget';
import { DateTasksWidget } from './DateTasksWidget';
import { CalendarTasksWidget } from './CalendarTasksWidget';
import { TodayWidget } from './TodayWidget';
import { UpcomingWidget } from './UpcomingWidget';
import { BoardWidget } from './BoardWidget';
import type { WidgetData } from '../src/services/widgetService';

const WIDGET_DATA_KEY = '@eisenhower/widget_data';
const WIDGET_TASKS_KEY = '@eisenhower/widget_tasks';

async function loadWidgetData(): Promise<WidgetData> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (json) return JSON.parse(json) as WidgetData;

    const legacy = await AsyncStorage.getItem(WIDGET_TASKS_KEY);
    if (legacy) {
      const q1 = JSON.parse(legacy) as WidgetTask[];
      return { q1, q2: [], q3: [], q4: [] };
    }
  } catch {}
  return { q1: [], q2: [], q3: [], q4: [] };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget, widgetInfo } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await loadWidgetData();
      const name = widgetInfo.widgetName;

      if (name === 'EisenhowerQ2') {
        renderWidget(React.createElement(Q2Widget, { tasks: data.q2 }));
      } else if (name === 'EisenhowerQ3') {
        renderWidget(React.createElement(Q3Widget, { tasks: data.q3 }));
      } else if (name === 'EisenhowerQ4') {
        renderWidget(React.createElement(Q4Widget, { tasks: data.q4 }));
      } else if (name === 'EisenhowerMatrix') {
        renderWidget(React.createElement(MatrixOverviewWidget, { data }));
      } else if (name === 'EisenhowerDashboard') {
        renderWidget(React.createElement(DashboardWidget, { data }));
      } else if (name === 'EisenhowerDouble') {
        renderWidget(React.createElement(DoubleSectionWidget, { q1Tasks: data.q1, q2Tasks: data.q2 }));
      } else if (name === 'EisenhowerDateTasks') {
        renderWidget(React.createElement(DateTasksWidget, { data }));
      } else if (name === 'EisenhowerCalendarTasks') {
        renderWidget(React.createElement(CalendarTasksWidget, { data }));
      } else if (name === 'EisenhowerToday') {
        renderWidget(React.createElement(TodayWidget, { data }));
      } else if (name === 'EisenhowerUpcoming') {
        renderWidget(React.createElement(UpcomingWidget, { data }));
      } else if (name === 'EisenhowerBoard') {
        renderWidget(React.createElement(BoardWidget, { data }));
      } else {
        renderWidget(React.createElement(EisenhowerWidget, { tasks: data.q1 }));
      }
      break;
    }
    case 'WIDGET_CLICK':
      break;
    default:
      break;
  }
}
