import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTask } from './EisenhowerWidget';

interface Props {
  tasks: WidgetTask[];
}

const BG = '#0F172A';
const AMBER = '#F59E0B';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';
const SEPARATOR = '#1E293B';

export function Q3Widget({ tasks }: Props) {
  const visibleTasks = tasks.slice(0, 5);

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
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <FlexWidget
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: AMBER, marginRight: 6 }}
        />
        <FlexWidget style={{ flex: 1 }}>
          <TextWidget
            text="Delegate"
            style={{ fontSize: 13, color: AMBER, fontWeight: 'bold' }}
            maxLines={1}
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ height: 1, backgroundColor: SEPARATOR, marginBottom: 8 }} />

      {visibleTasks.length === 0 ? (
        <TextWidget text="No tasks" style={{ color: SECONDARY, fontSize: 12 }} maxLines={1} />
      ) : (
        visibleTasks.map((task) => (
          <FlexWidget
            key={task.id}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}
            clickAction="OPEN_APP"
          >
            <FlexWidget
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: SECONDARY,
                marginRight: 7,
                marginTop: 1,
              }}
            />
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget text={task.title} style={{ color: TEXT, fontSize: 12 }} maxLines={1} />
            </FlexWidget>
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
