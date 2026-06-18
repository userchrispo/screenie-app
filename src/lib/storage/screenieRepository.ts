import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  createProject,
  createSavedItem,
  updateSavedItem,
  type CreateProjectInput,
  type CreateSavedItemInput,
  type Project,
  type SavedItem,
  type ScreenieRepository,
  type UpdateSavedItemInput
} from '../../domain/savedItem';
import { createWorkspaceSnapshot, normalizeWorkspaceSnapshot } from '../../domain/workspaceSnapshot';
import { seedItems, seedProjects } from './seedData';

interface ScreenieDb extends DBSchema {
  items: {
    key: string;
    value: SavedItem;
    indexes: {
      'by-created': string;
      'by-status': string;
      'by-type': string;
    };
  };
  projects: {
    key: string;
    value: Project;
    indexes: {
      'by-created': string;
    };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = 'screenie-local';
const DB_VERSION = 3;
const META_SEEDED_KEY = 'seeded';
const META_DEMO_DISABLED_KEY = 'demo-seed-disabled';

let dbPromise: Promise<IDBPDatabase<ScreenieDb>> | undefined;

interface MigrationCursor {
  value: unknown;
  update(value: SavedItem): Promise<unknown>;
  continue(): Promise<MigrationCursor | null>;
}

interface MigrationStore {
  openCursor(): Promise<MigrationCursor | null>;
}

export const screenieRepository: ScreenieRepository = {
  async list() {
    await ensureSeeded();
    const db = await getDb();
    return sortNewest(await db.getAll('items'));
  },

  async get(id) {
    const db = await getDb();
    return db.get('items', id);
  },

  async create(input: CreateSavedItemInput) {
    const db = await getDb();
    const item = createSavedItem(input);
    await db.put('items', item);
    return item;
  },

  async update(id: string, input: UpdateSavedItemInput) {
    const db = await getDb();
    const existing = await db.get('items', id);

    if (!existing) {
      throw new Error(`Saved item not found: ${id}`);
    }

    const updated = updateSavedItem(existing, input);
    await db.put('items', updated);
    return updated;
  },

  async trash(id: string) {
    return screenieRepository.update(id, { status: 'trash' });
  },

  async restore(id: string) {
    return screenieRepository.update(id, { status: 'active' });
  },

  async toggleFavorite(id: string) {
    const existing = await screenieRepository.get(id);
    if (!existing) {
      throw new Error(`Saved item not found: ${id}`);
    }
    return screenieRepository.update(id, { isFavorite: !existing.isFavorite });
  },

  async remove(id: string) {
    const db = await getDb();
    await db.delete('items', id);
  },

  async listProjects() {
    await ensureSeeded();
    const db = await getDb();
    return sortProjects(await db.getAll('projects'));
  },

  async createProject(input: CreateProjectInput) {
    const db = await getDb();
    const project = createProject(input);
    await db.put('projects', project);
    return project;
  },

  async renameProject(id: string, name: string) {
    const db = await getDb();
    const existing = await db.get('projects', id);

    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }

    const updated: Project = { ...existing, name: name.trim() || 'Untitled project' };
    await db.put('projects', updated);
    return updated;
  },

  async removeProject(id: string) {
    const db = await getDb();
    const items = await db.getAll('items');

    const transaction = db.transaction(['items', 'projects'], 'readwrite');
    for (const item of items) {
      if (item.projectId === id) {
        const updated = updateSavedItem(item, { projectId: null });
        await transaction.objectStore('items').put(updated);
      }
    }
    await transaction.objectStore('projects').delete(id);
    await transaction.done;
  },

  async exportWorkspace(now?: string) {
    const db = await getDb();
    const [items, projects] = await Promise.all([db.getAll('items'), db.getAll('projects')]);
    return createWorkspaceSnapshot(sortNewest(items), sortProjects(projects), now);
  },

  async importWorkspace(snapshot) {
    const normalized = normalizeWorkspaceSnapshot(snapshot);
    const db = await getDb();
    const transaction = db.transaction(['items', 'projects', 'meta'], 'readwrite');
    const itemStore = transaction.objectStore('items');
    const projectStore = transaction.objectStore('projects');
    const metaStore = transaction.objectStore('meta');

    await itemStore.clear();
    await projectStore.clear();
    await metaStore.clear();
    await Promise.all(normalized.items.map((item) => itemStore.put(item)));
    await Promise.all(normalized.projects.map((project) => projectStore.put(project)));
    await metaStore.put({ key: META_SEEDED_KEY, value: 'true' });
    await metaStore.put({ key: META_DEMO_DISABLED_KEY, value: 'true' });
    await transaction.done;
  },

  async resetDemo() {
    await screenieRepository.clear();
    await screenieRepository.seed(seedItems, seedProjects);
  },

  async seed(items: SavedItem[], projects: Project[] = seedProjects) {
    const db = await getDb();
    const transaction = db.transaction(['items', 'projects', 'meta'], 'readwrite');
    const meta = transaction.objectStore('meta');

    await Promise.all(items.map((item) => transaction.objectStore('items').put(item)));
    await Promise.all(projects.map((project) => transaction.objectStore('projects').put(project)));
    await meta.put({ key: META_SEEDED_KEY, value: 'true' });
    await meta.delete(META_DEMO_DISABLED_KEY);
    await transaction.done;
  },

  async clear() {
    const db = await getDb();
    const transaction = db.transaction(['items', 'projects', 'meta'], 'readwrite');
    const meta = transaction.objectStore('meta');

    await transaction.objectStore('items').clear();
    await transaction.objectStore('projects').clear();
    await meta.clear();
    await meta.put({ key: META_SEEDED_KEY, value: 'true' });
    await meta.put({ key: META_DEMO_DISABLED_KEY, value: 'true' });
    await transaction.done;
  }
};

export async function ensureSeeded() {
  const db = await getDb();
  const demoDisabled = await db.get('meta', META_DEMO_DISABLED_KEY);

  if (demoDisabled?.value === 'true') {
    return;
  }

  const seeded = await db.get('meta', META_SEEDED_KEY);

  if (seeded?.value !== 'true') {
    await screenieRepository.seed(seedItems, seedProjects);
    return;
  }

  const projects = await db.getAll('projects');
  if (projects.length === 0) {
    const transaction = db.transaction(['projects'], 'readwrite');
    await Promise.all(seedProjects.map((project) => transaction.objectStore('projects').put(project)));
    await transaction.done;
  }
}

function getDb() {
  dbPromise ??= openDB<ScreenieDb>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
      if (!db.objectStoreNames.contains('items')) {
        const items = db.createObjectStore('items', { keyPath: 'id' });
        items.createIndex('by-created', 'createdAt');
        items.createIndex('by-status', 'status');
        items.createIndex('by-type', 'type');
      }

      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      if (oldVersion < 2 && !db.objectStoreNames.contains('projects')) {
        const projects = db.createObjectStore('projects', { keyPath: 'id' });
        projects.createIndex('by-created', 'createdAt');
      }

      if (oldVersion < 3) {
        await migrateItemsToVersion3(transaction.objectStore('items'));
      }
    }
  });

  return dbPromise;
}

