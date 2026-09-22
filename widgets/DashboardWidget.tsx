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
  { key: 'q1' as const, color: '#EF4444' },
  { key: 'q2' as const, color: '#22C55E' },
  { key: 'q3' as const, color: '#F59E0B' },
  { key: 'q4' as const, color: '#64748B' },
];

function CountDot({ color, count }: { color: string; count: number }) {
  return (
    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
      <FlexWidget style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color, marginRight: 2 }} />
      <TextWidget text={`${count}`} style={{ color, fontSize: 9, fontWeight: 'bold' }} maxLines={1} />
    </FlexWidget>
  );
}

export function DashboardWidget({ data }: Props) {
  const allTasks = [
    ...data.q1.map((t) => ({ ...t, color: '#EF4444' })),
    ...data.q2.map((t) => ({ ...t, color: '#22C55E' })),
    ...data.q3.map((t) => ({ ...t, color: '#F59E0B' })),
    ...data.q4.map((t) => ({ ...t, color: '#64748B' })),
  ];
  const visible = allTasks.slice(0, 6);
  const overflow = allTasks.length - visible.length;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: BG,
        borderRadius: 16,
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <TextWidget text="À faire" style={{ color: TEXT, fontSize: 12, fontWeight: 'bold', flex: 1 }} maxLines={1} />
        {Q_CONFIG.map((q) => (
          <CountDot key={q.key} color={q.color} count={data[q.key].length} />
        ))}
      </FlexWidget>

      {/* Divider */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: DIVIDER, marginBottom: 6 }} />

      {/* Task list */}
      {visible.length === 0 ? (
        <TextWidget text="No tasks" style={{ color: SECONDARY, fontSize: 12 }} maxLines={1} />
      ) : (
        visible.map((task) => (
          <FlexWidget key={task.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: task.color, marginRight: 6 }} />
            <TextWidget text={task.title} style={{ color: TEXT, fontSize: 11, flex: 1 }} maxLines={1} />
          </FlexWidget>
        ))
      )}

      {overflow > 0 && (
        <TextWidget text={`+${overflow} de plus`} style={{ color: SECONDARY, fontSize: 10, marginTop: 2 }} maxLines={1} />
      )}
    </FlexWidget>
  );
}
