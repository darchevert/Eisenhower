import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { CalEvent } from './calendarTypes';
import { MONTH_NAMES_FR, WEEKDAY_NAMES_FR } from './calendarTypes';

interface Props {
  events: CalEvent[];
}

const BG = '#0F172A';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';
const DIVIDER = '#1E293B';

function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function ScheduleWidget({ events }: Props) {
  const now = new Date();
  const day = now.getDate();
  const month = MONTH_NAMES_FR[now.getMonth()].toUpperCase().slice(0, 4) + '.';
  const weekday = WEEKDAY_NAMES_FR[now.getDay()];

  // Sort by start time, today's events only (already filtered by caller)
  const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const visible = sorted.slice(0, 6);
  const remaining = sorted.length - visible.length;

  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', flexDirection: 'row', backgroundColor: BG, borderRadius: 16 }}
      clickAction="OPEN_APP"
    >
      {/* Left: date */}
      <FlexWidget style={{ flexDirection: 'column', padding: 12, width: 88 }}>
        <TextWidget text={month} style={{ color: SECONDARY, fontSize: 8, fontWeight: 'bold', marginBottom: 1 }} maxLines={1} />
        <TextWidget text={weekday} style={{ color: '#22C55E', fontSize: 11, fontWeight: 'bold', marginBottom: 2 }} maxLines={1} />
        <TextWidget text={`${day}`} style={{ color: TEXT, fontSize: 36, fontWeight: 'bold' }} maxLines={1} />
      </FlexWidget>

      {/* Vertical divider */}
      <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />

      {/* Right: events */}
      <FlexWidget style={{ flex: 1, flexDirection: 'column', padding: 10 }}>
        <TextWidget text="Aujourd'hui" style={{ color: SECONDARY, fontSize: 10, fontWeight: 'bold', marginBottom: 6 }} maxLines={1} />

        {visible.length === 0 && (
          <TextWidget text="Aucun événement" style={{ color: SECONDARY, fontSize: 11 }} maxLines={1} />
        )}

        {visible.map((ev, i) => (
          <FlexWidget key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            {/* Color bar */}
            <FlexWidget style={{ width: 3, height: 28, backgroundColor: ev.color, borderRadius: 2, marginRight: 6 }} />
            <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
              {!ev.allDay && (
                <TextWidget text={formatTime(ev.startDate)} style={{ color: SECONDARY, fontSize: 9 }} maxLines={1} />
              )}
              <TextWidget text={ev.title} style={{ color: TEXT, fontSize: 11, fontWeight: 'bold' }} maxLines={1} />
            </FlexWidget>
          </FlexWidget>
        ))}

        {remaining > 0 && (
          <TextWidget text={`+${remaining} de plus`} style={{ color: SECONDARY, fontSize: 9 }} maxLines={1} />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}
