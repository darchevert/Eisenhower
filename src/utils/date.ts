import { format, isToday, isTomorrow, isYesterday, isPast, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns';
import { t, getLocale } from '@/i18n';

export function formatDueDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return t('date.today');
  if (isTomorrow(date)) return t('date.tomorrow');
  if (isYesterday(date)) return t('date.yesterday');
  try {
    return new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return format(date, 'MMM d');
  }
}

export function isOverdue(timestamp: number): boolean {
  return isPast(new Date(timestamp)) && !isToday(new Date(timestamp));
}

export function getWeekDays(): Date[] {
  const now = new Date();
  return eachDayOfInterval({
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  });
}

export function formatShortDate(timestamp: number): string {
  return format(new Date(timestamp), 'EEE d');
}

export function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}
