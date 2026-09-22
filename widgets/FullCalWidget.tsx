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

function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function FullCalWidget({ events }: Props) {
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
      <TextWidget text={monthLabel} style={{ color: TEXT, fontSize: 13, fontWeight: 'bold', marginBottom: 6 }} maxLines={1} />

      {/* Day header */}
      <FlexWidget style={{ flexDirection: 'row', marginBottom: 4 }}>
        {DAY_LETTERS.map((l, i) => (
          <FlexWidget key={i} style={{ flex: 1, alignItems: 'center' }}>
            <TextWidget text={l} style={{ color: SECONDARY, fontSize: 9, fontWeight: 'bold' }} maxLines={1} />
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Day rows with event labels */}
      {rows.map((row, ri) => (
        <FlexWidget key={ri} style={{ flexDirection: 'row', flex: 1 }}>
          {Array(7).fill(null).map((_, ci) => {
            const day = row[ci] ?? null;
            const isToday = day === today;
            const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];

            return (
              <FlexWidget key={ci} style={{ flex: 1, flexDirection: 'column', alignItems: 'center', paddingHorizontal: 1 }}>
                {/* Day number */}
                <FlexWidget style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: isToday ? TODAY_BG : 'transparent', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                  <TextWidget
                    text={day !== null ? `${day}` : ''}
                    style={{ color: isToday ? '#FFFFFF' : TEXT, fontSize: 10, fontWeight: isToday ? 'bold' : 'normal' }}
                    maxLines={1}
                  />
                </FlexWidget>

                {/* First event pill */}
                {dayEvents.slice(0, 1).map((ev, i) => (
                  <FlexWidget key={i} style={{ width: 'match_parent', backgroundColor: ev.color, borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1, marginBottom: 1 }}>
                    <TextWidget
                      text={ev.allDay ? ev.title : `${formatTime(ev.startDate)} ${ev.title}`}
                      style={{ color: '#FFFFFF', fontSize: 7, fontWeight: 'bold' }}
                      maxLines={1}
                    />
                  </FlexWidget>
                ))}

                {/* Overflow indicator */}
                {dayEvents.length > 1 && (
                  <TextWidget text={`+${dayEvents.length - 1}`} style={{ color: SECONDARY, fontSize: 7 }} maxLines={1} />
                )}
              </FlexWidget>
            );
          })}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
