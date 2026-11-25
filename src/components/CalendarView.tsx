import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Priority, Task, TaskStatus } from '../types/task';
import { QuickAddBar } from './QuickAddBar';
import { TaskCard } from './TaskCard';

export function CalendarView() {
  const activeWorkspaceId = useTaskStore((s) => s.activeWorkspaceId);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);

  const [cursorDate, setCursorDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

  const workspaceTasks = useMemo(
    () => tasks.filter((t) => t.workspaceId === activeWorkspaceId && t.dueDate !== null),
    [tasks, activeWorkspaceId]
  );

  const projectsById = useMemo(() => {
    const map = new Map<string, (typeof projects)[number]>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  const calendarDays = useMemo(() => {
    if (calendarMode === 'week') {
      const start = startOfWeek(cursorDate, { weekStartsOn: 0 });
      const end = endOfWeek(cursorDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
    const monthStart = startOfMonth(cursorDate);
    const monthEnd = endOfMonth(cursorDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursorDate, calendarMode]);

  const tasksByDateKey = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of workspaceTasks) {
      if (!t.dueDate) continue;
      const key = format(parseISO(t.dueDate), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [workspaceTasks]);

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayTasks = tasksByDateKey.get(selectedDateKey) ?? [];

  const handlePrev = () => {
    setCursorDate((d) => (calendarMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  };

  const handleNext = () => {
    setCursorDate((d) => (calendarMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));
  };

  const handleJumpToday = () => {
    const now = new Date();
    setCursorDate(now);
    setSelectedDate(now);
  };

  const defaultSelectedIso = useMemo(
    () => setMinutes(setHours(selectedDate, 15), 0).toISOString(),
    [selectedDate]
  );

  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 px-4 py-6 pb-24 sm:px-8 sm:py-8 md:pb-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-slate-900 dark:text-[#F1F5F9]">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#94A3B8]">
            {calendarMode === 'month'
              ? format(cursorDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(cursorDate), 'MMM d')} – ${format(
                  addDays(startOfWeek(cursorDate), 6),
                  'MMM d, yyyy'
                )}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setCalendarMode('month')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                calendarMode === 'month'
                  ? 'bg-slate-900 text-white dark:bg-white/15 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode('week')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                calendarMode === 'week'
                  ? 'bg-slate-900 text-white dark:bg-white/15 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Week
            </button>
          </div>

          <button
            type="button"
            onClick={handleJumpToday}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              aria-label={`Previous ${calendarMode}`}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={`Next ${calendarMode}`}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="tf-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-white/[0.07]">
          {weekDayNames.map((day) => (
            <div
              key={day}
              className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/70 dark:divide-white/[0.06]">
          {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDateKey.get(key) ?? [];
            const inCurrentMonth = calendarMode === 'week' || isSameMonth(day, cursorDate);
            const isSelected = isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <div
                key={key}
                className={`flex flex-col p-1.5 sm:p-2 transition-colors ${
                  calendarMode === 'week' ? 'min-h-[168px]' : 'min-h-[96px] sm:min-h-[112px]'
                } ${
                  !inCurrentMonth
                    ? 'bg-slate-50/60 dark:bg-white/[0.01]'
                    : isSelected
                    ? 'bg-indigo-50/50 dark:bg-indigo-500/[0.09]'
                    : 'hover:bg-slate-50/70 dark:hover:bg-white/[0.02]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  aria-label={`Select ${format(day, 'MMMM d, yyyy')}, ${dayTasks.length} tasks`}
                  className="mb-1 flex items-center justify-between text-left"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      today
                        ? 'tf-gradient text-white'
                        : isSelected
                        ? 'bg-slate-900 text-white dark:bg-white/20 dark:text-white'
                        : inCurrentMonth
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-medium tabular-nums text-slate-400">
                      {dayTasks.length}
                    </span>
                  )}
                </button>

                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  {dayTasks.slice(0, calendarMode === 'week' ? 6 : 3).map((t) => {
                    const done = t.status === TaskStatus.Done;
                    const barColor =
                      t.priority === Priority.Urgent
                        ? 'bg-[#EF4444]'
                        : t.priority === Priority.High
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#6366F1]';
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day);
                          setSelectedTaskId(t.id);
                        }}
                        className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors truncate ${
                          done
                            ? 'bg-slate-100 text-slate-400 line-through dark:bg-white/[0.04] dark:text-slate-500'
                            : 'bg-slate-100/90 text-slate-800 hover:bg-indigo-100/70 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.12]'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${barColor}`} />
                        <span className="truncate">{t.title}</span>
                      </button>
                    );
                  })}
                  {dayTasks.length > (calendarMode === 'week' ? 6 : 3) && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className="px-1 text-left text-[10px] font-medium text-indigo-600 dark:text-indigo-400"
                    >
                      +{dayTasks.length - (calendarMode === 'week' ? 6 : 3)} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda & Quick Add */}
      <section aria-label="Selected day agenda" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
            <CalendarIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </h2>
          <span className="text-xs tabular-nums text-slate-400">
            {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <QuickAddBar
          key={selectedDateKey}
          defaultDueDate={defaultSelectedIso}
          placeholder={`Schedule a task for ${format(selectedDate, 'MMM d')}...`}
        />

        {selectedDayTasks.length > 0 ? (
          <div className="space-y-2">
            {selectedDayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                project={task.projectId ? projectsById.get(task.projectId) : null}
                isSelected={selectedTaskId === task.id}
                draggable={false}
              />
            ))}
          </div>
        ) : (
          <div className="tf-card px-6 py-8 text-center text-sm text-slate-500 dark:text-[#94A3B8]">
            No tasks scheduled for {format(selectedDate, 'MMMM d')}. Add one above to plan this day.
          </div>
        )}
      </section>
    </div>
  );
}
