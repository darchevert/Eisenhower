import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from '../src/services/widgetService';

interface Props {
  data: WidgetData;
}

const BG = '#0F172A';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';

const Q_CONFIG = [
  { key: 'q1' as const, color: '#EF4444' },
  { key: 'q2' as const, color: '#22C55E' },
  { key: 'q3' as const, color: '#F59E0B' },
  { key: 'q4' as const, color: '#64748B' },
];

export function UpcomingWidget({ data }: Props) {
  // Flat list ordered q1 → q2 → q3 → q4
  const allTasks = Q_CONFIG.flatMap((q) =>
    data[q.key].map((task) => ({ ...task, color: q.color }))
  );
  const maxVisible = 9;
  const visible = allTasks.slice(0, maxVisible);
  const remaining = allTasks.length - visible.length;

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
      <TextWidget
        text="À venir"
        style={{ color: '#22C55E', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}
        maxLines={1}
      />

      {/* Task rows */}
      {visible.length === 0 && (
        <TextWidget
          text="Aucune tâche"
          style={{ color: SECONDARY, fontSize: 11 }}
          maxLines={1}
        />
      )}
      {visible.map((task, i) => (
        <FlexWidget
          key={i}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
        >
          <FlexWidget
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: task.color,
              marginRight: 6,
            }}
          />
          <TextWidget
            text={task.title}
            style={{ color: TEXT, fontSize: 11, flex: 1 }}
            maxLines={1}
          />
        </FlexWidget>
      ))}

      {/* Overflow */}
      {remaining > 0 && (
        <TextWidget
          text={`+${remaining} de plus`}
          style={{ color: SECONDARY, fontSize: 10, marginTop: 2 }}
          maxLines={1}
        />
      )}
    </FlexWidget>
  );
}
