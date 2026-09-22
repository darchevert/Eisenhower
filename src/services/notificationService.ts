import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '@/i18n';
import type { Task } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const TASK_ID_PREFIX = 'task-reminder-';

export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleDailyReminder(hour: number, minute: number): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync('daily-reminder').catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-reminder',
      content: {
        title: 'Eisenhower Matrix',
        body: "Time to review your priorities for tomorrow 📋",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  },

  async cancelDailyReminder(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync('daily-reminder').catch(() => {});
  },

  async scheduleTaskReminder(task: Task): Promise<void> {
    if (Platform.OS === 'web' || !task.dueDate) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: asked } = await Notifications.requestPermissionsAsync();
      if (asked !== 'granted') return;
    }

    const identifier = `${TASK_ID_PREFIX}${task.id}`;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    const ONE_HOUR = 60 * 60 * 1000;
    const fireAt = task.dueDate - ONE_HOUR;

    if (fireAt <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `⏰ ${t('notifications.taskReminderTitle')}`,
        body: task.title,
        data: { taskId: task.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
      },
    }).catch(() => {});
  },

  async cancelTaskReminder(taskId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync(
      `${TASK_ID_PREFIX}${taskId}`
    ).catch(() => {});
  },

  async scheduleOverdueDigest(overdueCount: number): Promise<void> {
    if (Platform.OS === 'web') return;

    await Notifications.cancelScheduledNotificationAsync('overdue-digest').catch(() => {});

    if (overdueCount === 0) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Fire tomorrow at 9am (or today at 9am if not yet passed)
    const next9am = new Date();
    next9am.setHours(9, 0, 0, 0);
    if (next9am <= new Date()) {
      next9am.setDate(next9am.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: 'overdue-digest',
      content: {
        title: t('notifications.overdueTitle'),
        body: t('notifications.overdueBody').replace('{{count}}', String(overdueCount)),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: next9am,
      },
    }).catch(() => {});
  },
};
