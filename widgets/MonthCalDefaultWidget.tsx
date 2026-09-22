import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { CalEvent } from './calendarTypes';
import { DAY_LETTERS, MONTH_NAMES_FR } from './calendarTypes';

interface Props {
  events: CalEvent[];
}

const BG = '#0F172A';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';
const TODAY_BG = '#22C55E';

function buildCalendarRows(date: Date): (number | null)[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function MonthCalDefaultWidget({ events }: Props) {
  const now = new Date();
  const today = now.getDate();
  const monthLabel = `${MONTH_NAMES_FR[now.getMonth()]} ${now.getFullYear()}`;
  const rows = buildCalendarRows(now);

  // Group events by day-of-month
  const eventsByDay = new Map<number, CalEvent[]>();
  for (const ev of events) {
    const d = new Date(ev.startDate).getDate();
    if (!eventsByDay.has(d)) eventsByDay.set(d, []);
    eventsByDay.get(d)!.push(ev);
  }

  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', flexDirection: 'column', backgroundColor: BG, borderRadius: 16, padding: 12 }}
      clickAction="OPEN_APP"
    >
      <TextWidget text={monthLabel} style={{ color: TEXT, fontSize: 12, fontWeight: 'bold', marginBottom: 6 }} maxLines={1} />

      {/* Day header */}
      <FlexWidget style={{ flexDirection: 'row', marginBottom: 3 }}>
        {DAY_LETTERS.map((l, i) => (
          <FlexWidget key={i} style={{ flex: 1, alignItems: 'center' }}>
            <TextWidget text={l} style={{ color: SECONDARY, fontSize: 8 }} maxLines={1} />
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Day grid */}
      {rows.map((row, ri) => (
        <FlexWidget key={ri} style={{ flexDirection: 'row', marginBottom: 2 }}>
          {Array(7).fill(null).map((_, ci) => {
            const day = row[ci] ?? null;
            const isToday = day === today;
            const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
            return (
              <FlexWidget key={ci} style={{ flex: 1, alignItems: 'center', flexDirection: 'column' }}>
                <FlexWidget style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: isToday ? TODAY_BG : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  <TextWidget text={day !== null ? `${day}` : ''} style={{ color: isToday ? '#FFFFFF' : TEXT, fontSize: 9 }} maxLines={1} />
                </FlexWidget>
                {/* Event dots */}
                <FlexWidget style={{ flexDirection: 'row', height: 4 }}>
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <FlexWidget key={i} style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: ev.color, marginHorizontal: 1 }} />
                  ))}
                </FlexWidget>
              </FlexWidget>
            );
          })}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
