import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTask } from './EisenhowerWidget';

interface Props {
  q1Tasks: WidgetTask[];
  q2Tasks: WidgetTask[];
}

const BG = '#0F172A';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';
const DIVIDER = '#1E293B';
const Q1_COLOR = '#EF4444';
const Q2_COLOR = '#22C55E';

function QuadrantColumn({
  tasks,
  label,
  color,
}: {
  tasks: WidgetTask[];
  label: string;
  color: string;
}) {
  const visible = tasks.slice(0, 3);

  return (
    <FlexWidget
      style={{ flex: 1, flexDirection: 'column', backgroundColor: BG, padding: 10 }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 4 }} />
        <TextWidget text={label} style={{ color, fontSize: 11, fontWeight: 'bold', flex: 1 }} maxLines={1} />
        <FlexWidget
          style={{
            backgroundColor: color,
            borderRadius: 8,
            paddingHorizontal: 4,
            paddingVertical: 1,
          }}
        >
          <TextWidget text={`${tasks.length}`} style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' }} maxLines={1} />
        </FlexWidget>
      </FlexWidget>

      {/* Divider */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: color + '40', marginBottom: 4 }} />

      {/* Tasks */}
      {visible.length === 0 ? (
        <TextWidget text="—" style={{ color: SECONDARY, fontSize: 11 }} maxLines={1} />
      ) : (
        visible.map((task) => (
          <FlexWidget key={task.id} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 }}>
            <FlexWidget style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: SECONDARY, marginRight: 5, marginTop: 3 }} />
            <TextWidget text={task.title} style={{ color: TEXT, fontSize: 11, flex: 1 }} maxLines={1} />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}

export function DoubleSectionWidget({ q1Tasks, q2Tasks }: Props) {
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
      <QuadrantColumn tasks={q1Tasks} label="Do First" color={Q1_COLOR} />
      <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: DIVIDER }} />
      <QuadrantColumn tasks={q2Tasks} label="Schedule" color={Q2_COLOR} />
    </FlexWidget>
  );
}
