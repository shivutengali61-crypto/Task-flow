import assert from 'node:assert/strict';
import test from 'node:test';
import { Priority } from '../types/task';
import { parseNaturalTaskInput } from './taskParser';

const FIXED_REF = new Date('2026-11-24T09:00:00.000Z');

test('parses natural-language date, time, priority, project, and tags cleanly', () => {
  const parsed = parseNaturalTaskInput(
    'Ship v2 landing page tomorrow at 3pm !high #Launch @design @ux',
    FIXED_REF
  );

  assert.equal(parsed.title, 'Ship v2 landing page');
  assert.equal(parsed.priority, Priority.High);
  assert.equal(parsed.projectName, 'Launch');
  assert.deepEqual(parsed.tags, ['design', 'ux']);
  assert.equal(parsed.hasTime, true);
  assert.ok(parsed.dueDate !== null);

  const due = new Date(parsed.dueDate!);
  assert.equal(due.getDate(), 25);
});

test('supports p1-p4 shorthand priority tokens', () => {
  const urgent = parseNaturalTaskInput('Fix production alert p1', FIXED_REF);
  const low = parseNaturalTaskInput('Clean archive p4', FIXED_REF);

  assert.equal(urgent.priority, Priority.Urgent);
  assert.equal(urgent.title, 'Fix production alert');
  assert.equal(low.priority, Priority.Low);
  assert.equal(low.title, 'Clean archive');
});

test('handles plain titles without dates or tokens gracefully', () => {
  const parsed = parseNaturalTaskInput('Review architecture RFC', FIXED_REF);
  assert.equal(parsed.title, 'Review architecture RFC');
  assert.equal(parsed.dueDate, null);
  assert.equal(parsed.priority, null);
  assert.equal(parsed.projectName, null);
  assert.deepEqual(parsed.tags, []);
});

test('returns empty fields for whitespace-only input', () => {
  const parsed = parseNaturalTaskInput('   ', FIXED_REF);
  assert.equal(parsed.title, '');
  assert.equal(parsed.dueDate, null);
});
