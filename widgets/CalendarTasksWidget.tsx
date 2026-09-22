import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from '../src/services/widgetService';

interface Props {
  data: WidgetData;
}

const BG = '#0F172A';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';
const DIVIDER = '#1E293B';
const TODAY_COLOR = '#22C55E';

const Q_CONFIG = [
  { key: 'q1' as const, label: 'Important & Urgent',          color: '#EF4444' },
  { key: 'q2' as const, label: 'Important & Non urgent',      color: '#22C55E' },
  { key: 'q3' as const, label: 'Urgent & Moins important',    color: '#F59E0B' },
  { key: 'q4' as const, label: 'Non urgent & moins import.',  color: '#64748B' },
];

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function buildCalendarDays(date: Date): (number | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function CalendarTasksWidget({ data }: Props) {
  const now = new Date();
  const today = now.getDate();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const cells = buildCalendarDays(now);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        backgroundColor: BG,
        borderRadius: 16,
      }}
      clickAction="OPEN_APP"
    >
      {/* Left: mini calendar */}
      <FlexWidget style={{ flexDirection: 'column', padding: 10, width: 160 }}>
        <TextWidget text={monthLabel} style={{ color: SECONDARY, fontSize: 9, fontWeight: 'bold', marginBottom: 4 }} maxLines={1} />

        {/* Day-of-week header */}
        <FlexWidget style={{ flexDirection: 'row', marginBottom: 2 }}>
          {DAY_LETTERS.map((l, i) => (
            <FlexWidget key={i} style={{ flex: 1, alignItems: 'center' }}>
              <TextWidget text={l} style={{ color: SECONDARY, fontSize: 7 }} maxLines={1} />
            </FlexWidget>
          ))}
        </FlexWidget>

        {/* Day grid */}
        {rows.map((row, ri) => (
          <FlexWidget key={ri} style={{ flexDirection: 'row', marginBottom: 1 }}>
            {Array(7).fill(null).map((_, ci) => {
              const day = row[ci] ?? null;
              const isToday = day === today;
              return (
                <FlexWidget
                  key={ci}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? TODAY_COLOR : 'transparent',
                    borderRadius: 7,
                  }}
                >
                  <TextWidget
                    text={day !== null ? `${day}` : ''}
                    style={{ color: isToday ? '#FFFFFF' : TEXT, fontSize: 8 }}
                    maxLines={1}
                  />
                </FlexWidget>
              );
            })}
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Vertical divider */}
      <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />

      {/* Right: quadrant sections */}
      <FlexWidget style={{ flex: 1, flexDirection: 'column', padding: 10 }}>
        {Q_CONFIG.map((q) => {
          const tasks = data[q.key];
          const first = tasks[0];
          return (
            <FlexWidget key={q.key} style={{ flexDirection: 'column', marginBottom: 6 }}>
              <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <FlexWidget style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: q.color, marginRight: 4 }} />
                <TextWidget text={q.label} style={{ color: q.color, fontSize: 8, fontWeight: 'bold', flex: 1 }} maxLines={1} />
                <FlexWidget style={{ backgroundColor: q.color, borderRadius: 6, paddingHorizontal: 3, paddingVertical: 1 }}>
                  <TextWidget text={`${tasks.length}`} style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' }} maxLines={1} />
                </FlexWidget>
              </FlexWidget>
              {first && (
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 9 }}>
                  <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: q.color + '99', marginRight: 4 }} />
                  <TextWidget text={first.title} style={{ color: TEXT, fontSize: 9, flex: 1 }} maxLines={1} />
                </FlexWidget>
              )}
              {tasks.length === 0 && (
                <TextWidget text="—" style={{ color: SECONDARY, fontSize: 9, marginLeft: 9 }} maxLines={1} />
              )}
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
}
