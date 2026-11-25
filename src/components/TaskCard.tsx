import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Check,
  GripVertical,
  ListChecks,
  Repeat,
  Star,
  Trash2,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Priority, Project, Recurrence, Task, TaskStatus } from '../types/task';
import {
  formatDueDateLabel,
  isTaskDueToday,
  isTaskOverdue,
  PRIORITY_LABELS,
} from '../utils/taskFilters';
import { Tooltip } from './Tooltip';

interface TaskCardProps {
  task: Task;
  project?: Project | null;
  isSelected: boolean;
  draggable?: boolean;
}

const PRIORITY_TEXT_STYLE: Record<Priority, string> = {
  [Priority.Urgent]: 'text-[#EF4444] font-medium',
  [Priority.High]: 'text-[#F59E0B] font-medium',
  [Priority.Medium]: 'text-slate-500 dark:text-slate-400',
  [Priority.Low]: 'text-slate-400 dark:text-slate-500',
};

const CHECKBOX_RING_STYLE: Record<Priority, string> = {
  [Priority.Urgent]: 'border-[#EF4444] hover:bg-[#EF4444]/10',
  [Priority.High]: 'border-[#F59E0B] hover:bg-[#F59E0B]/10',
  [Priority.Medium]: 'border-slate-300 dark:border-slate-600 hover:border-indigo-400',
  [Priority.Low]: 'border-slate-300 dark:border-slate-700 hover:border-slate-400',
};

export function TaskCard({ task, project, isSelected, draggable = true }: TaskCardProps) {
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDone = task.status === TaskStatus.Done;
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task);
  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`task-card-${task.id}`}
      className={`tf-card group relative flex items-start gap-2.5 px-3.5 py-3 transition-colors duration-150 ${
        isDragging ? 'z-30 opacity-80 shadow-xl ring-1 ring-indigo-500/50' : ''
      } ${
        isSelected
          ? 'border-indigo-500/60 bg-indigo-50/40 dark:border-indigo-400/50 dark:bg-indigo-500/[0.08]'
          : 'hover:border-slate-300 dark:hover:border-white/15'
      }`}
    >
      {/* Drag Handle */}
      {draggable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder "${task.title}"`}
          className="mt-0.5 -ml-1 hidden h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 opacity-0 transition-opacity hover:text-slate-600 focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing sm:flex dark:text-slate-500 dark:hover:text-slate-300"
        >
          <GripVertical className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      )}

      {/* Animated Completion Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isDone}
        aria-label={isDone ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
        onClick={(e) => {
          e.stopPropagation();
          toggleTaskCompletion(task.id);
        }}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
          isDone
            ? 'border-[#22C55E] bg-[#22C55E] text-white'
            : CHECKBOX_RING_STYLE[task.priority]
        }`}
      >
        {isDone && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <Check className="h-3 w-3" strokeWidth={2.5} />
          </motion.span>
        )}
      </button>

      {/* Clickable Task Body Button */}
      <button
        type="button"
        onClick={() => setSelectedTaskId(task.id)}
        aria-label={`Inspect task "${task.title}"`}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-[15px] font-semibold leading-snug tracking-[-0.01em] ${
              isDone
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-[#F1F5F9]'
            }`}
          >
            {task.title}
          </span>
          {task.status === TaskStatus.InProgress && (
            <span className="shrink-0 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              In Progress
            </span>
          )}
        </div>

        {/* Clean Unboxed Metadata Row with typographic separators */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500 dark:text-[#94A3B8]">
          <span className={PRIORITY_TEXT_STYLE[task.priority]}>
            {PRIORITY_LABELS[task.priority]}
          </span>

          {task.dueDate && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                ·
              </span>
              <span
                className={`inline-flex items-center gap-1 tabular-nums ${
                  overdue
                    ? 'font-medium text-[#EF4444]'
                    : dueToday
                    ? 'font-medium text-[#F59E0B]'
                    : ''
                }`}
              >
                {overdue ? (
                  <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
                ) : (
                  <Calendar className="h-3 w-3" strokeWidth={1.5} />
                )}
                {overdue ? `Overdue · ${formatDueDateLabel(task.dueDate, task.hasTime)}` : formatDueDateLabel(task.dueDate, task.hasTime)}
              </span>
            </>
          )}

          {task.recurrence !== Recurrence.None && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                ·
              </span>
              <span className="inline-flex items-center gap-1 capitalize">
                <Repeat className="h-3 w-3" strokeWidth={1.5} />
                {task.recurrence}
              </span>
            </>
          )}

          {task.subtasks.length > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                ·
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <ListChecks className="h-3 w-3" strokeWidth={1.5} />
                {completedSubtasks}/{task.subtasks.length}
              </span>
            </>
          )}

          {project && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.name}</span>
              </span>
            </>
          )}

          {task.tags.length > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                ·
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {task.tags.map((tag) => `#${tag}`).join(' ')}
              </span>
            </>
          )}
        </div>
      </button>

      {/* Hover Quick Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-80 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <Tooltip label={task.starred ? 'Remove star' : 'Star task'}>
          <button
            type="button"
            aria-label={task.starred ? `Unstar "${task.title}"` : `Star "${task.title}"`}
            onClick={(e) => {
              e.stopPropagation();
              updateTask(task.id, { starred: !task.starred });
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-white/10 ${
              task.starred ? 'text-[#F59E0B] opacity-100' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Star
              className="h-3.5 w-3.5"
              strokeWidth={1.5}
              fill={task.starred ? 'currentColor' : 'none'}
            />
          </button>
        </Tooltip>

        <Tooltip label="Delete task">
          <button
            type="button"
            aria-label={`Delete "${task.title}"`}
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-500/10 hover:text-[#EF4444] dark:text-slate-500"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
