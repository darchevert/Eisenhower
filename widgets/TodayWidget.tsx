import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from '../src/services/widgetService';

interface Props {
  data: WidgetData;
}

const BG = '#0F172A';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';

const MONTH_NAMES_FR = [
  'JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN',
  'JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE',
];
const WEEKDAY_NAMES_FR = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

const Q_COLORS = ['#EF4444', '#22C55E', '#F59E0B', '#64748B'];

export function TodayWidget({ data }: Props) {
  const now = new Date();
  const month = MONTH_NAMES_FR[now.getMonth()];
  const weekday = WEEKDAY_NAMES_FR[now.getDay()];
  const day = `${now.getDate()}`;

  const counts = [data.q1.length, data.q2.length, data.q3.length, data.q4.length];

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: BG,
        borderRadius: 16,
        padding: 14,
      }}
      clickAction="OPEN_APP"
    >
      {/* Month */}
      <TextWidget
        text={month}
        style={{ color: SECONDARY, fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}
        maxLines={1}
      />

      {/* Weekday */}
      <TextWidget
        text={weekday}
        style={{ color: '#22C55E', fontSize: 13, fontWeight: 'bold', marginBottom: 2 }}
        maxLines={1}
      />

      {/* Day number */}
      <TextWidget
        text={day}
        style={{ color: TEXT, fontSize: 44, fontWeight: 'bold', lineHeight: 50 }}
        maxLines={1}
      />

      {/* Spacer */}
      <FlexWidget style={{ flex: 1 }} />

      {/* Count dots row */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        {counts.map((count, i) => (
          <FlexWidget key={i} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <FlexWidget
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: Q_COLORS[i],
                marginRight: 3,
              }}
            />
            <TextWidget
              text={`${count}`}
              style={{ color: TEXT, fontSize: 11, fontWeight: 'bold' }}
              maxLines={1}
            />
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
