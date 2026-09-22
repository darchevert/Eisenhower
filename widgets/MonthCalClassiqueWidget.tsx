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

export function MonthCalClassiqueWidget({ events }: Props) {
  const now = new Date();
  const today = now.getDate();
  const monthLabel = MONTH_NAMES_FR[now.getMonth()].toUpperCase();
  const year = now.getFullYear();
  const rows = buildCalendarRows(now);

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
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TextWidget text={monthLabel} style={{ color: TEXT, fontSize: 14, fontWeight: 'bold', flex: 1 }} maxLines={1} />
        <TextWidget text={`${year}`} style={{ color: SECONDARY, fontSize: 11 }} maxLines={1} />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', marginBottom: 4 }}>
        {DAY_LETTERS.map((l, i) => (
          <FlexWidget key={i} style={{ flex: 1, alignItems: 'center' }}>
            <TextWidget text={l} style={{ color: SECONDARY, fontSize: 9, fontWeight: 'bold' }} maxLines={1} />
          </FlexWidget>
        ))}
      </FlexWidget>

      {rows.map((row, ri) => (
        <FlexWidget key={ri} style={{ flexDirection: 'row', marginBottom: 3 }}>
          {Array(7).fill(null).map((_, ci) => {
            const day = row[ci] ?? null;
            const isToday = day === today;
            const hasEvent = day ? (eventsByDay.get(day) ?? []).length > 0 : false;

            return (
              <FlexWidget key={ci} style={{ flex: 1, alignItems: 'center' }}>
                <FlexWidget style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isToday ? TODAY_BG : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  <TextWidget
                    text={day !== null ? `${day}` : ''}
                    style={{ color: isToday ? '#FFFFFF' : (hasEvent ? '#22C55E' : TEXT), fontSize: 11, fontWeight: hasEvent ? 'bold' : 'normal' }}
                    maxLines={1}
                  />
                </FlexWidget>
              </FlexWidget>
            );
          })}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
