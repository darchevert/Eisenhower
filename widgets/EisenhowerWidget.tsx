import React from 'react';
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
} from 'react-native-android-widget';

export interface WidgetTask {
  id: string;
  title: string;
}

interface Props {
  tasks: WidgetTask[];
}

const BG = '#0F172A';
const RED = '#EF4444';
const TEXT = '#E2E8F0';
const SECONDARY = '#64748B';
const SEPARATOR = '#1E293B';

export function EisenhowerWidget({ tasks }: Props) {
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
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <FlexWidget
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: RED,
            marginRight: 6,
          }}
        />
        <FlexWidget style={{ flex: 1 }}>
          <TextWidget
            text="Do First"
            style={{
              fontSize: 13,
              color: RED,
              fontWeight: 'bold',
            }}
            maxLines={1}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Separator */}
      <FlexWidget
        style={{
          height: 1,
          backgroundColor: SEPARATOR,
          marginBottom: 8,
        }}
      />

      {/* Task list */}
      {visibleTasks.length === 0 ? (
        <TextWidget
          text="Aucune tâche urgente"
          style={{ color: SECONDARY, fontSize: 12 }}
          maxLines={1}
        />
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
              <TextWidget
                text={task.title}
                style={{ color: TEXT, fontSize: 12 }}
                maxLines={1}
              />
            </FlexWidget>
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
