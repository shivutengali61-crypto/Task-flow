import { AlertCircle, CheckCircle2, Clock, Flame, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTaskStore } from '../store/useTaskStore';
import { computeAnalyticsSummary } from '../utils/taskFilters';

export function AnalyticsView() {
  const theme = useTaskStore((s) => s.theme);
  const activeWorkspaceId = useTaskStore((s) => s.activeWorkspaceId);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const completionHistory = useTaskStore((s) => s.completionHistory);
  const workspaces = useTaskStore((s) => s.workspaces);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const summary = useMemo(
    () =>
      computeAnalyticsSummary(
        tasks,
        projects,
        completionHistory,
        activeWorkspaceId
      ),
    [tasks, projects, completionHistory, activeWorkspaceId]
  );

  const isDark = theme === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const axisTickColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipStyle = {
    backgroundColor: isDark ? '#13192B' : '#FFFFFF',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
    borderRadius: '10px',
    fontSize: '12px',
    color: isDark ? '#F1F5F9' : '#0F172A',
  };

  const focusHours = (summary.totalFocusMinutes / 60).toFixed(1);

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 px-4 py-6 pb-24 sm:px-8 sm:py-8 md:pb-8">
      {/* Header */}
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-slate-900 dark:text-[#F1F5F9]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#94A3B8]">
          Productivity momentum and workload breakdown for {activeWorkspace?.name ?? 'Workspace'}.
        </p>
      </header>

      {/* KPI Strip */}
      <section aria-label="Productivity metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="tf-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            <span>Completion Rate</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" strokeWidth={1.5} />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-[#F1F5F9]">
            {summary.completionRate}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {summary.totalCompleted} done · {summary.totalActive} open
          </p>
        </div>

        <div className="tf-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            <span>Active Streak</span>
            <Flame className="h-4 w-4 text-[#F59E0B]" strokeWidth={1.5} />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-[#F1F5F9]">
            {summary.streakDays} {summary.streakDays === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Consecutive completions
          </p>
        </div>

        <div className="tf-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            <span>Focus Logged</span>
            <Clock className="h-4 w-4 text-[#22C55E]" strokeWidth={1.5} />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-[#F1F5F9]">
            {focusHours}h
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {summary.totalFocusMinutes} min last 7 days
          </p>
        </div>

        <div className="tf-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            <span>Overdue Tasks</span>
            {summary.overdueCount > 0 ? (
              <AlertCircle className="h-4 w-4 text-[#EF4444]" strokeWidth={1.5} />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#22C55E]" strokeWidth={1.5} />
            )}
          </div>
          <p
            className={`mt-2 text-2xl font-bold tabular-nums ${
              summary.overdueCount > 0
                ? 'text-[#EF4444]'
                : 'text-slate-900 dark:text-[#F1F5F9]'
            }`}
          >
            {summary.overdueCount}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {summary.overdueCount === 0 ? 'All on schedule' : 'Needs triage'}
          </p>
        </div>
      </section>

      {/* Main 7-Day Completion Velocity Chart */}
      <section className="tf-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
              7-Day Completion Velocity
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Completed tasks per day across the last week
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.dailySeries} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: axisTickColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: axisTickColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed tasks"
                stroke="#6366F1"
                strokeWidth={2.25}
                fill="url(#velocityGradient)"
                activeDot={{ r: 5, fill: '#8B5CF6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Secondary Grid: Priority Breakdown + Project Distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Priority Breakdown */}
        <section className="tf-card p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
            Open Tasks by Priority
          </h2>
          <p className="mt-0.5 mb-4 text-xs text-slate-400 dark:text-slate-500">
            Active workload segmented by urgency level
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.prioritySeries}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: axisTickColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisTickColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="count" name="Open tasks" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {summary.prioritySeries.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Project Progress Breakdown */}
        <section className="tf-card p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-[#94A3B8]">
            Project Breakdown
          </h2>
          <p className="mt-0.5 mb-4 text-xs text-slate-400 dark:text-slate-500">
            Completed vs. remaining tasks per project
          </p>

          <div className="space-y-4">
            {summary.projectSeries.map((item) => {
              const total = item.active + item.completed;
              const pct = total === 0 ? 0 : Math.round((item.completed / total) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </span>
                    <span className="tabular-nums text-slate-500 dark:text-[#94A3B8]">
                      {item.completed}/{total} done ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
