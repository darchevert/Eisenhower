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

const Q_CONFIG = [
  { key: 'q1' as const, label: 'Do First',  color: '#EF4444' },
  { key: 'q2' as const, label: 'Schedule',  color: '#22C55E' },
  { key: 'q3' as const, label: 'Delegate',  color: '#F59E0B' },
  { key: 'q4' as const, label: 'Eliminate', color: '#64748B' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DateTasksWidget({ data }: Props) {
  const now = new Date();
  const dayNum = now.getDate();
  const month = MONTHS[now.getMonth()].toUpperCase();
  const weekday = DAYS[now.getDay()];

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
      {/* Left: date panel */}
      <FlexWidget
        style={{ flexDirection: 'column', padding: 12, width: 70 }}
      >
        <TextWidget text={month} style={{ color: SECONDARY, fontSize: 9, fontWeight: 'bold' }} maxLines={1} />
        <TextWidget text={`${dayNum}`} style={{ color: TEXT, fontSize: 30, fontWeight: 'bold' }} maxLines={1} />
        <TextWidget text={weekday} style={{ color: '#22C55E', fontSize: 10 }} maxLines={1} />
      </FlexWidget>

      {/* Vertical divider */}
      <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />

      {/* Right: quadrant sections */}
      <FlexWidget style={{ flex: 1, flexDirection: 'column', padding: 10 }}>
        {Q_CONFIG.filter((q) => data[q.key].length > 0).map((q) => {
          const tasks = data[q.key];
          const first = tasks[0];
          return (
            <FlexWidget key={q.key} style={{ flexDirection: 'column', marginBottom: 5 }}>
              {/* Section header */}
              <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <FlexWidget style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: q.color, marginRight: 4 }} />
                <TextWidget text={q.label} style={{ color: q.color, fontSize: 9, fontWeight: 'bold', flex: 1 }} maxLines={1} />
                <TextWidget text={`${tasks.length}`} style={{ color: q.color, fontSize: 9, fontWeight: 'bold' }} maxLines={1} />
              </FlexWidget>
              {/* First task */}
              <TextWidget
                text={`· ${first.title}`}
                style={{ color: TEXT, fontSize: 10, marginLeft: 9 }}
                maxLines={1}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
}
