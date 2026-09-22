import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from '../src/services/widgetService';
import type { WidgetTask } from './EisenhowerWidget';

interface Props {
  data: WidgetData;
}

const BG = '#0F172A';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';
const DIVIDER = '#1E293B';
const TODAY_COLOR = '#22C55E';

const MONTH_NAMES_FR = [
  'JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN',
  'JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE',
];
const WEEKDAY_NAMES_FR = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const Q_CONFIG = [
  { key: 'q1' as const, label: 'Important & Urgent',       color: '#EF4444', icon: '🔥' },
  { key: 'q2' as const, label: 'Important & Non urgent',   color: '#22C55E', icon: '📅' },
  { key: 'q3' as const, label: 'Urgent & Moins import.',   color: '#F59E0B', icon: '⚡' },
  { key: 'q4' as const, label: 'Non urgent & Non import.', color: '#64748B', icon: '🗑' },
];

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

function QuadrantCell({ tasks, label, color, icon }: { tasks: WidgetTask[]; label: string; color: string; icon: string }) {
  const first = tasks[0];
  return (
    <FlexWidget style={{ flex: 1, flexDirection: 'column', padding: 8 }}>
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
        <TextWidget text={icon} style={{ fontSize: 9, marginRight: 3 }} maxLines={1} />
        <TextWidget text={label} style={{ color, fontSize: 8, fontWeight: 'bold', flex: 1 }} maxLines={1} />
        <TextWidget text={`${tasks.length}`} style={{ color, fontSize: 8, fontWeight: 'bold' }} maxLines={1} />
      </FlexWidget>
      {/* First task */}
      {first ? (
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget style={{ width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: color + '99', marginRight: 4 }} />
          <TextWidget text={first.title} style={{ color: TEXT, fontSize: 9, flex: 1 }} maxLines={1} />
        </FlexWidget>
      ) : (
        <TextWidget text="—" style={{ color: SECONDARY, fontSize: 9 }} maxLines={1} />
      )}
    </FlexWidget>
  );
}

export function BoardWidget({ data }: Props) {
  const now = new Date();
  const today = now.getDate();
  const month = MONTH_NAMES_FR[now.getMonth()];
  const weekday = WEEKDAY_NAMES_FR[now.getDay()];
  const rows = buildCalendarRows(now);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: BG,
        borderRadius: 16,
      }}
      clickAction="OPEN_APP"
    >
      {/* TOP HALF: date + mini calendar */}
      <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
        {/* Date panel */}
        <FlexWidget style={{ flexDirection: 'column', padding: 12, width: 88 }}>
          <TextWidget text={month} style={{ color: SECONDARY, fontSize: 8, fontWeight: 'bold' }} maxLines={1} />
          <TextWidget text={weekday} style={{ color: TODAY_COLOR, fontSize: 11, fontWeight: 'bold', marginBottom: 2 }} maxLines={1} />
          <TextWidget text={`${today}`} style={{ color: TEXT, fontSize: 36, fontWeight: 'bold' }} maxLines={1} />
        </FlexWidget>

        {/* Vertical divider */}
        <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />

        {/* Mini calendar */}
        <FlexWidget style={{ flex: 1, flexDirection: 'column', padding: 10 }}>
          {/* Day letters header */}
          <FlexWidget style={{ flexDirection: 'row', marginBottom: 3 }}>
            {DAY_LETTERS.map((l, i) => (
              <FlexWidget key={i} style={{ flex: 1, alignItems: 'center' }}>
                <TextWidget text={l} style={{ color: SECONDARY, fontSize: 7 }} maxLines={1} />
              </FlexWidget>
            ))}
          </FlexWidget>
          {/* Day rows */}
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
                      borderRadius: 6,
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
      </FlexWidget>

      {/* Horizontal divider */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: DIVIDER }} />

      {/* BOTTOM HALF: 2×2 quadrant grid */}
      <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
        {/* Row 1: Q1 | Q2 */}
        <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
          <QuadrantCell tasks={data.q1} label={Q_CONFIG[0].label} color={Q_CONFIG[0].color} icon={Q_CONFIG[0].icon} />
          <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />
          <QuadrantCell tasks={data.q2} label={Q_CONFIG[1].label} color={Q_CONFIG[1].color} icon={Q_CONFIG[1].icon} />
        </FlexWidget>

        {/* Horizontal divider */}
        <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: DIVIDER }} />

        {/* Row 2: Q3 | Q4 */}
        <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
          <QuadrantCell tasks={data.q3} label={Q_CONFIG[2].label} color={Q_CONFIG[2].color} icon={Q_CONFIG[2].icon} />
          <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />
          <QuadrantCell tasks={data.q4} label={Q_CONFIG[3].label} color={Q_CONFIG[3].color} icon={Q_CONFIG[3].icon} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
