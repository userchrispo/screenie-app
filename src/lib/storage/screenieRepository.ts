import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
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
const DB_VERSION = 2;
const META_SEEDED_KEY = 'seeded';
const META_DEMO_DISABLED_KEY = 'demo-seed-disabled';

let dbPromise: Promise<IDBPDatabase<ScreenieDb>> | undefined;

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
    return this.update(id, { status: 'trash' });
  },

  async restore(id: string) {
    return this.update(id, { status: 'active' });
  },

  async toggleFavorite(id: string) {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Saved item not found: ${id}`);
    }
    return this.update(id, { isFavorite: !existing.isFavorite });
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
    upgrade(db, oldVersion) {
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
    }
  });

  return dbPromise;
}

function sortNewest(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}
