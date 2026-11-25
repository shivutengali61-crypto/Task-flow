import { format } from 'date-fns';
import { create } from 'zustand';
import { createSeedData } from '../data/seedData';
import {
  CompletionLogEntry,
  NavView,
  PersistedDataV1,
  Priority,
  Project,
  Recurrence,
  SortBy,
  Task,
  TaskStatus,
  ThemeMode,
  ViewMode,
  Workspace,
} from '../types/task';
import {
  CURRENT_SCHEMA_VERSION,
  loadPersistedState,
  parseImportedBackup,
  savePersistedState,
} from '../utils/storage';
import { calculateNextRecurrenceDate } from '../utils/taskFilters';

export interface ToastMessage {
  id: string;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string | null;
  hasTime?: boolean;
  projectId?: string | null;
  tags?: string[];
  recurrence?: Recurrence;
  status?: TaskStatus;
}

interface TaskStoreState {
  // Persisted domain data
  theme: ThemeMode;
  activeWorkspaceId: string;
  workspaces: Workspace[];
  projects: Project[];
  tasks: Task[];
  completionHistory: CompletionLogEntry[];

  // UI & Navigation state
  activeView: NavView;
  activeProjectId: string | null;
  activeTag: string | null;
  selectedTaskId: string | null;
  viewMode: ViewMode;
  sortBy: SortBy;
  priorityFilter: Priority | 'all';
  searchQuery: string;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  commandPaletteOpen: boolean;
  quickAddModalOpen: boolean;
  shortcutsModalOpen: boolean;
  settingsModalOpen: boolean;
  toast: ToastMessage | null;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setActiveWorkspace: (workspaceId: string) => void;
  addWorkspace: (name: string, accentColor?: string) => Workspace;
  setActiveView: (view: NavView, payload?: { projectId?: string | null; tag?: string | null }) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  setPriorityFilter: (priority: Priority | 'all') => void;
  setSearchQuery: (q: string) => void;
  toggleSidebarCollapsed: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickAddModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  dismissToast: () => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;

  // Task CRUD
  addTask: (input: CreateTaskInput) => Task;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  toggleTaskCompletion: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => Task | null;
  reorderTasks: (activeId: string, overId: string) => void;
  moveTaskToStatus: (taskId: string, status: TaskStatus) => void;
  logFocusMinutes: (taskId: string | null, minutes: number) => void;

  // Subtasks
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Projects
  addProject: (name: string, color: string, description?: string) => Project;
  deleteProject: (projectId: string) => void;

  // Backup & Reset
  exportDataJson: () => string;
  importDataJson: (raw: string) => boolean;
  resetDemoData: () => void;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function syncThemeClass(theme: ThemeMode) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

function persistSnapshot(state: Pick<
  TaskStoreState,
  'theme' | 'activeWorkspaceId' | 'workspaces' | 'projects' | 'tasks' | 'completionHistory'
>) {
  const payload: PersistedDataV1 = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    theme: state.theme,
    activeWorkspaceId: state.activeWorkspaceId,
    workspaces: state.workspaces,
    projects: state.projects,
    tasks: state.tasks,
    completionHistory: state.completionHistory,
  };
  savePersistedState(payload);
}

