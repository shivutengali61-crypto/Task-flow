import { addDays, format, setHours, setMinutes } from 'date-fns';
import { Calendar, Flag, Folder, Plus, Sparkles, X } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Priority } from '../types/task';
import { formatDueDateLabel, PRIORITY_LABELS } from '../utils/taskFilters';
import { parseNaturalTaskInput } from '../utils/taskParser';

interface QuickAddBarProps {
  defaultDueDate?: string | null;
  defaultProjectId?: string | null;
  autoFocus?: boolean;
  onTaskCreated?: () => void;
  placeholder?: string;
}

export function QuickAddBar({
  defaultDueDate = null,
  defaultProjectId = null,
  autoFocus = false,
  onTaskCreated,
  placeholder = 'Add a task — e.g. "Ship landing page tomorrow 3pm !high"',
}: QuickAddBarProps) {
  const [rawInput, setRawInput] = useState('');
  const [manualPriority, setManualPriority] = useState<Priority | null>(null);
  const [manualDueDate, setManualDueDate] = useState<string | null>(defaultDueDate);
  const [manualProjectId, setManualProjectId] = useState<string | null>(defaultProjectId);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeWorkspaceId = useTaskStore((s) => s.activeWorkspaceId);
  const projects = useTaskStore((s) => s.projects);
  const addTask = useTaskStore((s) => s.addTask);
  const showToast = useTaskStore((s) => s.showToast);

  const workspaceProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId]
  );

  const parsed = useMemo(() => parseNaturalTaskInput(rawInput), [rawInput]);

  // Match #ProjectName to existing workspace project
  const matchedProject = useMemo(() => {
    if (parsed.projectName) {
      const lower = parsed.projectName.toLowerCase();
      return (
        workspaceProjects.find(
          (p) =>
            p.name.toLowerCase() === lower ||
            p.name.toLowerCase().replace(/\s+/g, '').includes(lower)
        ) ?? null
      );
    }
    if (manualProjectId) {
      return workspaceProjects.find((p) => p.id === manualProjectId) ?? null;
    }
    return null;
  }, [parsed.projectName, manualProjectId, workspaceProjects]);

  const effectivePriority = parsed.priority ?? manualPriority ?? Priority.Medium;
  const effectiveDueDate = parsed.dueDate ?? manualDueDate;
  const effectiveHasTime = parsed.dueDate ? parsed.hasTime : false;

  const hasParsedPreview =
    rawInput.trim().length > 0 &&
    (parsed.dueDate !== null ||
      parsed.priority !== null ||
      parsed.projectName !== null ||
      parsed.tags.length > 0 ||
      manualPriority !== null ||
      manualDueDate !== defaultDueDate ||
      manualProjectId !== defaultProjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = parsed.title.trim();
    if (!title) return;

    const created = addTask({
      title,
      priority: effectivePriority,
      dueDate: effectiveDueDate,
      hasTime: effectiveHasTime,
      projectId: matchedProject ? matchedProject.id : manualProjectId,
      tags: parsed.tags,
    });

    setRawInput('');
    setManualPriority(null);
    setManualDueDate(defaultDueDate);
    setManualProjectId(defaultProjectId);
    setShowDateMenu(false);
    setShowPriorityMenu(false);
    setShowProjectMenu(false);
    showToast({ message: `Added "${created.title}"` });
    onTaskCreated?.();
  };

  const setQuickDate = (daysFromToday: number | null) => {
    if (daysFromToday === null) {
      setManualDueDate(null);
    } else {
      const d = setMinutes(setHours(addDays(new Date(), daysFromToday), 17), 0);
      setManualDueDate(d.toISOString());
    }
    setShowDateMenu(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="tf-card relative transition-colors focus-within:border-indigo-500/60"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-indigo-500 dark:text-indigo-400">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
        </span>

        <input
          ref={inputRef}
          type="text"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          autoFocus={autoFocus}
          aria-label="Quick add task with natural language"
          placeholder={placeholder}
          className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
        />

        <div className="flex shrink-0 items-center gap-1">
          {/* Due Date Picker Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowDateMenu((v) => !v);
                setShowPriorityMenu(false);
                setShowProjectMenu(false);
              }}
              aria-label="Set due date"
              title="Set due date"
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors whitespace-nowrap ${
                effectiveDueDate
                  ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-300'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">
                {effectiveDueDate ? formatDueDateLabel(effectiveDueDate, effectiveHasTime) : 'Date'}
              </span>
            </button>
            {showDateMenu && (
              <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#13192B]">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <span>Today</span>
                  <span className="text-slate-400 tabular-nums">{format(new Date(), 'EEE')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <span>Tomorrow</span>
                  <span className="text-slate-400 tabular-nums">
                    {format(addDays(new Date(), 1), 'EEE')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <span>Next Week</span>
                  <span className="text-slate-400 tabular-nums">
                    {format(addDays(new Date(), 7), 'MMM d')}
                  </span>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-white/10" />
                <label className="block px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Pick date
                  <input
                    type="date"
                    onChange={(e) => {
                      if (e.target.value) {
                        setManualDueDate(new Date(`${e.target.value}T17:00:00`).toISOString());
                        setShowDateMenu(false);
                      }
                    }}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-transparent px-2 py-1 text-xs text-slate-800 dark:border-white/10 dark:text-slate-100"
                  />
                </label>
                {manualDueDate && (
                  <button
                    type="button"
                    onClick={() => setQuickDate(null)}
                    className="mt-1 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-red-500 hover:bg-red-500/10"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Clear date
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Priority Picker Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowPriorityMenu((v) => !v);
                setShowDateMenu(false);
                setShowProjectMenu(false);
              }}
              aria-label="Set priority"
              title="Set priority"
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors whitespace-nowrap ${
                effectivePriority === Priority.Urgent
                  ? 'text-red-500 bg-red-500/10'
                  : effectivePriority === Priority.High
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
              }`}
            >
              <Flag className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden md:inline">{PRIORITY_LABELS[effectivePriority]}</span>
            </button>
            {showPriorityMenu && (
              <div className="absolute right-0 top-full z-30 mt-1.5 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#13192B]">
                {(
                  [Priority.Urgent, Priority.High, Priority.Medium, Priority.Low] as Priority[]
                ).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setManualPriority(p);
                      setShowPriorityMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <span>{PRIORITY_LABELS[p]}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        p === Priority.Urgent
                          ? 'bg-[#EF4444]'
                          : p === Priority.High
                          ? 'bg-[#F59E0B]'
                          : p === Priority.Medium
                          ? 'bg-[#6366F1]'
                          : 'bg-slate-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Picker Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowProjectMenu((v) => !v);
                setShowDateMenu(false);
                setShowPriorityMenu(false);
              }}
              aria-label="Set project"
              title="Set project"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200 whitespace-nowrap"
            >
              <Folder className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline max-w-[96px] truncate">
                {matchedProject ? matchedProject.name : 'Inbox'}
              </span>
            </button>
            {showProjectMenu && (
              <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#13192B]">
                <button
                  type="button"
                  onClick={() => {
                    setManualProjectId(null);
                    setShowProjectMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Inbox</span>
                </button>
                {workspaceProjects.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => {
                      setManualProjectId(proj.id);
                      setShowProjectMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: proj.color }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!rawInput.trim()}
            className="tf-gradient ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-40 whitespace-nowrap shrink-0 sm:px-3.5"
          >
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* Live natural-language parse preview strip */}
      {hasParsedPreview && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 font-medium text-indigo-500 dark:text-indigo-400">
            <Sparkles className="h-3 w-3" strokeWidth={1.5} />
            Parsed
          </span>
          <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[260px]">
            {parsed.title}
          </span>
          {effectiveDueDate && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums text-indigo-600 dark:text-indigo-300">
                Due {formatDueDateLabel(effectiveDueDate, effectiveHasTime)}
              </span>
            </>
          )}
          {(parsed.priority || manualPriority) && (
            <>
              <span aria-hidden="true">·</span>
              <span
                className={
                  effectivePriority === Priority.Urgent
                    ? 'text-[#EF4444]'
                    : effectivePriority === Priority.High
                    ? 'text-[#F59E0B]'
                    : 'text-slate-600 dark:text-slate-300'
                }
              >
                {PRIORITY_LABELS[effectivePriority]} priority
              </span>
            </>
          )}
          {matchedProject && (
            <>
              <span aria-hidden="true">·</span>
              <span>#{matchedProject.name}</span>
            </>
          )}
          {parsed.tags.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{parsed.tags.map((t) => `@${t}`).join(' ')}</span>
            </>
          )}
        </div>
      )}
    </form>
  );
}
