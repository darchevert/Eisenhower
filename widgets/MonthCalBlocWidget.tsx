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

function hexWithOpacity(hex: string, opacity: number): string {
  // Returns hex with alpha — Android supports #AARRGGBB but FlexWidget uses rgba-style strings
  // Keep it simple: just return the original color (widget lib may not support rgba)
  return hex;
}

export function MonthCalBlocWidget({ events }: Props) {
  const now = new Date();
  const today = now.getDate();
  const monthLabel = `${MONTH_NAMES_FR[now.getMonth()]} ${now.getFullYear()}`;
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
      <TextWidget text={monthLabel} style={{ color: TEXT, fontSize: 12, fontWeight: 'bold', marginBottom: 6 }} maxLines={1} />

      <FlexWidget style={{ flexDirection: 'row', marginBottom: 3 }}>
        {DAY_LETTERS.map((l, i) => (
          <FlexWidget key={i} style={{ flex: 1, alignItems: 'center' }}>
            <TextWidget text={l} style={{ color: SECONDARY, fontSize: 8 }} maxLines={1} />
          </FlexWidget>
        ))}
      </FlexWidget>

      {rows.map((row, ri) => (
        <FlexWidget key={ri} style={{ flexDirection: 'row', marginBottom: 2 }}>
          {Array(7).fill(null).map((_, ci) => {
            const day = row[ci] ?? null;
            const isToday = day === today;
            const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
            const hasEvent = dayEvents.length > 0;
            const eventColor = hasEvent ? dayEvents[0].color : 'transparent';

            return (
              <FlexWidget
                key={ci}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 18,
                  backgroundColor: isToday ? TODAY_BG : (hasEvent ? eventColor + '40' : 'transparent'),
                  borderRadius: 4,
                  margin: 1,
                }}
              >
                <TextWidget
                  text={day !== null ? `${day}` : ''}
                  style={{ color: isToday ? '#FFFFFF' : TEXT, fontSize: 9 }}
                  maxLines={1}
                />
              </FlexWidget>
            );
          })}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
