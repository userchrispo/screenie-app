import type { Project, SavedItem } from '../../domain/savedItem';

export type RecallSignalKind =
  | 'title'
  | 'ocr'
  | 'text'
  | 'url'
  | 'tag'
  | 'project'
  | 'date'
  | 'source'
  | 'favorite'
  | 'related';

export interface RecallSignal {
  kind: RecallSignalKind;
  label: string;
  detail?: string;
}

export interface RecallQuery {
  items: SavedItem[];
  projects?: Project[];
  text: string;
  projectId?: string;
  limit?: number;
  now?: string;
}

export interface RecallResult {
  item: SavedItem;
  score: number;
  answer: string;
  matchedText: string;
  signals: RecallSignal[];
  relatedItemIds: string[];
}

const FIELD_WEIGHTS = {
  title: 14,
  tags: 10,
  extractedText: 9,
  text: 7,
  project: 7,
  url: 5,
  source: 3
} as const;

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'any',
  'did',
  'from',
  'i',
  'in',
  'last',
  'me',
  'of',
  'or',
  'recent',
  'see',
  'that',
  'the',
  'this',
  'today',
  'to',
  'week',
  'where',
  'with',
  'yesterday'
]);

export function recallSavedItems({
  items,
  projects = [],
  text,
  projectId,
  limit = 5,
  now = new Date().toISOString()
}: RecallQuery): RecallResult[] {
  const terms = tokenize(text);
  const dateMemory = parseDateMemory(text, now);
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const activeItems = items.filter((item) => item.status !== 'trash' && (!projectId || item.projectId === projectId));

  if (terms.length === 0 && !dateMemory) {
    return [];
  }

  return activeItems
    .map((item) => scoreRecallItem(item, activeItems, terms, projectNames, dateMemory))
    .filter((result) => result.score > 0)
    .sort((first, second) => second.score - first.score || second.item.createdAt.localeCompare(first.item.createdAt))
    .slice(0, limit);
}

function scoreRecallItem(
  item: SavedItem,
  activeItems: SavedItem[],
  terms: string[],
  projectNames: Map<string, string>,
  dateMemory: DateMemory | null
): RecallResult {
  const projectName = item.projectId ? projectNames.get(item.projectId) : undefined;
  const fields = {
    title: item.title,
    tags: item.tags.join(' '),
    extractedText: item.extractedText ?? '',
    text: item.text ?? '',
    project: projectName ?? '',
    url: item.url ?? '',
    source: item.source ?? ''
  };
  const signals: RecallSignal[] = [];
  let score = 0;

  for (const term of terms) {
    for (const [field, value] of Object.entries(fields)) {
      if (!normalize(value).includes(term)) {
        continue;
      }

      score += FIELD_WEIGHTS[field as keyof typeof FIELD_WEIGHTS];
      addFieldSignal(signals, field, value);
      if (field === 'extractedText' && (item.type === 'image' || item.type === 'screenshot')) {
        score += 4;
      }
    }
  }

  if (terms.length > 1 && phraseAppears(fields, terms)) {
    score += 8;
  }

  if (dateMemory && isWithinDateMemory(item.createdAt, dateMemory)) {
    score += 9;
    addSignal(signals, { kind: 'date', label: dateMemory.label });
  }

  if (item.isFavorite && score > 0) {
    score += 2;
    addSignal(signals, { kind: 'favorite', label: 'Favorite' });
  }

  return {
    item,
    score,
    answer: createAnswer(item, signals, terms),
    matchedText: findMatchedText(item, terms),
    signals,
    relatedItemIds: findRelatedItemIds(item, activeItems)
  };
}

function addFieldSignal(signals: RecallSignal[], field: string, value: string) {
  if (field === 'title') {
    addSignal(signals, { kind: 'title', label: 'Title', detail: value });
    return;
  }

  if (field === 'tags') {
    addSignal(signals, { kind: 'tag', label: 'Tag', detail: value });
    return;
  }

  if (field === 'extractedText') {
    addSignal(signals, { kind: 'ocr', label: 'OCR text', detail: value });
    return;
  }

  if (field === 'text') {
    addSignal(signals, { kind: 'text', label: 'Saved text', detail: value });
    return;
  }

  if (field === 'project') {
    addSignal(signals, { kind: 'project', label: value });
    return;
  }

  if (field === 'url') {
    addSignal(signals, { kind: 'url', label: 'URL', detail: value });
    return;
  }

  if (field === 'source') {
    addSignal(signals, { kind: 'source', label: readableSource(value) });
  }
}

function addSignal(signals: RecallSignal[], signal: RecallSignal) {
  if (!signals.some((existing) => existing.kind === signal.kind && existing.label === signal.label)) {
    signals.push(signal);
  }
}

