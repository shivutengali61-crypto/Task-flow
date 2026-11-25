import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';
import {
  CompletionLogEntry,
  NavView,
  Priority,
  Project,
  Recurrence,
  SortBy,
  Task,
  TaskStatus,
} from '../types/task';

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  [Priority.Urgent]: 4,
  [Priority.High]: 3,
  [Priority.Medium]: 2,
  [Priority.Low]: 1,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.Urgent]: 'Urgent',
  [Priority.High]: 'High',
  [Priority.Medium]: 'Medium',
  [Priority.Low]: 'Low',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'To Do',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.Done]: 'Done',
};

export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (!task.dueDate || task.status === TaskStatus.Done) return false;
  const due = parseISO(task.dueDate);
  if (task.hasTime) {
    return isBefore(due, now);
  }
  return isBefore(endOfDay(due), startOfDay(now));
}

export function isTaskDueToday(task: Task, now: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  return isSameDay(parseISO(task.dueDate), now);
}

export function isTaskUpcoming(task: Task, now: Date = new Date()): boolean {
  if (!task.dueDate || task.status === TaskStatus.Done) return false;
  const due = parseISO(task.dueDate);
  return isAfter(startOfDay(due), startOfDay(now));
}

export function formatDueDateLabel(
  dueDate: string | null,
  hasTime?: boolean,
  now: Date = new Date()
): string {
  if (!dueDate) return 'No due date';
  const date = parseISO(dueDate);
  const timeSuffix = hasTime ? ` · ${format(date, 'h:mm a')}` : '';

  if (isSameDay(date, now) || isToday(date)) {
    return `Today${timeSuffix}`;
  }
  if (isTomorrow(date) || isSameDay(date, addDays(now, 1))) {
    return `Tomorrow${timeSuffix}`;
  }
  if (isSameDay(date, subDays(now, 1))) {
    return `Yesterday${timeSuffix}`;
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return `${format(date, sameYear ? 'MMM d' : 'MMM d, yyyy')}${timeSuffix}`;
}

export function calculateNextRecurrenceDate(
  currentDueIso: string | null,
  recurrence: Recurrence,
  fallbackNow: Date = new Date()
): string | null {
  if (recurrence === Recurrence.None) return null;
  const base = currentDueIso ? parseISO(currentDueIso) : fallbackNow;

  switch (recurrence) {
    case Recurrence.Daily:
      return addDays(base, 1).toISOString();
    case Recurrence.Weekdays: {
      let next = addDays(base, 1);
      while (next.getDay() === 0 || next.getDay() === 6) {
        next = addDays(next, 1);
      }
      return next.toISOString();
    }
    case Recurrence.Weekly:
      return addWeeks(base, 1).toISOString();
    case Recurrence.Monthly:
      return addMonths(base, 1).toISOString();
    default:
      return null;
  }
}

export interface FilterOptions {
  workspaceId: string;
  view: NavView;
  activeProjectId: string | null;
  activeTag: string | null;
  priorityFilter: Priority | 'all';
  searchQuery: string;
  sortBy: SortBy;
  now?: Date;
}

export function filterAndSortTasks(tasks: Task[], options: FilterOptions): Task[] {
  const now = options.now ?? new Date();
  const query = options.searchQuery.trim().toLowerCase();

  let result = tasks.filter((t) => t.workspaceId === options.workspaceId);

  // View filtering
  switch (options.view) {
    case 'inbox':
      result = result.filter((t) => t.projectId === null && t.status !== TaskStatus.Done);
      break;
    case 'today':
      result = result.filter((t) => {
        if (t.status === TaskStatus.Done) {
          return t.completedAt ? isSameDay(parseISO(t.completedAt), now) : false;
        }
        return isTaskDueToday(t, now) || isTaskOverdue(t, now);
      });
      break;
    case 'upcoming':
      result = result.filter(
        (t) =>
          t.status !== TaskStatus.Done &&
          t.dueDate !== null &&
          (isTaskDueToday(t, now) || isTaskUpcoming(t, now) || isTaskOverdue(t, now))
      );
      break;
    case 'completed':
      result = result.filter((t) => t.status === TaskStatus.Done);
      break;
    case 'project':
      result = result.filter((t) => t.projectId === options.activeProjectId);
      break;
    case 'tag':
      result = result.filter((t) =>
        options.activeTag ? t.tags.includes(options.activeTag) : true
      );
      break;
    default:
      break;
  }

  // Priority filter
  if (options.priorityFilter !== 'all') {
    result = result.filter((t) => t.priority === options.priorityFilter);
  }

  // Search query filter
  if (query.length > 0) {
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Sorting
  const sorted = [...result];
  sorted.sort((a, b) => {
    switch (options.sortBy) {
      case 'priority': {
        const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        return diff !== 0 ? diff : a.order - b.order;
      }
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return a.order - b.order;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      }
      case 'title':
        return a.title.localeCompare(b.title);
      case 'createdAt':
        return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
      case 'manual':
      default:
        return a.order - b.order;
    }
  });

  return sorted;
}

export interface DailyProgressStats {
  completedToday: number;
  totalToday: number;
  percentage: number;
  overdueCount: number;
}

export function computeDailyProgress(
  tasks: Task[],
  workspaceId: string,
  now: Date = new Date()
): DailyProgressStats {
  const wsTasks = tasks.filter((t) => t.workspaceId === workspaceId);
  const completedToday = wsTasks.filter(
    (t) => t.status === TaskStatus.Done && t.completedAt && isSameDay(parseISO(t.completedAt), now)
  ).length;
  const openDueTodayOrOverdue = wsTasks.filter(
    (t) => t.status !== TaskStatus.Done && (isTaskDueToday(t, now) || isTaskOverdue(t, now))
  ).length;
  const overdueCount = wsTasks.filter((t) => isTaskOverdue(t, now)).length;

  const totalToday = completedToday + openDueTodayOrOverdue;
  const percentage = totalToday === 0 ? 100 : Math.round((completedToday / totalToday) * 100);

  return {
    completedToday,
    totalToday,
    percentage,
    overdueCount,
  };
}

export interface NavCounts {
  inbox: number;
  today: number;
  upcoming: number;
  completed: number;
  byProject: Record<string, number>;
  byTag: Record<string, number>;
}

export function computeNavCounts(
  tasks: Task[],
  workspaceId: string,
  now: Date = new Date()
): NavCounts {
  const wsTasks = tasks.filter((t) => t.workspaceId === workspaceId);
  const byProject: Record<string, number> = {};
  const byTag: Record<string, number> = {};

  let inbox = 0;
  let today = 0;
  let upcoming = 0;
  let completed = 0;

  for (const t of wsTasks) {
    if (t.status === TaskStatus.Done) {
      completed += 1;
      continue;
    }
    if (t.projectId === null) {
      inbox += 1;
    } else {
      byProject[t.projectId] = (byProject[t.projectId] ?? 0) + 1;
    }
    if (isTaskDueToday(t, now) || isTaskOverdue(t, now)) {
      today += 1;
    }
    if (t.dueDate && (isTaskUpcoming(t, now) || isTaskDueToday(t, now))) {
      upcoming += 1;
    }
    for (const tag of t.tags) {
      byTag[tag] = (byTag[tag] ?? 0) + 1;
    }
  }

  return { inbox, today, upcoming, completed, byProject, byTag };
}

export interface AnalyticsSummary {
  totalCompleted: number;
  totalActive: number;
  completionRate: number;
  overdueCount: number;
  totalFocusMinutes: number;
  streakDays: number;
  dailySeries: Array<{ day: string; date: string; completed: number; focusMinutes: number }>;
  prioritySeries: Array<{ name: string; count: number; color: string }>;
  projectSeries: Array<{ name: string; active: number; completed: number; color: string }>;
}

export function computeAnalyticsSummary(
  tasks: Task[],
  projects: Project[],
  completionHistory: CompletionLogEntry[],
  workspaceId: string,
  now: Date = new Date()
): AnalyticsSummary {
  const wsTasks = tasks.filter((t) => t.workspaceId === workspaceId);
  const wsProjects = projects.filter((p) => p.workspaceId === workspaceId);

  const totalCompleted = wsTasks.filter((t) => t.status === TaskStatus.Done).length;
  const totalActive = wsTasks.filter((t) => t.status !== TaskStatus.Done).length;
  const total = totalCompleted + totalActive;
  const completionRate = total === 0 ? 0 : Math.round((totalCompleted / total) * 100);
  const overdueCount = wsTasks.filter((t) => isTaskOverdue(t, now)).length;
  const taskFocusMinutes = wsTasks.reduce((sum, t) => sum + (t.focusMinutes || 0), 0);

  // Build 7-day series combining completionHistory + live completed tasks
  const historyMap = new Map<string, CompletionLogEntry>();
  for (const entry of completionHistory) {
    historyMap.set(entry.date, entry);
  }

  const dailySeries: AnalyticsSummary['dailySeries'] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    const key = format(d, 'yyyy-MM-dd');
    const hist = historyMap.get(key);
    const liveCompleted = wsTasks.filter(
      (t) => t.status === TaskStatus.Done && t.completedAt && isSameDay(parseISO(t.completedAt), d)
    ).length;

    const completed = Math.max(hist?.completedCount ?? 0, liveCompleted);
    const focusMinutes = hist?.focusMinutes ?? (i === 0 ? Math.min(taskFocusMinutes, 120) : 0);

    dailySeries.push({
      day: format(d, 'EEE'),
      date: key,
      completed,
      focusMinutes,
    });
  }

  // Compute current active streak ending today or yesterday
  let streakDays = 0;
  for (let i = dailySeries.length - 1; i >= 0; i--) {
    if (dailySeries[i].completed > 0) {
      streakDays += 1;
    } else if (i < dailySeries.length - 1) {
      break;
    }
  }

  const priorityColors: Record<Priority, string> = {
    [Priority.Urgent]: '#EF4444',
    [Priority.High]: '#F59E0B',
    [Priority.Medium]: '#6366F1',
    [Priority.Low]: '#94A3B8',
  };

  const prioritySeries = (
    [Priority.Urgent, Priority.High, Priority.Medium, Priority.Low] as Priority[]
  ).map((p) => ({
    name: PRIORITY_LABELS[p],
    count: wsTasks.filter((t) => t.priority === p && t.status !== TaskStatus.Done).length,
    color: priorityColors[p],
  }));

  const projectSeries = [
    {
      name: 'Inbox',
      active: wsTasks.filter((t) => t.projectId === null && t.status !== TaskStatus.Done).length,
      completed: wsTasks.filter((t) => t.projectId === null && t.status === TaskStatus.Done).length,
      color: '#6366F1',
    },
    ...wsProjects.map((p) => ({
      name: p.name,
      active: wsTasks.filter((t) => t.projectId === p.id && t.status !== TaskStatus.Done).length,
      completed: wsTasks.filter((t) => t.projectId === p.id && t.status === TaskStatus.Done).length,
      color: p.color,
    })),
  ];

  const historyFocus = dailySeries.reduce((sum, d) => sum + d.focusMinutes, 0);

  return {
    totalCompleted,
    totalActive,
    completionRate,
    overdueCount,
    totalFocusMinutes: Math.max(taskFocusMinutes, historyFocus),
    streakDays,
    dailySeries,
    prioritySeries,
    projectSeries,
  };
}
