export type SavedItemType = 'link' | 'screenshot' | 'snippet' | 'image';
export type SavedItemStatus = 'active' | 'trash';
export type ScreenieFilter = 'inbox' | 'library' | 'favorites' | 'tags' | 'trash';
export type ScreenieSort = 'best-match' | 'newest' | 'oldest' | 'title';
export type ScreenieView = ScreenieFilter | 'find' | 'integrations' | 'templates' | 'settings';
export type MatchKind = 'text' | 'metadata' | 'none';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  now?: string;
}

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
  projectId?: string;
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
  projectId?: string;
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
  projectId?: string | null;
  isFavorite?: boolean;
  status?: SavedItemStatus;
  thumbnailColor?: string;
}

export interface SearchQuery {
  text: string;
  filter: ScreenieFilter;
  sortBy: ScreenieSort;
  tags?: string[];
  types?: SavedItemType[];
  projectId?: string;
  limit?: number;
}

export interface SearchResult {
  item: SavedItem;
  score: number;
  matchedText: string;
  matchedFields: string[];
  matchedTerms: string[];
  matchedTags: string[];
  matchKind: MatchKind;
  matchSummary: string;
}

export interface ScreenieRepository {
  list(): Promise<SavedItem[]>;
  get(id: string): Promise<SavedItem | undefined>;
  create(input: CreateSavedItemInput): Promise<SavedItem>;
  update(id: string, input: UpdateSavedItemInput): Promise<SavedItem>;
  trash(id: string): Promise<SavedItem>;
  restore(id: string): Promise<SavedItem>;
  toggleFavorite(id: string): Promise<SavedItem>;
  remove(id: string): Promise<void>;
  listProjects(): Promise<Project[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  renameProject(id: string, name: string): Promise<Project>;
  removeProject(id: string): Promise<void>;
  seed(items: SavedItem[], projects?: Project[]): Promise<void>;
  clear(): Promise<void>;
}

export function createProject(input: CreateProjectInput): Project {
  const now = input.now ?? new Date().toISOString();

  return {
    id: `project-${createId()}`,
    name: normalizeProjectName(input.name),
    createdAt: now
  };
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
    projectId: cleanOptional(input.projectId),
    isFavorite: input.isFavorite ?? false,
    status: input.status ?? 'active',
    createdAt,
    updatedAt: now,
    thumbnailColor: cleanOptional(input.thumbnailColor)
  };
}

export function updateSavedItem(
  existing: SavedItem,
  input: UpdateSavedItemInput,
  now = new Date().toISOString()
): SavedItem {
  return {
    ...existing,
    title: input.title === undefined ? existing.title : normalizeTitle(input.title),
    description: input.description === undefined ? existing.description : cleanOptional(input.description),
    url: input.url === undefined ? existing.url : cleanOptional(input.url),
    text: input.text === undefined ? existing.text : cleanOptional(input.text),
    extractedText:
      input.extractedText === undefined ? existing.extractedText : cleanOptional(input.extractedText),
    imageDataUrl: input.imageDataUrl === undefined ? existing.imageDataUrl : input.imageDataUrl,
    mimeType: input.mimeType === undefined ? existing.mimeType : cleanOptional(input.mimeType),
    sizeBytes: input.sizeBytes === undefined ? existing.sizeBytes : input.sizeBytes,
    tags: input.tags === undefined ? existing.tags : normalizeTags(input.tags),
    projectId:
      input.projectId === undefined
        ? existing.projectId
        : input.projectId === null
          ? undefined
          : input.projectId,
    isFavorite: input.isFavorite ?? existing.isFavorite,
    status: input.status ?? existing.status,
    thumbnailColor:
      input.thumbnailColor === undefined ? existing.thumbnailColor : cleanOptional(input.thumbnailColor),
    updatedAt: now
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

function normalizeProjectName(name: string): string {
  const normalized = name.trim();
  return normalized.length > 0 ? normalized : 'Untitled project';
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