function createAnswer(item: SavedItem, signals: RecallSignal[], terms: string[]): string {
  const ocrSignal = signals.find((signal) => signal.kind === 'ocr' && signal.detail);
  if (ocrSignal?.detail) {
    return `OCR matched "${clip(ocrSignal.detail)}"`;
  }

  const textSignal = signals.find((signal) => signal.kind === 'text' && signal.detail);
  if (textSignal?.detail) {
    return `Saved text matched "${clip(textSignal.detail)}"`;
  }

  const projectSignal = signals.find((signal) => signal.kind === 'project');
  if (projectSignal && terms.length > 0) {
    return `Found in ${projectSignal.label} with matching memory details.`;
  }

  const dateSignal = signals.find((signal) => signal.kind === 'date');
  if (dateSignal) {
    return `Captured during ${dateSignal.label.toLowerCase()}.`;
  }

  return `Best local memory match for "${terms.join(' ')}".`;
}

function findMatchedText(item: SavedItem, terms: string[]): string {
  const candidates = [item.extractedText, item.text, item.title, item.url, item.tags.join(', ')].filter(Boolean) as string[];

  return candidates.find((candidate) => terms.some((term) => normalize(candidate).includes(term))) ?? item.title;
}

function findRelatedItemIds(item: SavedItem, activeItems: SavedItem[]): string[] {
  return activeItems
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => ({
      item: candidate,
      score: scoreRelatedItem(item, candidate)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((first, second) => second.score - first.score || second.item.createdAt.localeCompare(first.item.createdAt))
    .slice(0, 3)
    .map(({ item: relatedItem }) => relatedItem.id);
}

function scoreRelatedItem(item: SavedItem, candidate: SavedItem): number {
  let score = 0;
  let hasCoreRelationship = false;
  const sharedTags = candidate.tags.filter((tag) => item.tags.includes(tag));

  if (item.projectId && candidate.projectId === item.projectId) {
    score += 5;
    hasCoreRelationship = true;
  }

  if (sharedTags.length > 0) {
    score += Math.min(sharedTags.length * 4, 12);
    hasCoreRelationship = true;
  }

  if (item.source && candidate.source === item.source) {
    score += 2;
    hasCoreRelationship = true;
  }

  if (!hasCoreRelationship) {
    return 0;
  }

  if (candidate.type === 'image' || candidate.type === 'screenshot') {
    score += 1;
  }

  if (Math.abs(new Date(item.createdAt).getTime() - new Date(candidate.createdAt).getTime()) <= 3 * 24 * 60 * 60 * 1000) {
    score += 3;
  }

  return score;
}

function phraseAppears(fields: Record<string, string>, terms: string[]): boolean {
  const phrase = terms.join(' ');
  return Object.values(fields).some((value) => normalize(value).includes(phrase));
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      normalize(text)
        .split(/[^a-z0-9$]+/i)
        .map((part) => part.trim())
        .filter((part) => part.length > 1 || part.startsWith('$'))
        .filter((part) => !STOP_WORDS.has(part))
    )
  );
}

interface DateMemory {
  label: string;
  start: Date;
  end: Date;
}

function parseDateMemory(text: string, now: string): DateMemory | null {
  const normalized = normalize(text);
  const current = startOfUtcDay(new Date(now));

  if (normalized.includes('last week')) {
    const thisWeekStart = startOfUtcWeek(current);
    return {
      label: 'Last week',
      start: addDays(thisWeekStart, -7),
      end: thisWeekStart
    };
  }

  if (normalized.includes('this week')) {
    const thisWeekStart = startOfUtcWeek(current);
    return {
      label: 'This week',
      start: thisWeekStart,
      end: addDays(thisWeekStart, 7)
    };
  }

  if (normalized.includes('yesterday')) {
    return {
      label: 'Yesterday',
      start: addDays(current, -1),
      end: current
    };
  }

  if (normalized.includes('today')) {
    return {
      label: 'Today',
      start: current,
      end: addDays(current, 1)
    };
  }

  if (normalized.includes('recent')) {
    return {
      label: 'Recent',
      start: addDays(current, -14),
      end: addDays(current, 1)
    };
  }

  return null;
}

function isWithinDateMemory(value: string, dateMemory: DateMemory): boolean {
  const date = new Date(value);
  return date >= dateMemory.start && date < dateMemory.end;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function startOfUtcWeek(value: Date): Date {
  const day = value.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(startOfUtcDay(value), mondayOffset);
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function readableSource(source: string): string {
  if (source === 'paste') {
    return 'Pasted';
  }

  if (source === 'upload') {
    return 'Uploaded';
  }

  if (source === 'extension') {
    return 'Extension';
  }

  return source.charAt(0).toUpperCase() + source.slice(1);
}

function clip(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 96 ? `${normalized.slice(0, 93)}...` : normalized;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
}
