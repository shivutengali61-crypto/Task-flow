import {
  BarChart3,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Folder,
  Inbox,
  Layers,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatus } from '../types/task';

interface PaletteItem {
  id: string;
  section: 'Navigation' | 'Tasks' | 'Projects' | 'Actions';
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function CommandPalette() {
  const open = useTaskStore((s) => s.commandPaletteOpen);
  const setOpen = useTaskStore((s) => s.setCommandPaletteOpen);
  const theme = useTaskStore((s) => s.theme);
  const toggleTheme = useTaskStore((s) => s.toggleTheme);
  const activeWorkspaceId = useTaskStore((s) => s.activeWorkspaceId);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const setActiveView = useTaskStore((s) => s.setActiveView);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);
  const setQuickAddModalOpen = useTaskStore((s) => s.setQuickAddModalOpen);
  const setSettingsModalOpen = useTaskStore((s) => s.setSettingsModalOpen);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const list: PaletteItem[] = [];

    const navItems: PaletteItem[] = [
      {
        id: 'nav-inbox',
        section: 'Navigation',
        label: 'Go to Inbox',
        icon: <Inbox className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => setActiveView('inbox'),
      },
      {
        id: 'nav-today',
        section: 'Navigation',
        label: 'Go to Today',
        icon: <Layers className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => setActiveView('today'),
      },
      {
        id: 'nav-upcoming',
        section: 'Navigation',
        label: 'Go to Upcoming',
        icon: <CalendarClock className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => setActiveView('upcoming'),
      },
      {
        id: 'nav-calendar',
        section: 'Navigation',
        label: 'Go to Calendar',
        icon: <Calendar className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => setActiveView('calendar'),
      },
      {
        id: 'nav-analytics',
        section: 'Navigation',
        label: 'Go to Analytics',
        icon: <BarChart3 className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => setActiveView('analytics'),
      },
      {
        id: 'nav-completed',
        section: 'Navigation',
        label: 'Go to Completed',
        icon: <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => setActiveView('completed'),
      },
    ];

    const actionItems: PaletteItem[] = [
      {
        id: 'act-new-task',
        section: 'Actions',
        label: 'Create new task',
        subtitle: 'Natural language date & priority parser',
        icon: <Plus className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => setQuickAddModalOpen(true),
      },
      {
        id: 'act-theme',
        section: 'Actions',
        label: theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme',
        icon:
          theme === 'dark' ? (
            <Sun className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.5} />
          ),
        onSelect: () => toggleTheme(),
      },
      {
        id: 'act-settings',
        section: 'Actions',
        label: 'Open Backup & Data Settings',
        icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => setSettingsModalOpen(true),
      },
    ];

    const wsProjects = projects.filter((p) => p.workspaceId === activeWorkspaceId);
    const projectItems: PaletteItem[] = wsProjects.map((proj) => ({
      id: `proj-${proj.id}`,
      section: 'Projects',
      label: proj.name,
      subtitle: 'Project',
      icon: (
        <Folder
          className="h-4 w-4"
          strokeWidth={1.5}
          style={{ color: proj.color }}
        />
      ),
      onSelect: () => setActiveView('project', { projectId: proj.id }),
    }));

    const wsTasks = tasks.filter((t) => t.workspaceId === activeWorkspaceId);
    const taskItems: PaletteItem[] = wsTasks
      .filter((t) =>
        q.length === 0
          ? t.status !== TaskStatus.Done
          : t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
      .slice(0, 8)
      .map((t) => ({
        id: `task-${t.id}`,
        section: 'Tasks',
        label: t.title,
        subtitle: t.status === TaskStatus.Done ? 'Completed' : t.priority,
        icon: <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => {
          setSelectedTaskId(t.id);
          if (t.projectId) {
            setActiveView('project', { projectId: t.projectId });
          } else {
            setActiveView('today');
          }
        },
      }));

    const all = [...taskItems, ...navItems, ...projectItems, ...actionItems];
    for (const item of all) {
      if (
        q.length === 0 ||
        item.label.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
      ) {
        list.push(item);
      }
    }
    return list;
  }, [
    query,
    tasks,
    projects,
    activeWorkspaceId,
    theme,
    setActiveView,
    setSelectedTaskId,
    setQuickAddModalOpen,
    setSettingsModalOpen,
    toggleTheme,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const execute = (item: PaletteItem) => {
    item.onSelect();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (items.length === 0 ? 0 : (i + 1) % items.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (items.length === 0 ? 0 : (i - 1 + items.length) % items.length));
    } else if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault();
      execute(items[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 px-4 pt-[12vh] backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0F1424]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3.5 dark:border-white/[0.08]">
          <Search className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, views, or commands..."
            aria-label="Command palette search"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-[#F1F5F9] dark:placeholder:text-slate-500"
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-white/10">
            ESC
          </kbd>
        </div>

        <div className="tf-scroll max-h-[380px] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-400">
              No matching tasks or commands for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            items.map((item, index) => {
              const prevSection = index > 0 ? items[index - 1].section : null;
              const showHeading = item.section !== prevSection;
              const isHighlighted = index === activeIndex;

              return (
                <React.Fragment key={item.id}>
                  {showHeading && (
                    <p className="mt-2 mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 first:mt-0 dark:text-slate-500">
                      {item.section}
                    </p>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => execute(item)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                      isHighlighted
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-white'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="shrink-0 opacity-75">{item.icon}</span>
                      <span className="truncate font-medium">{item.label}</span>
                    </span>
                    {item.subtitle && (
                      <span className="shrink-0 text-[11px] capitalize text-slate-400 dark:text-slate-500">
                        {item.subtitle}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
