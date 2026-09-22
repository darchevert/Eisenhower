import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTask } from './EisenhowerWidget';
import type { WidgetData } from '../src/services/widgetService';

interface Props {
  data: WidgetData;
}

const BG = '#0F172A';
const DIVIDER = '#1E293B';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';

const Q_CONFIG = [
  { key: 'q1' as const, label: 'Do First', color: '#EF4444' },
  { key: 'q2' as const, label: 'Schedule', color: '#22C55E' },
  { key: 'q3' as const, label: 'Delegate', color: '#F59E0B' },
  { key: 'q4' as const, label: 'Eliminate', color: '#64748B' },
];

function QuadrantCell({
  tasks,
  label,
  color,
}: {
  tasks: WidgetTask[];
  label: string;
  color: string;
}) {
  const visible = tasks.slice(0, 2);

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: 'column',
        backgroundColor: BG,
        padding: 8,
      }}
    >
      {/* Label row */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <FlexWidget
          style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color, marginRight: 4 }}
        />
        <TextWidget
          text={label}
          style={{ fontSize: 10, color, fontWeight: 'bold' }}
          maxLines={1}
        />
      </FlexWidget>

      {/* Tasks */}
      {visible.length === 0 ? (
        <TextWidget text="—" style={{ color: SECONDARY, fontSize: 10 }} maxLines={1} />
      ) : (
        visible.map((task) => (
          <TextWidget
            key={task.id}
            text={`· ${task.title}`}
            style={{ color: TEXT, fontSize: 10, marginBottom: 2 }}
            maxLines={1}
          />
        ))
      )}
    </FlexWidget>
  );
}

export function MatrixOverviewWidget({ data }: Props) {
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
      {/* Top row: Q1 | Q2 */}
      <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
        <QuadrantCell tasks={data.q1} label={Q_CONFIG[0].label} color={Q_CONFIG[0].color} />
        <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />
        <QuadrantCell tasks={data.q2} label={Q_CONFIG[1].label} color={Q_CONFIG[1].color} />
      </FlexWidget>

      {/* Horizontal divider */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: DIVIDER }} />

      {/* Bottom row: Q3 | Q4 */}
      <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
        <QuadrantCell tasks={data.q3} label={Q_CONFIG[2].label} color={Q_CONFIG[2].color} />
        <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />
        <QuadrantCell tasks={data.q4} label={Q_CONFIG[3].label} color={Q_CONFIG[3].color} />
      </FlexWidget>
    </FlexWidget>
  );
}