const initialData = loadPersistedState();
syncThemeClass(initialData.theme);

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  theme: initialData.theme,
  activeWorkspaceId: initialData.activeWorkspaceId,
  workspaces: initialData.workspaces,
  projects: initialData.projects,
  tasks: initialData.tasks,
  completionHistory: initialData.completionHistory,

  activeView: 'today',
  activeProjectId: null,
  activeTag: null,
  selectedTaskId: null,
  viewMode: 'list',
  sortBy: 'manual',
  priorityFilter: 'all',
  searchQuery: '',
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  commandPaletteOpen: false,
  quickAddModalOpen: false,
  shortcutsModalOpen: false,
  settingsModalOpen: false,
  toast: null,

  setTheme: (theme) => {
    syncThemeClass(theme);
    set({ theme });
    persistSnapshot(get());
  },

  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setActiveWorkspace: (workspaceId) => {
    set({
      activeWorkspaceId: workspaceId,
      activeView: 'today',
      activeProjectId: null,
      activeTag: null,
      selectedTaskId: null,
      mobileDrawerOpen: false,
    });
    persistSnapshot(get());
  },

  addWorkspace: (name, accentColor = '#6366F1') => {
    const trimmed = name.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    const initials =
      words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : trimmed.slice(0, 2).toUpperCase() || 'WS';

    const workspace: Workspace = {
      id: generateId('ws'),
      name: trimmed,
      initials,
      accentColor,
    };
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
      activeWorkspaceId: workspace.id,
      activeView: 'inbox',
      activeProjectId: null,
      activeTag: null,
      selectedTaskId: null,
    }));
    persistSnapshot(get());
    get().showToast({ message: `Workspace "${workspace.name}" created` });
    return workspace;
  },

  setActiveView: (view, payload) => {
    set({
      activeView: view,
      activeProjectId: view === 'project' ? payload?.projectId ?? null : null,
      activeTag: view === 'tag' ? payload?.tag ?? null : null,
      mobileDrawerOpen: false,
    });
  },

  setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setQuickAddModalOpen: (quickAddModalOpen) => set({ quickAddModalOpen }),
  setShortcutsModalOpen: (shortcutsModalOpen) => set({ shortcutsModalOpen }),
  setSettingsModalOpen: (settingsModalOpen) => set({ settingsModalOpen }),

  dismissToast: () => {
    if (toastTimeout) clearTimeout(toastTimeout);
    set({ toast: null });
  },

  showToast: (toast) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    const id = generateId('toast');
    set({ toast: { ...toast, id } });
    toastTimeout = setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
    }, 4500);
  },

  addTask: (input) => {
    const state = get();
    const nowIso = new Date().toISOString();
    const minOrder = state.tasks.reduce((min, t) => Math.min(min, t.order), 0);

    const newTask: Task = {
      id: generateId('task'),
      workspaceId: state.activeWorkspaceId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      status: input.status ?? TaskStatus.Todo,
      priority: input.priority ?? Priority.Medium,
      dueDate: input.dueDate ?? null,
      hasTime: input.hasTime ?? false,
      projectId: input.projectId !== undefined ? input.projectId : null,
      tags: input.tags ?? [],
      subtasks: [],
      recurrence: input.recurrence ?? Recurrence.None,
      starred: false,
      order: minOrder - 1,
      focusMinutes: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
    };

    set((s) => ({ tasks: [newTask, ...s.tasks] }));
    persistSnapshot(get());
    return newTask;
  },

  updateTask: (taskId, patch) => {
    const nowIso = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, ...patch, updatedAt: nowIso } : t
      ),
    }));
    persistSnapshot(get());
  },

  toggleTaskCompletion: (taskId) => {
    const state = get();
    const target = state.tasks.find((t) => t.id === taskId);
    if (!target) return;

    const prevTasks = state.tasks;
    const prevHistory = state.completionHistory;
    const now = new Date();
    const nowIso = now.toISOString();
    const todayKey = format(now, 'yyyy-MM-dd');
    const willComplete = target.status !== TaskStatus.Done;

    let nextTasks = state.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: willComplete ? TaskStatus.Done : TaskStatus.Todo,
            completedAt: willComplete ? nowIso : null,
            updatedAt: nowIso,
          }
        : t
    );

    // If completing a recurring task, automatically schedule its next occurrence
    if (willComplete && target.recurrence !== Recurrence.None) {
      const nextDue = calculateNextRecurrenceDate(target.dueDate, target.recurrence, now);
      const nextOccurrence: Task = {
        ...target,
        id: generateId('task'),
        status: TaskStatus.Todo,
        dueDate: nextDue,
        completedAt: null,
        subtasks: target.subtasks.map((st) => ({ ...st, completed: false })),
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      nextTasks = [nextOccurrence, ...nextTasks];
    }

    // Update completion history entry for today
    const existingEntry = state.completionHistory.find((e) => e.date === todayKey);
    let nextHistory: CompletionLogEntry[];
    if (existingEntry) {
      nextHistory = state.completionHistory.map((e) =>
        e.date === todayKey
          ? {
              ...e,
              completedCount: Math.max(0, e.completedCount + (willComplete ? 1 : -1)),
            }
          : e
      );
    } else {
      nextHistory = [
        ...state.completionHistory,
        { date: todayKey, completedCount: willComplete ? 1 : 0, focusMinutes: 0 },
      ];
    }

    set({ tasks: nextTasks, completionHistory: nextHistory });
    persistSnapshot(get());

    if (willComplete) {
      get().showToast({
        message:
          target.recurrence !== Recurrence.None
            ? `Completed "${target.title}" · Next occurrence scheduled`
            : `Completed "${target.title}"`,
        undoLabel: 'Undo',
        onUndo: () => {
          set({ tasks: prevTasks, completionHistory: prevHistory });
          persistSnapshot(get());
          get().dismissToast();
        },
      });
    }
  },

  deleteTask: (taskId) => {
    const state = get();
    const target = state.tasks.find((t) => t.id === taskId);
    if (!target) return;

    const prevTasks = state.tasks;
    const prevSelected = state.selectedTaskId;

    set({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
    });
    persistSnapshot(get());

    get().showToast({
      message: `Deleted "${target.title}"`,
      undoLabel: 'Undo',
      onUndo: () => {
        set({ tasks: prevTasks, selectedTaskId: prevSelected });
        persistSnapshot(get());
        get().dismissToast();
      },
    });
  },

  duplicateTask: (taskId) => {
    const state = get();
    const source = state.tasks.find((t) => t.id === taskId);
    if (!source) return null;
    const nowIso = new Date().toISOString();
    const copy: Task = {
      ...source,
      id: generateId('task'),
      title: `${source.title} (Copy)`,
      status: TaskStatus.Todo,
      completedAt: null,
      order: source.order + 0.5,
      subtasks: source.subtasks.map((st) => ({
        ...st,
        id: generateId('st'),
        completed: false,
      })),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    set((s) => ({ tasks: [...s.tasks, copy], selectedTaskId: copy.id }));
    persistSnapshot(get());
    get().showToast({ message: `Duplicated "${source.title}"` });
    return copy;
  },

  reorderTasks: (activeId, overId) => {
    if (activeId === overId) return;
    set((state) => {
      const sorted = [...state.tasks].sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex((t) => t.id === activeId);
      const newIndex = sorted.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;

      const [moved] = sorted.splice(oldIndex, 1);
      sorted.splice(newIndex, 0, moved);

      const reindexed = sorted.map((t, index) => ({ ...t, order: index }));
      return { tasks: reindexed };
    });
    persistSnapshot(get());
  },

  moveTaskToStatus: (taskId, status) => {
    const nowIso = new Date().toISOString();
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt: status === TaskStatus.Done ? nowIso : null,
              updatedAt: nowIso,
            }
          : t
      ),
    }));
    persistSnapshot(get());
  },

  logFocusMinutes: (taskId, minutes) => {
    if (minutes <= 0) return;
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    set((state) => {
      const nextTasks = taskId
        ? state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, focusMinutes: (t.focusMinutes || 0) + minutes }
              : t
          )
        : state.tasks;

      const existing = state.completionHistory.find((e) => e.date === todayKey);
      const nextHistory = existing
        ? state.completionHistory.map((e) =>
            e.date === todayKey
              ? { ...e, focusMinutes: e.focusMinutes + minutes }
              : e
          )
        : [
            ...state.completionHistory,
            { date: todayKey, completedCount: 0, focusMinutes: minutes },
          ];

      return { tasks: nextTasks, completionHistory: nextHistory };
    });
    persistSnapshot(get());
    get().showToast({ message: `Logged ${minutes} min focus session` });
  },

  addSubtask: (taskId, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const nowIso = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                { id: generateId('st'), title: trimmed, completed: false },
              ],
              updatedAt: nowIso,
            }
          : t
      ),
    }));
    persistSnapshot(get());
  },

  toggleSubtask: (taskId, subtaskId) => {
    const nowIso = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
              updatedAt: nowIso,
            }
          : t
      ),
    }));
    persistSnapshot(get());
  },

  deleteSubtask: (taskId, subtaskId) => {
    const nowIso = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
              updatedAt: nowIso,
            }
          : t
      ),
    }));
    persistSnapshot(get());
  },

  addProject: (name, color, description = '') => {
    const project: Project = {
      id: generateId('proj'),
      workspaceId: get().activeWorkspaceId,
      name: name.trim(),
      color,
      description: description.trim(),
    };
    set((s) => ({
      projects: [...s.projects, project],
      activeView: 'project',
      activeProjectId: project.id,
      activeTag: null,
    }));
    persistSnapshot(get());
    get().showToast({ message: `Project "${project.name}" created` });
    return project;
  },

  deleteProject: (projectId) => {
    const state = get();
    const proj = state.projects.find((p) => p.id === projectId);
    if (!proj) return;
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== projectId),
      tasks: s.tasks.map((t) =>
        t.projectId === projectId ? { ...t, projectId: null } : t
      ),
      activeView: s.activeProjectId === projectId ? 'inbox' : s.activeView,
      activeProjectId: s.activeProjectId === projectId ? null : s.activeProjectId,
    }));
    persistSnapshot(get());
    get().showToast({ message: `Deleted "${proj.name}" · Tasks moved to Inbox` });
  },

  exportDataJson: () => {
    const s = get();
    const payload: PersistedDataV1 = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      theme: s.theme,
      activeWorkspaceId: s.activeWorkspaceId,
      workspaces: s.workspaces,
      projects: s.projects,
      tasks: s.tasks,
      completionHistory: s.completionHistory,
    };
    return JSON.stringify(payload, null, 2);
  },

  importDataJson: (raw) => {
    const parsed = parseImportedBackup(raw);
    if (!parsed) return false;
    syncThemeClass(parsed.theme);
    set({
      theme: parsed.theme,
      activeWorkspaceId: parsed.activeWorkspaceId,
      workspaces: parsed.workspaces,
      projects: parsed.projects,
      tasks: parsed.tasks,
      completionHistory: parsed.completionHistory,
      activeView: 'today',
      activeProjectId: null,
      activeTag: null,
      selectedTaskId: null,
    });
    persistSnapshot(get());
    get().showToast({ message: 'Workspace backup restored' });
    return true;
  },

  resetDemoData: () => {
    const fresh = createSeedData();
    syncThemeClass(fresh.theme);
    set({
      theme: fresh.theme,
      activeWorkspaceId: fresh.activeWorkspaceId,
      workspaces: fresh.workspaces,
      projects: fresh.projects,
      tasks: fresh.tasks,
      completionHistory: fresh.completionHistory,
      activeView: 'today',
      activeProjectId: null,
      activeTag: null,
      selectedTaskId: null,
    });
    persistSnapshot(get());
    get().showToast({ message: 'Demo workspace restored' });
  },
}));
