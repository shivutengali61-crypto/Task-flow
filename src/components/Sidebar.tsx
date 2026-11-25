import {
  BarChart3,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Hash,
  Inbox,
  Keyboard,
  Layers,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { NavView } from '../types/task';
import { computeNavCounts } from '../utils/taskFilters';
import { Tooltip } from './Tooltip';

const PROJECT_COLORS = ['#6366F1', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export function Sidebar() {
  const theme = useTaskStore((s) => s.theme);
  const toggleTheme = useTaskStore((s) => s.toggleTheme);
  const workspaces = useTaskStore((s) => s.workspaces);
  const activeWorkspaceId = useTaskStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useTaskStore((s) => s.setActiveWorkspace);
  const addWorkspace = useTaskStore((s) => s.addWorkspace);
  const projects = useTaskStore((s) => s.projects);
  const addProject = useTaskStore((s) => s.addProject);
  const deleteProject = useTaskStore((s) => s.deleteProject);
  const tasks = useTaskStore((s) => s.tasks);

  const activeView = useTaskStore((s) => s.activeView);
  const activeProjectId = useTaskStore((s) => s.activeProjectId);
  const activeTag = useTaskStore((s) => s.activeTag);
  const setActiveView = useTaskStore((s) => s.setActiveView);

  const sidebarCollapsed = useTaskStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useTaskStore((s) => s.toggleSidebarCollapsed);
  const mobileDrawerOpen = useTaskStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useTaskStore((s) => s.setMobileDrawerOpen);
  const setCommandPaletteOpen = useTaskStore((s) => s.setCommandPaletteOpen);
  const setShortcutsModalOpen = useTaskStore((s) => s.setShortcutsModalOpen);
  const setSettingsModalOpen = useTaskStore((s) => s.setSettingsModalOpen);

  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const workspaceProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId]
  );

  const navCounts = useMemo(
    () => computeNavCounts(tasks, activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  const uniqueTags = useMemo(
    () => Object.entries(navCounts.byTag).sort((a, b) => b[1] - a[1]),
    [navCounts.byTag]
  );

  const primaryNav: Array<{
    id: NavView;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    count?: number;
  }> = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: navCounts.inbox },
    { id: 'today', label: 'Today', icon: Layers, count: navCounts.today },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarClock, count: navCounts.upcoming },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: navCounts.completed },
  ];

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    addWorkspace(newWsName.trim());
    setNewWsName('');
    setCreatingWorkspace(false);
    setWsMenuOpen(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    addProject(newProjectName.trim(), newProjectColor);
    setNewProjectName('');
    setNewProjectColor(PROJECT_COLORS[0]);
    setCreatingProject(false);
  };

  const renderSidebarInner = (isDrawer: boolean) => {
    const collapsed = !isDrawer && sidebarCollapsed;

    return (
      <div className="flex h-full flex-col bg-white border-r border-slate-200/80 dark:bg-[#0F1424] dark:border-white/[0.07]">
        {/* Brand Header */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setActiveView('today')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none"
          >
            <span className="tf-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm">
              TF
            </span>
            {!collapsed && (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-[#F1F5F9]">
                  TaskFlow
                </span>
                <span className="tf-gradient rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
                  PRO
                </span>
              </span>
            )}
          </button>

          {isDrawer ? (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close sidebar navigation"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : (
            <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </Tooltip>
          )}
        </div>

        {/* Workspace Switcher */}
        <div className="relative px-3 pb-2">
          <button
            type="button"
            onClick={() => setWsMenuOpen((v) => !v)}
            aria-expanded={wsMenuOpen}
            aria-label={`Switch workspace, current ${activeWorkspace.name}`}
            className={`flex w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-2 text-left transition-colors hover:bg-slate-100 dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.06] ${
              collapsed ? 'justify-center' : 'justify-between gap-2'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                style={{ backgroundColor: activeWorkspace.accentColor }}
              >
                {activeWorkspace.initials}
              </span>
              {!collapsed && (
                <span className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  {activeWorkspace.name}
                </span>
              )}
            </span>
            {!collapsed && (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.5} />
            )}
          </button>

          {wsMenuOpen && (
            <div className="absolute left-3 right-3 top-full z-40 mt-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#13192B]">
              <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Workspaces
              </p>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setActiveWorkspace(ws.id);
                    setWsMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                    ws.id === activeWorkspaceId
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: ws.accentColor }}
                    >
                      {ws.initials}
                    </span>
                    <span className="truncate">{ws.name}</span>
                  </span>
                </button>
              ))}

              <div className="my-1 border-t border-slate-100 dark:border-white/10" />

              {creatingWorkspace ? (
                <form onSubmit={handleCreateWorkspace} className="p-1.5 space-y-2">
                  <input
                    type="text"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    placeholder="Workspace name..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:text-slate-100"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCreatingWorkspace(false)}
                      className="rounded-md px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="tf-gradient rounded-md px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      Create
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreatingWorkspace(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-white/5"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>New Workspace</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search Trigger with ⌘K hint */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Search tasks and commands (Command K)"
            className={`flex w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-2 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-[#94A3B8] dark:hover:border-white/15 dark:hover:text-slate-200 ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              {!collapsed && <span>Search tasks...</span>}
            </span>
            {!collapsed && (
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        {/* Scrollable Navigation Content */}
        <nav aria-label="Main navigation" className="tf-scroll flex-1 overflow-y-auto px-3 space-y-5">
          {/* Core Views */}
          <div className="space-y-0.5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`flex w-full items-center rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all ${
                    collapsed ? 'justify-center' : 'justify-between'
                  } ${
                    isActive
                      ? 'tf-gradient text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.05] dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!collapsed && item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        isActive ? 'text-white/90' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Projects Section */}
          {!collapsed && (
            <div>
              <div className="mb-1.5 flex items-center justify-between px-2.5">
                <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
                  Projects
                </span>
                <Tooltip label="Create project">
                  <button
                    type="button"
                    onClick={() => setCreatingProject((v) => !v)}
                    aria-label="Create new project"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </Tooltip>
              </div>

              {creatingProject && (
                <form
                  onSubmit={handleCreateProject}
                  className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#0B0F1A] dark:text-slate-100"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {PROJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Select color ${color}`}
                          onClick={() => setNewProjectColor(color)}
                          className={`h-4 w-4 rounded-full transition-transform ${
                            newProjectColor === color ? 'scale-125 ring-2 ring-white/80' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="tf-gradient rounded-md px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-0.5">
                {workspaceProjects.map((proj) => {
                  const isActive = activeView === 'project' && activeProjectId === proj.id;
                  const count = navCounts.byProject[proj.id] ?? 0;
                  return (
                    <div key={proj.id} className="group flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveView('project', { projectId: proj.id })}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex flex-1 min-w-0 items-center justify-between rounded-xl px-2.5 py-1.5 text-[13.5px] font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-white/[0.08] dark:text-[#F1F5F9]'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.04] dark:hover:text-[#F1F5F9]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: proj.color }}
                          />
                          <span className="truncate">{proj.name}</span>
                        </span>
                        {count > 0 && (
                          <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
                            {count}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(proj.id)}
                        aria-label={`Delete project ${proj.name}`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-[#EF4444] group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags Section */}
          {!collapsed && uniqueTags.length > 0 && (
            <div className="pb-4">
              <div className="mb-1.5 px-2.5">
                <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
                  Tags
                </span>
              </div>
              <div className="space-y-0.5">
                {uniqueTags.slice(0, 8).map(([tag, count]) => {
                  const isActive = activeView === 'tag' && activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveView('tag', { tag })}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-white/[0.08] dark:text-[#F1F5F9]'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.04] dark:hover:text-[#F1F5F9]'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Hash className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                        <span className="truncate">{tag}</span>
                      </span>
                      <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer Controls: Theme Toggle, Shortcuts, Data Settings */}
        <div
          className={`shrink-0 border-t border-slate-200/80 p-3 dark:border-white/[0.07] ${
            collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between'
          }`}
        >
          <Tooltip label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} side="top">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/5 dark:hover:text-slate-100`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.5} />
              )}
              {!collapsed && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
            </button>
          </Tooltip>

          <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
            <Tooltip label="Keyboard shortcuts (?)" side="top">
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(true)}
                aria-label="Open keyboard shortcuts"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/5 dark:hover:text-slate-100"
              >
                <Keyboard className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </Tooltip>

            <Tooltip label="Backup & settings" side="top">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                aria-label="Open workspace settings and backup"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/5 dark:hover:text-slate-100"
              >
                <Settings className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Workspace sidebar"
        className={`hidden shrink-0 transition-[width] duration-200 lg:block ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        {renderSidebarInner(false)}
      </aside>

      {/* Tablet / Mobile Slide-over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 h-full w-[280px] max-w-[85vw] shadow-2xl">
            {renderSidebarInner(true)}
          </div>
        </div>
      )}
    </>
  );
}
