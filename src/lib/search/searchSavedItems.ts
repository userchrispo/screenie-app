import type { SavedItem, SearchQuery, SearchResult } from '../../domain/savedItem';

const FIELD_WEIGHTS = {
  title: 12,
  tags: 9,
  text: 6,
  extractedText: 5,
  url: 3,
  description: 2
} as const;

export function searchSavedItems(items: SavedItem[], query: SearchQuery): SearchResult[] {
  const terms = tokenize(query.text);
  const normalizedTags = (query.tags ?? []).map((tag) => tag.toLowerCase());

  return items
    .filter((item) => matchesFilter(item, query.filter))
    .filter((item) => normalizedTags.every((tag) => item.tags.includes(tag)))
    .map((item) => scoreItem(item, terms))
    .filter((result) => terms.length === 0 || result.score > 0)
    .sort((a, b) => sortResults(a, b, query.sortBy));
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
  let score = 0;

  for (const term of terms) {
    for (const [field, value] of Object.entries(fields)) {
      if (value.toLowerCase().includes(term)) {
        matchedFields.add(field);
        score += FIELD_WEIGHTS[field as keyof typeof FIELD_WEIGHTS];
      }
    }
  }

  if (item.isFavorite && score > 0) {
    score += 1;
  }

  return {
    item,
    score,
    matchedText: findMatchedText(item, terms),
    matchedFields: Array.from(matchedFields)
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

  return (
    candidates.find((candidate) =>
      terms.some((term) => candidate.toLowerCase().includes(term))
    ) ?? item.title
  );
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

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9$]+/i)
        .map((part) => part.trim())
        .filter(Boolean)
    )
  );
}
