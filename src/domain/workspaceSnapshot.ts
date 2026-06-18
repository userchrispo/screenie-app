import type {
  OcrStatus,
  Project,
  SavedItem,
  SavedItemSource,
  SavedItemStatus,
  SavedItemType,
  WorkspaceSnapshot
} from './savedItem';

const SNAPSHOT_VERSION = 1;
const ITEM_TYPES: SavedItemType[] = ['link', 'screenshot', 'snippet', 'image'];
const ITEM_STATUSES: SavedItemStatus[] = ['active', 'trash'];
const ITEM_SOURCES: SavedItemSource[] = ['manual', 'upload', 'paste', 'extension', 'import', 'seed'];
const OCR_STATUSES: OcrStatus[] = ['not_applicable', 'queued', 'processing', 'ready', 'failed'];

export function createWorkspaceSnapshot(
  items: SavedItem[],
  projects: Project[],
  exportedAt = new Date().toISOString()
): WorkspaceSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    exportedAt,
    items: items.map((item) => normalizeSavedItemForSnapshot(item)),
    projects: projects.map(normalizeProjectForSnapshot)
  };
}

export function parseWorkspaceSnapshot(value: string): WorkspaceSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Import file must be valid JSON.');
  }

  return normalizeWorkspaceSnapshot(parsed);
}

export function normalizeWorkspaceSnapshot(value: unknown): WorkspaceSnapshot {
  if (!isRecord(value)) {
    throw new Error('Import file must be a Screenie workspace export.');
  }

  if (value.version !== SNAPSHOT_VERSION) {
    throw new Error('Unsupported Screenie export version.');
  }

  if (!Array.isArray(value.items) || !Array.isArray(value.projects)) {
    throw new Error('Import file is missing items or projects.');
  }

  const projects = value.projects.map(normalizeProjectForSnapshot);
  const projectIds = new Set(projects.map((project) => project.id));

  return {
    version: SNAPSHOT_VERSION,
    exportedAt: stringValue(value.exportedAt) ?? new Date().toISOString(),
    items: value.items.map((item) => normalizeSavedItemForSnapshot(item, projectIds)),
    projects
  };
}

function normalizeSavedItemForSnapshot(value: unknown, projectIds?: Set<string>): SavedItem {
  if (!isRecord(value)) {
    throw new Error('Import file contains an invalid saved item.');
  }

  const id = requiredString(value.id, 'saved item id');
  const type = enumValue(value.type, ITEM_TYPES, 'saved item type');
  const title = requiredString(value.title, 'saved item title').trim() || 'Untitled item';
  const createdAt = requiredString(value.createdAt, 'saved item createdAt');
  const updatedAt = requiredString(value.updatedAt, 'saved item updatedAt');
  const projectId = stringValue(value.projectId);

  return {
    id,
    type,
    title,
    description: stringValue(value.description),
    url: stringValue(value.url),
    text: stringValue(value.text),
    extractedText: stringValue(value.extractedText),
    imageDataUrl: stringValue(value.imageDataUrl),
    mimeType: stringValue(value.mimeType),
    sizeBytes: numberValue(value.sizeBytes),
    tags: Array.isArray(value.tags) ? normalizeTags(value.tags) : [],
    projectId: projectIds === undefined || (projectId && projectIds.has(projectId)) ? projectId : undefined,
    source: enumValue(value.source ?? 'manual', ITEM_SOURCES, 'saved item source'),
    ocrStatus: enumValue(value.ocrStatus ?? 'not_applicable', OCR_STATUSES, 'OCR status'),
    ocrLanguage: stringValue(value.ocrLanguage),
    ocrError: stringValue(value.ocrError),
    ocrUpdatedAt: stringValue(value.ocrUpdatedAt),
    isFavorite: Boolean(value.isFavorite),
    status: enumValue(value.status ?? 'active', ITEM_STATUSES, 'saved item status'),
    createdAt,
    updatedAt,
    thumbnailColor: stringValue(value.thumbnailColor)
  };
}

function normalizeProjectForSnapshot(value: unknown): Project {
  if (!isRecord(value)) {
    throw new Error('Import file contains an invalid project.');
  }

  return {
    id: requiredString(value.id, 'project id'),
    name: requiredString(value.name, 'project name').trim() || 'Untitled project',
    createdAt: requiredString(value.createdAt, 'project createdAt')
  };
}

function normalizeTags(tags: unknown[]): string[] {
  return Array.from(
    new Set(
      tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function requiredString(value: unknown, label: string): string {
  const normalized = stringValue(value);
  if (!normalized) {
    throw new Error(`Import file contains a saved record without ${label}.`);
  }
  return normalized;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function enumValue<T extends string>(value: unknown, allowed: T[], label: string): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }
  throw new Error(`Import file contains an invalid ${label}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
