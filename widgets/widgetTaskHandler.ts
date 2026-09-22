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
import { MonthCalDefaultWidget } from './MonthCalDefaultWidget';
import { MonthCalBlocWidget } from './MonthCalBlocWidget';
import { MonthCalClassiqueWidget } from './MonthCalClassiqueWidget';
import { ScheduleWidget } from './ScheduleWidget';
import { FullCalWidget } from './FullCalWidget';
import type { CalEvent } from './calendarTypes';
import type { WidgetData } from '../src/services/widgetService';

const WIDGET_DATA_KEY = '@eisenhower/widget_data';
const WIDGET_TASKS_KEY = '@eisenhower/widget_tasks';

async function loadCalendarEvents(): Promise<CalEvent[]> {
  try {
    const Calendar = require('expo-calendar');
    const { status } = await Calendar.getCalendarPermissionsAsync();
    if (status !== 'granted') return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarIds = calendars.map((c: { id: string }) => c.id);
    const rawEvents = await Calendar.getEventsAsync(calendarIds, startOfMonth, endOfMonth);
    return rawEvents.map((ev: {
      id: string; title: string; startDate: string; endDate: string; allDay: boolean; color?: string
    }) => ({
      id: ev.id,
      title: ev.title ?? '',
      startDate: ev.startDate,
      endDate: ev.endDate,
      allDay: ev.allDay ?? false,
      color: ev.color ?? '#22C55E',
    } as CalEvent));
  } catch {
    return [];
  }
}

function todayEvents(events: CalEvent[]): CalEvent[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 86400000;
  return events.filter(ev => {
    const t = new Date(ev.startDate).getTime();
    return t >= start && t < end;
  });
}

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
      const isCalWidget = ['EisenhowerMonthDefault','EisenhowerMonthBloc','EisenhowerMonthClassique','EisenhowerSchedule','EisenhowerFullCal'].includes(name);
      const calEvents = isCalWidget ? await loadCalendarEvents() : [];

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
      } else if (name === 'EisenhowerMonthDefault') {
        renderWidget(React.createElement(MonthCalDefaultWidget, { events: calEvents }));
      } else if (name === 'EisenhowerMonthBloc') {
        renderWidget(React.createElement(MonthCalBlocWidget, { events: calEvents }));
      } else if (name === 'EisenhowerMonthClassique') {
        renderWidget(React.createElement(MonthCalClassiqueWidget, { events: calEvents }));
      } else if (name === 'EisenhowerSchedule') {
        renderWidget(React.createElement(ScheduleWidget, { events: todayEvents(calEvents) }));
      } else if (name === 'EisenhowerFullCal') {
        renderWidget(React.createElement(FullCalWidget, { events: calEvents }));
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
