import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeedData } from '../data/seedData';
import { Priority, Recurrence, TaskStatus } from '../types/task';
import {
  calculateNextRecurrenceDate,
  computeAnalyticsSummary,
  computeDailyProgress,
  computeNavCounts,
  filterAndSortTasks,
} from './taskFilters';

const FIXED_NOW = new Date('2026-11-24T12:00:00.000Z');

test('filterAndSortTasks returns Today view including overdue and due-today tasks', () => {
  const seed = createSeedData(FIXED_NOW);
  const todayTasks = filterAndSortTasks(seed.tasks, {
    workspaceId: 'ws-product',
    view: 'today',
    activeProjectId: null,
    activeTag: null,
    priorityFilter: 'all',
    searchQuery: '',
    sortBy: 'priority',
    now: FIXED_NOW,
  });

  assert.ok(todayTasks.length >= 4);
  // First task when sorted by priority must be Urgent
  assert.equal(todayTasks[0].priority, Priority.Urgent);
});

test('filterAndSortTasks respects searchQuery and priorityFilter', () => {
  const seed = createSeedData(FIXED_NOW);
  const filtered = filterAndSortTasks(seed.tasks, {
    workspaceId: 'ws-product',
    view: 'today',
    activeProjectId: null,
    activeTag: null,
    priorityFilter: Priority.Urgent,
    searchQuery: 'onboarding',
    sortBy: 'manual',
    now: FIXED_NOW,
  });

  assert.equal(filtered.length, 1);
  assert.match(filtered[0].title, /onboarding/i);
});

test('computeDailyProgress accurately calculates completion percentage and overdue count', () => {
  const seed = createSeedData(FIXED_NOW);
  const progress = computeDailyProgress(seed.tasks, 'ws-product', FIXED_NOW);

  assert.equal(progress.completedToday, 2);
  assert.equal(progress.overdueCount, 1);
  assert.ok(progress.percentage > 0 && progress.percentage < 100);
});

test('calculateNextRecurrenceDate skips weekends for Weekdays recurrence', () => {
  // 2026-11-27 is a Friday
  const fridayIso = '2026-11-27T10:00:00.000Z';
  const nextIso = calculateNextRecurrenceDate(fridayIso, Recurrence.Weekdays);
  assert.ok(nextIso !== null);
  const nextDate = new Date(nextIso!);
  // Must land on Monday (day 1)
  assert.equal(nextDate.getDay(), 1);
});

test('computeNavCounts and computeAnalyticsSummary produce consistent counts', () => {
  const seed = createSeedData(FIXED_NOW);
  const counts = computeNavCounts(seed.tasks, 'ws-product', FIXED_NOW);
  const analytics = computeAnalyticsSummary(
    seed.tasks,
    seed.projects,
    seed.completionHistory,
    'ws-product',
    FIXED_NOW
  );

  assert.equal(counts.completed, analytics.totalCompleted);
  assert.equal(analytics.dailySeries.length, 7);
  assert.equal(analytics.prioritySeries.length, 4);
  assert.ok(analytics.streakDays >= 1);
  assert.equal(
    seed.tasks.filter((t) => t.workspaceId === 'ws-product' && t.status !== TaskStatus.Done).length,
    analytics.totalActive
  );
});