export async function resetScreenieRepositoryForTests() {
  const db = await dbPromise?.catch(() => undefined);
  db?.close();
  dbPromise = undefined;
}

export async function deleteScreenieDatabaseForTests() {
  await resetScreenieRepositoryForTests();
  await deleteDB(DB_NAME);
}

async function migrateItemsToVersion3(store: MigrationStore) {
  let cursor = await store.openCursor();

  while (cursor) {
    const migrated = addBetaMetadataDefaults(cursor.value as Partial<SavedItem>);
    await cursor.update(migrated);
    cursor = await cursor.continue();
  }
}

function addBetaMetadataDefaults(item: Partial<SavedItem>): SavedItem {
  const createdAt = item.createdAt ?? new Date().toISOString();
  const updatedAt = item.updatedAt ?? createdAt;
  const extractedText = cleanString(item.extractedText);

  return {
    id: cleanString(item.id) ?? `legacy-${Math.random().toString(36).slice(2, 12)}`,
    type: item.type ?? 'snippet',
    title: cleanString(item.title) ?? 'Untitled item',
    description: cleanString(item.description),
    url: cleanString(item.url),
    text: cleanString(item.text),
    extractedText,
    imageDataUrl: cleanString(item.imageDataUrl),
    mimeType: cleanString(item.mimeType),
    sizeBytes: typeof item.sizeBytes === 'number' && Number.isFinite(item.sizeBytes) ? item.sizeBytes : undefined,
    tags: Array.isArray(item.tags) ? item.tags : [],
    projectId: cleanString(item.projectId),
    source: item.source ?? 'manual',
    ocrStatus: item.ocrStatus ?? (extractedText ? 'ready' : 'not_applicable'),
    ocrLanguage: cleanString(item.ocrLanguage),
    ocrError: cleanString(item.ocrError),
    ocrUpdatedAt: item.ocrUpdatedAt ?? (extractedText ? updatedAt : undefined),
    isFavorite: item.isFavorite ?? false,
    status: item.status ?? 'active',
    createdAt,
    updatedAt,
    thumbnailColor: cleanString(item.thumbnailColor)
  };
}

function cleanString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function sortNewest(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}
