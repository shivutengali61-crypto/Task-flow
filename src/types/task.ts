export enum Priority {
  Urgent = 'urgent',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
}

export enum Recurrence {
  None = 'none',
  Daily = 'daily',
  Weekdays = 'weekdays',
  Weekly = 'weekly',
  Monthly = 'monthly',
}

export type NavView =
  | 'inbox'
  | 'today'
  | 'upcoming'
  | 'calendar'
  | 'analytics'
  | 'completed'
  | 'project'
  | 'tag';

export type ViewMode = 'list' | 'board';

export type SortBy = 'manual' | 'dueDate' | 'priority' | 'title' | 'createdAt';

export type ThemeMode = 'dark' | 'light';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null; // ISO date string (YYYY-MM-DD) or ISO datetime
  hasTime?: boolean;
  projectId: string | null; // null = Inbox
  tags: string[];
  subtasks: Subtask[];
  recurrence: Recurrence;
  starred: boolean;
  order: number;
  focusMinutes: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description?: string;
}

export interface Workspace {
  id: string;
  name: string;
  initials: string;
  accentColor: string;
}

export interface CompletionLogEntry {
  date: string; // YYYY-MM-DD
  completedCount: number;
  focusMinutes: number;
}

export interface PersistedDataV1 {
  schemaVersion: 1;
  theme: ThemeMode;
  activeWorkspaceId: string;
  workspaces: Workspace[];
  projects: Project[];
  tasks: Task[];
  completionHistory: CompletionLogEntry[];
}

export interface ParsedTaskInput {
  title: string;
  dueDate: string | null;
  hasTime: boolean;
  dueDateText: string | null;
  priority: Priority | null;
  projectName: string | null;
  tags: string[];
}
