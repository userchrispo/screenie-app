import type { SavedItem, SearchQuery, SearchResult } from '../../domain/savedItem';

const FIELD_WEIGHTS = {
  title: 12,
  tags: 9,
  text: 7,
  extractedText: 6,
  url: 4,
  description: 3
} as const;

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'any',
  'from',
  'last',
  'of',
  'or',
  'that',
  'the',
  'this',
  'to',
  'week',
  'with'
]);

export function searchSavedItems(items: SavedItem[], query: SearchQuery): SearchResult[] {
  const terms = tokenize(query.text);
  const normalizedTags = (query.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  const typeFilter = new Set(query.types ?? []);

  const results = items
    .filter((item) => matchesFilter(item, query.filter))
    .filter((item) => !query.projectId || item.projectId === query.projectId)
    .filter((item) => typeFilter.size === 0 || typeFilter.has(item.type))
    .filter((item) => normalizedTags.every((tag) => item.tags.includes(tag)))
    .map((item) => scoreItem(item, terms))
    .filter((result) => terms.length === 0 || result.score > 0)
    .sort((a, b) => sortResults(a, b, query.sortBy));

  return query.limit === undefined ? results : results.slice(0, query.limit);
}

function scoreItem(item: SavedItem, terms: string[]): SearchResult {
  const fields = {
    title: item.title,
    tags: item.tags.join(' '),
    text: item.text ?? '',
    extractedText: item.extractedText ?? '',
    url: item.url ?? '',
    description: item.description ?? ''
  };
  const matchedFields = new Set<string>();
  const matchedTerms = new Set<string>();
  let score = 0;

  for (const term of terms) {
    for (const [field, value] of Object.entries(fields)) {
      if (normalizeSearchText(value).includes(term)) {
        matchedFields.add(field);
        matchedTerms.add(term);
        score += FIELD_WEIGHTS[field as keyof typeof FIELD_WEIGHTS];
      }
    }
  }

  if (terms.length > 1 && phraseAppears(fields, terms)) {
    score += 10;
  }

  if (item.isFavorite && score > 0) {
    score += 1;
  }

  const matchedText = findMatchedText(item, terms);
  const matchedTags = item.tags.filter((tag) => terms.some((term) => tag.includes(term)));
  const matchKind = getMatchKind(matchedFields);

  return {
    item,
    score,
    matchedText,
    matchedFields: Array.from(matchedFields),
    matchedTerms: Array.from(matchedTerms),
    matchedTags,
    matchKind,
    matchSummary: getMatchSummary(item, matchedFields, matchedTags, matchedText, terms)
  };
}

function matchesFilter(item: SavedItem, filter: SearchQuery['filter']): boolean {
  if (filter === 'trash') {
    return item.status === 'trash';
  }

  if (item.status === 'trash') {
    return false;
  }

  if (filter === 'favorites') {
    return item.isFavorite;
  }

  if (filter === 'tags') {
    return item.tags.length > 0;
  }

  if (filter === 'inbox') {
    return !item.projectId;
  }

  if (filter === 'library') {
    return true;
  }

  return true;
}

function findMatchedText(item: SavedItem, terms: string[]): string {
  const candidates = [
    item.text,
    item.extractedText,
    item.description,
    item.title,
    item.url,
    item.tags.join(', ')
  ].filter(Boolean) as string[];

  if (terms.length === 0) {
    return item.description ?? item.text ?? item.title;
  }

  return candidates.find((candidate) => terms.some((term) => normalizeSearchText(candidate).includes(term))) ?? item.title;
}

function getMatchKind(matchedFields: Set<string>): SearchResult['matchKind'] {
  if (matchedFields.has('text') || matchedFields.has('extractedText')) {
    return 'text';
  }

  if (matchedFields.size > 0) {
    return 'metadata';
  }

  return 'none';
}

function getMatchSummary(
  item: SavedItem,
  matchedFields: Set<string>,
  matchedTags: string[],
  matchedText: string,
  terms: string[]
): string {
  if (terms.length === 0) {
    return item.description ?? 'Recently saved item';
  }

  if (matchedFields.has('text') || matchedFields.has('extractedText')) {
    return `Matched text: ${matchedText}`;
  }

  const reasons: string[] = [];
  if (matchedFields.has('title')) {
    reasons.push('title');
  }
  if (matchedFields.has('url')) {
    reasons.push('url');
  }
  if (matchedFields.has('description')) {
    reasons.push('description');
  }
  if (matchedTags.length > 0) {
    reasons.push(`tagged ${matchedTags.join(', ')}`);
  }

  return reasons.length > 0 ? `Matched because ${reasons.join('; ')}` : 'Matched saved metadata';
}

function sortResults(a: SearchResult, b: SearchResult, sortBy: SearchQuery['sortBy']): number {
  if (sortBy === 'newest') {
    return b.item.createdAt.localeCompare(a.item.createdAt);
  }

  if (sortBy === 'oldest') {
    return a.item.createdAt.localeCompare(b.item.createdAt);
  }

  if (sortBy === 'title') {
    return a.item.title.localeCompare(b.item.title);
  }

  return b.score - a.score || b.item.createdAt.localeCompare(a.item.createdAt);
}

function phraseAppears(fields: Record<string, string>, terms: string[]): boolean {
  const phrase = terms.join(' ');
  return Object.values(fields).some((value) => normalizeSearchText(value).includes(phrase));
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      normalizeSearchText(text)
        .split(/[^a-z0-9$]+/i)
        .map((part) => part.trim())
        .filter((part) => part.length > 1 || part.startsWith('$'))
        .filter((part) => !STOP_WORDS.has(part))
    )
  );
}

function normalizeSearchText(text: string): string {
  return text.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
}
