export type SavedItemType = 'link' | 'screenshot' | 'snippet' | 'image';
export type SavedItemStatus = 'active' | 'trash';
export type ScreenieFilter = 'inbox' | 'library' | 'favorites' | 'tags' | 'trash';
export type ScreenieSort = 'best-match' | 'newest' | 'oldest' | 'title';

export interface SavedItem {
  id: string;
  type: SavedItemType;
  title: string;
  description?: string;
  url?: string;
  text?: string;
  extractedText?: string;
  imageDataUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  tags: string[];
  isFavorite: boolean;
  status: SavedItemStatus;
  createdAt: string;
  updatedAt: string;
  thumbnailColor?: string;
}

export interface CreateSavedItemInput {
  type: SavedItemType;
  title: string;
  description?: string;
  url?: string;
  text?: string;
  extractedText?: string;
  imageDataUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  tags?: string[];
  isFavorite?: boolean;
  status?: SavedItemStatus;
  createdAt?: string;
  thumbnailColor?: string;
  now?: string;
}

export interface UpdateSavedItemInput {
  title?: string;
  description?: string;
  url?: string;
  text?: string;
  extractedText?: string;
  imageDataUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  tags?: string[];
  isFavorite?: boolean;
  status?: SavedItemStatus;
  thumbnailColor?: string;
}

export interface SearchQuery {
  text: string;
  filter: ScreenieFilter;
  sortBy: ScreenieSort;
  tags?: string[];
}

export interface SearchResult {
  item: SavedItem;
  score: number;
  matchedText: string;
  matchedFields: string[];
}

export interface ScreenieRepository {
  list(): Promise<SavedItem[]>;
  get(id: string): Promise<SavedItem | undefined>;
  create(input: CreateSavedItemInput): Promise<SavedItem>;
  update(id: string, input: UpdateSavedItemInput): Promise<SavedItem>;
  remove(id: string): Promise<void>;
  seed(items: SavedItem[]): Promise<void>;
}

export function createSavedItem(input: CreateSavedItemInput): SavedItem {
  const now = input.now ?? new Date().toISOString();
  const createdAt = input.createdAt ?? now;

  return {
    id: `item-${createId()}`,
    type: input.type,
    title: normalizeTitle(input.title),
    description: cleanOptional(input.description),
    url: cleanOptional(input.url),
    text: cleanOptional(input.text),
    extractedText: cleanOptional(input.extractedText),
    imageDataUrl: input.imageDataUrl,
    mimeType: cleanOptional(input.mimeType),
    sizeBytes: input.sizeBytes,
    tags: normalizeTags(input.tags ?? []),
    isFavorite: input.isFavorite ?? false,
    status: input.status ?? 'active',
    createdAt,
    updatedAt: now,
    thumbnailColor: cleanOptional(input.thumbnailColor)
  };
}

export function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function normalizeTitle(title: string): string {
  const normalized = title.trim();
  return normalized.length > 0 ? normalized : 'Untitled item';
}

function cleanOptional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function createId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 12);
}
