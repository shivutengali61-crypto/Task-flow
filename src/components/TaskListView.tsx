import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Columns3,
  Filter,
  Inbox as InboxIcon,
  List,
  Plus,
  Search,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Priority, SortBy, Task, TaskStatus } from '../types/task';
import {
  computeDailyProgress,
  filterAndSortTasks,
  formatDueDateLabel,
  isTaskOverdue,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../utils/taskFilters';
import { ProgressRing } from './ProgressRing';
import { QuickAddBar } from './QuickAddBar';
import { TaskCard } from './TaskCard';

function KanbanColumn({
  status,
  tasks,
  projectsById,
  selectedTaskId,
}: {
  status: TaskStatus;
  tasks: Task[];
  projectsById: Map<string, ReturnType<typeof useTaskStore.getState>['projects'][number]>;
  selectedTaskId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  const moveTaskToStatus = useTaskStore((s) => s.moveTaskToStatus);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[320px] flex-col rounded-2xl border p-3 transition-colors ${
        isOver
          ? 'border-indigo-500/60 bg-indigo-50/40 dark:bg-indigo-500/[0.08]'
          : 'border-slate-200/80 bg-slate-100/50 dark:border-white/[0.06] dark:bg-white/[0.02]'
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs font-medium tabular-nums text-slate-400 dark:text-slate-500">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <div key={task.id} className="space-y-1">
              <TaskCard
                task={task}
                project={task.projectId ? projectsById.get(task.projectId) : null}
                isSelected={selectedTaskId === task.id}
              />
              {/* Keyboard-accessible quick status move on board cards */}
              <div className="flex items-center justify-end gap-1.5 px-1 text-[11px] text-slate-400">
                {status !== TaskStatus.Todo && (
                  <button
                    type="button"
                    onClick={() => moveTaskToStatus(task.id, TaskStatus.Todo)}
                    className="hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Move to To Do
                  </button>
                )}
                {status !== TaskStatus.InProgress && (
                  <button
                    type="button"
                    onClick={() => moveTaskToStatus(task.id, TaskStatus.InProgress)}
                    className="hover:text-indigo-500 dark:hover:text-indigo-300"
                  >
                    In Progress
                  </button>
                )}
                {status !== TaskStatus.Done && (
                  <button
                    type="button"
                    onClick={() => moveTaskToStatus(task.id, TaskStatus.Done)}
                    className="hover:text-[#22C55E]"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-white/10 dark:text-slate-500">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskListView() {
  const activeWorkspaceId = useTaskStore((s) => s.activeWorkspaceId);
  const activeView = useTaskStore((s) => s.activeView);
  const activeProjectId = useTaskStore((s) => s.activeProjectId);
  const activeTag = useTaskStore((s) => s.activeTag);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);

  const viewMode = useTaskStore((s) => s.viewMode);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const sortBy = useTaskStore((s) => s.sortBy);
  const setSortBy = useTaskStore((s) => s.setSortBy);
  const priorityFilter = useTaskStore((s) => s.priorityFilter);
  const setPriorityFilter = useTaskStore((s) => s.setPriorityFilter);
  const searchQuery = useTaskStore((s) => s.searchQuery);
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const moveTaskToStatus = useTaskStore((s) => s.moveTaskToStatus);
  const setQuickAddModalOpen = useTaskStore((s) => s.setQuickAddModalOpen);

  const [showCompleted, setShowCompleted] = useState(true);
  const [showOverdue, setShowOverdue] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const projectsById = useMemo(() => {
    const map = new Map<string, (typeof projects)[number]>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  const activeProject = activeProjectId ? projectsById.get(activeProjectId) ?? null : null;

  const filteredTasks = useMemo(
    () =>
      filterAndSortTasks(tasks, {
        workspaceId: activeWorkspaceId,
        view: activeView,
        activeProjectId,
        activeTag,
        priorityFilter,
        searchQuery,
        sortBy,
      }),
    [tasks, activeWorkspaceId, activeView, activeProjectId, activeTag, priorityFilter, searchQuery, sortBy]
  );

  const dailyProgress = useMemo(
    () => computeDailyProgress(tasks, activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  const overdueTasks = useMemo(
    () =>
      activeView === 'completed'
        ? []
        : filteredTasks.filter((t) => isTaskOverdue(t)),
    [filteredTasks, activeView]
  );

  const activeTasks = useMemo(
    () =>
      activeView === 'completed'
        ? []
        : filteredTasks.filter((t) => t.status !== TaskStatus.Done && !isTaskOverdue(t)),
    [filteredTasks, activeView]
  );

  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === TaskStatus.Done),
    [filteredTasks]
  );

  // Group Upcoming view tasks by day
  const upcomingGroups = useMemo(() => {
    if (activeView !== 'upcoming') return [];
    const groups: Array<{ dateKey: string; label: string; items: Task[] }> = [];
    for (const task of activeTasks) {
      if (!task.dueDate) continue;
      const d = startOfDay(parseISO(task.dueDate));
      const key = format(d, 'yyyy-MM-dd');
      let existing = groups.find((g) => g.dateKey === key);
      if (!existing) {
        const label = isSameDay(d, new Date())
          ? `Today · ${format(d, 'EEEE, MMM d')}`
          : `${formatDueDateLabel(task.dueDate, false)} · ${format(d, 'EEEE')}`;
        existing = { dateKey: key, label, items: [] };
        groups.push(existing);
      }
      existing.items.push(task);
    }
    return groups;
  }, [activeTasks, activeView]);

  const headerInfo = useMemo(() => {
    const todayFormatted = format(new Date(), 'EEEE, MMMM d');
    switch (activeView) {
      case 'inbox':
        return {
          title: 'Inbox',
          subtitle: 'Quick capture & untriaged tasks waiting for a project or schedule.',
        };
      case 'today':
        return {
          title: 'Today',
          subtitle: `${todayFormatted} · ${dailyProgress.completedToday} of ${dailyProgress.totalToday} completed`,
        };
      case 'upcoming':
        return {
          title: 'Upcoming',
          subtitle: 'Scheduled work ahead, organized chronologically.',
        };
      case 'completed':
        return {
          title: 'Completed',
          subtitle: `${completedTasks.length} completed tasks in this workspace.`,
        };
      case 'project':
        return {
          title: activeProject?.name ?? 'Project',
          subtitle: activeProject?.description || 'Focused project deliverables and milestones.',
        };
      case 'tag':
        return {
          title: `#${activeTag ?? ''}`,
          subtitle: 'All tasks tagged across projects.',
        };
      default:
        return { title: 'Tasks', subtitle: todayFormatted };
    }
  }, [activeView, activeProject, activeTag, dailyProgress, completedTasks.length]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (viewMode === 'board') {
      if (overId.startsWith('col-')) {
        const newStatus = overId.replace('col-', '') as TaskStatus;
        moveTaskToStatus(activeId, newStatus);
        return;
      }
      const overTask = filteredTasks.find((t) => t.id === overId);
      if (overTask) {
        moveTaskToStatus(activeId, overTask.status);
        reorderTasks(activeId, overId);
      }
      return;
    }

    if (activeId !== overId) {
      reorderTasks(activeId, overId);
      if (sortBy !== 'manual') {
        setSortBy('manual');
      }
    }
  };

  const defaultQuickAddDate = activeView === 'today' ? new Date().toISOString() : null;
  const defaultQuickAddProject = activeView === 'project' ? activeProjectId : null;

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
      {/* Page Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {activeView === 'project' && activeProject && (
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: activeProject.color }}
              />
            )}
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-slate-900 dark:text-[#F1F5F9]">
              {headerInfo.title}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#94A3B8]">{headerInfo.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {(activeView === 'today' || activeView === 'inbox') && (
            <div
              className={`items-center gap-2.5 ${
                selectedTaskId ? 'hidden sm:flex' : 'hidden sm:flex xl:hidden'
              }`}
            >
              <ProgressRing percentage={dailyProgress.percentage} size={44} />
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  {dailyProgress.completedToday}/{dailyProgress.totalToday} done
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Daily goal</p>
              </div>
            </div>
          )}

          {/* List / Board Switcher */}
          {activeView !== 'completed' && (
            <div
              role="group"
              aria-label="View layout switcher"
              className="flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-white dark:bg-white/15 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <List className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                aria-pressed={viewMode === 'board'}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'board'
                    ? 'bg-slate-900 text-white dark:bg-white/15 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Columns3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Board</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Natural-Language Quick Add Bar */}
      {activeView !== 'completed' && (
        <QuickAddBar
          key={`${activeView}-${activeProjectId ?? 'none'}`}
          defaultDueDate={defaultQuickAddDate}
          defaultProjectId={defaultQuickAddProject}
        />
      )}

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Inline filter input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter current list"
            placeholder="Filter tasks..."
            className="w-full rounded-xl border border-slate-200/90 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300">
            <Filter className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
            <span className="sr-only">Filter by priority</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
              aria-label="Filter by priority"
              className="bg-transparent text-xs font-medium focus:outline-none dark:bg-[#0F1424]"
            >
              <option value="all">All Priorities</option>
              <option value={Priority.Urgent}>Urgent</option>
              <option value={Priority.High}>High</option>
              <option value={Priority.Medium}>Medium</option>
              <option value={Priority.Low}>Low</option>
            </select>
          </label>

          {/* Sort Selector */}
          <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
            <span className="sr-only">Sort tasks</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              aria-label="Sort tasks by"
              className="bg-transparent text-xs font-medium focus:outline-none dark:bg-[#0F1424]"
            >
              <option value="manual">Manual Order</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="title">Alphabetical</option>
              <option value="createdAt">Newest First</option>
            </select>
          </label>
        </div>
      </div>

      {/* Main Content: Board or List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {viewMode === 'board' && activeView !== 'completed' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done].map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={filteredTasks.filter((t) => t.status === status)}
                projectsById={projectsById}
                selectedTaskId={selectedTaskId}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6 pb-20 md:pb-8">
            {/* Overdue Section */}
            {overdueTasks.length > 0 && (
              <section aria-label="Overdue tasks" className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowOverdue((v) => !v)}
                  className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EF4444]"
                >
                  {showOverdue ? (
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )}
                  <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Overdue</span>
                  <span className="tabular-nums opacity-80">{overdueTasks.length}</span>
                </button>
                {showOverdue && (
                  <SortableContext
                    items={overdueTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {overdueTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={task.projectId ? projectsById.get(task.projectId) : null}
                          isSelected={selectedTaskId === task.id}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </section>
            )}

            {/* Upcoming Grouped View */}
            {activeView === 'upcoming' && upcomingGroups.length > 0 && (
              <div className="space-y-6">
                {upcomingGroups.map((group) => (
                  <section key={group.dateKey} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
                        {group.label}
                      </h2>
                      <span className="text-xs tabular-nums text-slate-400">
                        {group.items.length}
                      </span>
                    </div>
                    <SortableContext
                      items={group.items.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {group.items.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            project={task.projectId ? projectsById.get(task.projectId) : null}
                            isSelected={selectedTaskId === task.id}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </section>
                ))}
              </div>
            )}

            {/* Active Tasks Section (non-upcoming views) */}
            {activeView !== 'upcoming' && activeView !== 'completed' && activeTasks.length > 0 && (
              <section aria-label="Active tasks" className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
                    {activeView === 'today' ? 'Today' : 'Tasks'}
                  </h2>
                  <span className="text-xs tabular-nums text-slate-400">{activeTasks.length}</span>
                </div>
                <SortableContext
                  items={activeTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        project={task.projectId ? projectsById.get(task.projectId) : null}
                        isSelected={selectedTaskId === task.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </section>
            )}

            {/* Empty State */}
            {overdueTasks.length === 0 &&
              activeTasks.length === 0 &&
              (activeView !== 'completed' || completedTasks.length === 0) && (
                <div className="tf-card flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                    {activeView === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />
                    ) : (
                      <InboxIcon className="h-6 w-6" strokeWidth={1.5} />
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {searchQuery || priorityFilter !== 'all'
                      ? 'No matching tasks'
                      : activeView === 'completed'
                      ? 'No completed tasks yet'
                      : 'All clear for now'}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-[#94A3B8]">
                    {searchQuery || priorityFilter !== 'all'
                      ? 'Try adjusting your priority filter or search query.'
                      : 'Capture a task above using natural dates like "Review proposal Friday at 2pm !high".'}
                  </p>
                  {(searchQuery || priorityFilter !== 'all') ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setPriorityFilter('all');
                      }}
                      className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      Clear filters
                    </button>
                  ) : (
                    activeView !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => setQuickAddModalOpen(true)}
                        className="tf-gradient mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        Create Task
                      </button>
                    )
                  )}
                </div>
              )}

            {/* Completed Section */}
            {completedTasks.length > 0 && (
              <section aria-label="Completed tasks" className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleted((v) => !v)}
                  className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showCompleted ? (
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )}
                  <span>Completed</span>
                  <span className="tabular-nums">{completedTasks.length}</span>
                </button>
                {showCompleted && (
                  <div className="space-y-2 opacity-80">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        project={task.projectId ? projectsById.get(task.projectId) : null}
                        isSelected={selectedTaskId === task.id}
                        draggable={false}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </DndContext>
    </div>
  );
}
