import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Task, Matrix } from '@/types';
import { t } from '@/i18n';

const QUADRANT_ORDER = ['q1', 'q2', 'q3', 'q4'] as const;

function formatDate(ts: number | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function exportMatrixAsText(
  matrix: Matrix,
  tasks: Task[]
): Promise<void> {
  const lines: string[] = [];
  const title = t('share.exportTitle');

  lines.push(`# ${matrix.name}`);
  lines.push(`${title}`);
  lines.push(`${formatDate(Date.now())}`);
  lines.push('');

  const quadrantNames: Record<string, string> = {
    q1: t('quadrants.q1.label'),
    q2: t('quadrants.q2.label'),
    q3: t('quadrants.q3.label'),
    q4: t('quadrants.q4.label'),
  };

  for (const qId of QUADRANT_ORDER) {
    const qTasks = tasks.filter(
      (t) => t.quadrant === qId && t.matrixId === matrix.id
    );
    if (qTasks.length === 0) continue;

    lines.push(`## ${quadrantNames[qId]}`);
    lines.push('');

    for (const task of qTasks) {
      const check = task.completed ? '[x]' : '[ ]';
      const due = task.dueDate ? ` (${formatDate(task.dueDate)})` : '';
      const rec = task.recurrence && task.recurrence !== 'none'
        ? ` 🔄 ${t(`recurrence.${task.recurrence}`)}`
        : '';
      lines.push(`- ${check} ${task.title}${due}${rec}`);
      if (task.description) {
        lines.push(`     ${task.description}`);
      }
    }
    lines.push('');
  }

  const content = lines.join('\n');
  const fileName = `eisenhower-${matrix.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/plain',
      dialogTitle: matrix.name,
      UTI: 'public.plain-text',
    });
  }
}
