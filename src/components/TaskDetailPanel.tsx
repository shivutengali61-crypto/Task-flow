import { addDays, format, parseISO, setHours, setMinutes } from 'date-fns';
import {
  Calendar,
  Check,
  Copy,
  Flag,
  Folder,
  Pause,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Star,
  Tag,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Priority, Recurrence, TaskStatus } from '../types/task';
import { computeDailyProgress, PRIORITY_LABELS, STATUS_LABELS } from '../utils/taskFilters';
import { ProgressRing } from './ProgressRing';
import { Tooltip } from './Tooltip';

function useIsXlViewport(): boolean {
  const [isXl, setIsXl] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const onChange = (e: MediaQueryListEvent) => setIsXl(e.matches);
    setIsXl(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isXl;
}

function FocusTimerWidget({ taskId, taskTitle }: { taskId: string | null; taskTitle?: string }) {
  const logFocusMinutes = useTaskStore((s) => s.logFocusMinutes);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          logFocusMinutes(taskId, durationMinutes);
          return durationMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, taskId, durationMinutes, logFocusMinutes]);

  const handleSelectDuration = (mins: number) => {
    setRunning(false);
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const handleReset = () => {
    setRunning(false);
    setSecondsLeft(durationMinutes * 60);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="tf-card p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
          <Timer className="h-3.5 w-3.5" strokeWidth={1.5} />
          Focus Timer
        </span>
        <div className="flex items-center gap-1">
          {[15, 25, 50].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSelectDuration(m)}
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition-colors ${
                durationMinutes === m
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {taskTitle && (
        <p className="mt-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
          Targeting: {taskTitle}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-[#F1F5F9]">
          {mins}:{secs}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            aria-label={running ? 'Pause focus timer' : 'Start focus timer'}
            className="tf-gradient inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white"
          >
            {running ? (
              <>
                <Pause className="h-3.5 w-3.5" strokeWidth={1.75} />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
                Focus
              </>
            )}
          </button>

          <Tooltip label="Reset timer">
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset focus timer"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export function TaskDetailPanel() {
  const activeWorkspaceId = useTaskStore((s) => s.activeWorkspaceId);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);
  const updateTask = useTaskStore((s) => s.updateTask);
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const duplicateTask = useTaskStore((s) => s.duplicateTask);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const deleteSubtask = useTaskStore((s) => s.deleteSubtask);

  const isXl = useIsXlViewport();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const workspaceProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId]
  );

  const dailyProgress = useMemo(
    () => computeDailyProgress(tasks, activeWorkspaceId),
    [tasks, activeWorkspaceId]
  );

  const upNextTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.workspaceId === activeWorkspaceId && t.status !== TaskStatus.Done)
        .sort((a, b) => {
          if (a.starred !== b.starred) return a.starred ? -1 : 1;
          const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
          return weight[b.priority] - weight[a.priority];
        })
        .slice(0, 4),
    [tasks, activeWorkspaceId]
  );

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    addSubtask(selectedTask.id, newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const cleaned = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!cleaned || selectedTask.tags.includes(cleaned)) {
      setNewTagInput('');
      return;
    }
    updateTask(selectedTask.id, { tags: [...selectedTask.tags, cleaned] });
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    if (!selectedTask) return;
    updateTask(selectedTask.id, {
      tags: selectedTask.tags.filter((t) => t !== tag),
    });
  };

  const renderInspectorContent = () => {
    if (!selectedTask) {
      return (
        <div className="flex h-full flex-col gap-5 overflow-y-auto p-5 tf-scroll">
          {/* Today's Summary Card */}
          <div className="tf-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
                  Daily Momentum
                </h2>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-[#F1F5F9]">
                  {dailyProgress.completedToday} of {dailyProgress.totalToday} tasks
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {dailyProgress.overdueCount > 0
                    ? `${dailyProgress.overdueCount} overdue to review`
                    : 'Right on track today'}
                </p>
              </div>
              <ProgressRing percentage={dailyProgress.percentage} size={56} strokeWidth={4} />
            </div>
          </div>

          {/* Focus Timer */}
          <FocusTimerWidget taskId={null} />

          {/* Up Next Priority Queue */}
          <div>
            <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
              Up Next
            </h2>
            {upNextTasks.length > 0 ? (
              <div className="space-y-2">
                {upNextTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-label={`Inspect task "${t.title}"`}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="tf-card flex w-full items-start justify-between gap-2 p-3 text-left transition-colors hover:border-indigo-500/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        {PRIORITY_LABELS[t.priority]}
                        {t.subtasks.length > 0 &&
                          ` · ${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length} subtasks`}
                      </p>
                    </div>
                    {t.starred && (
                      <Star
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F59E0B]"
                        fill="currentColor"
                        strokeWidth={1.5}
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Select any task to inspect details, notes, and subtasks.
              </p>
            )}
          </div>

          {/* Keyboard Hints */}
          <div className="mt-auto rounded-xl border border-slate-200/70 p-3.5 text-xs text-slate-500 dark:border-white/[0.06] dark:text-[#94A3B8]">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
              <span>Command search</span>
              <span className="text-right font-mono text-slate-700 dark:text-slate-300">⌘K</span>
              <span>New task</span>
              <span className="text-right font-mono text-slate-700 dark:text-slate-300">N</span>
              <span>Toggle theme</span>
              <span className="text-right font-mono text-slate-700 dark:text-slate-300">⇧T</span>
              <span>All shortcuts</span>
              <span className="text-right font-mono text-slate-700 dark:text-slate-300">?</span>
            </div>
          </div>
        </div>
      );
    }

    const isDone = selectedTask.status === TaskStatus.Done;
    const dueDateValue = selectedTask.dueDate
      ? format(parseISO(selectedTask.dueDate), 'yyyy-MM-dd')
      : '';
    const dueTimeValue =
      selectedTask.dueDate && selectedTask.hasTime
        ? format(parseISO(selectedTask.dueDate), 'HH:mm')
        : '';

    const completedSubtasks = selectedTask.subtasks.filter((st) => st.completed).length;
    const subtaskPct =
      selectedTask.subtasks.length === 0
        ? 0
        : Math.round((completedSubtasks / selectedTask.subtasks.length) * 100);

    return (
      <div className="flex h-full flex-col">
        {/* Inspector Top Bar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 px-4 dark:border-white/[0.07]">
          <button
            type="button"
            onClick={() => toggleTaskCompletion(selectedTask.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isDone
                ? 'bg-[#22C55E]/15 text-[#22C55E]'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5'
            }`}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
            <span>{isDone ? 'Completed' : 'Mark Complete'}</span>
          </button>

          <div className="flex items-center gap-1">
            <Tooltip label={selectedTask.starred ? 'Remove star' : 'Star task'}>
              <button
                type="button"
                aria-label={selectedTask.starred ? 'Unstar selected task' : 'Star selected task'}
                onClick={() => updateTask(selectedTask.id, { starred: !selectedTask.starred })}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5 ${
                  selectedTask.starred ? 'text-[#F59E0B]' : 'text-slate-400'
                }`}
              >
                <Star
                  className="h-4 w-4"
                  strokeWidth={1.5}
                  fill={selectedTask.starred ? 'currentColor' : 'none'}
                />
              </button>
            </Tooltip>

            <Tooltip label="Duplicate task">
              <button
                type="button"
                aria-label="Duplicate selected task"
                onClick={() => duplicateTask(selectedTask.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"
              >
                <Copy className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </Tooltip>

            <Tooltip label="Delete task">
              <button
                type="button"
                aria-label="Delete selected task"
                onClick={() => deleteTask(selectedTask.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/10 hover:text-[#EF4444]"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </Tooltip>

            <Tooltip label="Close inspector">
              <button
                type="button"
                aria-label="Close task inspector"
                onClick={() => setSelectedTaskId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="tf-scroll flex-1 space-y-5 overflow-y-auto p-5">
          {/* Editable Title & Description */}
          <div className="space-y-2">
            <label className="sr-only" htmlFor="inspector-title">
              Task title
            </label>
            <input
              id="inspector-title"
              type="text"
              value={selectedTask.title}
              onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
              className={`w-full bg-transparent text-base font-semibold leading-snug focus:outline-none ${
                isDone
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-[#F1F5F9]'
              }`}
            />

            <label className="sr-only" htmlFor="inspector-description">
              Task notes
            </label>
            <textarea
              id="inspector-description"
              value={selectedTask.description}
              onChange={(e) => updateTask(selectedTask.id, { description: e.target.value })}
              placeholder="Add notes, links, or context..."
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Structured Properties */}
          <div className="space-y-3 border-t border-slate-200/70 pt-4 text-xs dark:border-white/[0.07]">
            {/* Status */}
            <div className="grid grid-cols-[100px_1fr] items-center gap-2">
              <span className="text-slate-500 dark:text-[#94A3B8]">Status</span>
              <select
                aria-label="Task status"
                value={selectedTask.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as TaskStatus;
                  updateTask(selectedTask.id, {
                    status: nextStatus,
                    completedAt: nextStatus === TaskStatus.Done ? new Date().toISOString() : null,
                  });
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#13192B] dark:text-slate-100"
              >
                {Object.values(TaskStatus).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="grid grid-cols-[100px_1fr] items-center gap-2">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
                <Flag className="h-3.5 w-3.5" strokeWidth={1.5} />
                Priority
              </span>
              <select
                aria-label="Task priority"
                value={selectedTask.priority}
                onChange={(e) =>
                  updateTask(selectedTask.id, { priority: e.target.value as Priority })
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#13192B] dark:text-slate-100"
              >
                {Object.values(Priority).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div className="grid grid-cols-[100px_1fr] items-center gap-2">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
                <Folder className="h-3.5 w-3.5" strokeWidth={1.5} />
                Project
              </span>
              <select
                aria-label="Task project"
                value={selectedTask.projectId ?? ''}
                onChange={(e) =>
                  updateTask(selectedTask.id, {
                    projectId: e.target.value ? e.target.value : null,
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#13192B] dark:text-slate-100"
              >
                <option value="">Inbox</option>
                {workspaceProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-[100px_1fr] items-start gap-2">
              <span className="mt-1.5 flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                Due Date
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    aria-label="Due date"
                    value={dueDateValue}
                    onChange={(e) => {
                      if (!e.target.value) {
                        updateTask(selectedTask.id, { dueDate: null, hasTime: false });
                      } else {
                        const timePart = dueTimeValue || '17:00';
                        updateTask(selectedTask.id, {
                          dueDate: new Date(`${e.target.value}T${timePart}:00`).toISOString(),
                        });
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#13192B] dark:text-slate-100"
                  />
                  <input
                    type="time"
                    aria-label="Due time"
                    value={dueTimeValue}
                    onChange={(e) => {
                      const baseDate = dueDateValue || format(new Date(), 'yyyy-MM-dd');
                      if (!e.target.value) {
                        updateTask(selectedTask.id, {
                          dueDate: new Date(`${baseDate}T17:00:00`).toISOString(),
                          hasTime: false,
                        });
                      } else {
                        updateTask(selectedTask.id, {
                          dueDate: new Date(`${baseDate}T${e.target.value}:00`).toISOString(),
                          hasTime: true,
                        });
                      }
                    }}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#13192B] dark:text-slate-100"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() =>
                      updateTask(selectedTask.id, {
                        dueDate: setMinutes(setHours(new Date(), 17), 0).toISOString(),
                        hasTime: false,
                      })
                    }
                    className="text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    Today
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateTask(selectedTask.id, {
                        dueDate: setMinutes(setHours(addDays(new Date(), 1), 17), 0).toISOString(),
                        hasTime: false,
                      })
                    }
                    className="text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    Tomorrow
                  </button>
                  {selectedTask.dueDate && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(selectedTask.id, { dueDate: null, hasTime: false })
                        }
                        className="text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Recurrence */}
            <div className="grid grid-cols-[100px_1fr] items-center gap-2">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
                <Repeat className="h-3.5 w-3.5" strokeWidth={1.5} />
                Repeat
              </span>
              <select
                aria-label="Task recurrence"
                value={selectedTask.recurrence}
                onChange={(e) =>
                  updateTask(selectedTask.id, { recurrence: e.target.value as Recurrence })
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium capitalize text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#13192B] dark:text-slate-100"
              >
                <option value={Recurrence.None}>Does not repeat</option>
                <option value={Recurrence.Daily}>Daily</option>
                <option value={Recurrence.Weekdays}>Weekdays</option>
                <option value={Recurrence.Weekly}>Weekly</option>
                <option value={Recurrence.Monthly}>Monthly</option>
              </select>
            </div>

            {/* Tags */}
            <div className="grid grid-cols-[100px_1fr] items-start gap-2">
              <span className="mt-1 flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
                <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />
                Tags
              </span>
              <div className="space-y-2">
                {selectedTask.tags.length > 0 && (
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                    {selectedTask.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Remove tag ${tag}`}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddTag} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Add tag..."
                    aria-label="Add a tag"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#13192B] dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    aria-label="Confirm add tag"
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-2.5 border-t border-slate-200/70 pt-4 dark:border-white/[0.07]">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
                Subtasks
              </h3>
              {selectedTask.subtasks.length > 0 && (
                <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                  {completedSubtasks}/{selectedTask.subtasks.length} ({subtaskPct}%)
                </span>
              )}
            </div>

            {selectedTask.subtasks.length > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.07]">
                <div
                  className="tf-gradient h-full rounded-full transition-all duration-300"
                  style={{ width: `${subtaskPct}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {selectedTask.subtasks.map((st) => (
                <div
                  key={st.id}
                  className="group flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100/70 dark:hover:bg-white/[0.03]"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={st.completed}
                    aria-label={st.completed ? `Uncheck subtask "${st.title}"` : `Complete subtask "${st.title}"`}
                    onClick={() => toggleSubtask(selectedTask.id, st.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        st.completed
                          ? 'border-[#22C55E] bg-[#22C55E] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {st.completed && <Check className="h-2.5 w-2.5" strokeWidth={2.5} />}
                    </span>
                    <span
                      className={`truncate text-xs ${
                        st.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSubtask(selectedTask.id, st.id)}
                    aria-label={`Delete subtask "${st.title}"`}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a subtask..."
                aria-label="New subtask title"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#13192B] dark:text-slate-100"
              />
              <button
                type="submit"
                aria-label="Add subtask"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </form>
          </div>

          {/* Embedded Focus Timer */}
          <div className="border-t border-slate-200/70 pt-4 dark:border-white/[0.07]">
            <FocusTimerWidget taskId={selectedTask.id} taskTitle={selectedTask.title} />
          </div>

          {/* Footer Timestamps */}
          <div className="border-t border-slate-200/70 pt-3 text-[11px] tabular-nums text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
            <p>Created {format(parseISO(selectedTask.createdAt), 'MMM d, yyyy · h:mm a')}</p>
            {selectedTask.focusMinutes > 0 && (
              <p className="mt-0.5">Focus logged: {selectedTask.focusMinutes} min</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isXl) {
    return (
      <aside
        aria-label="Task inspector panel"
        className="h-full w-[340px] shrink-0 border-l border-slate-200/80 bg-white/70 dark:border-white/[0.07] dark:bg-[#0F1424]/70"
      >
        {renderInspectorContent()}
      </aside>
    );
  }

  if (!selectedTask) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Task details"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        onClick={() => setSelectedTaskId(null)}
      />
      <div className="relative z-10 h-full w-full max-w-[380px] bg-white shadow-2xl dark:bg-[#0F1424]">
        {renderInspectorContent()}
      </div>
    </div>
  );
}
