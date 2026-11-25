import * as chrono from 'chrono-node';
import { ParsedTaskInput, Priority } from '../types/task';

const PRIORITY_TOKEN_REGEX = /(?:^|\s)(!(urgent|high|medium|med|low)|p([1-4]))(?=\s|$)/gi;
const PROJECT_TOKEN_REGEX = /(?:^|\s)#([a-zA-Z0-9_-]+)(?=\s|$)/g;
const TAG_TOKEN_REGEX = /(?:^|\s)@([a-zA-Z0-9_-]+)(?=\s|$)/g;

function mapPriorityToken(raw: string): Priority | null {
  const normalized = raw.toLowerCase();
  if (normalized === '!urgent' || normalized === 'p1') return Priority.Urgent;
  if (normalized === '!high' || normalized === 'p2') return Priority.High;
  if (normalized === '!medium' || normalized === '!med' || normalized === 'p3') return Priority.Medium;
  if (normalized === '!low' || normalized === 'p4') return Priority.Low;
  return null;
}

/**
 * Parses natural-language task input into structured fields:
 * - Natural language dates/times via chrono-node (e.g. "tomorrow at 3pm", "next Friday")
 * - Priority tokens: !urgent, !high, !medium, !low, p1, p2, p3, p4
 * - Project token: #ProjectName
 * - Tag tokens: @tag1 @tag2
 */
export function parseNaturalTaskInput(
  rawInput: string,
  referenceDate: Date = new Date()
): ParsedTaskInput {
  let working = rawInput.trim();
  if (!working) {
    return {
      title: '',
      dueDate: null,
      hasTime: false,
      dueDateText: null,
      priority: null,
      projectName: null,
      tags: [],
    };
  }

  let priority: Priority | null = null;
  let projectName: string | null = null;
  const tags: string[] = [];

  // Extract priority
  working = working.replace(PRIORITY_TOKEN_REGEX, (match, fullToken) => {
    const mapped = mapPriorityToken(fullToken);
    if (mapped) {
      priority = mapped;
      return ' ';
    }
    return match;
  });

  // Extract project (#Project)
  working = working.replace(PROJECT_TOKEN_REGEX, (_match, name: string) => {
    if (!projectName) {
      projectName = name;
    }
    return ' ';
  });

  // Extract tags (@tag)
  working = working.replace(TAG_TOKEN_REGEX, (_match, tag: string) => {
    const cleanTag = tag.toLowerCase();
    if (!tags.includes(cleanTag)) {
      tags.push(cleanTag);
    }
    return ' ';
  });

  // Extract natural-language date with chrono-node
  let dueDate: string | null = null;
  let hasTime = false;
  let dueDateText: string | null = null;

  const parsedDates = chrono.parse(working, referenceDate, { forwardDate: true });
  if (parsedDates.length > 0) {
    const first = parsedDates[0];
    const dateObj = first.start.date();
    hasTime = first.start.isCertain('hour');
    dueDate = dateObj.toISOString();
    dueDateText = first.text;

    // Remove the date phrase from title only if meaningful text remains
    const stripped = (
      working.slice(0, first.index) +
      ' ' +
      working.slice(first.index + first.text.length)
    )
      .replace(/\s+/g, ' ')
      .replace(/\b(by|on|at|due)\s*$/i, '')
      .trim();

    if (stripped.length > 0) {
      working = stripped;
    }
  }

  const cleanTitle = working.replace(/\s+/g, ' ').trim();

  return {
    title: cleanTitle || rawInput.trim(),
    dueDate,
    hasTime,
    dueDateText,
    priority,
    projectName,
    tags,
  };
}
